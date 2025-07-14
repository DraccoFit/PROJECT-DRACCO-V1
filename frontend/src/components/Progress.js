import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Progress = ({ token }) => {
  const [progressEntries, setProgressEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    weight: '',
    muscle_mass: '',
    body_fat: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: ''
    },
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProgressEntries();
  }, []);

  const fetchProgressEntries = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/progress`, { headers });
      setProgressEntries(response.data);
    } catch (error) {
      console.error('Error fetching progress entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const entryData = {
        weight: newEntry.weight ? parseFloat(newEntry.weight) : null,
        muscle_mass: newEntry.muscle_mass ? parseFloat(newEntry.muscle_mass) : null,
        body_fat: newEntry.body_fat ? parseFloat(newEntry.body_fat) : null,
        measurements: {},
        notes: newEntry.notes
      };

      // Only include measurements that have values
      Object.keys(newEntry.measurements).forEach(key => {
        if (newEntry.measurements[key]) {
          entryData.measurements[key] = parseFloat(newEntry.measurements[key]);
        }
      });

      await axios.post(`${API}/progress`, entryData, { headers });
      
      // Reset form
      setNewEntry({
        weight: '',
        muscle_mass: '',
        body_fat: '',
        measurements: {
          chest: '',
          waist: '',
          hips: '',
          arms: '',
          thighs: ''
        },
        notes: ''
      });

      // Refresh data
      fetchProgressEntries();
    } catch (error) {
      console.error('Error adding progress entry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewEntry(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewEntry(prev => ({ ...prev, [field]: value }));
    }
  };

  const getWeightTrend = () => {
    if (progressEntries.length < 2) return null;
    
    const recentEntries = progressEntries.filter(entry => entry.weight).slice(0, 5);
    if (recentEntries.length < 2) return null;

    const firstWeight = recentEntries[recentEntries.length - 1].weight;
    const lastWeight = recentEntries[0].weight;
    const diff = lastWeight - firstWeight;

    if (Math.abs(diff) < 0.1) return { trend: 'stable', value: diff };
    return { trend: diff > 0 ? 'up' : 'down', value: diff };
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      case 'stable': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const ProgressChart = ({ entries, field, label, unit }) => {
    const validEntries = entries.filter(entry => entry[field] !== null && entry[field] !== undefined);
    
    if (validEntries.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay datos de {label.toLowerCase()} disponibles
        </div>
      );
    }

    const maxValue = Math.max(...validEntries.map(entry => entry[field]));
    const minValue = Math.min(...validEntries.map(entry => entry[field]));
    const range = maxValue - minValue;

    return (
      <div className="h-64 flex items-end justify-center space-x-2 px-4">
        {validEntries.slice(0, 10).reverse().map((entry, index) => {
          const height = range > 0 ? ((entry[field] - minValue) / range) * 200 + 20 : 120;
          return (
            <div key={entry.id} className="flex flex-col items-center">
              <div className="relative group">
                <div
                  className="bg-blue-500 hover:bg-blue-600 transition-colors rounded-t w-8 min-h-[20px]"
                  style={{ height: `${height}px` }}
                ></div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {entry[field]}{unit}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(entry.date).toLocaleDateString('es-ES', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const weightTrend = getWeightTrend();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Progreso
        </h1>
        {weightTrend && (
          <div className={`flex items-center space-x-2 ${getTrendColor(weightTrend.trend)}`}>
            <span className="text-2xl">{getTrendIcon(weightTrend.trend)}</span>
            <span className="font-semibold">
              {weightTrend.value > 0 ? '+' : ''}{weightTrend.value.toFixed(1)}kg
            </span>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Peso Actual
          </h3>
          <ProgressChart entries={progressEntries} field="weight" label="Peso" unit="kg" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Masa Muscular
          </h3>
          <ProgressChart entries={progressEntries} field="muscle_mass" label="Masa Muscular" unit="kg" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Grasa Corporal
          </h3>
          <ProgressChart entries={progressEntries} field="body_fat" label="Grasa Corporal" unit="%" />
        </div>
      </div>

      {/* Add New Entry */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Agregar Nueva Entrada
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={newEntry.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                onChange={(e) => handleInputChange('muscle_mass', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="30.2"
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
                onChange={(e) => handleInputChange('body_fat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="15.5"
              />
            </div>
          </div>

          {/* Measurements */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Medidas (cm)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pecho
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.measurements.chest}
                  onChange={(e) => handleInputChange('measurements.chest', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="95"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cintura
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.measurements.waist}
                  onChange={(e) => handleInputChange('measurements.waist', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Caderas
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.measurements.hips}
                  onChange={(e) => handleInputChange('measurements.hips', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brazos
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.measurements.arms}
                  onChange={(e) => handleInputChange('measurements.arms', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="35"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Muslos
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.measurements.thighs}
                  onChange={(e) => handleInputChange('measurements.thighs', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="55"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas
            </label>
            <textarea
              value={newEntry.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Cómo te sientes hoy, cambios notados, etc..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Guardar Progreso'}
            </button>
          </div>
        </form>
      </div>

      {/* Progress History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Historial de Progreso
        </h2>

        {progressEntries.length > 0 ? (
          <div className="space-y-4">
            {progressEntries.map(entry => (
              <div key={entry.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(entry.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(entry.date).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {entry.weight && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {entry.weight} kg
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Peso</p>
                    </div>
                  )}
                  {entry.muscle_mass && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {entry.muscle_mass} kg
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Masa Muscular</p>
                    </div>
                  )}
                  {entry.body_fat && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {entry.body_fat}%
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Grasa Corporal</p>
                    </div>
                  )}
                </div>

                {Object.keys(entry.measurements).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Medidas:
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.entries(entry.measurements).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {value} cm
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {key === 'chest' ? 'Pecho' : 
                             key === 'waist' ? 'Cintura' : 
                             key === 'hips' ? 'Caderas' : 
                             key === 'arms' ? 'Brazos' : 
                             key === 'thighs' ? 'Muslos' : key}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.notes && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {entry.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No hay entradas de progreso aún
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Agrega tu primera entrada para comenzar a seguir tu progreso
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;