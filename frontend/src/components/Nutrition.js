import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Nutrition = ({ token }) => {
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [nutritionAnalysis, setNutritionAnalysis] = useState(null);
  const [foods, setFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [shoppingLists, setShoppingLists] = useState([]);
  const [alternatives, setAlternatives] = useState({});

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const fetchNutritionData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [plansResponse, foodsResponse, shoppingResponse] = await Promise.all([
        axios.get(`${API}/nutrition-plans`, { headers }),
        axios.get(`${API}/foods`),
        axios.get(`${API}/shopping-lists`, { headers }).catch(() => ({ data: [] }))
      ]);

      setNutritionPlans(plansResponse.data);
      setFoods(foodsResponse.data);
      setShoppingLists(shoppingResponse.data);
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
      const response = await axios.post(`${API}/nutrition-plans/generate`, {}, { headers });
      
      if (response.data.plan_details) {
        setPlanDetails(response.data.plan_details);
        setSelectedPlan(response.data.plan_id);
      }
      
      fetchNutritionData();
    } catch (error) {
      console.error('Error generating nutrition plan:', error);
    } finally {
      setGenerating(false);
    }
  };

  const fetchPlanDetails = async (planId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/nutrition-plans/${planId}`, { headers });
      setPlanDetails(response.data);
      setSelectedPlan(planId);
    } catch (error) {
      console.error('Error fetching plan details:', error);
    }
  };

  const fetchNutritionAnalysis = async (planId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/nutrition-analysis/${planId}`, { headers });
      setNutritionAnalysis(response.data);
    } catch (error) {
      console.error('Error fetching nutrition analysis:', error);
    }
  };

  const generateShoppingList = async (planId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/shopping-lists/generate/${planId}`, {}, { headers });
      fetchNutritionData();
    } catch (error) {
      console.error('Error generating shopping list:', error);
    }
  };

  const getMealAlternatives = async (planId, day, mealType) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/nutrition-plans/${planId}/alternatives`, 
        { day, meal_type: mealType }, 
        { headers }
      );
      setAlternatives(prev => ({
        ...prev,
        [`${day}-${mealType}`]: response.data.alternatives
      }));
    } catch (error) {
      console.error('Error fetching meal alternatives:', error);
    }
  };

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MacroChart = ({ protein, carbs, fat }) => {
    const total = protein + carbs + fat;
    if (total === 0) return null;
    
    const proteinPercent = (protein / total) * 100;
    const carbsPercent = (carbs / total) * 100;
    const fatPercent = (fat / total) * 100;

    return (
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600"
          style={{ width: `${proteinPercent}%` }}
          title={`Proteína: ${proteinPercent.toFixed(1)}%`}
        />
        <div 
          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600"
          style={{ width: `${carbsPercent}%` }}
          title={`Carbohidratos: ${carbsPercent.toFixed(1)}%`}
        />
        <div 
          className="h-full bg-gradient-to-r from-green-500 to-green-600"
          style={{ width: `${fatPercent}%` }}
          title={`Grasa: ${fatPercent.toFixed(1)}%`}
        />
      </div>
    );
  };

  const NutritionAnalysisCard = ({ analysis }) => (
    <div className="glass rounded-2xl p-6 animate-card-enter">
      <h3 className="text-xl font-bold gradient-text mb-4">
        📊 Análisis Nutricional
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Promedios Diarios
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Calorías:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {analysis.daily_averages.calories} kcal
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Proteína:</span>
              <span className="font-bold text-red-600">
                {analysis.daily_averages.protein}g
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Carbohidratos:</span>
              <span className="font-bold text-yellow-600">
                {analysis.daily_averages.carbs}g
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Grasa:</span>
              <span className="font-bold text-green-600">
                {analysis.daily_averages.fat}g
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Distribución de Macros
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-red-600 font-medium">Proteína</span>
              <span className="font-bold">{analysis.macro_distribution.protein}%</span>
            </div>
            <div className="progress-bar bg-gradient-to-r from-red-500 to-red-600" 
                 style={{ width: `${analysis.macro_distribution.protein}%` }}></div>
            
            <div className="flex items-center justify-between">
              <span className="text-yellow-600 font-medium">Carbohidratos</span>
              <span className="font-bold">{analysis.macro_distribution.carbs}%</span>
            </div>
            <div className="progress-bar bg-gradient-to-r from-yellow-500 to-yellow-600" 
                 style={{ width: `${analysis.macro_distribution.carbs}%` }}></div>
            
            <div className="flex items-center justify-between">
              <span className="text-green-600 font-medium">Grasa</span>
              <span className="font-bold">{analysis.macro_distribution.fat}%</span>
            </div>
            <div className="progress-bar bg-gradient-to-r from-green-500 to-green-600" 
                 style={{ width: `${analysis.macro_distribution.fat}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  const MealCard = ({ meal, day, planId }) => (
    <div className="glass rounded-xl p-4 hover-lift">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
          {meal.meal_type}
        </h4>
        <span className="text-sm font-bold text-primary-600">
          {meal.total_calories} kcal
        </span>
      </div>
      
      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
        {meal.name}
      </h5>
      
      <div className="mb-3">
        <MacroChart 
          protein={meal.total_protein} 
          carbs={meal.total_carbs} 
          fat={meal.total_fat} 
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div className="text-center">
          <span className="text-red-600 font-medium">{meal.total_protein}g</span>
          <p className="text-gray-500">Proteína</p>
        </div>
        <div className="text-center">
          <span className="text-yellow-600 font-medium">{meal.total_carbs}g</span>
          <p className="text-gray-500">Carbos</p>
        </div>
        <div className="text-center">
          <span className="text-green-600 font-medium">{meal.total_fat}g</span>
          <p className="text-gray-500">Grasa</p>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button 
          onClick={() => getMealAlternatives(planId, day, meal.meal_type)}
          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 px-3 rounded-lg text-xs font-medium hover:shadow-lg transition-all"
        >
          Alternativas
        </button>
        <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-3 rounded-lg text-xs font-medium hover:shadow-lg transition-all">
          Detalles
        </button>
      </div>
    </div>
  );

  const FoodCard = ({ food }) => (
    <div className="glass rounded-xl p-4 hover-lift animate-card-enter">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {food.name}
        </h3>
        <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-full">
          {food.category}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <p className="text-2xl font-bold gradient-text">
            {food.calories_per_100g}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            cal/100g
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-red-600">
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
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 mb-3">
        <span>🔴 Proteína</span>
        <span>🟡 Carbohidratos</span>
        <span>🟢 Grasa</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="font-medium text-yellow-600">
            {food.carbs}g
          </p>
          <p className="text-gray-500 dark:text-gray-400">Carbohidratos</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-green-600">
            {food.fat}g
          </p>
          <p className="text-gray-500 dark:text-gray-400">Grasa</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-blue-600">
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
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Nutrición
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Planes personalizados con inteligencia artificial 🥗
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={generateNutritionPlan}
            disabled={generating}
            className="btn-primary px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-neon disabled:opacity-50 flex items-center space-x-2"
          >
            {generating ? (
              <>
                <div className="spinner w-4 h-4"></div>
                <span>Generando...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generar Plan IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {[
          { id: 'plans', label: 'Mis Planes', icon: '📋' },
          { id: 'foods', label: 'Alimentos', icon: '🍎' },
          { id: 'shopping', label: 'Compras', icon: '🛒' },
          { id: 'analysis', label: 'Análisis', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'glass hover:bg-white/10 dark:hover:bg-black/10 text-gray-700 dark:text-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Plans Grid */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Mis Planes Nutricionales
            </h2>
            
            {nutritionPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nutritionPlans.map((plan, index) => (
                  <div 
                    key={plan.id} 
                    className="glass rounded-xl p-6 hover-lift cursor-pointer animate-card-enter"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => fetchPlanDetails(plan.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {plan.plan_name || `Semana ${plan.week_number}`}
                      </h3>
                      <span className="text-2xl">📅</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Calorías:</span>
                        <span className="font-bold text-primary-600">{plan.daily_calories} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Creado:</span>
                        <span className="text-sm text-gray-500">{new Date(plan.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchNutritionAnalysis(plan.id);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                      >
                        Análisis
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          generateShoppingList(plan.id);
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                      >
                        Lista
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🍽️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No hay planes nutricionales
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Completa tu evaluación y genera tu primer plan personalizado
                </p>
                <button
                  onClick={generateNutritionPlan}
                  className="btn-primary px-6 py-3 rounded-xl font-semibold"
                >
                  Generar Primer Plan
                </button>
              </div>
            )}
          </div>

          {/* Plan Details */}
          {selectedPlan && planDetails && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Plan Detallado
                </h2>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {planDetails.meals && Object.entries(planDetails.meals).map(([day, meals]) => (
                  <div key={day} className="space-y-4">
                    <h3 className="text-lg font-bold text-center gradient-text">
                      {day}
                    </h3>
                    <div className="space-y-3">
                      {meals.map((meal, index) => (
                        <MealCard 
                          key={index} 
                          meal={meal} 
                          day={day} 
                          planId={selectedPlan} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips */}
              {planDetails.tips && planDetails.tips.length > 0 && (
                <div className="mt-8 glass rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    💡 Consejos Nutricionales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {planDetails.tips.map((tip, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="text-primary-500 font-bold">•</span>
                        <p className="text-gray-700 dark:text-gray-300">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'foods' && (
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Base de Datos de Alimentos
              </h2>
              <div className="flex items-center space-x-4">
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
                className="form-input w-full px-4 py-3 rounded-xl"
              />
            </div>

            {/* Food Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFoods.map((food, index) => (
                <div key={food.id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <FoodCard food={food} />
                </div>
              ))}
            </div>

            {filteredFoods.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  No se encontraron alimentos
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analysis' && nutritionAnalysis && (
        <NutritionAnalysisCard analysis={nutritionAnalysis} />
      )}

      {activeTab === 'shopping' && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Listas de Compras
          </h2>
          
          {shoppingLists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shoppingLists.map((list, index) => (
                <div key={list.id} className="glass rounded-xl p-6 animate-card-enter" style={{ animationDelay: `${index * 0.1}s` }}>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                    Lista #{list.id.substring(0, 8)}
                  </h3>
                  <div className="space-y-2">
                    {list.items.slice(0, 5).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={item.purchased}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className={`text-sm ${item.purchased ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                    {list.items.length > 5 && (
                      <p className="text-xs text-gray-500">
                        +{list.items.length - 5} más...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                No tienes listas de compras aún
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Nutrition;