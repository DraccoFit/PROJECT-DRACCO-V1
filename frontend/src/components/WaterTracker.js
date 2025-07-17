import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const WaterTracker = ({ token }) => {
  const [waterData, setWaterData] = useState({
    today: 0,
    goal: 2000,
    history: []
  });
  const [loading, setLoading] = useState(false);
  const [quickAmount, setQuickAmount] = useState(250);

  useEffect(() => {
    fetchWaterData();
  }, []);

  const fetchWaterData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch today's water intake
      const todayResponse = await axios.get(`${API}/water-intake/today`, { headers });
      
      // Fetch water history
      const historyResponse = await axios.get(`${API}/water-intake/history`, { headers });
      
      setWaterData({
        today: todayResponse.data.total_intake || 0,
        goal: todayResponse.data.goal || 2000,
        history: historyResponse.data || []
      });
    } catch (error) {
      console.error('Error fetching water data:', error);
    }
  };

  const addWater = async (amount) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/water-intake`, {
        amount_ml: amount,
        goal_ml: waterData.goal
      }, { headers });
      
      // Update local state
      setWaterData(prev => ({
        ...prev,
        today: prev.today + amount
      }));
      
      // Refresh data
      fetchWaterData();
    } catch (error) {
      console.error('Error adding water:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async (newGoal) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/water-intake/goal`, {
        goal_ml: newGoal
      }, { headers });
      
      setWaterData(prev => ({
        ...prev,
        goal: newGoal
      }));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const getProgressPercentage = () => {
    return Math.min((waterData.today / waterData.goal) * 100, 100);
  };

  const getWaterLevel = () => {
    return Math.min((waterData.today / waterData.goal) * 100, 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  const quickAmounts = [100, 250, 500, 750, 1000];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Hidratación
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Mantén un seguimiento de tu consumo diario de agua 💧
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visualización Principal */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-8 animate-slide-up">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Consumo de Hoy
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Botella de Agua Animada */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-48 bg-gradient-to-b from-transparent to-blue-100 dark:to-blue-900 rounded-full border-4 border-blue-300 dark:border-blue-700 overflow-hidden relative">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-1000 ease-out"
                    style={{ height: `${getWaterLevel()}%` }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-2 bg-blue-300 opacity-50 animate-pulse"></div>
                  </div>
                  
                  {/* Burbujas animadas */}
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-blue-200 rounded-full animate-bounce"
                      style={{
                        left: `${20 + i * 25}%`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: '2s'
                      }}
                    ></div>
                  ))}
                </div>
                
                {/* Tapa de la botella */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-gray-400 dark:bg-gray-600 rounded-t-lg"></div>
              </div>
            </div>

            {/* Progreso Numérico */}
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {waterData.today}ml
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400">
                de {waterData.goal}ml objetivo
              </div>
            </div>

            {/* Barra de Progreso */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>Progreso</span>
                <span>{getProgressPercentage().toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="progress-bar bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${getProgressPercentage()}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Botones de Acción Rápida */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => addWater(amount)}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 hover:scale-105"
                >
                  +{amount}ml
                </button>
              ))}
            </div>

            {/* Cantidad Personalizada */}
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={quickAmount}
                onChange={(e) => setQuickAmount(parseInt(e.target.value) || 0)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Cantidad personalizada"
                min="1"
                max="2000"
              />
              <button
                onClick={() => addWater(quickAmount)}
                disabled={loading || quickAmount <= 0}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Objetivo Diario */}
          <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Objetivo Diario
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Meta actual:</span>
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {waterData.goal}ml
                </span>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nuevo objetivo:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={waterData.goal}
                    min="500"
                    max="5000"
                    step="250"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const newGoal = parseInt(e.target.value);
                        if (newGoal >= 500 && newGoal <= 5000) {
                          updateGoal(newGoal);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <span className="text-gray-500 dark:text-gray-400">ml</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Recomendado: 2000-3000ml por día
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Estadísticas
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Restante:</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {Math.max(0, waterData.goal - waterData.today)}ml
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Vasos (250ml):</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {Math.floor(waterData.today / 250)} / {Math.ceil(waterData.goal / 250)}
                </span>
              </div>
              
              {waterData.today >= waterData.goal && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3">
                  <div className="flex items-center text-green-700 dark:text-green-400">
                    <span className="text-lg mr-2">🎉</span>
                    <span className="font-medium">¡Objetivo alcanzado!</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Historial Semanal */}
          <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Historial Semanal
            </h3>
            
            <div className="space-y-3">
              {waterData.history.slice(0, 7).map((entry, index) => (
                <div key={entry.id} className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatDate(entry.date)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((entry.amount_ml / entry.goal_ml) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">
                      {entry.amount_ml}ml
                    </span>
                  </div>
                </div>
              ))}
              
              {waterData.history.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No hay historial disponible
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterTracker;