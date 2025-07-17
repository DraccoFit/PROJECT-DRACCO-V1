import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const Forum = ({ token }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/forum/posts`, { headers });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/forum/posts`, newPost, { headers });
      
      setNewPost({
        title: '',
        content: '',
        category: 'general'
      });
      setShowCreatePost(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/forum/posts/${postId}/like`, {}, { headers });
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const categories = [
    { id: 'all', name: 'Todas', color: 'bg-gray-100 text-gray-800' },
    { id: 'general', name: 'General', color: 'bg-blue-100 text-blue-800' },
    { id: 'nutrition', name: 'Nutrición', color: 'bg-green-100 text-green-800' },
    { id: 'workout', name: 'Entrenamiento', color: 'bg-purple-100 text-purple-800' },
    { id: 'progress', name: 'Progreso', color: 'bg-orange-100 text-orange-800' },
    { id: 'motivation', name: 'Motivación', color: 'bg-pink-100 text-pink-800' },
    { id: 'questions', name: 'Preguntas', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Foro Comunitario
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Conecta con la comunidad fitness y comparte experiencias 💬
          </p>
        </div>
        <button
          onClick={() => setShowCreatePost(true)}
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300"
        >
          Crear Publicación
        </button>
      </div>

      {/* Filtros por Categoría */}
      <div className="glass rounded-2xl p-6 animate-slide-up">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Categorías
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                  : `${category.color} hover:shadow-md`
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Modal para Crear Publicación */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Crear Nueva Publicación
              </h2>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <form onSubmit={createPost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Título de tu publicación"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                >
                  {categories.slice(1).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
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
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Comparte tu experiencia, pregunta o consejo..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Publicaciones */}
      <div className="space-y-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <div 
              key={post.id} 
              className="glass rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {post.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                      {categories.find(c => c.id === post.category)?.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {post.author_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span>{post.author_name || 'Usuario'}</span>
                    </div>
                    <span>•</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => likePost(post.id)}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
                  >
                    <span className="text-lg">👍</span>
                    <span className="text-sm font-medium">{post.likes || 0}</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                    <span className="text-lg">💬</span>
                    <span className="text-sm font-medium">{post.replies?.length || 0}</span>
                  </button>
                </div>
                
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <span className="text-lg">🔗</span>
                </button>
              </div>
              
              {/* Respuestas */}
              {post.replies && post.replies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Respuestas ({post.replies.length})
                  </h4>
                  <div className="space-y-3">
                    {post.replies.slice(0, 3).map((reply, replyIndex) => (
                      <div key={replyIndex} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {reply.author_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {reply.author_name || 'Usuario'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                    {post.replies.length > 3 && (
                      <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        Ver más respuestas...
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay publicaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedCategory === 'all' 
                ? 'Sé el primero en crear una publicación en el foro' 
                : `No hay publicaciones en la categoría "${categories.find(c => c.id === selectedCategory)?.name}"`
              }
            </p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300"
            >
              Crear Primera Publicación
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;