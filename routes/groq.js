// ========== FORZAR CARGA DE .env ==========
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('📁 [groq.js] .env cargado desde:', path.join(__dirname, '..', '.env'));
console.log('🔑 [groq.js] GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ EXISTE' : '❌ NO EXISTE');

// routes/groq.js
import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import retryHandler from '../utils/retryHandler.js';
import groqCache from '../utils/groqCache.js';
import groqLogger from '../utils/groqLogger.js';
import { getFallbackResponse, shouldUseFallback, getErrorMessage } from '../utils/fallbackResponses.js';

console.log('=== DIAGNÓSTICO GROQ ===');
console.log('process.env.GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ EXISTE' : '❌ NO EXISTE');
console.log('Valor:', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 20) + '...' : 'vacío');
console.log('========================');

const router = express.Router();
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Validación de configuración
 */
function validateGroqConfig() {
  const key = GROQ_API_KEY;
  
  if (!key || key === 'tu_api_key_de_groq_aqui') {
    return {
      valid: false,
      error: '🔑 API key de Groq no está configurada en el servidor. Contacta al administrador.'
    };
  }
  
  return { valid: true };
}

/**
 * Construye los mensajes para Groq (formato OpenAI)
 */
function buildMessages(pregunta, materia, contexto) {
  const systemPrompt = `Eres un asistente educativo experto en el plan de estudios TECNM (Tecnológico Nacional de México) para Ingeniería en Sistemas.
${materia ? `El estudiante está estudiando la materia: ${materia}.` : ''}
Responde de manera clara, educativa y adecuada para estudiantes universitarios.
Incluye ejemplos prácticos cuando sea posible.
Si es una pregunta sobre código, proporciona ejemplos completos.
Mantén las respuestas concisas pero informativas.`;

  const userMessage = `${contexto ? `Contexto: ${contexto}\n\n` : ''}Pregunta del estudiante: ${pregunta}`;
  
  return {
    system: systemPrompt,
    userMessage: userMessage
  };
}

/**
 * Llama a Groq API con manejo de errores
 */
async function callGroqAPI(messages, apiKey) {
  const startTime = Date.now();
  
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9
      })
    }
  );

  const responseTime = Date.now() - startTime;
  
  if (!response.ok) {
    const error = new Error(await response.text());
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const respuesta = data.choices?.[0]?.message?.content || 'Sin respuesta disponible';
  
  return { respuesta, responseTime };
}

/**
 * Endpoint principal: POST /api/groq
 */
router.post('/', verifyToken, async (req, res) => {
  const { pregunta, materia, contexto } = req.body;
  const startTime = Date.now();

  const configCheck = validateGroqConfig();
  if (!configCheck.valid) {
    const fallbackResponse = getFallbackResponse(materia, { statusCode: 503 });
    groqLogger.logFallback(503, pregunta, materia, 'GROQ_API_KEY no configurada');

    return res.status(200).json({
      respuesta: fallbackResponse,
      source: 'fallback',
      reason: configCheck.error,
      statusCode: 503,
      responseTime: Date.now() - startTime,
      warning: '⚠️ Groq no está configurado. Respuesta de respaldo en uso.'
    });
  }

  if (!pregunta || !pregunta.trim()) {
    return res.status(400).json({ error: '❌ Pregunta no proporcionada' });
  }

  const cachedResponse = groqCache.get(pregunta, materia);
  if (cachedResponse) {
    groqLogger.logCacheHit(pregunta, materia);
    return res.json({
      respuesta: cachedResponse,
      source: 'cache',
      responseTime: Date.now() - startTime
    });
  }

  const { system, userMessage } = buildMessages(pregunta, materia, contexto);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: userMessage }
  ];
  const apiKey = GROQ_API_KEY;

  try {
    const { respuesta, responseTime } = await retryHandler.execute(
      () => callGroqAPI(messages, apiKey),
      'Groq API Call'
    );

    groqCache.set(pregunta, materia, respuesta);
    groqLogger.logSuccess(pregunta, materia, responseTime);

    return res.json({
      respuesta,
      source: 'groq',
      responseTime
    });

  } catch (error) {
    const statusCode = error.statusCode || 500;
    const responseTime = Date.now() - startTime;

    groqLogger.logError(statusCode, error.message, error.attempts || 1, pregunta, materia);

    if (shouldUseFallback(statusCode)) {
      const fallbackResponse = getFallbackResponse(materia, { statusCode });
      groqLogger.logFallback(statusCode, pregunta, materia, `Error ${statusCode}`);

      return res.status(200).json({
        respuesta: fallbackResponse,
        source: 'fallback',
        reason: getErrorMessage(statusCode, error),
        statusCode,
        responseTime,
        warning: '⚠️ Respuesta de respaldo mientras el servicio se recupera'
      });
    }

    return res.status(statusCode).json({
      error: getErrorMessage(statusCode, error),
      statusCode,
      responseTime,
      suggestion: 'Intenta de nuevo en unos momentos'
    });
  }
});

