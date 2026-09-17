import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import retryHandler from '../utils/retryHandler.js';
import geminiCache from '../utils/geminiCache.js';
import geminiLogger from '../utils/geminiLogger.js';
import { getFallbackResponse, shouldUseFallback, getErrorMessage } from '../utils/fallbackResponses.js';

const router = express.Router();
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function validateGeminiConfig() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'tu_api_key_de_gemini_aqui') {
    return { valid: false, error: 'API key de Gemini no está configurada en el servidor.' };
  }
  return { valid: true };
}

function buildPrompt(pregunta, materia, contexto) {
  const systemPrompt = `Eres un asistente educativo experto en el plan de estudios TECNM para Ingeniería en Sistemas.
${materia ? `El estudiante está estudiando la materia: ${materia}.` : ''}
Responde de manera clara, educativa y adecuada para estudiantes universitarios.
Incluye ejemplos prácticos cuando sea posible. Si es una pregunta sobre código, proporciona ejemplos completos.
Mantén las respuestas concisas pero informativas.`;

  return `${systemPrompt}\n\n${contexto ? `Contexto: ${contexto}\n\n` : ''}Pregunta del estudiante: ${pregunta}`;
}

async function callGeminiAPI(prompt, apiKey, generationConfig = {}) {
  const startTime = Date.now();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9,
        ...generationConfig
      }
    })
  });

  const responseTime = Date.now() - startTime;
  if (!response.ok) {
    const error = new Error(await response.text());
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const respuesta = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
  if (!respuesta) {
    const error = new Error('Gemini no devolvió contenido');
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

  const configCheck = validateGeminiConfig();
  if (!configCheck.valid) {
    const fallbackResponse = getFallbackResponse(materia, { statusCode: 503 });
    geminiLogger.logFallback(503, pregunta, materia, 'GEMINI_API_KEY no configurada');
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
      () => callGeminiAPI(buildPrompt(pregunta, materia, contexto), GEMINI_API_KEY),
      'Gemini API Call'
    );
    geminiCache.set(pregunta, materia, result.respuesta);
    geminiLogger.logSuccess(pregunta, materia, result.responseTime);
    return res.json({ respuesta: result.respuesta, source: 'gemini', responseTime: result.responseTime });
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

  if (!validateGeminiConfig().valid) {
    return res.json(generarQuizFallback(moduloNombre, materiaNombre));
  }

  const prompt = `Responde únicamente con JSON válido, sin markdown ni texto adicional. Genera un examen de 5 preguntas de opción múltiple sobre "${moduloNombre}" de la materia "${materiaNombre}". Usa exactamente este formato: {"preguntas":[{"texto":"...","opciones":["...","...","...","..."],"correcta":0,"explicacion":"..."}]}. "correcta" debe ser un índice entre 0 y 3.`;

  try {
    const { respuesta } = await retryHandler.execute(
      () => callGeminiAPI(prompt, GEMINI_API_KEY, { temperature: 0.3, maxOutputTokens: 2000, responseMimeType: 'application/json' }),
      'Gemini Quiz Call'
    );
    const jsonStart = respuesta.indexOf('{');
    const jsonEnd = respuesta.lastIndexOf('}');
    const quiz = JSON.parse(respuesta.slice(jsonStart, jsonEnd + 1));
    if (!Array.isArray(quiz.preguntas) || quiz.preguntas.length !== 5) {
      return res.json(generarQuizFallback(moduloNombre, materiaNombre));
    }
    return res.json(quiz);
  } catch (error) {
    console.error('Error generando quiz con Gemini:', error.message);
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
    gemini: geminiLogger.getStats(),
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
    configured: validateGeminiConfig().valid,
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
console.log(`Sistema de Gemini inicializado con el modelo ${GEMINI_MODEL}`);

export default router;
