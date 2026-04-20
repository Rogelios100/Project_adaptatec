import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import retryHandler from '../utils/retryHandler.js';
import geminiCache from '../utils/geminiCache.js';
import geminiLogger from '../utils/geminiLogger.js';
import { getFallbackResponse, shouldUseFallback, getErrorMessage } from '../utils/fallbackResponses.js';

const router = express.Router();

/**
 * Validación de configuración
 */
function validateGeminiConfig() {
  const key = process.env.GEMINI_API_KEY;
  
  if (!key || key === 'tu_api_key_de_google_gemini_aqui') {
    return {
      valid: false,
      error: '🔑 API key de Gemini no está configurada en el servidor. Contacta al administrador.'
    };
  }
  
  return { valid: true };
}

/**
 * Construye el prompt completo para Gemini
 */
function buildPrompt(pregunta, materia, contexto) {
  const systemPrompt = `Eres un asistente educativo experto en el plan de estudios TECNM (Tecnológico Nacional de México) para Ingeniería en Sistemas.
${materia ? `El estudiante está estudiando la materia: ${materia}.` : ''}
Responde de manera clara, educativa y adecuada para estudiantes universitarios.
Incluye ejemplos prácticos cuando sea posible.
Si es una pregunta sobre código, proporciona ejemplos completos.
Mantén las respuestas concisas pero informativas.`;

  const userPrompt = `${contexto ? `Contexto: ${contexto}\n\n` : ''}Pregunta del estudiante: ${pregunta}`;
  
  return systemPrompt + '\n\n' + userPrompt;
}

/**
 * Llama a Gemini API con manejo de errores
 */
async function callGeminiAPI(prompt, apiKey) {
  const startTime = Date.now();
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1024
        }
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
  const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta disponible';
  
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
  const configCheck = validateGeminiConfig();
  if (!configCheck.valid) {
    geminiLogger.logError(400, 'API key not configured', 1, pregunta, materia);
    return res.status(400).json({ error: configCheck.error });
  }

  if (!pregunta || !pregunta.trim()) {
    return res.status(400).json({ error: '❌ Pregunta no proporcionada' });
  }

  // ========== VERIFICAR CACHÉ ==========
  const cachedResponse = geminiCache.get(pregunta, materia);
  if (cachedResponse) {
    geminiLogger.logCacheHit(pregunta, materia);
    return res.json({
      respuesta: cachedResponse,
      source: 'cache',
      responseTime: Date.now() - startTime
    });
  }

  // ========== CONSTRUIR PROMPT ==========
  const fullPrompt = buildPrompt(pregunta, materia, contexto);
  const apiKey = process.env.GEMINI_API_KEY;

  // ========== EJECUTAR CON REINTENTOS ==========
  try {
    const { respuesta, responseTime } = await retryHandler.execute(
      () => callGeminiAPI(fullPrompt, apiKey),
      'Gemini API Call'
    );

    // Guardar en caché
    geminiCache.set(pregunta, materia, respuesta);
    
    // Registrar éxito
    geminiLogger.logSuccess(pregunta, materia, responseTime);

    return res.json({
      respuesta,
      source: 'gemini',
      responseTime
    });

  } catch (error) {
    const statusCode = error.statusCode || 500;
    const responseTime = Date.now() - startTime;

    // ========== MANEJO DE ERRORES CON FALLBACK ==========
    geminiLogger.logError(statusCode, error.message, error.attempts || 1, pregunta, materia);

    // Usar fallback si es apropiado
    if (shouldUseFallback(statusCode)) {
      const fallbackResponse = getFallbackResponse(materia, { statusCode });
      geminiLogger.logFallback(statusCode, pregunta, materia, `Error ${statusCode}`);

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
  const stats = geminiLogger.getStats();
  const cacheStats = geminiCache.getStats();
  
  res.json({
    gemini: stats,
    cache: cacheStats,
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint: GET /api/gemini/health
 * Verifica salud del sistema
 */
router.get('/health', (req, res) => {
  const stats = geminiLogger.getStats();
  const cacheStats = geminiCache.getStats();
  const errorReport = geminiLogger.getErrorReport();
  
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
  geminiLogger.saveStats();
  geminiCache.cleanup();
  geminiLogger.cleanupOldLogs(30);
}, 60 * 60 * 1000); // Cada hora

// Limpiar al iniciar
geminiCache.cleanup();
console.log('✅ Sistema de Gemini con respaldo profesional inicializado');

export default router;
