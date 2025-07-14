import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FoodRecognition = ({ token }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mealType, setMealType] = useState('unknown');
  const [recognizing, setRecognizing] = useState(false);
  const [currentRecognition, setCurrentRecognition] = useState(null);
  const [recognitionHistory, setRecognitionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecognitionHistory();
  }, []);

  const fetchRecognitionHistory = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/foods/recognition-history`, { headers });
      setRecognitionHistory(response.data.recognitions);
    } catch (error) {
      console.error('Error fetching recognition history:', error);
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

  const handleRecognize = async () => {
    if (!selectedFile) return;

    setRecognizing(true);
    try {
      const base64Image = await convertToBase64(selectedFile);
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.post(`${API}/foods/recognize`, {
        image_base64: base64Image,
        meal_type: mealType
      }, { headers });

      setCurrentRecognition(response.data);
      fetchRecognitionHistory(); // Refresh history
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error('Error recognizing food:', error);
      alert('Error reconociendo los alimentos. Por favor, intenta nuevamente.');
    } finally {
      setRecognizing(false);
    }
  };

  const getMealTypeLabel = (type) => {
    const labels = {
      'breakfast': 'Desayuno',
      'lunch': 'Almuerzo',
      'dinner': 'Cena',
      'snack': 'Snack',
      'unknown': 'Desconocido'
    };
    return labels[type] || type;
  };

  const getQualityScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const RecognitionResult = ({ recognition }) => {
    if (!recognition) return null;

    const { recognized_foods, nutritional_info, meal_quality_score, suggestions } = recognition;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🥗 Resultado del Reconocimiento
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recognized Foods */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Alimentos Reconocidos
            </h4>
            
            {recognized_foods && recognized_foods.length > 0 ? (
              <div className="space-y-3">
                {recognized_foods.map((food, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {food.name}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {food.portion_size}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Calorías:</span>
                        <span className="ml-1 font-semibold">{food.calories}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Proteína:</span>
                        <span className="ml-1 font-semibold">{food.protein}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Carbohidratos:</span>
                        <span className="ml-1 font-semibold">{food.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Grasa:</span>
                        <span className="ml-1 font-semibold">{food.fat}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No se reconocieron alimentos específicos
              </p>
            )}
          </div>

          {/* Nutritional Summary */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Resumen Nutricional
            </h4>
            
            {nutritional_info && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {nutritional_info.calories || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Calorías</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {nutritional_info.protein || 0}g
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Proteína</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {nutritional_info.carbs || 0}g
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Carbohidratos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {nutritional_info.fat || 0}g
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Grasa</p>
                  </div>
                </div>
              </div>
            )}
            
            {meal_quality_score && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calidad de la Comida
                </h5>
                <div className="flex items-center">
                  <div className={`text-2xl font-bold ${getQualityScoreColor(meal_quality_score)}`}>
                    {meal_quality_score}/100
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${meal_quality_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span>Confianza del reconocimiento:</span>
              <span className="ml-1 font-semibold">
                {Math.round(recognition.confidence_score * 100)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              💡 Sugerencias
            </h4>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                  <span className="text-sm text-green-700 dark:text-green-300">{suggestion}</span>
                </li>
              ))}
            </ul>
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
          🍽️ Reconocimiento de Alimentos
        </h1>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Escanear Comida con IA
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Comida
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="unknown">Desconocido</option>
              <option value="breakfast">Desayuno</option>
              <option value="lunch">Almuerzo</option>
              <option value="dinner">Cena</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto de la Comida
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

        {/* Recognize Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleRecognize}
            disabled={!selectedFile || recognizing}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {recognizing ? 'Reconociendo...' : 'Reconocer Alimentos'}
          </button>
        </div>
      </div>

      {/* Current Recognition Result */}
      {currentRecognition && <RecognitionResult recognition={currentRecognition} />}

      {/* Recognition History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Historial de Reconocimientos
        </h2>

        {recognitionHistory.length > 0 ? (
          <div className="space-y-4">
            {recognitionHistory.map((recognition, index) => (
              <div key={recognition.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getMealTypeLabel(recognition.meal_type)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(recognition.created_at).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <img
                      src={`data:image/jpeg;base64,${recognition.image_base64}`}
                      alt="Food"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Calorías totales: <span className="font-semibold">{recognition.total_calories}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Confianza: {Math.round(recognition.confidence_score * 100)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Alimentos: {recognition.recognized_foods?.length || 0}
                    </p>
                  </div>
                  <div>
                    {recognition.nutritional_info && (
                      <div className="text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          P: {recognition.nutritional_info.protein || 0}g
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          C: {recognition.nutritional_info.carbs || 0}g
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          G: {recognition.nutritional_info.fat || 0}g
                        </p>
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
              No hay reconocimientos previos
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Escanea tu primera comida para obtener información nutricional instantánea
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodRecognition;