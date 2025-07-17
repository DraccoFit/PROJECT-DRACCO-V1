import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Forum = ({ token }) => {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  const categories = [
    { id: 'general', name: 'General', icon: '💬' },
    { id: 'nutrition', name: 'Nutrición', icon: '🥗' },
    { id: 'training', name: 'Entrenamiento', icon: '🏋️' },
    { id: 'motivation', name: 'Motivación', icon: '💪' },
    { id: 'progress', name: 'Progreso', icon: '📈' },
    { id: 'recipes', name: 'Recetas', icon: '👨‍🍳' },
    { id: 'supplements', name: 'Suplementos', icon: '💊' },
    { id: 'injuries', name: 'Lesiones', icon: '🏥' }
  ];

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      let url = `${API}/forum`;
      if (selectedCategory) {
        url += `?category=${selectedCategory}`;
      }
      
      const response = await axios.get(url);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching forum posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/forum`, newPost, { headers });
      
      setNewPost({ title: '', content: '', category: 'general' });
      setShowNewPostForm(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : '💬';
  };

  const getCategoryName = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.name : 'General';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    if (diff < 604800000) return `Hace ${Math.floor(diff / 86400000)} días`;
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const PostCard = ({ post }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {post.user_id.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {post.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(post.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
            {getCategoryIcon(post.category)} {getCategoryName(post.category)}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <span>❤️</span>
            <span className="text-sm">{post.likes}</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            <span>💬</span>
            <span className="text-sm">{post.replies.length}</span>
          </button>
        </div>
        
        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
          Leer más
        </button>
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
          💬 Foro Comunitario
        </h1>
        <button
          onClick={() => setShowNewPostForm(!showNewPostForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          {showNewPostForm ? 'Cancelar' : 'Nueva Publicación'}
        </button>
      </div>

      {/* New Post Form */}
      {showNewPostForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Crear Nueva Publicación
          </h2>
          
          <form onSubmit={handleSubmitPost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título
              </label>
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Escribe el título de tu publicación..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría
              </label>
              <select
                value={newPost.category}
                onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenido
              </label>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Comparte tu experiencia, pregunta o consejo..."
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowNewPostForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Publicar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Categorías
        </h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === '' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🌟 Todas
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay publicaciones
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {selectedCategory 
                ? `No hay publicaciones en la categoría ${getCategoryName(selectedCategory)}`
                : 'Sé el primero en iniciar una conversación'
              }
            </p>
            <button
              onClick={() => setShowNewPostForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Crear Primera Publicación
            </button>
          </div>
        )}
      </div>

      {/* Community Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Estadísticas de la Comunidad
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {posts.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Publicaciones
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {posts.reduce((acc, post) => acc + post.replies.length, 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Respuestas
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {posts.reduce((acc, post) => acc + post.likes, 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Me gusta
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {categories.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Categorías
            </div>
          </div>
        </div>
      </div>

      {/* Community Rules */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Reglas de la Comunidad
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Sé respetuoso
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Trata a todos los miembros con respeto y cortesía.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">💡</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Comparte conocimiento
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ayuda a otros compartiendo tu experiencia y conocimientos.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">⚠️</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                No spam
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Evita publicaciones repetitivas o promoción excesiva.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">🏥</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Consulta profesionales
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Para temas médicos serios, siempre consulta a un profesional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;