import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const Workout = ({ token }) => {
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
    muscle_groups: [],
    equipment: [],
    duration_range: { min: '', max: '' }
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWorkoutPlan();
    fetchExercises();
  }, []);

  const fetchWorkoutPlan = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/workout-plan`, { headers });
      setWorkoutPlan(response.data);
    } catch (error) {
      console.error('Error fetching workout plan:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/exercises`, { headers });
      setExercises(response.data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const generateWorkoutPlan = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/workout-plan/generate`, {}, { headers });
      setWorkoutPlan(response.data);
    } catch (error) {
      console.error('Error generating workout plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/exercises/filter`, filters, { headers });
      setExercises(response.data);
    } catch (error) {
      console.error('Error filtering exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise => 
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'cardio': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'strength': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'flexibility': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      case 'balance': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Entrenamiento
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Tu rutina personalizada de ejercicios 🏋️‍♂️
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={generateWorkoutPlan}
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Generar Plan'}
          </button>
          <button
            onClick={filterExercises}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50"
          >
            Filtrar Ejercicios
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Plan de Entrenamiento */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Plan de Entrenamiento
          </h3>
          
          {workoutPlan ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
                <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">
                  Semana {workoutPlan.week_number}
                </h4>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Plan personalizado según tu evaluación
                </p>
              </div>
              
              {Object.entries(workoutPlan.sessions || {}).map(([day, session]) => (
                <div key={day} className="border rounded-lg p-4 dark:border-gray-700">
                  <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 capitalize">
                    {day}
                  </h5>
                  
                  {session ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h6 className="font-medium text-gray-800 dark:text-gray-200">
                          {session.name}
                        </h6>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(session.difficulty)}`}>
                            {session.difficulty}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {session.total_duration} min
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Áreas de enfoque:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.focus_areas?.map((area, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Ejercicios:
                        </p>
                        {session.exercises?.map((exercise, index) => (
                          <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {exercise.name || `Ejercicio ${index + 1}`}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {exercise.sets}x{exercise.reps}
                              {exercise.weight && ` | ${exercise.weight}kg`}
                              {exercise.duration && ` | ${exercise.duration}min`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Día de descanso
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏋️‍♂️</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Aún no tienes un plan de entrenamiento
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Genera uno personalizado para ti
              </p>
            </div>
          )}
        </div>

        {/* Filtros y Búsqueda */}
        <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Explorar Ejercicios
          </h3>
          
          {/* Filtros */}
          <div className="space-y-4 mb-6">
            <div>
              <input
                type="text"
                placeholder="Buscar ejercicios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos los tipos</option>
                <option value="cardio">Cardio</option>
                <option value="strength">Fuerza</option>
                <option value="flexibility">Flexibilidad</option>
                <option value="balance">Balance</option>
              </select>
              
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todas las dificultades</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>
          
          {/* Lista de Ejercicios */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredExercises.map((exercise) => (
              <div key={exercise.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">
                    {exercise.name}
                  </h4>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(exercise.type)}`}>
                      {exercise.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                      {exercise.difficulty}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {exercise.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {exercise.muscle_groups?.map((muscle, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs">
                      {muscle}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>⏱️ {exercise.duration_minutes} min</span>
                  <span>🔥 {exercise.calories_burned} cal</span>
                  <span>💪 Intensidad: {exercise.intensity_level}/10</span>
                </div>
                
                {exercise.equipment && exercise.equipment.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {exercise.equipment.map((item, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {filteredExercises.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No se encontraron ejercicios
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Prueba con diferentes filtros
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workout;