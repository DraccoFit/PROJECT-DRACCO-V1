import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PhotoAnalysis = ({ token }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisType, setAnalysisType] = useState('body_composition');
  const [analyzing, setAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisHistory();
  }, []);

  const fetchAnalysisHistory = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/photos/analysis-history`, { headers });
      setAnalysisHistory(response.data.analyses);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove data URL prefix to get pure base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    try {
      const base64Image = await convertToBase64(selectedFile);
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.post(`${API}/photos/analyze`, {
        image_base64: base64Image,
        analysis_type: analysisType
      }, { headers });

      setCurrentAnalysis(response.data);
      fetchAnalysisHistory(); // Refresh history
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error('Error analyzing photo:', error);
      alert('Error analizando la foto. Por favor, intenta nuevamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getAnalysisTypeLabel = (type) => {
    const labels = {
      'body_composition': 'Composición Corporal',
      'progress_comparison': 'Comparación de Progreso',
      'posture': 'Análisis de Postura'
    };
    return labels[type] || type;
  };

  const AnalysisResult = ({ analysis }) => {
    if (!analysis) return null;

    const analysisData = analysis.analysis || {};
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📊 Resultado del Análisis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Métricas Detectadas
            </h4>
            
            {analysisData.body_fat_estimate && (
              <div className="mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Grasa corporal estimada:</span>
                <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                  {analysisData.body_fat_estimate}
                </span>
              </div>
            )}
            
            {analysisData.muscle_definition && (
              <div className="mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Definición muscular:</span>
                <span className="ml-2 font-semibold text-green-600 dark:text-green-400 capitalize">
                  {analysisData.muscle_definition}
                </span>
              </div>
            )}
            
            {analysisData.posture_score && (
              <div className="mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Puntuación de postura:</span>
                <span className="ml-2 font-semibold text-purple-600 dark:text-purple-400">
                  {analysisData.posture_score}/100
                </span>
              </div>
            )}
            
            <div className="mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Confianza del análisis:</span>
              <span className="ml-2 font-semibold text-yellow-600 dark:text-yellow-400">
                {Math.round(analysis.confidence_score * 100)}%
              </span>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Recomendaciones
            </h4>
            
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No hay recomendaciones específicas disponibles.
              </p>
            )}
          </div>
        </div>
        
        {analysisData.areas_for_improvement && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Áreas de Mejora
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysisData.areas_for_improvement.map((area, index) => (
                <span key={index} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-sm">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {analysisData.progress_indicators && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Indicadores de Progreso
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysisData.progress_indicators.map((indicator, index) => (
                <span key={index} className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm">
                  {indicator}
                </span>
              ))}
            </div>
          </div>
        )}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          📸 Análisis de Fotos con IA
        </h1>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Subir Foto para Análisis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Análisis
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="body_composition">Composición Corporal</option>
              <option value="progress_comparison">Comparación de Progreso</option>
              <option value="posture">Análisis de Postura</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vista Previa
            </label>
            <div className="max-w-md mx-auto">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || analyzing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {analyzing ? 'Analizando...' : 'Analizar Foto'}
          </button>
        </div>
      </div>

      {/* Current Analysis Result */}
      {currentAnalysis && <AnalysisResult analysis={currentAnalysis} />}

      {/* Analysis History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Historial de Análisis
        </h2>

        {analysisHistory.length > 0 ? (
          <div className="space-y-4">
            {analysisHistory.map((analysis, index) => (
              <div key={analysis.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getAnalysisTypeLabel(analysis.analysis_type)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(analysis.created_at).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <img
                      src={`data:image/jpeg;base64,${analysis.image_base64}`}
                      alt="Analyzed"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Confianza: {Math.round(analysis.confidence_score * 100)}%
                    </p>
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Recomendaciones:
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400">
                          {analysis.recommendations.slice(0, 2).map((rec, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-green-500 mr-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No hay análisis previos
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Sube tu primera foto para comenzar el análisis con IA
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoAnalysis;