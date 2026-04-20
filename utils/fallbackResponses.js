/**
 * Respuestas Fallback Inteligentes para Educación
 * Proporciona respuestas útiles cuando Gemini no está disponible
 */

const fallbackResponses = {
  default: `Lo siento, estoy experimentando dificultades técnicas en este momento. Sin embargo, aquí te doy algunas sugerencias:

**¿Qué puedes hacer?**
1. Intenta hacer tu pregunta de otra forma
2. Consulta el material de la materia en tu navegador
3. Intenta nuevamente en unos minutos

**Mientras esperas:**
- Revisa los apuntes de clase
- Consulta los ejemplos prácticos del módulo
- Investiga en recursos en línea como:
  - W3Schools (para desarrollo web)
  - GeeksforGeeks (para programación)
  - Khan Academy (para conceptos base)

El servicio de IA debería estar disponible pronto. ¡Gracias por tu paciencia! 🙏`,

  algoritmos: `Entiendo que estás estudiando **Algoritmos y Estructuras de Datos**. El servicio de IA no está disponible ahora, pero aquí van algunos consejos:

**Tópicos comunes en esta materia:**
- Big O Notation y análisis de complejidad
- Estructuras básicas: Arrays, Listas, Pilas, Colas
- Árboles binarios y búsqueda
- Algoritmos de ordenamiento: QuickSort, MergeSort, BubbleSort
- Grafos y búsqueda: DFS, BFS

**Recursos recomendados:**
- Visualiza algoritmos en: https://visualgo.net
- Practica en: https://www.hackerrank.com
- Lee: "Introduction to Algorithms" (CLRS)

¡Intenta tu pregunta más tarde! 💪`,

  desarrollo: `Veo que trabajas con **Desarrollo Web**. El servicio de IA está en mantenimiento, pero aquí te ayudo:

**Áreas típicas:**
- HTML5: Semántica y estructura
- CSS3: Flexbox, Grid, Animaciones
- JavaScript: DOM, Eventos, Promises, Async/Await
- Frameworks: React, Vue, Angular
- APIs REST y Fetch

**Para practicar:**
- CodePen (https://codepen.io) - ejemplos vivos
- MDN Web Docs - documentación oficial
- FreeCodeCamp - tutoriales completos
- GitHub - estudia código real

¡El servicio vuelve pronto! 🚀`,

  basedatos: `Trabajas con **Base de Datos**. El IA no está disponible ahora, pero aquí van pistas:

**Temas principales:**
- Modelado Entidad-Relación (ER)
- SQL: SELECT, JOIN, subconsultas
- Índices y optimización
- Transacciones y ACID
- Normalización (1NF, 2NF, 3NF)
- NoSQL: MongoDB, Firebase

**Herramientas útiles:**
- SQLiteOnline - prueba SQL en línea
- DBDiagram.io - diseña modelos ER
- Workbench - GUI para MySQL

¡Vuelve a intentar en unos minutos! 📊`,

  ia: `Interesante, estudias **Inteligencia Artificial**. El IA principal está en pausa, pero aquí van conceptos:

**Áreas de IA:**
- Búsqueda: BFS, DFS, A*, algoritmo de Dijkstra
- Machine Learning: supervisado, no supervisado
- Redes Neuronales: forward pass, backpropagation
- Procesamiento de Lenguaje Natural (NLP)
- Visión Computacional

**Plataformas para aprender:**
- Coursera - cursos de Andrew Ng
- Fast.ai - Deep Learning
- Kaggle - datasets y competencias
- TensorFlow Playground - visualiza redes

¡El servicio regresa pronto! 🤖`,

  arquitectura: `Estudias **Arquitectura de Software**. El servicio de IA no está disponible, pero te doy guía:

**Patrones de diseño:**
- MVC, MVVM, MVP
- Microservicios vs Monolítico
- Arquitectura hexagonal
- Domain-Driven Design (DDD)
- Event-Driven Architecture

**Principios:**
- SOLID (Single, Open, Liskov, Interface, Dependency)
- DRY, KISS, YAGNI
- Escalabilidad y performance

**Referencias:**
- "Clean Architecture" - Robert Martin
- "Building Microservices" - Sam Newman

¡Intenta más tarde! 🏗️`,

  seguridad: `Te veo trabajando en **Seguridad Informática**. El IA está en mantenimiento, pero aquí van puntos clave:

**Seguridad Core:**
- Criptografía: simétrica, asimétrica, hashing
- Autenticación: OAuth, JWT, MFA
- OWASP Top 10: SQL Injection, XSS, CSRF
- Control de acceso: RBAC, ABAC
- Auditoría y logs

**Prácticas:**
- HTTPS y certificados SSL/TLS
- Firewalls y IDS
- Seguridad en APIs
- Respuesta a incidentes

**Aprende haciendo:**
- HackTheBox - CTF challenges
- TryHackMe - labs interactivos
- OWASP WebGoat - vulnerabilidades reales

¡Vuelve luego! 🔐`
};

