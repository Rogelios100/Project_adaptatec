import { BookOpen, Clock, Award, ChevronRight, Play, CheckCircle2, Lock, MessageSquare, Send, Bot, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Subject {
  id: string;
  name: string;
  progress: number;
  color: string;
  modules: number;
  completedModules: number;
  hours: number;
  level: string;
  image: string;
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

const subjects: Subject[] = [
  {
    id: "1",
    name: "Algoritmos y Estructuras de Datos",
    progress: 75,
    color: "blue",
    modules: 12,
    completedModules: 9,
    hours: 24,
    level: "Avanzado",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%233B82F6' width='100' height='100'/%3E%3C/svg%3E"
  },
  {
    id: "2",
    name: "Desarrollo Web Avanzado",
    progress: 60,
    color: "purple",
    modules: 15,
    completedModules: 9,
    hours: 30,
    level: "Intermedio",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%238B5CF6' width='100' height='100'/%3E%3C/svg%3E"
  },
  {
    id: "3",
    name: "Base de Datos",
    progress: 85,
    color: "green",
    modules: 10,
    completedModules: 8,
    hours: 20,
    level: "Avanzado",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%2310B981' width='100' height='100'/%3E%3C/svg%3E"
  },
  {
    id: "4",
    name: "Inteligencia Artificial",
    progress: 40,
    color: "pink",
    modules: 14,
    completedModules: 5,
    hours: 28,
    level: "Intermedio",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23EC4899' width='100' height='100'/%3E%3C/svg%3E"
  },
  {
    id: "5",
    name: "Arquitectura de Software",
    progress: 55,
    color: "orange",
    modules: 11,
    completedModules: 6,
    hours: 22,
    level: "Avanzado",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23F97316' width='100' height='100'/%3E%3C/svg%3E"
  },
  {
    id: "6",
    name: "Seguridad Informática",
    progress: 30,
    color: "red",
    modules: 13,
    completedModules: 4,
    hours: 26,
    level: "Intermedio",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23EF4444' width='100' height='100'/%3E%3C/svg%3E"
  },
];

export function Subjects() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [chatOpenForSubject, setChatOpenForSubject] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const getSubjectModules = (subjectId: string) => {
    const modules = [
      { id: 1, name: "Introducción al Concepto", status: "completed" },
      { id: 2, name: "Fundamentos Básicos", status: "completed" },
      { id: 3, name: "Práctica Guiada", status: "completed" },
      { id: 4, name: "Casos de Estudio", status: "in-progress" },
      { id: 5, name: "Proyecto Final", status: "locked" },
    ];
    return modules;
  };

  const getAIResponse = (userMessage: string, subjectName: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Respuestas contextuales según la materia
    if (subjectName.includes("Algoritmos")) {
      if (lowerMessage.includes("ordenamiento") || lowerMessage.includes("sort")) {
        return "En Algoritmos y Estructuras de Datos, los métodos de ordenamiento son fundamentales:\n\n• **Bubble Sort**: O(n²) - Simple pero ineficiente\n• **Quick Sort**: O(n log n) - Muy usado en la práctica\n• **Merge Sort**: O(n log n) - Estable y predecible\n• **Heap Sort**: O(n log n) - Usa una estructura heap\n\n¿Quieres que profundice en la implementación de alguno?";
      }
      if (lowerMessage.includes("árbol") || lowerMessage.includes("tree")) {
        return "Los árboles son estructuras jerárquicas clave:\n\n• **Árbol Binario**: Cada nodo tiene máximo 2 hijos\n• **BST**: Árbol binario de búsqueda ordenado\n• **AVL**: Árbol auto-balanceado\n• **Heap**: Árbol completo con propiedad de orden\n\nRecuerda: en el módulo 4 verás implementaciones prácticas de estos conceptos.";
      }
      return `Excelente pregunta sobre Algoritmos. Estamos en el módulo de ${getSubjectModules("1")[3].name}. ¿Podrías ser más específico sobre qué tema del curso necesitas ayuda? Por ejemplo: búsqueda, ordenamiento, grafos, o árboles.`;
    }
    
    if (subjectName.includes("Desarrollo Web")) {
      if (lowerMessage.includes("react") || lowerMessage.includes("componente")) {
        return "En React, los componentes son la base:\n\n```jsx\nfunction MiComponente({ titulo }) {\n  const [contador, setContador] = useState(0);\n  \n  return (\n    <div>\n      <h1>{titulo}</h1>\n      <button onClick={() => setContador(contador + 1)}>\n        Clicks: {contador}\n      </button>\n    </div>\n  );\n}\n```\n\nRecuerda usar hooks como useState, useEffect para gestionar estado y efectos.";
      }
      if (lowerMessage.includes("css") || lowerMessage.includes("estilo")) {
        return "Para estilos modernos en desarrollo web:\n\n• **Flexbox**: Layout unidimensional flexible\n• **Grid**: Layout bidimensional potente\n• **Tailwind CSS**: Utility-first framework\n• **CSS Modules**: Estilos con scope local\n\n¿Estás trabajando en el proyecto del módulo actual?";
      }
      return `Estoy aquí para ayudarte con Desarrollo Web. Estamos cubriendo temas como React, CSS avanzado, APIs y estado global. ¿En qué concepto específico necesitas ayuda?`;
    }
    
    if (subjectName.includes("Base de Datos")) {
      if (lowerMessage.includes("join") || lowerMessage.includes("unir")) {
        return "Los JOINs en SQL combinan datos de múltiples tablas:\n\n• **INNER JOIN**: Solo coincidencias en ambas tablas\n• **LEFT JOIN**: Todos de la izquierda + coincidencias\n• **RIGHT JOIN**: Todos de la derecha + coincidencias\n• **FULL OUTER JOIN**: Todos de ambas tablas\n\n```sql\nSELECT u.nombre, p.titulo\nFROM usuarios u\nINNER JOIN publicaciones p ON u.id = p.usuario_id;\n```";
      }
      if (lowerMessage.includes("normalización") || lowerMessage.includes("normal")) {
        return "La normalización organiza datos para reducir redundancia:\n\n**1NF**: Valores atómicos, sin grupos repetitivos\n**2NF**: 1NF + sin dependencias parciales\n**3NF**: 2NF + sin dependencias transitivas\n**BCNF**: 3NF + cada determinante es clave candidata\n\nEsto es clave para el diseño del proyecto final.";
      }
      return `Te puedo ayudar con Base de Datos. Temas que cubrimos: SQL, normalización, índices, transacciones y optimización. ¿Qué necesitas entender mejor?`;
    }
    
    if (subjectName.includes("Inteligencia Artificial")) {
      if (lowerMessage.includes("machine learning") || lowerMessage.includes("aprendizaje")) {
        return "Machine Learning se divide en:\n\n• **Supervisado**: Datos etiquetados (clasificación, regresión)\n• **No supervisado**: Datos sin etiquetar (clustering, reducción dimensional)\n• **Por refuerzo**: Aprendizaje mediante recompensas\n\nAlgoritmos populares: Linear Regression, Decision Trees, Neural Networks, K-means.\n\n¿Estás en la parte de redes neuronales?";
      }
      return `En IA cubrimos desde fundamentos hasta redes neuronales. Estamos en módulos de aprendizaje automático. ¿Qué concepto de IA te gustaría explorar?`;
    }
    
    return `Estoy aquí para ayudarte con "${subjectName}". Por favor, hazme una pregunta específica sobre los temas del curso y te ayudaré con explicaciones detalladas y ejemplos prácticos.`;
  };

  const handleOpenChat = (subjectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatOpenForSubject(subjectId);
    
    // Inicializar chat si no existe
    if (!chatMessages[subjectId]) {
      const subject = subjects.find(s => s.id === subjectId);
      setChatMessages({
        ...chatMessages,
        [subjectId]: [{
          id: "1",
          type: "ai",
          content: `¡Hola! Soy tu asistente para ${subject?.name}. Estoy aquí para ayudarte con cualquier duda sobre esta materia. ¿En qué puedo ayudarte?`,
          timestamp: new Date(),
        }]
      });
    }
  };

  const handleSendMessage = async (subjectId: string) => {
    if (!chatInput.trim()) return;

    const subject = subjects.find(s => s.id === subjectId);
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages({
      ...chatMessages,
      [subjectId]: [...(chatMessages[subjectId] || []), userMessage]
    });
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: getAIResponse(chatInput, subject?.name || ""),
        timestamp: new Date(),
      };
      setChatMessages(prev => ({
        ...prev,
        [subjectId]: [...(prev[subjectId] || []), aiResponse]
      }));
      setIsTyping(false);
    }, 1500);
  };

  const handleCloseChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChatOpenForSubject(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Materias</h1>
          <p className="text-gray-600 mt-1">Gestiona tu progreso y pregunta a la IA en cada materia</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
          <Award size={20} />
          <span className="font-medium">1,850 XP acumulados</span>
        </div>
      </div>

      {/* Lista de Materias */}
      <div className="grid md:grid-cols-2 gap-4">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div 
              className="flex gap-4 p-4 cursor-pointer"
              onClick={() => setSelectedSubject(selectedSubject === subject.id ? null : subject.id)}
            >
              <div className={`w-20 h-20 bg-${subject.color}-500 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <BookOpen size={32} className="text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                  <ChevronRight 
                    size={20} 
                    className={`text-gray-400 transition-transform flex-shrink-0 ${
                      selectedSubject === subject.id ? "rotate-90" : ""
                    }`}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {subject.completedModules}/{subject.modules} módulos
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {subject.hours}h
                  </span>
                  <span className={`px-2 py-0.5 bg-${subject.color}-100 text-${subject.color}-700 rounded-full text-xs`}>
                    {subject.level}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${subject.color}-500 h-2 rounded-full transition-all`}
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">{subject.progress}% completado</p>
              </div>
            </div>

            {/* Botón para abrir chat IA */}
            <div className="px-4 pb-4">
              <button
                onClick={(e) => handleOpenChat(subject.id, e)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-${subject.color}-500 hover:bg-${subject.color}-600 text-white rounded-lg transition-colors`}
              >
                <MessageSquare size={18} />
                <span>Pregunta a la IA sobre esta materia</span>
              </button>
            </div>

            {/* Módulos expandibles */}
            {selectedSubject === subject.id && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Módulos del Curso</h4>
                {getSubjectModules(subject.id).map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {module.status === "completed" && (
                      <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                    )}
                    {module.status === "in-progress" && (
                      <Play size={20} className="text-blue-500 flex-shrink-0" />
                    )}
                    {module.status === "locked" && (
                      <Lock size={20} className="text-gray-400 flex-shrink-0" />
                    )}
                    
                    <span className={`text-sm flex-1 ${
                      module.status === "locked" ? "text-gray-400" : "text-gray-700"
                    }`}>
                      Módulo {module.id}: {module.name}
                    </span>

                    {module.status === "in-progress" && (
                      <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors">
                        Continuar
                      </button>
                    )}
                    {module.status === "completed" && (
                      <span className="text-xs text-green-600 font-medium">Completado</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chat Modal */}
      {chatOpenForSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-${subjects.find(s => s.id === chatOpenForSubject)?.color}-500 rounded-lg flex items-center justify-center`}>
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {subjects.find(s => s.id === chatOpenForSubject)?.name}
                  </h3>
                  <p className="text-sm text-gray-600">Asistente IA</p>
                </div>
              </div>
              <button
                onClick={handleCloseChat}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(chatMessages[chatOpenForSubject] || []).map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "ai" && (
                    <div className={`w-8 h-8 bg-${subjects.find(s => s.id === chatOpenForSubject)?.color}-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Bot size={16} className="text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.type === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <span className={`text-xs mt-1 block ${
                      message.type === "user" ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className={`w-8 h-8 bg-${subjects.find(s => s.id === chatOpenForSubject)?.color}-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(chatOpenForSubject);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe tu pregunta sobre esta materia..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas Generales */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Estadísticas Generales</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {subjects.reduce((acc, s) => acc + s.completedModules, 0)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Módulos Completados</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {subjects.reduce((acc, s) => acc + s.hours, 0)}h
            </p>
            <p className="text-sm text-gray-600 mt-1">Horas Totales de Estudio</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(subjects.reduce((acc, s) => acc + s.progress, 0) / subjects.length)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Progreso Promedio</p>
          </div>
        </div>
      </div>
    </div>
  );
}
