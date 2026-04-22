import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import retryHandler from '../utils/retryHandler.js';
import groqCache from '../utils/groqCache.js';
import groqLogger from '../utils/groqLogger.js';
import { getFallbackResponse, shouldUseFallback, getErrorMessage } from '../utils/fallbackResponses.js';

const router = express.Router();

/**
 * Validación de configuración
 */
function validateGroqConfig() {
  const key = process.env.GROQ_API_KEY;
  
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
 * Groq es ultra-rápido y compatible con OpenAI
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
        model: 'llama-3.3-70b-versatile', // Modelo recomendado para educación
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
 * Endpoint principal: POST /api/gemini
 * Con reintentos, caché y fallback automático
 */
router.post('/', verifyToken, async (req, res) => {
  const { pregunta, materia, contexto } = req.body;
  const startTime = Date.now();

  // ========== VALIDACIONES INICIALES ==========
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

  // ========== VERIFICAR CACHÉ ==========
  //console.log(typeof req.body.materia, req.body.materia);
  const cachedResponse = groqCache.get(pregunta, materia);
  if (cachedResponse) {
    groqLogger.logCacheHit(pregunta, materia);
    return res.json({
      respuesta: cachedResponse,
      source: 'cache',
      responseTime: Date.now() - startTime
    });
  }

  // ========== CONSTRUIR MENSAJES ==========
  const { system, userMessage } = buildMessages(pregunta, materia, contexto);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: userMessage }
  ];
  const apiKey = process.env.GROQ_API_KEY;

  // ========== EJECUTAR CON REINTENTOS ==========
  try {
    const { respuesta, responseTime } = await retryHandler.execute(
      () => callGroqAPI(messages, apiKey),
      'Groq API Call'
    );

    // Guardar en caché
    groqCache.set(pregunta, materia, respuesta);
    
    // Registrar éxito
    groqLogger.logSuccess(pregunta, materia, responseTime);

    return res.json({
      respuesta,
      source: 'groq',
      responseTime
    });

  } catch (error) {
    const statusCode = error.statusCode || 500;
    const responseTime = Date.now() - startTime;

    // ========== MANEJO DE ERRORES CON FALLBACK ==========
    groqLogger.logError(statusCode, error.message, error.attempts || 1, pregunta, materia);

    // Usar fallback si es apropiado
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

    // Error no recuperable
    return res.status(statusCode).json({
      error: getErrorMessage(statusCode, error),
      statusCode,
      responseTime,
      suggestion: 'Intenta de nuevo en unos momentos'
    });
  }
});

/**
 * Endpoint: GET /api/gemini/stats
 * Obtiene estadísticas del sistema
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
 * Endpoint: GET /api/gemini/health
 * Verifica salud del sistema
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

/**
 * Limpiar y mantener sistemas
 */
setInterval(() => {
  groqLogger.saveStats();
  groqCache.cleanup();
  groqLogger.cleanupOldLogs(30);
}, 60 * 60 * 1000); // Cada hora

// Limpiar al iniciar
groqCache.cleanup();
console.log('✅ Sistema de Groq con respaldo profesional inicializado');

export default router;
