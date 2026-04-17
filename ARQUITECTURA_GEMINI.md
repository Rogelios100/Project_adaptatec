# 🏗️ Arquitectura: Adaptatec + Gemini

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR DEL ALUMNO                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐                                        │
│  │  index.html      │  ◄─── UI del Chatbot                 │
│  │  ┌────────────┐  │                                        │
│  │  │  Chat 💬   │  │                                        │
│  │  │  (flotante)│  │                                        │
│  │  └────────────┘  │                                        │
│  └──────────────────┘                                        │
│           │                                                   │
│           │ (pregunta)                                       │
│           ↓                                                   │
│  ┌──────────────────┐                                        │
│  │  app.js          │ ◄─── Lógica del Chatbot              │
│  │  (async)         │                                        │
│  └──────────────────┘                                        │
│           │                                                   │
│           │ apiGeminiQuestion()                             │
│           ↓                                                   │
│  ┌──────────────────┐                                        │
│  │  api.js          │ ◄─── Cliente API                      │
│  │ (Maneja Token)   │                                        │
│  └──────────────────┘                                        │
│           │                                                   │
│           │ POST /api/gemini                                │
│           │ + JWT Token + API Key                           │
│           ↓                                                   │
└─────────────────────────────────────────────────────────────┘
                      🌐 HTTPS
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                  SERVIDOR NODE.JS                            │
│                  (Adaptatec Backend)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────┐                   │
│  │  server.js                           │                   │
│  │  express + cors + body-parser        │                   │
│  └──────────────────────────────────────┘                   │
│           │                                                   │
│           │ verifyToken (middleware/auth.js)               │
│           ↓                                                   │
│  ┌──────────────────────────────────────┐                   │
│  │  routes/gemini.js                    │                   │
│  │  POST /api/gemini                    │                   │
│  │  ├─ Valida JWT                       │                   │
│  │  ├─ Obtiene API key del header       │                   │
│  │  ├─ Construye prompt educativo       │                   │
│  │  └─ Llama Gemini API                 │                   │
│  └──────────────────────────────────────┘                   │
│           │                                                   │
│           │ fetch() a Gemini                                │
│           ↓                                                   │
└─────────────────────────────────────────────────────────────┘
                      HTTPS
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│            GOOGLE GEMINI API (Cloud)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  generativelanguage.googleapis.com                           │
│  /v1beta/models/gemini-pro:generateContent                  │
│                                                               │
│  ├─ Recibe prompt + pregunta                               │
│  ├─ Procesa con modelo gemini-pro                          │
│  ├─ Genera respuesta educativa                             │
│  └─ Devuelve JSON                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                      HTTPS (respuesta)
                        │
                        ↓
                   (vuelve al servidor)
                        │
                        ↓
                   (vuelve al navegador)
                        │
                        ↓
                 Aparece en el chat 💬
                        │
                        ↓
            ✅ Alumno ve la respuesta
