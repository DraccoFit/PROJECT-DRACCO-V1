import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WaterTracker = ({ token }) => {
  const [todayIntake, setTodayIntake] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [entries, setEntries] = useState([]);
  const [newAmount, setNewAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayIntake();
  }, []);

  const fetchTodayIntake = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/water-intake/today`, { headers });
      setTodayIntake(response.data.total_intake);
      setGoal(response.data.goal);
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Error fetching water intake:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWaterIntake = async (amount) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/water-intake`, {
        amount_ml: amount,
        goal_ml: goal
      }, { headers });
      
      setTodayIntake(prev => prev + amount);
      fetchTodayIntake();
    } catch (error) {
      console.error('Error adding water intake:', error);
    }
  };

  const handleQuickAdd = (amount) => {
    addWaterIntake(amount);
  };

  const handleCustomAdd = (e) => {
    e.preventDefault();
    if (newAmount && !isNaN(newAmount) && parseInt(newAmount) > 0) {
      addWaterIntake(parseInt(newAmount));
      setNewAmount('');
    }
  };

  const progressPercentage = Math.min((todayIntake / goal) * 100, 100);

  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'bg-green-500';
    if (progressPercentage >= 75) return 'bg-blue-500';
    if (progressPercentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getWaterLevel = () => {
    return Math.min(progressPercentage, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Seguimiento de Agua
        </h1>
        <div className="text-lg text-gray-600 dark:text-gray-400">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Main Water Tracker */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
          {/* Water Bottle Animation */}
          <div className="relative">
            <div className="w-32 h-64 bg-gray-200 dark:bg-gray-700 rounded-full border-4 border-gray-300 dark:border-gray-600 relative overflow-hidden">
              {/* Water Level */}
              <div 
                className={`absolute bottom-0 left-0 right-0 ${getProgressColor()} transition-all duration-1000 ease-out rounded-full`}
                style={{ height: `${getWaterLevel()}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-20"></div>
                {/* Water Animation */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-2 left-0 right-0 h-4 bg-white opacity-10 rounded-full animate-pulse"></div>
                  <div className="absolute -top-1 left-0 right-0 h-2 bg-white opacity-20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>
              
              {/* Water Bottle Cap */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-gray-400 dark:bg-gray-500 rounded-t-lg border-2 border-gray-500 dark:border-gray-600"></div>
              
              {/* Measurements */}
              <div className="absolute right-2 top-4 text-xs text-gray-500 dark:text-gray-400 space-y-8">
                <div>2L</div>
                <div>1.5L</div>
                <div>1L</div>
                <div>0.5L</div>
              </div>
            </div>
          </div>

          {/* Progress Info */}
          <div className="flex-1 text-center lg:text-left lg:ml-8">
            <div className="mb-6">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {todayIntake} ml
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                de {goal} ml objetivo
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
              <div 
                className={`h-4 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-6">
              <span>0%</span>
              <span className="font-medium">
                {progressPercentage.toFixed(1)}%
              </span>
              <span>100%</span>
            </div>

            {/* Status Message */}
            <div className="text-center">
              {progressPercentage >= 100 ? (
                <div className="text-green-600 dark:text-green-400 font-semibold">
                  🎉 ¡Objetivo alcanzado! ¡Excelente trabajo!
                </div>
              ) : progressPercentage >= 75 ? (
                <div className="text-blue-600 dark:text-blue-400 font-semibold">
                  💪 ¡Casi lo logras! Solo {goal - todayIntake} ml más
                </div>
              ) : progressPercentage >= 50 ? (
                <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                  ⚡ ¡Buen progreso! Continúa así
                </div>
              ) : (
                <div className="text-red-600 dark:text-red-400 font-semibold">
                  🚰 ¡Necesitas hidratarte más!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Agregar Rápido
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => handleQuickAdd(250)}
            className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 p-4 rounded-lg transition-colors font-medium"
          >
            <div className="text-2xl mb-1">🥤</div>
            <div>250ml</div>
            <div className="text-sm opacity-75">Vaso</div>
          </button>
          
          <button
            onClick={() => handleQuickAdd(500)}
            className="bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-800 dark:text-green-200 p-4 rounded-lg transition-colors font-medium"
          >
            <div className="text-2xl mb-1">🍶</div>
            <div>500ml</div>
            <div className="text-sm opacity-75">Botella</div>
          </button>
          
          <button
            onClick={() => handleQuickAdd(1000)}
            className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-800 dark:text-purple-200 p-4 rounded-lg transition-colors font-medium"
          >
            <div className="text-2xl mb-1">🍼</div>
            <div>1000ml</div>
            <div className="text-sm opacity-75">Botella Grande</div>
          </button>
          
          <button
            onClick={() => handleQuickAdd(100)}
            className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg transition-colors font-medium"
          >
            <div className="text-2xl mb-1">☕</div>
            <div>100ml</div>
            <div className="text-sm opacity-75">Sorbo</div>
          </button>
        </div>

        {/* Custom Amount */}
        <form onSubmit={handleCustomAdd} className="flex items-center space-x-4">
          <input
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Cantidad personalizada (ml)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            Agregar
          </button>
        </form>
      </div>

      {/* Daily History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Historial del Día
        </h3>
        
        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {entry.amount_ml} ml
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {new Date(entry.date).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No has registrado agua hoy
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              ¡Comienza hidratándote ahora!
            </p>
          </div>
        )}
      </div>

      {/* Hydration Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Consejos de Hidratación
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              🌅 Al despertar
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Bebe 1-2 vasos de agua inmediatamente al levantarte para activar tu metabolismo.
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
              🏃 Durante el ejercicio
            </h4>
            <p className="text-sm text-green-800 dark:text-green-400">
              Bebe 150-250ml cada 15-20 minutos durante el ejercicio intenso.
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              🍽️ Antes de comer
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Bebe agua 30 minutos antes de las comidas para mejorar la digestión.
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
              🌙 Antes de dormir
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-400">
              Bebe un vaso de agua 1 hora antes de dormir para mantener la hidratación nocturna.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterTracker;