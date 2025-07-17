import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const Nutrition = ({ token }) => {
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [shoppingList, setShoppingList] = useState(null);

  useEffect(() => {
    fetchNutritionPlan();
    fetchFoods();
  }, []);

  const fetchNutritionPlan = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/nutrition-plan`, { headers });
      setNutritionPlan(response.data);
    } catch (error) {
      console.error('Error fetching nutrition plan:', error);
    }
  };

  const fetchFoods = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/foods`, { headers });
      setFoods(response.data);
    } catch (error) {
      console.error('Error fetching foods:', error);
    }
  };

  const generateNutritionPlan = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/nutrition-plan/generate`, {}, { headers });
      setNutritionPlan(response.data);
    } catch (error) {
      console.error('Error generating nutrition plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShoppingList = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/shopping-list/generate`, {}, { headers });
      setShoppingList(response.data);
    } catch (error) {
      console.error('Error generating shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Nutrición
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Planifica tu alimentación y alcanza tus objetivos 🥗
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={generateNutritionPlan}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Generar Plan'}
          </button>
          <button
            onClick={generateShoppingList}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50"
          >
            Lista de Compras
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Plan de Nutrición */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Plan Nutricional
          </h3>
          
          {nutritionPlan ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                  {nutritionPlan.plan_name}
                </h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Calorías diarias: {nutritionPlan.daily_calories}
                </p>
              </div>
              
              {Object.entries(nutritionPlan.meals || {}).map(([day, dayMeals]) => (
                <div key={day} className="border rounded-lg p-4 dark:border-gray-700">
                  <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 capitalize">
                    {day}
                  </h5>
                  <div className="space-y-2">
                    {dayMeals.map((meal, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h6 className="font-medium text-gray-800 dark:text-gray-200">
                              {meal.name}
                            </h6>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {meal.meal_type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">
                              {meal.total_calories} cal
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              P: {meal.total_protein}g | C: {meal.total_carbs}g | G: {meal.total_fat}g
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {nutritionPlan.tips && nutritionPlan.tips.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4">
                  <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Consejos
                  </h5>
                  <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                    {nutritionPlan.tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🥗</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Aún no tienes un plan nutricional
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Genera uno personalizado para ti
              </p>
            </div>
          )}
        </div>

        {/* Base de Datos de Alimentos */}
        <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Base de Datos de Alimentos
          </h3>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar alimentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredFoods.map((food) => (
              <div key={food.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">
                      {food.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {food.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {food.calories_per_100g} cal/100g
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      P: {food.protein}g | C: {food.carbs}g | G: {food.fat}g
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredFoods.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No se encontraron alimentos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Compras */}
      {shoppingList && (
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Lista de Compras
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shoppingList.categories?.map((category) => (
              <div key={category} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {category}
                </h4>
                <ul className="space-y-2">
                  {shoppingList.items
                    ?.filter(item => item.category === category)
                    .map((item, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.purchased}
                          onChange={() => {}}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className={`text-sm ${item.purchased ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.name} ({item.quantity} {item.unit})
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
          
          {shoppingList.estimated_cost && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-green-800 dark:text-green-300">
                  Costo Estimado:
                </span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${shoppingList.estimated_cost}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Nutrition;