```

---

## Componentes y Sus Roles

### 📱 Frontend (Navegador)

| Archivo | Función |
|---------|---------|
| **index.html** | UI del chatbot flotante |
| **app.js** | Lógica: enviar mensajes, manejar respuestas |
| **api.js** | Cliente HTTP: conecta con backend |

### 🖥️ Backend (Node.js)

| Archivo | Función |
|---------|---------|
| **server.js** | Servidor Express + rutas |
| **routes/gemini.js** | Endpoint `/api/gemini` |
| **middleware/auth.js** | Verifica JWT token |

### 🤖 Gemini API (Google Cloud)

| Componente | Función |
|-----------|---------|
| **gemini-pro** | Modelo de IA que responde preguntas |
| **API Key** | Autenticación (del usuario) |

---

## Flujo de Datos Paso a Paso

### 1. **Configuración Inicial**

```
┌─────────────────────────────────┐
│ Alumno abre Adaptatec           │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Click: "🤖 Configurar IA"       │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Alumno ingresa API Key          │
│ (desde Google AI Studio)         │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Se guarda en localStorage        │
│ (solo en el navegador)           │
└─────────────────────────────────┘
```

### 2. **Usar el Chatbot**

```
┌─────────────────────────────────┐
│ Alumno escribe pregunta          │
│ en el chat flotante              │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ app.js: enviarMensaje()          │
│ ├─ Muestra pregunta en chat      │
│ └─ Llama obtenerRespuestaGemini()│
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Mostrar: "⏳ Procesando..."      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ api.js: apiGeminiQuestion()      │
│ ├─ Obtiene API Key de localStorage│
│ ├─ Obtiene JWT Token             │
│ └─ POST /api/gemini              │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Backend: routes/gemini.js        │
│ ├─ Valida JWT                    │
│ ├─ Obtiene API Key del header    │
│ ├─ Construye prompt educativo    │
│ └─ fetch() a Gemini              │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Google Gemini API                │
│ ├─ Procesa pregunta              │
│ ├─ Genera respuesta educativa    │
│ └─ Devuelve JSON                 │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Backend devuelve respuesta       │
│ al frontend                      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ app.js muestra respuesta         │
│ en el chat                       │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ ✅ Alumno ve la respuesta        │
│    y puede hacer más preguntas   │
└─────────────────────────────────┘
```

---

## Seguridad en Capas

```
┌─────────────────┐
│  API Key Local  │
│  (localStorage) │  ◄─── Solo en navegador del usuario
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ HTTPS Encrypted             │  ◄─── Transmisión segura
│ (navegador → servidor)      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ JWT Token Validation        │  ◄─── Middleware /auth.js
│ (middleware)                │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ API Key en Header           │  ◄─── No se guarda en BD
│ (temporal)                  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ HTTPS a Google              │  ◄─── Conexión directa
│ (servidor → Gemini)         │
└────────┬────────────────────┘
         │
         ▼
✅ Respuesta segura de Gemini
```

---

## Casos de Fallo y Recuperación

```
┌─────────────────────────────────────┐
│     ¿Qué pasa si algo falla?        │
└─────────────────────────────────────┘
       │
       ├─── API Key inválida
       │    └─ Mostrar error
       │       └─ Intentar de nuevo
       │
       ├─── Sin conexión a internet
       │    └─ Usar respuestas locales
       │       └─ Fallback inteligente
       │
       ├─── Gemini API cae
       │    └─ Mostrar: "Intenta más tarde"
       │       └─ Fallback a respuestas locales
       │
       ├─── Límite de requests alcanzado
       │    └─ Mostrar: "Límite alcanzado"
       │       └─ Esperar 1 minuto
       │
       └─── Token JWT expirado
            └─ Usuario debe iniciar sesión nuevamente
```

---

## Almacenamiento de Datos

```
┌────────────────────────────────────┐
│         NAVEGADOR                  │
├────────────────────────────────────┤
│ localStorage                       │
│ ├─ adaptatec_token         ◄─── JWT
│ ├─ adaptatec_gemini_key    ◄─── API Key
│ └─ adaptatec_gemini_email  ◄─── Email
└────────────────────────────────────┘

┌────────────────────────────────────┐
│      SERVIDOR (NO guardamos)       │
├────────────────────────────────────┤
│ ✅ Base de datos SQLite            │
│   ├─ users (credenciales)          │
│   ├─ materias                      │
│   ├─ user_progress                 │
│   └─ activities                    │
│                                    │
│ ❌ NO guardamos:                   │
│   ├─ API keys de usuarios          │
│   ├─ Conversaciones Gemini         │
│   └─ Historial de chat             │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│     GOOGLE GEMINI (Cloud)          │
├────────────────────────────────────┤
│ Solo procesa                       │
│ No almacena conversaciones nuestras│
└────────────────────────────────────┘
```

---

## Estadísticas de Arquitectura

| Métrica | Valor |
|---------|-------|
| **Latencia esperada** | 1-3 segundos |
| **Tiempo max para respuesta** | 30 segundos (timeout) |
| **Usuarios concurrentes** | Ilimitados |
| **Peticiones / minuto** | 60 (límite Gemini) |
| **Almacenamiento cliente** | ~1-5 KB (API key + token) |
| **Conexiones activas** | WebSocket (futuro) |

---

## Próximas Mejoras en Arquitectura

🔄 **WebSockets** - Chat en tiempo real sin polling  
📊 **Caché de respuestas** - Guardar respuestas comunes localmente  
🔐 **End-to-End Encryption** - API key más protegida  
⚡ **CDN** - Servir estáticos desde CDN  
🗄️ **DB Cache** - Caché en servidor para Gemini  
🎯 **Load Balancing** - Múltiples servidores  

---

¡Arquitectura lista para producción! 🚀
