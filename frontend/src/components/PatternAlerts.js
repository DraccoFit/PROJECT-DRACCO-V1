import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PatternAlerts = ({ token }) => {
  const [alerts, setAlerts] = useState([]);
  const [activitySummary, setActivitySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/patterns/alerts`, { headers });
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzePatterns = async () => {
    setAnalyzing(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/patterns/detect-abandonment`, { headers });
      setAlerts(response.data.alerts);
      setActivitySummary(response.data.activity_summary);
    } catch (error) {
      console.error('Error analyzing patterns:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/patterns/alerts/${alertId}/resolve`, {}, { headers });
      
      // Remove resolved alert from state
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getAlertIcon = (alertType) => {
    const icons = {
      'abandonment': '⚠️',
      'plateau': '📈',
      'goal_deviation': '🎯',
      'health_concern': '🏥'
    };
    return icons[alertType] || '🔔';
  };

  const getAlertColor = (severity) => {
    const colors = {
      'low': 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      'medium': 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      'high': 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      'critical': 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700'
    };
    return colors[severity] || colors['medium'];
  };

  const getAlertTextColor = (severity) => {
    const colors = {
      'low': 'text-blue-800 dark:text-blue-200',
      'medium': 'text-yellow-800 dark:text-yellow-200',
      'high': 'text-red-800 dark:text-red-200',
      'critical': 'text-red-900 dark:text-red-100'
    };
    return colors[severity] || colors['medium'];
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    return labels[severity] || severity;
  };

  const getAlertTypeLabel = (alertType) => {
    const labels = {
      'abandonment': 'Abandono',
      'plateau': 'Estancamiento',
      'goal_deviation': 'Desviación de Objetivos',
      'health_concern': 'Preocupación de Salud'
    };
    return labels[alertType] || alertType;
  };

  const AlertCard = ({ alert }) => (
    <div className={`rounded-lg p-4 border ${getAlertColor(alert.severity)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{getAlertIcon(alert.alert_type)}</span>
          <div>
            <h4 className={`font-semibold ${getAlertTextColor(alert.severity)}`}>
              {alert.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getAlertTypeLabel(alert.alert_type)} • Severidad: {getSeverityLabel(alert.severity)}
            </p>
          </div>
        </div>
        <button
          onClick={() => resolveAlert(alert.id)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          title="Marcar como resuelto"
        >
          ✓
        </button>
      </div>
      
      <p className={`text-sm mb-3 ${getAlertTextColor(alert.severity)}`}>
        {alert.description}
      </p>
      
      {alert.recommendations && alert.recommendations.length > 0 && (
        <div className="mt-3">
          <h5 className={`text-sm font-medium ${getAlertTextColor(alert.severity)} mb-2`}>
            Recomendaciones:
          </h5>
          <ul className="space-y-1">
            {alert.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {new Date(alert.created_at).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );

  const ActivityCard = ({ title, value, subtitle, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className={`text-2xl font-bold ${color}`}>
          {value}
        </div>
      </div>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
        {title}
      </h4>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {subtitle}
      </p>
    </div>
  );

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
          🚨 Alertas y Patrones
        </h1>
        <button
          onClick={analyzePatterns}
          disabled={analyzing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {analyzing ? 'Analizando...' : 'Analizar Patrones'}
        </button>
      </div>

      {/* Activity Summary */}
      {activitySummary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📊 Resumen de Actividad (Últimos 30 días)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActivityCard
              title="Entradas de Progreso"
              value={activitySummary.progress_entries}
              subtitle="Registros de peso y medidas"
              icon="📈"
              color="text-blue-600 dark:text-blue-400"
            />
            <ActivityCard
              title="Registros de Agua"
              value={activitySummary.water_records}
              subtitle="Seguimiento de hidratación"
              icon="💧"
              color="text-cyan-600 dark:text-cyan-400"
            />
            <ActivityCard
              title="Planes de Entrenamiento"
              value={activitySummary.workout_plans}
              subtitle="Rutinas creadas"
              icon="💪"
              color="text-green-600 dark:text-green-400"
            />
            <ActivityCard
              title="Interacciones Chat"
              value={activitySummary.chat_interactions}
              subtitle="Conversaciones con IA"
              icon="🤖"
              color="text-purple-600 dark:text-purple-400"
            />
          </div>
        </div>
      )}

      {/* Active Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔔 Alertas Activas
        </h2>

        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              ¡No hay alertas activas!
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Estás manteniendo un buen ritmo en tu rutina de fitness
            </p>
          </div>
        )}
      </div>

      {/* Pattern Detection Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔍 Detección de Patrones
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Patrones que Detectamos
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">⚠️</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Abandono:</strong> Falta de registros de progreso, hidratación o ejercicio
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">📈</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Estancamiento:</strong> Peso o medidas que no cambian por períodos prolongados
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">🎯</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Desviación de Objetivos:</strong> Progreso alejándose de las metas establecidas
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">🏥</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Preocupaciones de Salud:</strong> Métricas que sugieren riesgo para la salud
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Cómo Usamos los Datos
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">📊</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Analizamos tus registros de progreso, hidratación y ejercicio
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">🤖</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Utilizamos IA para identificar patrones en tu comportamiento
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">🎯</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Comparamos tu progreso con tus objetivos personales
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">💡</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Generamos recomendaciones personalizadas para mejorar
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips for Better Results */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          💡 Consejos para Mejores Resultados
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Consistencia en el Registro
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Registra tu progreso al menos 3 veces por semana para obtener análisis más precisos
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Hidratación Regular
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Registra tu consumo de agua diariamente para mantener un seguimiento completo
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Ejercicio Programado
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crea y sigue planes de entrenamiento regulares para mejores resultados
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Interacción con IA
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Usa el chat de IA para obtener consejos personalizados y mantener la motivación
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternAlerts;