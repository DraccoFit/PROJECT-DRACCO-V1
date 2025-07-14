import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Profile = ({ token, user }) => {
  const [profile, setProfile] = useState(user || {});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDays: 0,
    streakDays: 7,
    caloriesBurned: 0
  });

  useEffect(() => {
    fetchUserStats();
    generateAchievements();
  }, []);

  const fetchUserStats = async () => {
    // This would fetch real stats from the backend
    // For now, we'll use mock data
    setStats({
      totalWorkouts: 25,
      totalDays: 45,
      streakDays: 7,
      caloriesBurned: 12500
    });
  };

  const generateAchievements = () => {
    const mockAchievements = [
      { id: 1, title: 'Primera Semana', description: 'Completa tu primera semana de entrenamiento', earned: true, date: '2024-01-15', icon: '🏆' },
      { id: 2, title: 'Hydration Hero', description: 'Bebe 2L de agua por 7 días consecutivos', earned: true, date: '2024-01-20', icon: '💧' },
      { id: 3, title: 'Progreso Fotográfico', description: 'Sube tu primera foto de progreso', earned: true, date: '2024-01-25', icon: '📸' },
      { id: 4, title: 'Mentor Comunitario', description: 'Ayuda a 5 personas en el foro', earned: false, progress: 3, icon: '🤝' },
      { id: 5, title: 'Racha de Fuego', description: 'Mantén una racha de 30 días', earned: false, progress: 7, icon: '🔥' },
      { id: 6, title: 'Máquina de Cardio', description: 'Quema 10,000 calorías en total', earned: false, progress: 8500, icon: '🏃' }
    ];
    setAchievements(mockAchievements);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // This would save the profile to the backend
      console.log('Saving profile:', profile);
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (profile.evaluation?.weight && profile.evaluation?.height) {
      const heightInMeters = profile.evaluation.height / 100;
      const bmi = profile.evaluation.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Bajo peso', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Sobrepeso', color: 'text-yellow-600' };
    return { category: 'Obesidad', color: 'text-red-600' };
  };

  const getProgressPercentage = (progress, total) => {
    return Math.min((progress / total) * 100, 100);
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          👤 Mi Perfil
        </h1>
        <button
          onClick={() => setEditing(!editing)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          {editing ? 'Cancelar' : 'Editar Perfil'}
        </button>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Información Personal
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre Completo
              </label>
              {editing ? (
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profile.full_name || 'No especificado'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{profile.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Edad
              </label>
              <p className="text-gray-900 dark:text-white">
                {profile.evaluation?.age || 'No especificado'} años
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Género
              </label>
              <p className="text-gray-900 dark:text-white capitalize">
                {profile.evaluation?.gender || 'No especificado'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peso Actual
              </label>
              <p className="text-gray-900 dark:text-white">
                {profile.evaluation?.weight || 'No especificado'} kg
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Altura
              </label>
              <p className="text-gray-900 dark:text-white">
                {profile.evaluation?.height || 'No especificado'} cm
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Objetivo
              </label>
              <p className="text-gray-900 dark:text-white">
                {profile.evaluation?.goal === 'lose_weight' ? 'Perder peso' :
                 profile.evaluation?.goal === 'gain_weight' ? 'Ganar peso' :
                 profile.evaluation?.goal === 'build_muscle' ? 'Ganar músculo' :
                 profile.evaluation?.goal === 'maintain_weight' ? 'Mantener peso' :
                 profile.evaluation?.goal === 'improve_fitness' ? 'Mejorar condición física' :
                 'No especificado'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nivel de Actividad
              </label>
              <p className="text-gray-900 dark:text-white capitalize">
                {profile.evaluation?.activity_level?.replace('_', ' ') || 'No especificado'}
              </p>
            </div>
          </div>

          {editing && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          )}
        </div>

        {/* Health Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Estadísticas de Salud
          </h2>
          
          <div className="space-y-4">
            {bmi && (
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {bmi}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Índice de Masa Corporal
                </div>
                <div className={`text-sm font-medium ${bmiCategory.color}`}>
                  {bmiCategory.category}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {profile.daily_calories || 'N/A'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Calorías diarias recomendadas
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {profile.tmb || 'N/A'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Tasa Metabólica Basal
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Estadísticas de Actividad
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {stats.totalWorkouts}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Entrenamientos Completados
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {stats.totalDays}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Días Activos
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {stats.streakDays}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Racha Actual (días)
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {stats.caloriesBurned.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Calorías Quemadas
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🏆 Logros
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <div 
              key={achievement.id} 
              className={`p-4 rounded-lg border-2 ${
                achievement.earned 
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{achievement.icon}</span>
                {achievement.earned && (
                  <span className="text-yellow-600 dark:text-yellow-400 text-sm">
                    ✓ Completado
                  </span>
                )}
              </div>
              
              <h3 className={`font-semibold mb-1 ${
                achievement.earned 
                  ? 'text-yellow-800 dark:text-yellow-300' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {achievement.title}
              </h3>
              
              <p className={`text-sm mb-2 ${
                achievement.earned 
                  ? 'text-yellow-700 dark:text-yellow-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {achievement.description}
              </p>

              {achievement.earned ? (
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  Obtenido: {new Date(achievement.date).toLocaleDateString()}
                </div>
              ) : achievement.progress !== undefined ? (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progreso</span>
                    <span>{achievement.progress}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(achievement.progress, achievement.id === 4 ? 5 : achievement.id === 5 ? 30 : 10000)}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Sin progreso
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Configuración de Cuenta
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Notificaciones por Email
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recibir recordatorios y actualizaciones por email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Recordatorios de Entrenamiento
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recibir recordatorios para entrenar
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Compartir Progreso
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Permitir que otros vean tu progreso en el foro
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex space-x-4">
              <button className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Cambiar Contraseña
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;