/**
 * Obtiene respuesta fallback basada en la materia
 */
function getFallbackResponse(materia, errorInfo = null) {
  // Buscar coincidencia parcial con el nombre de la materia
  let response = fallbackResponses.default;

  if (materia) {
    const meteriaLower = materia.toLowerCase();
    
    if (meteriaLower.includes('algoritmo') || meteriaLower.includes('estructura')) {
      response = fallbackResponses.algoritmos;
    } else if (meteriaLower.includes('web') || meteriaLower.includes('desarrollo') || meteriaLower.includes('javascript')) {
      response = fallbackResponses.desarrollo;
    } else if (meteriaLower.includes('base') || meteriaLower.includes('dato') || meteriaLower.includes('sql')) {
      response = fallbackResponses.basedatos;
    } else if (meteriaLower.includes('inteligencia') || meteriaLower.includes('ia') || meteriaLower.includes('machine')) {
      response = fallbackResponses.ia;
    } else if (meteriaLower.includes('arquitectura')) {
      response = fallbackResponses.arquitectura;
    } else if (meteriaLower.includes('seguridad') || meteriaLower.includes('criptografía')) {
      response = fallbackResponses.seguridad;
    }
  }

  // Agregar información del error si está disponible
  if (errorInfo && errorInfo.statusCode === 503) {
    const footer = `\n\n---\n⚠️ **Estado:** El servicio de IA está saturado (Error 503). Estamos reintentando automáticamente...`;
    response += footer;
  } else if (errorInfo && errorInfo.statusCode) {
    const footer = `\n\n---\n⚠️ **Estado:** Problema técnico temporal (Error ${errorInfo.statusCode}). Por favor intenta nuevamente.`;
    response += footer;
  }

  return response;
}

/**
 * Determina si se debe usar fallback para un error específico
 */
function shouldUseFallback(statusCode) {
  return [429, 500, 502, 503, 504].includes(statusCode);
}

/**
 * Obtiene mensaje de error usuario-friendly
 */
function getErrorMessage(statusCode, originalError = null) {
  const messages = {
    429: '⏰ El servicio recibe demasiadas solicitudes. Intenta en unos momentos.',
    500: '❌ Error interno del servidor. Estamos trabajando en ello.',
    502: '🔌 Puerta de enlace no disponible. Intenta nuevamente en unos segundos.',
    503: '⚠️ Servicio temporalmente no disponible. Reintentando automáticamente...',
    504: '⏳ El servicio tardó demasiado. Intenta tu pregunta de nuevo.',
    timeout: '⏱️ La solicitud tardó demasiado tiempo. Por favor intenta de nuevo.',
    network: '📡 Problema de conexión de red. Verifica tu conexión a internet.'
  };

  if (statusCode && messages[statusCode]) {
    return messages[statusCode];
  } else if (originalError?.code === 'ECONNREFUSED') {
    return messages.network;
  } else if (originalError?.code === 'ETIMEDOUT') {
    return messages.timeout;
  }

  return '❌ Error desconocido. Por favor intenta de nuevo más tarde.';
}

export {
  fallbackResponses,
  getFallbackResponse,
  shouldUseFallback,
  getErrorMessage
};
