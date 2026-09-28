import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import retryHandler from '../utils/retryHandler.js';
import geminiCache from '../utils/geminiCache.js';
import geminiLogger from '../utils/geminiLogger.js';
import { getFallbackResponse, shouldUseFallback, getErrorMessage } from '../utils/fallbackResponses.js';

const router = express.Router();
const BAZAARLINK_MODEL = process.env.BAZAARLINK_MODEL || 'auto:free';
const BAZAARLINK_API_KEY = process.env.BAZAARLINK_API_KEY;
const BAZAARLINK_BASE_URL = (process.env.BAZAARLINK_BASE_URL || 'https://api.bazaarlink.ai/v1').replace(/\/+$/, '');

function validateBazaarlinkConfig() {
  if (!BAZAARLINK_API_KEY || BAZAARLINK_API_KEY === 'tu_api_key_de_bazaarlink_aqui') {
    return { valid: false, error: 'La API key de BazaarLink no está configurada en el servidor.' };
  }
  return { valid: true };
}

function buildMessages(pregunta, materia, contexto) {
  const systemPrompt = `Eres un asistente educativo experto en el plan de estudios TECNM para Ingeniería en Sistemas.
${materia ? `El estudiante está estudiando la materia: ${materia}.` : ''}
Responde de manera clara, educativa y adecuada para estudiantes universitarios.
Incluye ejemplos prácticos cuando sea posible. Si es una pregunta sobre código, proporciona ejemplos completos.
Mantén las respuestas concisas pero informativas.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${contexto ? `Contexto: ${contexto}\n\n` : ''}Pregunta del estudiante: ${pregunta}` }
  ];
}

async function callBazaarlinkAPI(messages, generationConfig = {}) {
  const startTime = Date.now();
  const response = await fetch(`${BAZAARLINK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BAZAARLINK_API_KEY}`
    },
    body: JSON.stringify({
      model: BAZAARLINK_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
      ...generationConfig
    })
  });

  const responseTime = Date.now() - startTime;
  if (!response.ok) {
    const error = new Error(await response.text());
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const respuesta = data.choices?.[0]?.message?.content?.trim();
  if (!respuesta) {
    const error = new Error('BazaarLink no devolvió contenido');
    error.statusCode = 502;
    throw error;
  }

  return { respuesta, responseTime };
}

