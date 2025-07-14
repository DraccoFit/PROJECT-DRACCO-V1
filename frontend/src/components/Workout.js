import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Workout = ({ token }) => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
    muscle_group: ''
  });

  useEffect(() => {
    fetchWorkoutData();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, filters]);

  const fetchWorkoutData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [plansResponse, exercisesResponse] = await Promise.all([
        axios.get(`${API}/workout-plans`, { headers }),
        axios.get(`${API}/exercises`)
      ]);

      setWorkoutPlans(plansResponse.data);
      setExercises(exercisesResponse.data);
    } catch (error) {
      console.error('Error fetching workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    if (filters.type) {
      filtered = filtered.filter(exercise => exercise.type === filters.type);
    }

    if (filters.difficulty) {
      filtered = filtered.filter(exercise => exercise.difficulty === filters.difficulty);
    }

    if (filters.muscle_group) {
      filtered = filtered.filter(exercise => 
        exercise.muscle_groups.includes(filters.muscle_group)
      );
    }

    setFilteredExercises(filtered);
  };

  const generateWorkoutPlan = async () => {
    setGenerating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/workout-plans/generate`, {}, { headers });
      fetchWorkoutData();
    } catch (error) {
      console.error('Error generating workout plan:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cardio': return '🏃';
      case 'strength': return '🏋️';
      case 'flexibility': return '🤸';
      case 'balance': return '⚖️';
      case 'sports': return '⚽';
      default: return '💪';
    }
  };

  const ExerciseCard = ({ exercise }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getTypeIcon(exercise.type)}</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {exercise.name}
          </h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
          {exercise.difficulty}
        </span>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
        {exercise.description}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {exercise.duration_minutes}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            minutos
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {exercise.calories_burned}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            calorías
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Grupos Musculares:
        </h4>
        <div className="flex flex-wrap gap-1">
          {exercise.muscle_groups.map(group => (
            <span key={group} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded text-xs">
              {group}
            </span>
          ))}
        </div>
      </div>

      {exercise.equipment.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Equipo:
          </h4>
          <div className="flex flex-wrap gap-1">
            {exercise.equipment.map(item => (
              <span key={item} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-xs">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Instrucciones:
        </h4>
        <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          {exercise.instructions.map((instruction, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2 font-medium">
                {index + 1}.
              </span>
              {instruction}
            </li>
          ))}
        </ol>
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
          Entrenamiento
        </h1>
        <button
          onClick={generateWorkoutPlan}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {generating ? 'Generando...' : 'Generar Plan de Entrenamiento'}
        </button>
      </div>

      {/* Workout Plans */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Mis Planes de Entrenamiento
        </h2>
        
        {workoutPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workoutPlans.map(plan => (
              <div key={plan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Semana {plan.week_number}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Creado: {new Date(plan.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No tienes planes de entrenamiento aún
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Completa tu evaluación y genera tu primer plan personalizado
            </p>
          </div>
        )}
      </div>

      {/* Exercise Library */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Biblioteca de Ejercicios
        </h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="cardio">Cardio</option>
              <option value="strength">Fuerza</option>
              <option value="flexibility">Flexibilidad</option>
              <option value="balance">Balance</option>
              <option value="sports">Deportes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dificultad
            </label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todas</option>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grupo Muscular
            </label>
            <select
              value={filters.muscle_group}
              onChange={(e) => setFilters(prev => ({ ...prev, muscle_group: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="chest">Pecho</option>
              <option value="shoulders">Hombros</option>
              <option value="triceps">Tríceps</option>
              <option value="quadriceps">Cuádriceps</option>
              <option value="glutes">Glúteos</option>
              <option value="hamstrings">Isquiotibiales</option>
              <option value="legs">Piernas</option>
              <option value="core">Core</option>
            </select>
          </div>
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredExercises.map(exercise => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No se encontraron ejercicios con los filtros seleccionados
            </p>
          </div>
        )}
      </div>

      {/* Quick Workout Generator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Entrenamiento Rápido
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all">
            <h3 className="font-semibold mb-2">🏃 Cardio 15 min</h3>
            <p className="text-sm opacity-90">Rutina rápida de cardio</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg cursor-pointer hover:from-green-600 hover:to-green-700 transition-all">
            <h3 className="font-semibold mb-2">💪 Fuerza 20 min</h3>
            <p className="text-sm opacity-90">Entrenamiento de fuerza</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all">
            <h3 className="font-semibold mb-2">🤸 Flexibilidad 10 min</h3>
            <p className="text-sm opacity-90">Rutina de estiramiento</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workout;