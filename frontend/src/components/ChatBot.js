import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const ChatBot = ({ token }) => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/chat/history`, { headers });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      message: currentMessage,
      response: '',
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setLoading(true);
    setIsTyping(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/chat`, {
        message: currentMessage
      }, { headers });

      const botMessage = {
        id: Date.now() + 1,
        message: currentMessage,
        response: response.data.response,
        timestamp: new Date().toISOString(),
        isUser: false
      };

      setMessages(prev => [...prev.slice(0, -1), botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        message: currentMessage,
        response: 'Lo siento, hubo un error procesando tu mensaje. Por favor, inténtalo de nuevo.',
        timestamp: new Date().toISOString(),
        isUser: false,
        isError: true
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const suggestedQuestions = [
    "¿Cómo puedo mejorar mi rutina de ejercicios?",
    "¿Qué alimentos debo evitar para mi objetivo?",
    "¿Cuántas calorías debo consumir al día?",
    "¿Cómo puedo aumentar mi masa muscular?",
    "¿Qué suplementos me recomiendas?",
    "¿Cómo puedo mejorar mi recuperación muscular?"
  ];

  const quickReply = (question) => {
    setCurrentMessage(question);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
        <div>
          <h1 className="text-4xl font-bold gradient-text animate-slide-up">
            Chat con IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Tu entrenador personal inteligente 24/7 🤖
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            IA en línea
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Chat Principal */}
        <div className="flex-1 glass rounded-2xl p-6 flex flex-col animate-slide-up">
          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4 max-h-96 lg:max-h-none">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¡Hola! Soy tu entrenador virtual
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Estoy aquí para ayudarte con tus objetivos de fitness, nutrición y bienestar.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pregúntame cualquier cosa relacionada con tu entrenamiento
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    {/* Mensaje del Usuario */}
                    {msg.isUser && (
                      <div className="flex justify-end">
                        <div className="max-w-xs lg:max-w-md">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg">
                            <p className="text-sm">{msg.message}</p>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Respuesta del Bot */}
                    {!msg.isUser && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            🤖
                          </div>
                          <div className="flex-1">
                            <div className={`glass rounded-2xl rounded-bl-sm px-4 py-3 ${
                              msg.isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''
                            }`}>
                              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                {msg.response}
                              </p>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatTime(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Indicador de Escritura */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        🤖
                      </div>
                      <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Entrada */}
          <form onSubmit={sendMessage} className="flex space-x-3">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Escribe tu pregunta sobre fitness, nutrición o bienestar..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !currentMessage.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Enviar</span>
              )}
            </button>
          </form>
        </div>

        {/* Panel Lateral */}
        <div className="lg:w-80 space-y-6">
          {/* Preguntas Sugeridas */}
          <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Preguntas Sugeridas
            </h3>
            <div className="space-y-3">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => quickReply(question)}
                  className="w-full text-left bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-xl p-3 transition-all duration-300 hover:shadow-md"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {question}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Consejos de Uso */}
          <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Consejos de Uso
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">💡</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Sé específico en tus preguntas para obtener respuestas más personalizadas
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400 text-sm">🎯</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Pregunta sobre tu rutina actual, objetivos y preferencias
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 dark:text-purple-400 text-sm">🔄</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Puedes hacer preguntas de seguimiento para aclarar dudas
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 dark:text-orange-400 text-sm">⚠️</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Recuerda que soy un asistente de IA, no reemplazo el consejo médico profesional
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Estadísticas
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Mensajes enviados:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {messages.filter(m => m.isUser).length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Respuestas recibidas:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {messages.filter(m => !m.isUser).length}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Estado del chat:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  Activo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;