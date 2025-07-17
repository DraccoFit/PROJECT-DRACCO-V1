import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Componente para Análisis Avanzado
export const AdvancedAnalytics = ({ token }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/analytics/advanced?period=${selectedPeriod}`, { headers });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Análisis Avanzado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Insights profundos sobre tu progreso y patrones 📊
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="week">Última Semana</option>
          <option value="month">Último Mes</option>
          <option value="quarter">Último Trimestre</option>
          <option value="year">Último Año</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : analyticsData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Tendencias de Peso
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Cambio total:</span>
                <span className="font-semibold text-blue-600">
                  {analyticsData.weight_trend?.total_change || '0'} kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tendencia:</span>
                <span className={`font-semibold ${
                  analyticsData.weight_trend?.direction === 'up' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {analyticsData.weight_trend?.direction === 'up' ? '↗️ Subiendo' : '↘️ Bajando'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Patrones de Actividad
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Días más activos:</span>
                <span className="font-semibold text-purple-600">
                  {analyticsData.activity_patterns?.most_active_days?.join(', ') || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Promedio semanal:</span>
                <span className="font-semibold text-green-600">
                  {analyticsData.activity_patterns?.weekly_average || '0'} entrenamientos
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No hay datos de análisis disponibles
          </p>
        </div>
      )}
    </div>
  );
};

// Componente para Análisis de Fotos
export const PhotoAnalysis = ({ token }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  useEffect(() => {
    fetchAnalysisHistory();
  }, []);

  const fetchAnalysisHistory = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/photo-analysis/history`, { headers });
      setAnalysisHistory(response.data);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePhoto = async () => {
    if (!selectedImage) return;
    
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/photo-analysis`, {
        image_base64: selectedImage,
        analysis_type: 'body_composition'
      }, { headers });
      
      setAnalysisResult(response.data);
      fetchAnalysisHistory();
    } catch (error) {
      console.error('Error analyzing photo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Análisis de Fotos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Análisis inteligente de tu composición corporal 📸
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Subir Foto para Análisis
          </h3>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              {selectedImage ? (
                <div>
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className="max-w-full max-h-48 mx-auto rounded-lg mb-4"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar imagen
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">📸</div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Sube una foto para análisis de composición corporal
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
                  >
                    Seleccionar Imagen
                  </label>
                </div>
              )}
            </div>
            
            {selectedImage && (
              <button
                onClick={analyzePhoto}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Analizando...' : 'Analizar Foto'}
              </button>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Resultado del Análisis
          </h3>
          
          {analysisResult ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                  Análisis Completado
                </h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Confianza: {(analysisResult.confidence_score * 100).toFixed(1)}%
                </p>
              </div>
              
              {analysisResult.recommendations && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Recomendaciones:
                  </h4>
                  <ul className="space-y-1">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-gray-500 dark:text-gray-400">
                Sube una foto para obtener un análisis detallado
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historial de Análisis */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Historial de Análisis
        </h3>
        
        {analysisHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisHistory.map((analysis, index) => (
              <div key={analysis.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {analysis.analysis_type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confianza: {(analysis.confidence_score * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay análisis previos
          </p>
        )}
      </div>
    </div>
  );
};

// Componente para Reconocimiento de Alimentos
export const FoodRecognition = ({ token }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState('unknown');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const recognizeFood = async () => {
    if (!selectedImage) return;
    
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/food-recognition`, {
        image_base64: selectedImage,
        meal_type: mealType
      }, { headers });
      
      setRecognitionResult(response.data);
    } catch (error) {
      console.error('Error recognizing food:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Reconocimiento de Alimentos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Identifica alimentos y obtén información nutricional 🍽️
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Subir Foto de Alimento
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Comida
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="unknown">Desconocido</option>
                <option value="breakfast">Desayuno</option>
                <option value="lunch">Almuerzo</option>
                <option value="dinner">Cena</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              {selectedImage ? (
                <div>
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className="max-w-full max-h-48 mx-auto rounded-lg mb-4"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar imagen
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">🍽️</div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Sube una foto de tu comida
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="food-upload"
                  />
                  <label
                    htmlFor="food-upload"
                    className="bg-green-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-green-600 transition-colors"
                  >
                    Seleccionar Imagen
                  </label>
                </div>
              )}
            </div>
            
            {selectedImage && (
              <button
                onClick={recognizeFood}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Analizando...' : 'Reconocer Alimentos'}
              </button>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Información Nutricional
          </h3>
          
          {recognitionResult ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                  Alimentos Detectados
                </h4>
                <div className="space-y-2">
                  {recognitionResult.recognized_foods?.map((food, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {food.name}
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {(food.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  Información Nutricional Total
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600 dark:text-blue-400">Calorías:</span>
                    <span className="font-medium text-blue-800 dark:text-blue-300">
                      {recognitionResult.total_calories} kcal
                    </span>
                  </div>
                  {recognitionResult.nutritional_info && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 dark:text-blue-400">Proteínas:</span>
                        <span className="font-medium text-blue-800 dark:text-blue-300">
                          {recognitionResult.nutritional_info.protein}g
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 dark:text-blue-400">Carbohidratos:</span>
                        <span className="font-medium text-blue-800 dark:text-blue-300">
                          {recognitionResult.nutritional_info.carbs}g
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 dark:text-blue-400">Grasas:</span>
                        <span className="font-medium text-blue-800 dark:text-blue-300">
                          {recognitionResult.nutritional_info.fat}g
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {recognitionResult.suggestions && recognitionResult.suggestions.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                    Sugerencias
                  </h4>
                  <ul className="space-y-1">
                    {recognitionResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-yellow-600 dark:text-yellow-400">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-gray-500 dark:text-gray-400">
                Sube una foto de tu comida para obtener información nutricional
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para Alertas y Patrones
export const PatternAlerts = ({ token }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/pattern-alerts`, { headers });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/pattern-alerts/${alertId}/dismiss`, {}, { headers });
      fetchAlerts();
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'low': return 'ℹ️';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      case 'critical': return '🆘';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Alertas y Patrones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Monitoreo inteligente de tu progreso y comportamiento 🚨
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar Alertas'}
        </button>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`glass rounded-2xl p-6 border-l-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {alert.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {alert.alert_type} • {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {alert.description}
              </p>
              
              {alert.recommendations && alert.recommendations.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Recomendaciones:
                  </h4>
                  <ul className="space-y-1">
                    {alert.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            ¡Todo está bien!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No hay alertas o patrones preocupantes en este momento
          </p>
        </div>
      )}
    </div>
  );
};