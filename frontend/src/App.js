import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Nutrition from './components/Nutrition';
import Workout from './components/Workout';
import Progress from './components/Progress';
import WaterTracker from './components/WaterTracker';
import ChatBot from './components/ChatBot';
import Forum from './components/Forum';
import Profile from './components/Profile';

// API Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme Context
const ThemeContext = createContext();

// Auth Context
const AuthContext = createContext();

// Auth Hook
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Theme Hook
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          console.error('Auth error:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/login`, { email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const userResponse = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      setUser(userResponse.data);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const response = await axios.post(`${API}/register`, {
        email,
        password,
        full_name: fullName
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const userResponse = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      setUser(userResponse.data);
      
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Theme Provider
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Components
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
  </div>
);

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <nav className="glass backdrop-blur-xl border-b border-white/20 dark:border-gray-800/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold shadow-neon animate-pulse-glow">
                💪
              </div>
              <span className="ml-3 text-2xl font-bold gradient-text">
                FitnessPro
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-3 rounded-xl glass hover:bg-white/10 dark:hover:bg-black/10 transition-all duration-300 hover:shadow-neon group"
            >
              <span className="text-xl transition-transform group-hover:scale-110">
                {theme === 'light' ? '🌙' : '☀️'}
              </span>
            </button>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Hola, {user.full_name.split(' ')[0]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 font-medium"
                >
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                  <span className="sm:hidden">Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'from-blue-500 to-cyan-500' },
    { id: 'evaluation', label: 'Evaluación', icon: '📋', color: 'from-purple-500 to-pink-500' },
    { id: 'nutrition', label: 'Nutrición', icon: '🥗', color: 'from-green-500 to-emerald-500' },
    { id: 'workout', label: 'Entrenamiento', icon: '🏋️', color: 'from-orange-500 to-red-500' },
    { id: 'progress', label: 'Progreso', icon: '📈', color: 'from-teal-500 to-blue-500' },
    { id: 'exercises', label: 'Ejercicios', icon: '💪', color: 'from-indigo-500 to-purple-500' },
    { id: 'water', label: 'Agua', icon: '💧', color: 'from-cyan-500 to-blue-500' },
    { id: 'chat', label: 'Chat IA', icon: '🤖', color: 'from-pink-500 to-rose-500' },
    { id: 'forum', label: 'Foro', icon: '💬', color: 'from-yellow-500 to-orange-500' },
    { id: 'profile', label: 'Perfil', icon: '👤', color: 'from-slate-500 to-gray-500' },
  ];

  return (
    <div className="w-64 glass backdrop-blur-xl border-r border-white/20 dark:border-gray-800/20 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold gradient-text mb-6 text-center">
          Menú Principal
        </h2>
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 hover-lift group ${
                activeTab === item.id
                  ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-black/10'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className={`text-xl transition-transform group-hover:scale-110 ${
                activeTab === item.id ? 'animate-bounce-slow' : ''
              }`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            ¡Mantén tu rutina diaria!
          </p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    waterIntake: 0,
    waterGoal: 2000,
    weeklyWorkouts: 0,
    caloriesGoal: user?.daily_calories || 2000
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch water intake
        const waterResponse = await axios.get(`${API}/water-intake/today`, { headers });
        setStats(prev => ({ ...prev, waterIntake: waterResponse.data.total_intake }));
        
        // Fetch notifications
        const notificationsResponse = await axios.get(`${API}/notifications`, { headers });
        setNotifications(notificationsResponse.data.slice(0, 5));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [token]);

  const statCards = [
    {
      title: 'Agua Diaria',
      value: `${stats.waterIntake}ml`,
      icon: '💧',
      gradient: 'from-blue-500 to-cyan-500',
      progress: Math.min((stats.waterIntake / stats.waterGoal) * 100, 100)
    },
    {
      title: 'Calorías Objetivo',
      value: stats.caloriesGoal,
      icon: '🎯',
      gradient: 'from-green-500 to-emerald-500',
      progress: 75
    },
    {
      title: 'Entrenamientos',
      value: stats.weeklyWorkouts,
      icon: '🏋️',
      gradient: 'from-purple-500 to-pink-500',
      progress: 60
    },
    {
      title: 'Racha Actual',
      value: '7 días',
      icon: '🔥',
      gradient: 'from-orange-500 to-red-500',
      progress: 90
    }
  ];

  const weeklyProgress = [
    { day: 'Lunes', completed: true },
    { day: 'Martes', completed: true },
    { day: 'Miércoles', completed: false },
    { day: 'Jueves', completed: false },
    { day: 'Viernes', completed: false },
    { day: 'Sábado', completed: false },
    { day: 'Domingo', completed: false }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Bienvenido de vuelta, {user?.full_name?.split(' ')[0]}! 🚀
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="glass px-4 py-2 rounded-xl">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={stat.title} 
            className="glass rounded-2xl p-6 hover-lift animate-card-enter"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white text-2xl shadow-lg animate-float`}>
                {stat.icon}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progreso</span>
                <span>{stat.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`progress-bar bg-gradient-to-r ${stat.gradient} h-2 rounded-full transition-all duration-1000`}
                  style={{ width: `${stat.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Actividad Reciente
              </h3>
              <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium">
                Ver todo
              </button>
            </div>
            
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-white/50 to-white/20 dark:from-gray-800/50 dark:to-gray-800/20 hover:from-white/70 hover:to-white/40 dark:hover:from-gray-800/70 dark:hover:to-gray-800/40 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                      {notification.type === 'reminder' ? '⏰' : 
                       notification.type === 'motivation' ? '💪' : '🎯'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No hay notificaciones recientes</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Progreso Semanal
            </h3>
            <div className="space-y-4">
              {weeklyProgress.map((day, index) => (
                <div 
                  key={day.day} 
                  className="flex justify-between items-center animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {day.day}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    day.completed 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}>
                    {day.completed ? (
                      <span className="text-sm font-bold">✓</span>
                    ) : (
                      <span className="text-sm">○</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                Añadir Agua 💧
              </button>
              <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300">
                Registrar Comida 🍽️
              </button>
              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
                Iniciar Entrenamiento 🏋️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Evaluation = () => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    activity_level: 'sedentary',
    goal: 'maintain_weight',
    experience_level: 'beginner',
    health_conditions: [],
    food_preferences: [],
    food_allergies: [],
    available_days: [],
    preferred_workout_time: '',
    equipment_available: []
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.evaluation) {
      setFormData(user.evaluation);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/evaluation`, formData, { headers });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Evaluación de Fitness
        </h2>

        {success && (
          <div className="mb-6 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            ¡Evaluación actualizada exitosamente!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Edad
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Género
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peso (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Altura (cm)
              </label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nivel de Actividad
            </label>
            <select
              name="activity_level"
              value={formData.activity_level}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="sedentary">Sedentario</option>
              <option value="lightly_active">Ligeramente Activo</option>
              <option value="moderately_active">Moderadamente Activo</option>
              <option value="very_active">Muy Activo</option>
              <option value="extremely_active">Extremadamente Activo</option>
            </select>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Objetivo
            </label>
            <select
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="lose_weight">Perder Peso</option>
              <option value="maintain_weight">Mantener Peso</option>
              <option value="gain_weight">Ganar Peso</option>
              <option value="build_muscle">Construir Músculo</option>
              <option value="improve_fitness">Mejorar Fitness</option>
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nivel de Experiencia
            </label>
            <select
              name="experience_level"
              value={formData.experience_level}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>

          {/* Available Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Días Disponibles para Entrenar
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                <label key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.available_days.includes(day)}
                    onChange={() => handleMultiSelect('available_days', day)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Equipo Disponible
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['Mancuernas', 'Barra', 'Máquinas', 'Banda elástica', 'Kettlebell', 'Ninguno'].map(equipment => (
                <label key={equipment} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.equipment_available.includes(equipment)}
                    onChange={() => handleMultiSelect('equipment_available', equipment)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{equipment}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Evaluación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to main app if user is authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.email, formData.password, formData.fullName);

      if (!success) {
        setError('Error en la autenticación. Por favor, verifica tus credenciales.');
      }
    } catch (error) {
      setError('Error en la autenticación. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50 dark:from-gray-900 dark:via-primary-900 dark:to-gray-800"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary-400 rounded-full opacity-20 animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-secondary-400 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-success-400 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-40 right-40 w-24 h-24 bg-primary-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '0.5s' }}></div>
      
      {/* Hero Image */}
      <div className="absolute inset-0 flex items-center justify-end pr-16">
        <div className="hidden lg:block relative">
          <img 
            src="https://images.unsplash.com/photo-1541694458248-5aa2101c77df?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHxmaXRuZXNzfGVufDB8fHxibHVlfDE3NTI0ODY4MjJ8MA&ixlib=rb-4.1.0&q=85"
            alt="Fitness Hero"
            className="w-96 h-96 object-cover rounded-3xl shadow-2xl opacity-80 animate-float"
          />
        </div>
      </div>
      
      {/* Login Form */}
      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center animate-fade-in">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center text-3xl text-white shadow-neon animate-pulse-glow">
              💪
            </div>
            <h2 className="mt-6 text-center text-4xl font-bold gradient-text">
              {isLogin ? 'Bienvenido' : 'Únete a FitnessPro'}
            </h2>
            <p className="mt-4 text-center text-lg text-gray-600 dark:text-gray-300">
              {isLogin ? 'Continúa tu viaje fitness' : 'Comienza tu transformación'}
            </p>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 transition-colors"
              >
                {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
              </button>
            </p>
          </div>

          <div className="glass rounded-3xl p-8 shadow-glass animate-card-enter">
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl animate-slide-up">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="animate-slide-up">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required={!isLogin}
                    value={formData.fullName}
                    onChange={handleChange}
                    className="form-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
                    placeholder="Tu nombre completo"
                  />
                </div>
              )}

              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
                  placeholder="tu@email.com"
                />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
                  placeholder="Tu contraseña"
                />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 px-6 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-neon disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Al continuar, aceptas nuestros{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                  Términos de Servicio
                </a>{' '}
                y{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                  Política de Privacidad
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, token } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'evaluation':
        return <Evaluation />;
      case 'nutrition':
        return <Nutrition token={token} />;
      case 'workout':
        return <Workout token={token} />;
      case 'progress':
        return <Progress token={token} />;
      case 'exercises':
        return <Workout token={token} />;
      case 'water':
        return <WaterTracker token={token} />;
      case 'chat':
        return <ChatBot token={token} />;
      case 'forum':
        return <Forum token={token} />;
      case 'profile':
        return <Profile token={token} user={user} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(231, 121, 249, 0.1) 0%, transparent 50%)`
        }}></div>
      </div>
      
      <Navbar />
      <div className="flex relative">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 lg:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/*" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? children : <Navigate to="/auth" />;
};

export default App;