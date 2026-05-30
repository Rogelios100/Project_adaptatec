# Guía de Migración de Gemini a Groq

## 🚀 ¿Qué es Groq?

Groq es una plataforma de IA ultra-rápida que proporciona inferencia de modelos de lenguaje abiertos. Es compatible con OpenAI y ofrece velocidades de procesamiento muy altas.

## 📋 Cambios Realizados

### 1. **Archivos Modificados**

- `routes/gemini.js` → Adaptado para usar Groq API
- `utils/geminiCache.js` → `utils/groqCache.js` (mismo funcionamiento)
- `utils/geminiLogger.js` → `utils/groqLogger.js` (mismo funcionamiento)

### 2. **Cambios en la API**

**Antes (Gemini):**
```javascript
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY}
// Formato: contents[], parts[], text
```

**Ahora (Groq):**
```javascript
https://api.groq.com/openai/v1/chat/completions
// Formato: messages[], role, content (Compatible con OpenAI)
```

### 3. **Modelos Disponibles en Groq**

- **mixtral-8x7b-32768** (Recomendado) - Muy rápido y versátil
- **llama2-70b-4096** - Más potente pero más lento

## 🔧 Configuración

### Paso 1: Obtener API Key

1. Accede a https://console.groq.com/
2. Regístrate o inicia sesión
3. Ve a "API Keys"
4. Crea una nueva clave de API
5. Copia tu clave

### Paso 2: Configurar Variables de Entorno

```bash
# Copia .env.example a .env
cp .env.example .env

# Edita .env y añade tu API key de Groq
GROQ_API_KEY=gsk_... (tu clave aquí)
```

### Paso 3: Instalar Dependencias

```bash
npm install
```

### Paso 4: Iniciar el Servidor

```bash
npm start
# o para desarrollo con watch
npm run dev
```

## 📊 Comparación: Gemini vs Groq

| Aspecto | Gemini | Groq |
|---------|--------|------|
| **Velocidad** | Moderada | Ultra-rápida ⚡ |
| **Costo** | Gratuito (limitado) | Gratuito (generoso) |
| **Formato API** | Propietario | OpenAI compatible |
| **Modelos** | Cerrados | Abiertos (Mixtral, Llama) |
| **Reintentos** | Soportados | Soportados |
| **Caché** | Sí | Sí |

## 🔍 Verificar Funcionamiento

### Endpoint de Salud

```bash
curl http://localhost:3000/api/gemini/health
```

Respuesta esperada:
```json
{
  "status": "HEALTHY",
  "successRate": "100%",
  "totalRequests": 0,
  "errors24h": 0,
  "cacheUsage": "0%",
  "uptime": "0s",
  "recentErrors": []
}
```

### Probar una Solicitud

```bash
curl -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pregunta": "¿Qué es programación?",
    "materia": "Programación Básica",
    "contexto": ""
  }'
```

## 📈 Características

- ✅ **Caché inteligente** - Almacena respuestas por 30 días
- ✅ **Reintentos automáticos** - Maneja errores temporales
- ✅ **Logging profesional** - Registra todos los eventos
- ✅ **Fallback automático** - Proporciona respuestas alternativas si la API falla
- ✅ **Estadísticas en tiempo real** - Monitorea el rendimiento

## ⚡ Límites de Groq (Plan Gratuito)

- **Requests por minuto:** 30
- **Requests por día:** Sin límite específico
- **Tokens por minuto:** 6000

## 🐛 Solución de Problemas

### Error: "API key no está configurada"

```bash
# Verifica que .env existe y tiene GROQ_API_KEY
cat .env | grep GROQ_API_KEY
```

### Error: "401 Unauthorized"

```bash
# Verifica que tu clave de API es correcta en Groq Console
# Recuerda que la clave debe comenzar con "gsk_"
```

### Error: "429 Rate Limited"

```bash
# Has superado el límite de requests
# Espera 1 minuto o mejora tu plan
```

## 📚 Recursos Útiles

- [Groq Console](https://console.groq.com/)
- [Groq API Docs](https://console.groq.com/docs)
- [Modelos disponibles](https://console.groq.com/docs/models)
- [OpenAI Compatible API](https://console.groq.com/docs/speech-text)

## 🔐 Seguridad

- ⚠️ NUNCA compartas tu `GROQ_API_KEY`
- ⚠️ Usa variables de entorno para secrets
- ⚠️ Mantén `.env` en `.gitignore`
- ⚠️ Rota tus claves regularmente

## ✨ Próximos Pasos

1. Monitorea las estadísticas en `/api/gemini/stats`
2. Revisa los logs en `logs/groq/`
3. Ajusta parámetros de temperatura si es necesario
4. Considera cambiar a modelos más avanzados si necesitas mejor calidad

---

**¡Listo!** Tu sistema ahora usa Groq en lugar de Gemini. 🎉