// ========== ENDPOINT PARA GENERAR EXAMEN ==========
router.post('/generate-quiz', verifyToken, async (req, res) => {
    try {
        const { materiaId, moduloIndex, moduloNombre, materiaNombre } = req.body;
        
        if (!moduloNombre || !materiaNombre) {
            return res.status(400).json({ error: 'Faltan datos del módulo o materia' });
        }
        
        console.log(`📝 Generando examen para: ${materiaNombre} - ${moduloNombre}`);
        
        // Si no hay API Key, usar fallback
        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'tu_api_key_de_groq_aqui') {
            console.log('⚠️ GROQ_API_KEY no configurada, usando fallback');
            const fallbackQuiz = generarQuizFallback(moduloNombre, materiaNombre);
            return res.json(fallbackQuiz);
        }
        
        // Prompt mejorado para forzar JSON puro
        const prompt = `Eres un asistente que SOLO responde con JSON válido, sin texto adicional.

Genera un examen de 5 preguntas de opción múltiple sobre "${moduloNombre}" (Materia: ${materiaNombre}).

RESPONDE ÚNICAMENTE CON ESTE FORMATO JSON, sin explicaciones, sin saludos, sin nada más:

{
  "preguntas": [
    {
      "texto": "pregunta aquí",
      "opciones": ["opcion1", "opcion2", "opcion3", "opcion4"],
      "correcta": 0,
      "explicacion": "explicación breve"
    }
  ]
}`;

        console.log('🚀 Enviando solicitud a Groq...');
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,  // Reducir temperatura para respuestas más consistentes
                max_tokens: 2000
            })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error body:', errorText);
            throw new Error(`Groq API error: ${response.status}`);
        }
        
        const data = await response.json();
        let quizData;
        
        try {
            const content = data.choices[0].message.content;
            console.log('📄 Respuesta recibida, longitud:', content.length);
            console.log('📄 Primeros 100 caracteres:', content.substring(0, 100));
            
            // Estrategia de limpieza más agresiva
            let cleanContent = content;
            
            // 1. Eliminar bloques de código markdown
            cleanContent = cleanContent.replace(/```json\n?/gi, '');
            cleanContent = cleanContent.replace(/```\n?/gi, '');
            
            // 2. Buscar el primer { y el último }
            const firstBrace = cleanContent.indexOf('{');
            const lastBrace = cleanContent.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
            }
            
            console.log('📄 JSON extraído (primeros 100 chars):', cleanContent.substring(0, 100));
            
            quizData = JSON.parse(cleanContent);
            
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError.message);
            console.error('Contenido completo que falló:', content);
            throw new Error('Respuesta inválida de la API');
        }
        
        // Validar que tenga 5 preguntas
        if (!quizData.preguntas || quizData.preguntas.length !== 5) {
            console.log(`⚠️ La API no generó 5 preguntas (tiene ${quizData.preguntas?.length || 0}), usando fallback`);
            const fallbackQuiz = generarQuizFallback(moduloNombre, materiaNombre);
            return res.json(fallbackQuiz);
        }
        
        console.log(`✅ Examen generado con ${quizData.preguntas.length} preguntas usando IA`);
        res.json(quizData);
        
    } catch (error) {
        console.error('Error generando quiz:', error);
        const fallbackQuiz = generarQuizFallback(req.body.moduloNombre || 'general', req.body.materiaNombre || 'general');
        res.json(fallbackQuiz);
    }
});