router.post('/', verifyToken, async (req, res) => {
  const { pregunta, materia, contexto } = req.body;
  const startTime = Date.now();

  if (!pregunta || !pregunta.trim()) {
    return res.status(400).json({ error: 'Pregunta no proporcionada' });
  }

  const configCheck = validateBazaarlinkConfig();
  if (!configCheck.valid) {
    const fallbackResponse = getFallbackResponse(materia, { statusCode: 503 });
    geminiLogger.logFallback(503, pregunta, materia, 'BAZAARLINK_API_KEY no configurada');
    return res.status(200).json({
      respuesta: fallbackResponse,
      source: 'fallback',
      reason: configCheck.error,
      statusCode: 503,
      responseTime: Date.now() - startTime
    });
  }

  const cachedResponse = geminiCache.get(pregunta, materia);
  if (cachedResponse) {
    geminiLogger.logCacheHit(pregunta, materia);
    return res.json({ respuesta: cachedResponse, source: 'cache', responseTime: Date.now() - startTime });
  }

  try {
    const result = await retryHandler.execute(
      () => callBazaarlinkAPI(buildMessages(pregunta, materia, contexto)),
      'BazaarLink API Call'
    );
    geminiCache.set(pregunta, materia, result.respuesta);
    geminiLogger.logSuccess(pregunta, materia, result.responseTime);
    return res.json({ respuesta: result.respuesta, source: 'bazaarlink', responseTime: result.responseTime });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const responseTime = Date.now() - startTime;
    geminiLogger.logError(statusCode, error.message, error.attempts || 1, pregunta, materia);

    if (shouldUseFallback(statusCode)) {
      const fallbackResponse = getFallbackResponse(materia, { statusCode });
      geminiLogger.logFallback(statusCode, pregunta, materia, `Error ${statusCode}`);
      return res.status(200).json({
        respuesta: fallbackResponse,
        source: 'fallback',
        reason: getErrorMessage(statusCode, error),
        statusCode,
        responseTime,
        warning: 'Respuesta de respaldo mientras el servicio se recupera'
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

router.post('/generate-quiz', verifyToken, async (req, res) => {
  const { moduloNombre, materiaNombre } = req.body;
  if (!moduloNombre || !materiaNombre) {
    return res.status(400).json({ error: 'Faltan datos del módulo o materia' });
  }

  if (!validateBazaarlinkConfig().valid) {
    return res.json(generarQuizFallback(moduloNombre, materiaNombre));
  }

  const prompt = `Responde únicamente con JSON válido, sin markdown ni texto adicional. Genera un examen de 5 preguntas de opción múltiple sobre "${moduloNombre}" de la materia "${materiaNombre}". Usa exactamente este formato: {"preguntas":[{"texto":"...","opciones":["...","...","...","..."],"correcta":0,"explicacion":"..."}]}. "correcta" debe ser un índice entre 0 y 3.`;

  try {
    const { respuesta } = await retryHandler.execute(
      () => callBazaarlinkAPI([{ role: 'user', content: prompt }], {
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      }),
      'BazaarLink Quiz Call'
    );
    const jsonStart = respuesta.indexOf('{');
    const jsonEnd = respuesta.lastIndexOf('}');
    const quiz = JSON.parse(respuesta.slice(jsonStart, jsonEnd + 1));
    if (!Array.isArray(quiz.preguntas) || quiz.preguntas.length !== 5) {
      return res.json(generarQuizFallback(moduloNombre, materiaNombre));
    }
    return res.json(quiz);
  } catch (error) {
    console.error('Error generando quiz con BazaarLink:', error.message);
    return res.json(generarQuizFallback(moduloNombre, materiaNombre));
  }
});

function generarQuizFallback(moduloNombre, materiaNombre) {
  return {
    preguntas: Array.from({ length: 5 }, (_, index) => ({
      texto: `¿Cuál es un concepto fundamental de "${moduloNombre}" en ${materiaNombre}?`,
      opciones: ['Conceptualización básica', 'Aplicación práctica', 'Análisis de casos', 'Síntesis de información'],
      correcta: 0,
      explicacion: index === 0 ? 'La conceptualización básica permite comprender el tema.' : 'La práctica y el análisis consolidan el aprendizaje.'
    }))
  };
}

router.get('/stats', verifyToken, (req, res) => {
  res.json({
    bazaarlink: geminiLogger.getStats(),
    cache: geminiCache.getStats(),
    timestamp: new Date().toISOString()
  });
});

router.get('/health', (req, res) => {
  const stats = geminiLogger.getStats();
  const cacheStats = geminiCache.getStats();
  const errorReport = geminiLogger.getErrorReport();
  res.json({
    status: stats.successRate > 90 ? 'HEALTHY' : stats.successRate > 70 ? 'DEGRADED' : 'UNHEALTHY',
    configured: validateBazaarlinkConfig().valid,
    successRate: stats.successRate,
    totalRequests: stats.totalRequests,
    errors24h: errorReport.errors24h,
    cacheUsage: `${cacheStats.usage}%`,
    uptime: stats.uptime,
    recentErrors: errorReport.recentErrors.slice(-3)
  });
});

setInterval(() => {
  geminiLogger.saveStats();
  geminiCache.cleanup();
  geminiLogger.cleanupOldLogs(30);
}, 60 * 60 * 1000);

geminiCache.cleanup();
console.log(`Sistema de BazaarLink inicializado con el modelo ${BAZAARLINK_MODEL}`);

export default router;
