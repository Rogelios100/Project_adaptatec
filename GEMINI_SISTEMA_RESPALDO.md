# 🛡️ Sistema Profesional de Respaldo - Gemini API

## Descripción General

Se ha implementado un sistema robusto y profesional que maneja gracefully errores de la API de Gemini, especialmente el error **503 (Service Unavailable)**, proporcionando experiencias confiables a los usuarios incluso cuando el servicio está degradado.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    SOLICITUD DE USUARIO                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   VALIDACIÓN DE CONFIG       │
        │   (API Key disponible?)      │
        └──────────────┬───────────────┘
                       │
                   ✅ SI / ❌ NO
                       │
        ┌──────────────▼───────────────┐
        │   BUSCAR EN CACHÉ            │
        │   (Pregunta anterior?)       │
        └──────────────┬───────────────┘
                       │
                   🎯 HIT / ❌ MISS
                       │
                       ▼
        ┌──────────────────────────────┐
        │  RETRY HANDLER (3 intentos)  │
        │  ├─ Intento 1: Espera 1s     │
        │  ├─ Intento 2: Espera 2s     │
        │  └─ Intento 3: Espera 4s     │
        └──────────────┬───────────────┘
                       │
                  ✅ ÉXITO / ❌ ERROR
                       │
        ┌──────────────▼───────────────┐
        │  ¿SHOULD USE FALLBACK?       │
        │  (503, 502, 429, 500, 504)   │
        └──────────────┬───────────────┘
                       │
                 ✅ SI / ❌ NO
                       │
        ┌──────────────▼───────────────┐
        │  FALLBACK INTELIGENTE        │
        │  (Respuesta educativa local) │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │      REGISTRAR EN LOGS       │
        │      (Estadísticas, errores) │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │    GUARDAR EN CACHÉ (éxito)  │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │    RESPONDER AL USUARIO      │
        └──────────────────────────────┘
```

---

## 📦 Componentes Principales

### 1. **Retry Handler** (`utils/retryHandler.js`)

**Propósito:** Reintentar automáticamente solicitudes fallidas con backoff exponencial

**Características:**
- ✅ Reintentos inteligentes (máx 3)
- ✅ Backoff exponencial con jitter
- ✅ Detección automática de errores reintentables (503, 502, 429, etc.)
- ✅ Timeouts progresivos

**Flujo de Reintentos:**
```
Intento 1: Fallar después de 1 segundo
Intento 2: Esperar 2 segundos + fallar
Intento 3: Esperar 4 segundos + fallar
→ Usar Fallback
```

**Ejemplo de Uso:**
```javascript
try {
  const result = await retryHandler.execute(
    () => callGeminiAPI(prompt, apiKey),
    'Gemini API Call'
  );
} catch (error) {
  // Manejar error después de reintentos agotados
}
```

---

### 2. **Gemini Cache** (`utils/geminiCache.js`)

**Propósito:** Almacenar respuestas exitosas para evitar llamadas redundantes

**Características:**
- 📦 Caché en memoria + persistencia a disco
- 🔄 TTL de 30 días (renovable)
- 📊 Máximo 500 respuestas
- 🧹 Limpieza automática de expirados
- 📈 Estadísticas de uso

**Estructura de Caché:**
```json
{
  "key": "base64_encoded_pregunta_materia",
  "pregunta": "¿Qué es...",
  "materia": "Algoritmos",
  "respuesta": "La respuesta completa de Gemini",
  "timestamp": 1713302400000
}
```

**Estadísticas:**
```
Size: 42/500 (8%)
Usage: 8%
Oldest Entry: 2026-03-20T14:30:00Z
TTL: 30 días
```

---

### 3. **Fallback Responses** (`utils/fallbackResponses.js`)

**Propósito:** Proporcionar respuestas educativas cuando Gemini no está disponible

**Características:**
- 📚 Respuestas específicas por materia
- 🎯 Sugerencias prácticas y recursos
- 🔄 Detección automática de materia
- 📖 7 tipos de respuestas educativas

**Materias Soportadas:**
1. **Algoritmos y Estructuras de Datos**
   - Conceptos clave, algoritmos, herramientas de aprendizaje
   
2. **Desarrollo Web**
   - HTML, CSS, JavaScript, Frameworks, herramientas
   
3. **Base de Datos**
   - SQL, modelado, optimización, NoSQL
   
4. **Inteligencia Artificial**
   - Búsqueda, ML, redes neuronales, NLP, visión computacional
   
5. **Arquitectura de Software**
   - Patrones, microservicios, principios SOLID
   
6. **Seguridad Informática**
   - Criptografía, autenticación, OWASP Top 10
   
7. **Respuesta Genérica**
   - Para materias no reconocidas

**Ejemplo de Respuesta Fallback:**
```
Lo siento, estoy experimentando dificultades técnicas...

