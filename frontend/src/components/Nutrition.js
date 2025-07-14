import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Nutrition = ({ token }) => {
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [foods, setFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const fetchNutritionData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [plansResponse, foodsResponse] = await Promise.all([
        axios.get(`${API}/nutrition-plans`, { headers }),
        axios.get(`${API}/foods`)
      ]);

      setNutritionPlans(plansResponse.data);
      setFoods(foodsResponse.data);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNutritionPlan = async () => {
    setGenerating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/nutrition-plans/generate`, {}, { headers });
      fetchNutritionData();
    } catch (error) {
      console.error('Error generating nutrition plan:', error);
    } finally {
      setGenerating(false);
    }
  };

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MacroChart = ({ protein, carbs, fat }) => {
    const total = protein + carbs + fat;
    const proteinPercent = (protein / total) * 100;
    const carbsPercent = (carbs / total) * 100;
    const fatPercent = (fat / total) * 100;

    return (
      <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-red-500 flex items-center justify-center text-xs text-white"
          style={{ width: `${proteinPercent}%` }}
        >
          {proteinPercent > 15 && `${proteinPercent.toFixed(0)}%`}
        </div>
        <div 
          className="h-full bg-yellow-500 flex items-center justify-center text-xs text-white"
          style={{ width: `${carbsPercent}%` }}
        >
          {carbsPercent > 15 && `${carbsPercent.toFixed(0)}%`}
        </div>
        <div 
          className="h-full bg-green-500 flex items-center justify-center text-xs text-white"
          style={{ width: `${fatPercent}%` }}
        >
          {fatPercent > 15 && `${fatPercent.toFixed(0)}%`}
        </div>
      </div>
    );
  };

  const FoodCard = ({ food }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {food.name}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {food.category}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {food.calories_per_100g}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            calorías/100g
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {food.protein}g
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            proteína
          </p>
        </div>
      </div>

      <MacroChart 
        protein={food.protein} 
        carbs={food.carbs} 
        fat={food.fat} 
      />
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
        <span>Proteína</span>
        <span>Carbohidratos</span>
        <span>Grasa</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="font-medium text-gray-900 dark:text-white">
            {food.carbs}g
          </p>
          <p className="text-gray-500 dark:text-gray-400">Carbohidratos</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-900 dark:text-white">
            {food.fat}g
          </p>
          <p className="text-gray-500 dark:text-gray-400">Grasa</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-900 dark:text-white">
            {food.fiber}g
          </p>
          <p className="text-gray-500 dark:text-gray-400">Fibra</p>
        </div>
      </div>
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
          Nutrición
        </h1>
        <button
          onClick={generateNutritionPlan}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {generating ? 'Generando...' : 'Generar Plan Nutricional'}
        </button>
      </div>

      {/* Nutrition Plans */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Mis Planes Nutricionales
        </h2>
        
        {nutritionPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nutritionPlans.map(plan => (
              <div key={plan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Semana {plan.week_number}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Calorías diarias: {plan.daily_calories}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Creado: {new Date(plan.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No tienes planes nutricionales aún
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Completa tu evaluación y genera tu primer plan personalizado
            </p>
          </div>
        )}
      </div>

      {/* Food Database */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Base de Datos de Alimentos
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              🔴 Proteína 🟡 Carbohidratos 🟢 Grasa
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar alimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Food Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFoods.map(food => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>

        {filteredFoods.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No se encontraron alimentos
            </p>
          </div>
        )}
      </div>

      {/* Nutrition Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Consejos Nutricionales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              💧 Hidratación
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Bebe al menos 2 litros de agua al día. Más si haces ejercicio intenso.
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
              🥗 Variedad
            </h3>
            <p className="text-sm text-green-800 dark:text-green-400">
              Incluye alimentos de todos los grupos para una nutrición completa.
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              ⏰ Timing
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Come cada 3-4 horas para mantener estable tu metabolismo.
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
              🍽️ Porciones
            </h3>
            <p className="text-sm text-purple-800 dark:text-purple-400">
              Controla las porciones para mantener un balance calórico adecuado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nutrition;