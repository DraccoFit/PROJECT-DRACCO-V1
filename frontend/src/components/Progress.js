import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const Progress = ({ token }) => {
  const [progressData, setProgressData] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [measurements, setMeasurements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newEntry, setNewEntry] = useState({
    weight: '',
    muscle_mass: '',
    body_fat: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      bicep: '',
      thigh: ''
    },
    notes: ''
  });

  useEffect(() => {
    fetchProgressData();
    fetchHealthMetrics();
  }, []);

  const fetchProgressData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/progress`, { headers });
      setProgressData(response.data);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  };

  const fetchHealthMetrics = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/health-metrics`, { headers });
      setHealthMetrics(response.data);
    } catch (error) {
      console.error('Error fetching health metrics:', error);
    }
  };

  const submitProgressEntry = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/progress`, newEntry, { headers });
      
      // Reset form
      setNewEntry({
        weight: '',
        muscle_mass: '',
        body_fat: '',
        measurements: {
          chest: '',
          waist: '',
          hips: '',
          bicep: '',
          thigh: ''
        },
        notes: ''
      });
      
      // Refresh data
      fetchProgressData();
      fetchHealthMetrics();
    } catch (error) {
      console.error('Error submitting progress entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthMetrics = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/health-metrics/calculate`, {}, { headers });
      setHealthMetrics(response.data);
    } catch (error) {
      console.error('Error calculating health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Bajo peso', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Peso normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Sobrepeso', color: 'text-yellow-600' };
    return { category: 'Obesidad', color: 'text-red-600' };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Progreso
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Seguimiento de tu transformación física 📈
          </p>
        </div>
        <button
          onClick={calculateHealthMetrics}
          disabled={loading}
          className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Calculando...' : 'Calcular Métricas'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nuevo Registro */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Nuevo Registro
          </h3>
          
          <form onSubmit={submitProgressEntry} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.weight}
                  onChange={(e) => setNewEntry({...newEntry, weight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                  placeholder="70.5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Masa Muscular (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.muscle_mass}
                  onChange={(e) => setNewEntry({...newEntry, muscle_mass: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                  placeholder="35.2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grasa Corporal (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.body_fat}
                  onChange={(e) => setNewEntry({...newEntry, body_fat: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                  placeholder="15.3"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Mediciones (cm)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(newEntry.measurements).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">
                      {key === 'chest' ? 'Pecho' : 
                       key === 'waist' ? 'Cintura' : 
                       key === 'hips' ? 'Cadera' : 
                       key === 'bicep' ? 'Bícep' : 
                       key === 'thigh' ? 'Muslo' : key}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={value}
                      onChange={(e) => setNewEntry({
                        ...newEntry,
                        measurements: {
                          ...newEntry.measurements,
                          [key]: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                      placeholder="0.0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas
              </label>
              <textarea
                value={newEntry.notes}
                onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                placeholder="Cómo te sientes hoy, logros, observaciones..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </form>
        </div>

        {/* Métricas de Salud */}
        <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Métricas de Salud
          </h3>
          
          {healthMetrics ? (
            <div className="space-y-6">
              {/* IMC */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300">
                    Índice de Masa Corporal (IMC)
                  </h4>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {healthMetrics.bmi?.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((healthMetrics.bmi / 35) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium ${getBMICategory(healthMetrics.bmi).color}`}>
                    {getBMICategory(healthMetrics.bmi).category}
                  </span>
                </div>
              </div>

              {/* Grasa Corporal */}
              {healthMetrics.body_fat_percentage && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-green-800 dark:text-green-300">
                      Grasa Corporal
                    </h4>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {healthMetrics.body_fat_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((healthMetrics.body_fat_percentage / 40) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Masa Muscular */}
              {healthMetrics.muscle_mass_percentage && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300">
                      Masa Muscular
                    </h4>
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {healthMetrics.muscle_mass_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((healthMetrics.muscle_mass_percentage / 60) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              {healthMetrics.recommendations && healthMetrics.recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
                    Recomendaciones
                  </h4>
                  <ul className="space-y-2">
                    {healthMetrics.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">
                          {rec}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-blue-100 dark:from-teal-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                No hay métricas de salud disponibles
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Agrega un registro para calcular tus métricas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historial de Progreso */}
      <div className="glass rounded-2xl p-6 animate-slide-up">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Historial de Progreso
        </h3>
        
        {progressData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Peso
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Masa Muscular
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Grasa Corporal
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody>
                {progressData.slice(0, 10).map((entry, index) => (
                  <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(entry.date)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {entry.weight ? `${entry.weight} kg` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {entry.muscle_mass ? `${entry.muscle_mass} kg` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {entry.body_fat ? `${entry.body_fat}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {entry.notes ? (
                        <span className="truncate max-w-xs block" title={entry.notes}>
                          {entry.notes}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No hay registros de progreso
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Comienza agregando tu primer registro
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;