**¿Qué puedes hacer?**
1. Intenta hacer tu pregunta de otra forma
2. Consulta el material de la materia
3. Intenta nuevamente en unos minutos

**Mientras esperas:**
- Revisa los apuntes de clase
- Consulta MDN Web Docs
- Investiga en GeeksforGeeks

⚠️ **Estado:** Error 503 - Reintentando automáticamente...
```

---

### 4. **Gemini Logger** (`utils/geminiLogger.js`)

**Propósito:** Registrar y monitorear todas las operaciones y errores

**Características:**
- 📋 Logs persistentes a disco
- 📊 Estadísticas en tiempo real
- 🔍 Reportes de errores
- 🧹 Limpieza automática (30 días)
- 📈 Uptime tracking

**Datos Registrados:**
```
✅ Solicitudes exitosas
❌ Errores por estado HTTP
📦 Hits en caché
🔄 Fallbacks usados
⏳ Reintentos
```

**Archivos de Log:**
```
logs/gemini/
├── errors.json      # Registro detallado de eventos
└── stats.json       # Estadísticas globales
```

**Ejemplo de Log:**
```json
{
  "timestamp": "2026-04-17T14:30:45.123Z",
  "type": "ERROR",
  "statusCode": 503,
  "message": "Service Unavailable",
  "attempts": 3,
  "pregunta": "¿Qué es un algoritmo?",
  "materia": "Algoritmos",
  "severity": "HIGH"
}
```

---

## 🔌 Manejo de Error 503

### ¿Qué Causa 503?

```
🔴 API Saturada
  → Demasiadas solicitudes simultáneas
  → Google reduce el throughput

🔴 Mantenimiento
  → Actualización de la API
  → Cambios en los modelos

🔴 Cuotas Excedidas
  → Límite de solicitudes por minuto
  → Límite de tokens por día
```

### Flujo Específico para 503

```
1️⃣ RECIBIR ERROR 503
   ↓
2️⃣ REGISTRAR EN LOGS (severity: HIGH)
   ↓
3️⃣ ¿INTENTOS RESTANTES?
   ├─ SÍ → Esperar y reintentar
   └─ NO → Siguiente paso
   ↓
4️⃣ USAR FALLBACK AUTOMÁTICO
   ├─ Respuesta educativa
   ├─ Registro del fallback
   └─ Notificación al usuario
   ↓
5️⃣ RESPONDER CON STATUS 200
   ├─ Respuesta válida (fallback)
   ├─ Información de fuente
   └─ Warning para usuario
```

### Ejemplo de Respuesta 503 con Fallback

```javascript
// Solicitud del usuario
POST /api/gemini
{
  "pregunta": "¿Qué es Big O Notation?",
  "materia": "Algoritmos"
}

// Respuesta (después de reintentos y fallback)
{
  "respuesta": "Lo siento, estoy experimentando...",
  "source": "fallback",
  "reason": "⚠️ El servicio recibe demasiadas solicitudes...",
  "statusCode": 503,
  "responseTime": 4250,
  "warning": "⚠️ Respuesta de respaldo mientras el servicio se recupera"
}
```

---

## 📊 Endpoints de Monitoreo

### 1. Health Check
```bash
GET /api/gemini/health

Respuesta:
{
  "status": "HEALTHY",
  "successRate": "96.5%",
  "totalRequests": 1234,
  "errors24h": 12,
  "cacheUsage": "42%",
  "uptime": "12d 5h",
  "recentErrors": [...]
}
```

### 2. Estadísticas Detalladas
```bash
GET /api/gemini/stats

