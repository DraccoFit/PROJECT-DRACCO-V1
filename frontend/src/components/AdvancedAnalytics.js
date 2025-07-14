import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdvancedAnalytics = ({ token }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('weight');

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/analytics/advanced-progress?period=${period}`, { headers });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (period) => {
    const labels = {
      'week': 'Última Semana',
      'month': 'Último Mes',
      'quarter': 'Último Trimestre',
      'year': 'Último Año'
    };
    return labels[period] || period;
  };

  const getTrendColor = (trend) => {
    if (!trend) return 'text-gray-500';
    
    switch (trend.direction) {
      case 'increasing':
        return 'text-green-600 dark:text-green-400';
      case 'decreasing':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend) => {
    if (!trend) return '📊';
    
    switch (trend.direction) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '📊';
    }
  };

  const createLineChartData = (data, label, color) => {
    if (!data || data.length === 0) return null;

    return {
      labels: data.map(item => new Date(item.date).toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      })),
      datasets: [
        {
          label: label,
          data: data.map(item => item.value),
          borderColor: color,
          backgroundColor: `${color}20`,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  const createBarChartData = (measurements) => {
    if (!measurements) return null;

    const measurementNames = Object.keys(measurements);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    return {
      labels: measurementNames.map(name => {
        const labels = {
          'chest': 'Pecho',
          'waist': 'Cintura',
          'hips': 'Caderas',
          'arms': 'Brazos',
          'thighs': 'Muslos'
        };
        return labels[name] || name;
      }),
      datasets: [
        {
          label: 'Medidas (cm)',
          data: measurementNames.map(name => {
            const data = measurements[name];
            return data.length > 0 ? data[data.length - 1].value : 0;
          }),
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 2,
        },
      ],
    };
  };

  const createDoughnutChartData = (activitySummary) => {
    if (!activitySummary) return null;

    const waterGoal = 2000; // ml
    const waterProgress = (activitySummary.avg_water_intake / waterGoal) * 100;
    const workoutGoal = 20; // workouts per period
    const workoutProgress = (activitySummary.workout_frequency / workoutGoal) * 100;

    return {
      labels: ['Hidratación', 'Ejercicio', 'Restante'],
      datasets: [
        {
          data: [
            Math.min(waterProgress, 100),
            Math.min(workoutProgress, 100),
            Math.max(0, 100 - waterProgress - workoutProgress)
          ],
          backgroundColor: ['#3B82F6', '#10B981', '#E5E7EB'],
          borderColor: ['#1D4ED8', '#059669', '#9CA3AF'],
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No hay datos suficientes para mostrar análisis avanzado
        </p>
      </div>
    );
  }

  const { chart_data, trends, activity_summary, goal_progress, predictions, achievements } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📊 Análisis Avanzado
        </h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="week">Última Semana</option>
          <option value="month">Último Mes</option>
          <option value="quarter">Último Trimestre</option>
          <option value="year">Último Año</option>
        </select>
      </div>

      {/* Trends Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tendencia de Peso
            </h3>
            <span className={`text-2xl ${getTrendColor(trends.weight)}`}>
              {getTrendIcon(trends.weight)}
            </span>
          </div>
          {trends.weight && (
            <div>
              <p className={`text-lg font-bold ${getTrendColor(trends.weight)}`}>
                {trends.weight.direction === 'increasing' ? '+' : trends.weight.direction === 'decreasing' ? '-' : ''}
                {Math.abs(trends.weight.change || 0).toFixed(1)}kg
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {trends.weight.change_percent?.toFixed(1)}% en {getPeriodLabel(period).toLowerCase()}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Grasa Corporal
            </h3>
            <span className={`text-2xl ${getTrendColor(trends.body_fat)}`}>
              {getTrendIcon(trends.body_fat)}
            </span>
          </div>
          {trends.body_fat && (
            <div>
              <p className={`text-lg font-bold ${getTrendColor(trends.body_fat)}`}>
                {trends.body_fat.direction === 'increasing' ? '+' : trends.body_fat.direction === 'decreasing' ? '-' : ''}
                {Math.abs(trends.body_fat.change || 0).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {trends.body_fat.change_percent?.toFixed(1)}% en {getPeriodLabel(period).toLowerCase()}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Masa Muscular
            </h3>
            <span className={`text-2xl ${getTrendColor(trends.muscle_mass)}`}>
              {getTrendIcon(trends.muscle_mass)}
            </span>
          </div>
          {trends.muscle_mass && (
            <div>
              <p className={`text-lg font-bold ${getTrendColor(trends.muscle_mass)}`}>
                {trends.muscle_mass.direction === 'increasing' ? '+' : trends.muscle_mass.direction === 'decreasing' ? '-' : ''}
                {Math.abs(trends.muscle_mass.change || 0).toFixed(1)}kg
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {trends.muscle_mass.change_percent?.toFixed(1)}% en {getPeriodLabel(period).toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Progress Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Progreso de Peso
          </h3>
          <div className="h-64">
            {chart_data.weight && chart_data.weight.length > 0 ? (
              <Line 
                data={createLineChartData(chart_data.weight, 'Peso (kg)', '#3B82F6')}
                options={chartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay datos de peso disponibles
              </div>
            )}
          </div>
        </div>

        {/* Body Fat Progress Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Grasa Corporal
          </h3>
          <div className="h-64">
            {chart_data.body_fat && chart_data.body_fat.length > 0 ? (
              <Line 
                data={createLineChartData(chart_data.body_fat, 'Grasa Corporal (%)', '#EF4444')}
                options={chartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay datos de grasa corporal disponibles
              </div>
            )}
          </div>
        </div>

        {/* Measurements Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Medidas Corporales
          </h3>
          <div className="h-64">
            {chart_data.measurements && Object.keys(chart_data.measurements).some(key => chart_data.measurements[key].length > 0) ? (
              <Bar 
                data={createBarChartData(chart_data.measurements)}
                options={chartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay datos de medidas disponibles
              </div>
            )}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumen de Actividad
          </h3>
          <div className="h-64">
            {activity_summary ? (
              <Doughnut 
                data={createDoughnutChartData(activity_summary)}
                options={doughnutOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay datos de actividad disponibles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Progress */}
      {goal_progress && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Progreso hacia Objetivos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {goal_progress.progress_percent}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Progreso General</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {goal_progress.status}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                {goal_progress.current_weight}kg
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Peso Actual</p>
            </div>
          </div>
        </div>
      )}

      {/* Predictions */}
      {predictions && Object.keys(predictions).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🔮 Predicciones (Próximos 30 días)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {predictions.weight && (
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                  Peso Proyectado
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Basado en la tendencia actual, tu peso podría estar entre{' '}
                  <span className="font-semibold">
                    {Math.min(...predictions.weight).toFixed(1)}kg - {Math.max(...predictions.weight).toFixed(1)}kg
                  </span>
                </p>
              </div>
            )}
            {predictions.body_fat && (
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                  Grasa Corporal Proyectada
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Basado en la tendencia actual, tu grasa corporal podría estar entre{' '}
                  <span className="font-semibold">
                    {Math.min(...predictions.body_fat).toFixed(1)}% - {Math.max(...predictions.body_fat).toFixed(1)}%
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🏆 Logros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🎖️</span>
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {achievement}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;