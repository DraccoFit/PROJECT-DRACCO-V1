import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const Profile = ({ token, user }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    age: user?.evaluation?.age || '',
    gender: user?.evaluation?.gender || 'male',
    location: ''
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    email_updates: true,
    theme: 'light',
    language: 'es',
    privacy_level: 'private'
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const updatePersonalInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/profile/personal`, personalInfo, { headers });
      // Handle success
    } catch (error) {
      console.error('Error updating personal info:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/profile/preferences`, preferences, { headers });
      // Handle success
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/profile/password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, { headers });
      
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      // Handle success
    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Información Personal', icon: '👤' },
    { id: 'preferences', label: 'Preferencias', icon: '⚙️' },
    { id: 'security', label: 'Seguridad', icon: '🔒' },
    { id: 'stats', label: 'Estadísticas', icon: '📊' }
  ];

  const renderPersonalInfo = () => (
    <form onSubmit={updatePersonalInfo} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre Completo
          </label>
          <input
            type="text"
            value={personalInfo.full_name}
            onChange={(e) => setPersonalInfo({...personalInfo, full_name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={personalInfo.email}
            onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={personalInfo.phone}
            onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="+1 (555) 123-4567"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Edad
          </label>
          <input
            type="number"
            value={personalInfo.age}
            onChange={(e) => setPersonalInfo({...personalInfo, age: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            min="13"
            max="120"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Género
          </label>
          <select
            value={personalInfo.gender}
            onChange={(e) => setPersonalInfo({...personalInfo, gender: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ubicación
          </label>
          <input
            type="text"
            value={personalInfo.location}
            onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ciudad, País"
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );

  const renderPreferences = () => (
    <form onSubmit={updatePreferences} className="space-y-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notificaciones
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notificaciones Push
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Recibir notificaciones en tiempo real
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreferences({...preferences, notifications: !preferences.notifications})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Actualizaciones por Email
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Recibir actualizaciones semanales
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreferences({...preferences, email_updates: !preferences.email_updates})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.email_updates ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.email_updates ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Apariencia
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tema
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => setPreferences({...preferences, theme: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Idioma
              </label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Privacidad
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nivel de Privacidad
            </label>
            <select
              value={preferences.privacy_level}
              onChange={(e) => setPreferences({...preferences, privacy_level: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="public">Público</option>
              <option value="friends">Solo Amigos</option>
              <option value="private">Privado</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Preferencias'}
        </button>
      </div>
    </form>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <form onSubmit={updatePassword} className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cambiar Contraseña
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contraseña Actual
          </label>
          <input
            type="password"
            value={passwordData.current_password}
            onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nueva Contraseña
          </label>
          <input
            type="password"
            value={passwordData.new_password}
            onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirmar Nueva Contraseña
          </label>
          <input
            type="password"
            value={passwordData.confirm_password}
            onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </div>
      </form>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Configuración de Seguridad
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Autenticación de Dos Factores
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Añade una capa extra de seguridad
              </p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Activar
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Sesiones Activas
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestiona tus sesiones en otros dispositivos
              </p>
            </div>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              Ver Sesiones
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Estadísticas de Uso
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Días Activos
              </p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                45
              </p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Entrenamientos
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                32
              </p>
            </div>
            <div className="text-3xl">🏋️</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                Planes Completados
              </p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                8
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Calorías Quemadas
              </p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                15,420
              </p>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                Agua Consumida
              </p>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                890L
              </p>
            </div>
            <div className="text-3xl">💧</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                Tiempo Activo
              </p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                156h
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Logros Recientes
        </h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">🏆</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                30 Días Consecutivos
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ¡Mantuviste tu racha por un mes completo!
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">💪</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Fuerza Máxima
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Alcanzaste tu record personal en bench press
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">🥗</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Nutrición Perfecta
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Seguiste tu plan nutricional por 2 semanas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'preferences':
        return renderPreferences();
      case 'security':
        return renderSecurity();
      case 'stats':
        return renderStats();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Mi Perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Gestiona tu información personal y configuración 👤
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de Pestañas */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {user?.full_name || 'Usuario'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email || 'email@ejemplo.com'}
                </p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;