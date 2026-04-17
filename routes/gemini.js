import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Llamar a Google Gemini API
router.post('/', verifyToken, async (req, res) => {
  try {
    const { pregunta, materia, contexto } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey || geminiApiKey === 'tu_api_key_de_google_gemini_aqui') {
      return res.status(400).json({ 
        error: 'API key de Gemini no está configurada en el servidor. Contacta al administrador.' 
      });
    }

    if (!pregunta) {
      return res.status(400).json({ error: 'Pregunta no proporcionada' });
    }

    // Construir el prompt con contexto educativo
    const systemPrompt = `Eres un asistente educativo experto en el plan de estudios TECNM (Tecnológico Nacional de México) para Ingeniería en Sistemas.
${materia ? `El estudiante está estudiando la materia: ${materia}.` : ''}
Responde de manera clara, educativa y adecuada para estudiantes universitarios.
Incluye ejemplos prácticos cuando sea posible.
Si es una pregunta sobre código, proporciona ejemplos completos.
Mantén las respuestas concisas pero informativas.`;

    const userPrompt = `${contexto ? `Contexto: ${contexto}\n\n` : ''}Pregunta del estudiante: ${pregunta}`;

    // Llamar a Google Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: systemPrompt + '\n\n' + userPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      return res.status(response.status).json({
        error: error.error?.message || 'Error al contactar Gemini API'
      });
    }

    const data = await response.json();
    const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta disponible';

    res.json({ respuesta });
  } catch (error) {
    console.error('Error en Gemini:', error);
    res.status(500).json({ error: 'Error al procesar la pregunta con IA' });
  }
});

export default router;