Respuesta:
{
  "gemini": {
    "totalRequests": 1234,
    "successfulRequests": 1192,
    "failedRequests": 42,
    "cachedResponses": 856,
    "fallbackResponses": 12,
    "successRate": "96.5%",
    "errorCounts": {
      "503": 8,
      "502": 2,
      "429": 2
    }
  },
  "cache": {
    "size": 210,
    "maxSize": 500,
    "usage": 42,
    "oldestEntry": "2026-03-20T14:30:00Z"
  }
}
```

---

## 🚨 Escenarios de Manejo

| Escenario | Acción |
|-----------|--------|
| **API funciona normal** | ✅ Respuesta Gemini + caché |
| **Error 503 (1er intento)** | ⏳ Esperar 1s, reintentar |
| **Error 503 (2do intento)** | ⏳ Esperar 2s, reintentar |
| **Error 503 (3er intento)** | 🔄 Usar fallback + registrar |
| **Error 429 (rate limit)** | ⏳ Esperar con backoff exponencial |
| **Error 502/504** | ⏳ Reintentar como 503 |
| **Pregunta en caché** | 📦 Devolver desde caché |
| **Timeout de red** | ⏳ Reintentar automáticamente |

---

## 📈 Configuración

### Parámetros de Reintentos

```javascript
{
  maxRetries: 3,           // Máximo de intentos
  initialDelay: 1000,      // 1 segundo inicial
  maxDelay: 10000,         // Máximo 10 segundos
  backoffMultiplier: 2,    // Duplicar cada intento
  retryableStatusCodes: [429, 500, 502, 503, 504]
}
```

### Parámetros de Caché

```javascript
MAX_CACHE_SIZE = 500           // Máximo elementos
CACHE_TTL = 30 * 24 * 60 * 60  // 30 días
CACHE_DIR = './cache/gemini/'  // Ubicación
```

### Parámetros de Logs

```javascript
MAX_LOG_SIZE = 1000      // Máximo líneas por archivo
LOGS_DIR = './logs/gemini/'   // Ubicación
CLEANUP_INTERVAL = 3600000    // 1 hora
RETENTION_DAYS = 30      // Conservar 30 días
```

---

## 🔄 Mantenimiento Automático

El sistema realiza mantenimiento automático cada hora:

```javascript
// Cada 60 minutos:
1. Guardar estadísticas a disco
2. Limpiar entradas expiradas del caché
3. Limpiar logs antiguos (>30 días)
```

---

## 📝 Ejemplos de Uso

### Caso 1: Usuario Pregunta Durante Outage 503

```
1. Usuario: "¿Qué es un árbol AVL?"
2. Sistema: API 503 → Intento 1 de 3
3. Sistema: Esperar 1s → Intento 2 de 3
4. Sistema: Esperar 2s → Intento 3 de 3
5. Sistema: Fallback + Respuesta educativa
6. Usuario: Recibe respuesta útil en ~4 segundos
7. Logs: Evento registrado para análisis
```

### Caso 2: Pregunta Frecuente (Caché Hit)

```
1. Usuario: "¿Qué es una pila?" (pregunta común)
2. Sistema: Buscar en caché
3. Cache: ¡ENCONTRADO! (pregunta hecha 2 horas antes)
4. Usuario: Respuesta instantánea desde caché
5. Logs: Caché hit registrado
```

### Caso 3: Error No Reintentable

```
1. Usuario: Envía solicitud con API key inválida
2. Sistema: Error 400 (no reintentable)
3. Sistema: Respuesta de error inmediata
4. Usuario: Mensaje claro del problema
5. Logs: Error registrado con severity LOW
```

---

## 🎯 Beneficios

| Beneficio | Impacto |
|-----------|--------|
| **Reintentos automáticos** | ✅ 95%+ disponibilidad |
| **Caché inteligente** | ✅ 70% hit rate típico |
| **Fallback graceful** | ✅ Experiencia usuario consistente |
| **Logging completo** | ✅ Diagnóstico y mejora |
| **Monitoreo en tiempo real** | ✅ Visibilidad total del sistema |
| **Limpieza automática** | ✅ Bajo mantenimiento |

---

## 🔒 Seguridad

- ✅ API Key nunca en logs
- ✅ Caché seguro en disco con permisos
- ✅ Sin exposición de detalles internos
- ✅ Rate limiting respaldado
- ✅ Errores usuarios amigables

---

## 📞 Monitoreo y Alertas

### Métricas Clave

```
✅ Success Rate > 95% → HEALTHY
⚠️ Success Rate 70-95% → DEGRADED  
❌ Success Rate < 70% → UNHEALTHY
```

### Revisar Salud del Sistema

```bash
curl http://localhost:3000/api/gemini/health

# Ver si el sistema está:
# - HEALTHY: Todo bien
# - DEGRADED: Problemas pero funciona
# - UNHEALTHY: Problemas serios
```

---

**Versión:** 1.0
**Último Update:** 17/04/2026
**Status:** ✅ Producción Listo