// Función para generar quiz de fallback (preguntas predefinidas)
function generarQuizFallback(moduloNombre, materiaNombre) {
    console.log(`📚 Usando fallback quiz para: ${moduloNombre}`);
    
    const preguntasPorMateria = {
        algoritmos: [
            { texto: "¿Qué significa LIFO en estructuras de datos?", opciones: ["First In First Out", "Last In First Out", "Last In Last Out", "First In Last Out"], correcta: 1, explicacion: "LIFO significa Last In, First Out, característico de las pilas." },
            { texto: "¿Qué estructura de datos usa el principio LIFO?", opciones: ["Cola", "Pila", "Lista enlazada", "Árbol binario"], correcta: 1, explicacion: "La pila (stack) utiliza LIFO." },
            { texto: "¿Cuál es la complejidad temporal de una búsqueda binaria en un arreglo ordenado?", opciones: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correcta: 2, explicacion: "La búsqueda binaria tiene complejidad O(log n)." },
            { texto: "¿Qué tipo de algoritmo es el ordenamiento burbuja?", opciones: ["Divide y vencerás", "Programación dinámica", "Algoritmo de intercambio", "Algoritmo greedy"], correcta: 2, explicacion: "Bubble sort es un algoritmo de ordenamiento por intercambio." },
            { texto: "¿Cuál es la principal ventaja de una lista enlazada?", opciones: ["Acceso aleatorio rápido", "Menor uso de memoria", "Inserción y eliminación eficiente", "Búsqueda binaria"], correcta: 2, explicacion: "Las listas enlazadas permiten inserciones y eliminaciones O(1)." }
        ],
        web: [
            { texto: "¿Qué significa HTML?", opciones: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correcta: 0, explicacion: "HTML son las siglas de HyperText Markup Language." },
            { texto: "¿Qué etiqueta se usa para crear un enlace en HTML?", opciones: ["<link>", "<a>", "<href>", "<url>"], correcta: 1, explicacion: "La etiqueta <a> (anchor) se usa para crear enlaces." },
            { texto: "¿Qué propiedad CSS se usa para cambiar el color de fondo?", opciones: ["color", "background-color", "bgcolor", "background"], correcta: 1, explicacion: "background-color es la propiedad correcta para el color de fondo." },
            { texto: "¿Qué método HTTP se usa para obtener datos?", opciones: ["POST", "PUT", "GET", "DELETE"], correcta: 2, explicacion: "GET se usa para solicitar datos del servidor." },
            { texto: "¿Qué framework de JavaScript es desarrollado por Meta?", opciones: ["Angular", "Vue", "React", "Svelte"], correcta: 2, explicacion: "React fue creado y es mantenido por Meta." }
        ],
        default: [
            { texto: `¿Cuál es un concepto fundamental de "${moduloNombre}" en ${materiaNombre}?`, opciones: ["Conceptualización básica", "Aplicación práctica", "Análisis de casos", "Síntesis de información"], correcta: 0, explicacion: "La conceptualización básica es fundamental para entender cualquier tema." },
            { texto: "¿Cuál es la mejor práctica para aprender este tema?", opciones: ["Practicar con ejercicios", "Solo leer teoría", "Memorizar conceptos", "Ver videos sin práctica"], correcta: 0, explicacion: "La práctica con ejercicios es esencial para el aprendizaje efectivo." },
            { texto: "¿Qué caracteriza a un buen entendimiento de este tema?", opciones: ["Aplicación a casos reales", "Memorización de definiciones", "Saber la historia", "Conocer autores"], correcta: 0, explicacion: "La aplicación práctica demuestra comprensión real del tema." },
            { texto: "¿Qué recurso es más útil para estudiar?", opciones: ["Documentación oficial", "Videos de YouTube", "Redes sociales", "Foros de discusión"], correcta: 0, explicacion: "La documentación oficial suele ser la fuente más confiable." },
            { texto: "¿Qué habilidad desarrolla principalmente este módulo?", opciones: ["Pensamiento analítico", "Memoria", "Creatividad artística", "Habilidades físicas"], correcta: 0, explicacion: "Los módulos técnicos desarrollan principalmente el pensamiento analítico." }
        ]
    };
    
    let tipo = 'default';
    const materiaLower = materiaNombre.toLowerCase();
    if (materiaLower.includes('algoritmo') || materiaLower.includes('estructura')) tipo = 'algoritmos';
    else if (materiaLower.includes('web') || materiaLower.includes('desarrollo') || materiaLower.includes('html')) tipo = 'web';
    
    const preguntasBase = preguntasPorMateria[tipo];
    
    const preguntas = [];
    for (let i = 0; i < 5; i++) {
        if (preguntasBase[i]) {
            preguntas.push({ ...preguntasBase[i] });
        } else {
            const base = { ...preguntasBase[0] };
            base.texto = `${base.texto} (Parte ${i + 1})`;
            preguntas.push(base);
        }
    }
    
    return { preguntas };
}

/**
 * Endpoint: GET /api/groq/stats
 */
router.get('/stats', verifyToken, (req, res) => {
  const stats = groqLogger.getStats();
  const cacheStats = groqCache.getStats();
  
  res.json({
    groq: stats,
    cache: cacheStats,
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint: GET /api/groq/health
 */
router.get('/health', (req, res) => {
  const stats = groqLogger.getStats();
  const cacheStats = groqCache.getStats();
  const errorReport = groqLogger.getErrorReport();
  
  const health = {
    status: stats.successRate > 90 ? 'HEALTHY' : stats.successRate > 70 ? 'DEGRADED' : 'UNHEALTHY',
    successRate: stats.successRate,
    totalRequests: stats.totalRequests,
    errors24h: errorReport.errors24h,
    cacheUsage: `${cacheStats.usage}%`,
    uptime: stats.uptime,
    recentErrors: errorReport.recentErrors.slice(-3)
  };
  
  res.json(health);
});

// Limpieza periódica
setInterval(() => {
  groqLogger.saveStats();
  groqCache.cleanup();
  groqLogger.cleanupOldLogs(30);
}, 60 * 60 * 1000);

groqCache.cleanup();
console.log('✅ Sistema de Groq con respaldo profesional inicializado');

export default router;