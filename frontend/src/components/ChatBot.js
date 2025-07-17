import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatBot = ({ token }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/chat/history`, { headers });
      
      const formattedMessages = response.data.flatMap(chat => [
        { type: 'user', content: chat.message, timestamp: chat.timestamp },
        { type: 'bot', content: chat.response, timestamp: chat.timestamp }
      ]);
      
      setMessages(formattedMessages);
      setChatHistory(response.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = { type: 'user', content: newMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/chat`, 
        `message=${encodeURIComponent(newMessage)}`, 
        { 
          headers: {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const botMessage = { 
        type: 'bot', 
        content: response.data.response, 
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { 
        type: 'bot', 
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    '¿Cómo puedo mejorar mi dieta?',
    '¿Qué ejercicios son mejores para principiantes?',
    '¿Cuánta agua debo beber al día?',
    '¿Cómo puedo mantener la motivación?',
    '¿Qué suplementos recomiendas?',
    '¿Cómo puedo perder peso de forma saludable?'
  ];

  const handleQuickQuestion = (question) => {
    setNewMessage(question);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🤖 Asistente Fitness IA
        </h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>En línea</span>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-96 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">🤖</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Asistente Fitness
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tu entrenador personal con IA
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ¡Hola! Soy tu asistente fitness
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Estoy aquí para ayudarte con consejos de entrenamiento, nutrición y motivación.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Puedes preguntarme cualquier cosa relacionada con fitness y salud.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' 
                      ? 'text-blue-100' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Escribiendo...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={sendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu pregunta aquí..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '📤' : '➤'}
            </button>
          </form>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preguntas Frecuentes
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              className="text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm text-gray-700 dark:text-gray-300"
            >
              💬 {question}
            </button>
          ))}
        </div>
      </div>

      {/* AI Features */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Funcionalidades del Asistente IA
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Consejos Personalizados
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Recibe consejos adaptados a tu perfil, objetivos y progreso actual.
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl mb-2">🥗</div>
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
              Guía Nutricional
            </h4>
            <p className="text-sm text-green-800 dark:text-green-400">
              Obtén recomendaciones sobre alimentación, recetas y planificación de comidas.
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-2xl mb-2">💪</div>
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
              Entrenamiento Adaptado
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-400">
              Recibe rutinas y ejercicios personalizados según tu nivel y equipamiento.
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-2xl mb-2">🔥</div>
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              Motivación Constante
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Mantente motivado con mensajes personalizados y estrategias de adherencia.
            </p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">
              Análisis de Progreso
            </h4>
            <p className="text-sm text-red-800 dark:text-red-400">
              Interpreta tus datos de progreso y sugiere ajustes en tu plan.
            </p>
          </div>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <div className="text-2xl mb-2">🏥</div>
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
              Bienestar Integral
            </h4>
            <p className="text-sm text-indigo-800 dark:text-indigo-400">
              Consejos sobre descanso, hidratación y manejo del estrés.
            </p>
          </div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Consejos de Uso
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Sé específico en tus preguntas
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cuanto más detalles proporciones, mejor podrá ayudarte el asistente.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Menciona tu contexto
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Incluye información sobre tu nivel, objetivos y limitaciones.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Haz seguimiento
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Puedes hacer preguntas de seguimiento para profundizar en un tema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;