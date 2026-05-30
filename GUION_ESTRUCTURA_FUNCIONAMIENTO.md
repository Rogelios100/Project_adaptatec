# 📚 Guión de Estructura y Funcionamiento - Adaptatec v2.1

## 🎯 Índice General

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Componentes Frontend](#componentes-frontend)
4. [Componentes Backend](#componentes-backend)
5. [Flujo de Operación](#flujo-de-operación)
6. [Sistema de Autenticación](#sistema-de-autenticación)
7. [Base de Datos](#base-de-datos)
8. [Sistema de Respaldo (Gemini)](#sistema-de-respaldo-gemini)
9. [Roles de Usuario](#roles-de-usuario)
10. [Flujos de Casos de Uso](#flujos-de-casos-de-uso)

---

## 📖 Introducción

**Adaptatec** es una plataforma educativa inteligente basada en web que combina:
- 🎓 **Contenido Educativo**: 6 materias del plan TECNM (Ingeniería en Sistemas)
- 🤖 **Asistente IA**: Google Gemini integrado para respuestas personalizadas
- 📊 **Seguimiento de Progreso**: Sistema de badges, puntos y niveles
- 🔐 **Seguridad**: Autenticación JWT, contraseñas hasheadas con bcrypt
- 🚀 **Multi-dispositivo**: Conexión remota a través de Node.js

**Stack Tecnológico:**
```
Frontend:  HTML5 + CSS3 + JavaScript (ES6 Modules)
Backend:   Node.js + Express.js
Database:  SQLite3
Auth:      JWT Tokens + Bcrypt
AI:        Google Gemini API
```

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                      NAVEGADOR DEL USUARIO                      │
│                   (adaptatec/index.html + CSS + JS)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                 (HTTP REST API + WebSocket)
                           │
        ┌──────────────────▼──────────────────┐
        │       SERVIDOR NODE.JS + EXPRESS    │
        │     (puerto 0.0.0.0:3000)           │
        │                                     │
        │  ├─ Routes (Auth, Users, Materias) │
        │  ├─ Middleware (JWT, CORS)         │
        │  ├─ Retry Handler (reintentos)     │
        │  ├─ Cache (respuestas Gemini)      │
        │  ├─ Logger (eventos y errores)     │
        │  └─ Fallback (respuestas locales)  │
        │                                     │
        └──────────────────┬──────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
        ┌─────────┐   ┌──────────┐   ┌──────────┐
        │ SQLite  │   │ Gemini   │   │ File     │
        │ Database│   │ API      │   │ System   │
        │(*.db)   │   │          │   │(Cache,   │
        │         │   │          │   │Logs)     │
        └─────────┘   └──────────┘   └──────────┘
```

---

## 💻 Componentes Frontend

### **Estructura de Archivos Frontend**

```
adaptatec/
├── index.html           (Interfaz principal - 450+ líneas)
├── css/
│   └── styles.css       (Estilos responsivos)
└── js/
    ├── app.js           (Lógica principal - 650+ líneas)
    └── api.js           (Cliente HTTP - 165+ líneas)
```

### **Archivo: index.html**

**Responsabilidad:** Estructura visual de la aplicación

**Secciones Principales:**
1. **Pantalla de Autenticación**
   - Tab: Iniciar Sesión
   - Tab: Registrarse
   - Formularios con validación

2. **Panel Principal (Después de login)**
   - **Sidebar Navegación** (nav-buttons)
     - 📊 Dashboard
     - 📚 Materias
     - 🏆 Recompensas
     - 📈 Progreso
     - ⚙️ Panel Admin (solo admin)

   - **Main Content Area** (main-content)
     - Vista Dashboard
     - Vista Materias
     - Vista Módulos + Chatbot IA
     - Vista Recompensas
     - Vista Progreso
     - Vista Admin

3. **Chatbot IA Flotante**
   - Burbuja flotante (#chatFab)
   - Modal de chat (#chatModal)
   - Mensajes bidireccionales

### **Archivo: js/app.js**

**Responsabilidad:** Lógica principal de la aplicación (650+ líneas)

**Variables Globales:**
```javascript
currentUser           // Usuario autenticado actual
currentMateriaId      // Materia seleccionada
materiasGlobal        // Listado de materias
horasChart, califChart, materiasChart  // Instancias de gráficos
modulosPorMateria     // Definición de módulos por materia
```

**Funciones Principales:**

```javascript
// AUTENTICACIÓN
async handleLogin()         // Valida y autentica usuario
async handleRegister()      // Crea nueva cuenta
handleLogout()              // Cierra sesión

// RENDER VISTAS
renderDashboard()           // Estadísticas personales
renderMaterias()            // Listado de materias
renderProgreso()            // Gráficos de progreso
renderRecompensas()         // Badges y logros
renderAdminUsers()          // Gestión de usuarios (admin)

// NAVEGACIÓN
switchView(viewId)          // Cambia entre vistas
applyRoleVisibility()       // Muestra/oculta según rol

// IA Y CHAT
async obtenerRespuestaGemini()      // Llama API con reintentos
async enviarMensaje()               // Procesa mensaje del usuario
responderIA(pregunta)               // Fallback local

// GRÁFICOS
renderProgresoCharts()              // Inicializa gráficos con Chart.js

// EVENT LISTENERS
loginForm.addEventListener('submit')
registerForm.addEventListener('submit')
document.querySelectorAll('.nav-button').forEach()
document.querySelectorAll('.admin-tab-btn').forEach()
chatFab.addEventListener('click')
chatSendBtn.addEventListener('click')
```

**Flujo de Ejecución:**
```
1. DOMContentLoaded
   ↓
2. Cargar token de localStorage
   ↓
3. Si hay token → Mostrar app principal
   ↓
4. Si no hay token → Mostrar login
   ↓
5. Escuchar clicks y eventos
   ↓
6. Actualizar UI en tiempo real
```

### **Archivo: js/api.js**

**Responsabilidad:** Cliente HTTP para comunicar con backend (165+ líneas)

**Constantes:**
```javascript
API_BASE = 'http://localhost:3000/api'  (o IP remota)
```

**Funciones Exportadas:**

```javascript
// AUTENTICACIÓN
apiLogin(username, password)
apiRegister(username, email, name, password)

// USUARIOS
apiGetProfile()
apiUpdateProgress(materiaId, progress)
apiLogActivity(descripcion, tipo)

// MATERIAS
apiGetMaterias()
apiGetModulosByMateria(materiaId)

// IA - GEMINI
apiGeminiQuestion(pregunta, materia, contexto)
  → POST /api/gemini con JWT

// UTILIDADES
getAuthHeader()              // Retorna header con token JWT
```

**Patrón de Solicitud:**
```javascript
async function apiFunction(data) {
  try {
    const response = await fetch(`${API_BASE}/endpoint`, {
      method: 'POST/GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()  // Agrega Authorization: Bearer <token>
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

---

## 🔧 Componentes Backend

### **Estructura de Archivos Backend**

```
.
├── server.js                (Servidor Express principal)
├── .env                     (Variables de entorno)
├── .gitignore              (Archivos a ignorar)
├── package.json            (Dependencias)
├── config/
│   └── database.js          (Inicialización SQLite)
├── middleware/
│   └── auth.js              (Verificación JWT)
├── routes/
│   ├── auth.js              (Login/Register)
│   ├── users.js             (Perfil y progreso)
│   ├── materias.js          (Listado de materias)
│   └── gemini.js            (IA con reintentos)
├── utils/
│   ├── retryHandler.js      (Reintentos para API)
│   ├── geminiCache.js       (Caché de respuestas)
│   ├── geminiLogger.js      (Logs y estadísticas)
│   └── fallbackResponses.js (Respuestas locales)
├── cache/
│   └── gemini/
│       └── responses.json   (Caché persistente)
└── logs/
    └── gemini/
        ├── errors.json      (Registro de errores)
        └── stats.json       (Estadísticas)
```

### **Archivo: server.js (60 líneas)**

**Responsabilidad:** Punto de entrada del servidor

```javascript
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import materiasRoutes from './routes/materias.js';
import geminiRoutes from './routes/gemini.js';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('adaptatec'));

// Base de datos
initializeDatabase();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/gemini', geminiRoutes);

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor en http://${HOST}:${PORT}`);
});
```

### **Archivo: config/database.js (130+ líneas)**

**Responsabilidad:** Inicialización y gestión de SQLite

**Tablas Creadas:**

1. **users**
   - id, username, password (hashed), email, name, role, nivel, puntos, logros, etc.

2. **materias**
   - id, nombre, descripcion, icon

3. **user_progress**
   - userId, materiaId, progress%, modulosCompletados, horasEstudio

4. **activities**
   - id, userId, descripcion, tipo, timestamp

**Funciones:**
```javascript
initializeDatabase()    // Crea tablas e inserta datos de prueba
db.run(sql, params)     // Ejecuta query (INSERT, UPDATE, DELETE)
db.get(sql, params)     // Obtiene 1 resultado
db.all(sql, params)     // Obtiene múltiples resultados
```

### **Archivo: middleware/auth.js (20 líneas)**

**Responsabilidad:** Verificación de tokens JWT

```javascript
export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
```

### **Rutas Principales**

#### **routes/auth.js**
```
POST /api/auth/register
  → Crear usuario con bcrypt hashed password

POST /api/auth/login
  → Validar credenciales y retornar JWT token
```

#### **routes/users.js**
```
GET /api/users/profile
  → Obtener perfil del usuario autenticado

PUT /api/users/progress
  → Actualizar progreso en materia

POST /api/users/activity
  → Registrar actividad del usuario
```

#### **routes/materias.js**
```
GET /api/materias
  → Listado de todas las materias

GET /api/materias/:id/modules
  → Módulos específicos de una materia
```

#### **routes/gemini.js (NUEVO - Sistema de Respaldo)**
```
POST /api/gemini
  → Enviar pregunta con reintentos automáticos
  → Retorna respuesta Gemini O fallback

GET /api/gemini/stats
  → Estadísticas del sistema (requests, cache, etc)

GET /api/gemini/health
  → Estado del sistema (HEALTHY, DEGRADED, UNHEALTHY)
```

### **Utils - Sistema de Respaldo Profesional**

#### **utils/retryHandler.js**
- Reintentos automáticos (máx 3)
- Backoff exponencial: 1s → 2s → 4s
- Detección de errores reintentables (503, 502, 429, 500, 504)
- Jitter aleatorio

#### **utils/geminiCache.js**
- Caché en memoria + persistencia a disco
- TTL 30 días
- Máximo 500 respuestas
- Búsqueda por pregunta + materia

#### **utils/geminiLogger.js**
- Logs en: `logs/gemini/errors.json` y `stats.json`
- Estadísticas: requests, errores, cache hits, uptime
- Limpieza automática (30 días)

#### **utils/fallbackResponses.js**
- 7 respuestas educativas por materia
- Sugerencias de recursos
- Mensajes amigables al usuario

---

## 🔄 Flujo de Operación

### **Flujo 1: Autenticación (Login)**

```
1. Usuario escribe credenciales en login form
   ↓
2. Frontend valida campos no vacíos
   ↓
3. Frontend envia POST /api/auth/login
   {username, password}
   ↓
4. Backend valida contra BD
   - ¿Usuario existe?
   - ¿Contraseña correcta? (bcrypt.compare)
   ↓
5. ¿SÍ? Generar JWT token
   - payload: {userId, username, role}
   - expiry: 7 días
   ↓
6. Retornar token al frontend
   {token, user: {id, username, role, name}}
   ↓
7. Frontend guarda en localStorage
   localStorage.setItem('token', token)
   ↓
8. Mostrar app principal
   switchView('dashboard')
```

### **Flujo 2: Cargar Materias**

```
1. Usuario hace click en "📚 Materias"
   ↓
2. Frontend llama apiGetMaterias()
   ↓
3. GET /api/materias (sin parámetros)
   ↓
4. Backend query: SELECT * FROM materias
   ↓
5. Retornar array de materias con:
   {id, nombre, descripcion, icon}
   ↓
6. Frontend renderMaterias()
   - Mostrar grid de materias
   - Click en materia → switchView('modulos')
```

### **Flujo 3: Usar IA Chatbot (Con Reintentos)**

```
1. Usuario selecciona materia
2. Hace click en "💬 Pregunta a la IA"
   ↓
3. Se abre chat modal
   ↓
4. Usuario escribe pregunta y envía
   ↓
5. Frontend: enviarMensaje()
   - Mostrar spinner de carga
   - Llamar apiGeminiQuestion(pregunta, materia)
   ↓
6. Frontend POST /api/gemini
   {pregunta, materia, contexto}
   + Header: Authorization: Bearer <JWT>
   ↓
7. Backend: routes/gemini.js
   
   a) Validar JWT ✅
   
   b) Validar API key en .env ✅
   
   c) Buscar en caché
      ├─ HIT → Retornar respuesta cacheada
      └─ MISS → Continuar
      
   d) Construir prompt educativo
      systemPrompt + userPrompt
      
   e) retryHandler.execute()
      - Intento 1: callGeminiAPI()
        → Timeout/Error? Esperar 1s, reintentar
      - Intento 2: Mismo, esperar 2s
      - Intento 3: Mismo, esperar 4s
      
   f) ¿Éxito? 
      ├─ SÍ:
      │  - geminiCache.set(respuesta)
      │  - geminiLogger.logSuccess()
      │  - Retornar: {respuesta, source: 'gemini'}
      │
      └─ NO (Error 503/502/429/etc):
         - geminiLogger.logError()
         - ¿shouldUseFallback?
            ├─ SÍ:
            │  - fallback = getFallbackResponse(materia)
            │  - geminiLogger.logFallback()
            │  - Retornar: {respuesta: fallback, source: 'fallback', warning}
            │
            └─ NO:
               - Retornar error al frontend
   ↓
8. Frontend recibe respuesta
   - Agregar mensaje de bot al chat
   - Mostrar source (gemini/cache/fallback)
   - Quitar spinner
   ↓
9. Mostrar respuesta al usuario
```

### **Flujo 4: Ver Progreso (Gráficos)**

```
1. Usuario hace click en "📈 Progreso"
   ↓
2. Frontend llama apiGetProfile()
   ↓
3. GET /api/users/profile (con JWT)
   ↓
4. Backend retorna usuario con materias y progreso
   ↓
5. Frontend renderProgresoCharts()
   - Utiliza Chart.js
   - Gráfico 1: Progreso por materia (%)
   - Gráfico 2: Horas estudiadas
   - Gráfico 3: Puntos y logros
   ↓
6. Mostrar gráficos interactivos
```

---

## 🔐 Sistema de Autenticación

### **Flujo JWT (JSON Web Tokens)**

```
┌─────────────────────────────────────────────────────┐
│            AUTENTICACIÓN CON JWT                    │
└─────────────────────────────────────────────────────┘

1. LOGIN
   Cliente envía: {username, password}
   ↓
   Servidor valida con bcrypt
   ↓
   Genera JWT: Header.Payload.Signature
   
   Payload contiene:
   {
     userId: 1,
     username: "ALU001",
     role: "alumno",
     iat: 1713302400,
     exp: 1713907200  (7 días después)
   }
   ↓
   Cliente guarda en localStorage

2. SOLICITUDES SUBSECUENTES
   
   Cliente agrega a cada request:
   Authorization: Bearer <JWT_TOKEN>
   ↓
   
   Servidor verifica:
   - ¿Token existe?
   - ¿Firma válida?
   - ¿No expirado?
   ↓
   
   Si ✅: Ejecutar ruta
   Si ❌: Retornar 401 Unauthorized

3. TOKEN EXPIRADO
   
   Después de 7 días → Token inválido
   ↓
   Usuario debe hacer login nuevamente
```

### **Seguridad**

```
✅ Contraseñas hasheadas con bcrypt (salt rounds: 10)
✅ Tokens firmados con JWT_SECRET
✅ CORS con credenciales
✅ API Key de Gemini nunca en cliente
✅ Validación de entrada en servidor
```

---

## 💾 Base de Datos

### **Estructura de Tablas**

#### **Tabla: users**
```
┌─────────────────────────────────────────┐
│ users                                   │
├─────────────────────────────────────────┤
│ id (PK)          INTEGER                │
│ username (UNIQUE) TEXT                  │
│ password (hashed) TEXT                  │
│ email (UNIQUE)   TEXT                   │
│ name             TEXT                   │
│ role             TEXT (alumno, admin)   │
│ nivel            INTEGER (1-20)         │
│ puntos           INTEGER                │
│ logros           INTEGER                │
│ totalLogros      INTEGER                │
│ horas            INTEGER                │
│ createdAt        DATETIME               │
│ updatedAt        DATETIME               │
└─────────────────────────────────────────┘

Datos de Prueba:
- ALU001 / 123 → Alumno
- ADMIN001 / 123 → Administrador
```

#### **Tabla: materias**
```
┌─────────────────────────────────────────┐
│ materias                                │
├─────────────────────────────────────────┤
│ id (PK)          INTEGER                │
│ nombre           TEXT                   │
│ descripcion      TEXT                   │
│ icon             TEXT                   │
└─────────────────────────────────────────┘

6 Materias del Plan TECNM:
1. Algoritmos y Estructuras de Datos (12 módulos)
2. Desarrollo Web Avanzado (15 módulos)
3. Base de Datos (10 módulos)
4. Inteligencia Artificial (14 módulos)
5. Arquitectura de Software (11 módulos)
6. Seguridad Informática (13 módulos)
```

#### **Tabla: user_progress**
```
┌─────────────────────────────────────────┐
│ user_progress                           │
├─────────────────────────────────────────┤
│ id (PK)          INTEGER                │
│ userId (FK)      INTEGER                │
│ materiaId (FK)   INTEGER                │
│ progress         INTEGER (0-100 %)      │
│ modulosCompletados INTEGER              │
│ totalModulos     INTEGER                │
│ horasEstudio     INTEGER                │
│ lastAccessed     DATETIME               │
│ UNIQUE(userId, materiaId)               │
└─────────────────────────────────────────┘

Ejemplo:
- ALU001 en Algoritmos: 75% completado, 9/12 módulos, 24 horas
```

#### **Tabla: activities**
```
┌─────────────────────────────────────────┐
│ activities                              │
├─────────────────────────────────────────┤
│ id (PK)          INTEGER                │
│ userId (FK)      INTEGER                │
│ descripcion      TEXT                   │
│ tipo             TEXT (module, quiz, etc)│
│ createdAt        DATETIME               │
└─────────────────────────────────────────┘
```

---

## 🤖 Sistema de Respaldo Gemini

### **Componentes del Sistema de Respaldo**

```
┌──────────────────────────────────────┐
│   SOLICITUD DEL USUARIO              │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 1. VALIDACIÓN                        │
│    - ¿API key configurada?           │
│    - ¿Pregunta válida?               │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 2. BÚSQUEDA EN CACHÉ                 │
│    - ¿Pregunta anterior?             │
│    - geminiCache.get(pregunta)       │
└────────────┬─────────────────────────┘
             │
        ┌────┴────┐
        │          │
       HIT       MISS
        │          │
        │          ▼
        │  ┌──────────────────────────┐
        │  │ 3. REINTENTOS CON RETRY │
        │  │    retryHandler.execute()│
        │  │    - Intento 1: 1s wait  │
        │  │    - Intento 2: 2s wait  │
        │  │    - Intento 3: 4s wait  │
        │  └────────┬─────────────────┘
        │           │
        │      ┌────┴────┐
        │      │          │
        │    ÉXITO     ERROR
        │      │          │
        │      ▼          ▼
        │  ┌─────────┐  ┌──────────────┐
        │  │ Guardar │  │ ¿Fallback?   │
        │  │ caché   │  │ (503/502/429)│
        │  └────┬────┘  └────┬─────────┘
        │       │             │
        │       │         ┌───┴───┐
        │       │        SÍ      NO
        │       │         │       │
        │       │    ┌────▼────┐ │
        │       │    │Fallback │ │
        │       │    │Response │ │
        │       │    └────┬────┘ │
        │       │         │      │
        └───────┼─────────┼──────┤
                │         │      │
                ▼         ▼      ▼
            ┌────────────────────────┐
            │ REGISTRAR EN LOGS      │
            │ geminiLogger.log*()    │
            └────────┬───────────────┘
                     │
                     ▼
            ┌────────────────────────┐
            │ RESPONDER AL USUARIO   │
            │ {respuesta, source}    │
            └────────────────────────┘
```

### **Estados de Respuesta**

```
{
  "respuesta": "Texto de la respuesta...",
  "source": "gemini" | "cache" | "fallback",
  "statusCode": 200 | 503,
  "responseTime": 1234 (ms),
  "warning": "⚠️ Respuesta de respaldo..." (si aplica)
}
```

### **Estadísticas Disponibles**

```bash
GET /api/gemini/stats
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
      "502": 2
    }
  },
  "cache": {
    "size": 210,
    "maxSize": 500,
    "usage": 42
  }
}
```

---

## 👥 Roles de Usuario

### **Rol: Alumno (alumno)**

**Acceso:**
- ✅ Seleccionar materias
- ✅ Ver módulos de cada materia
- ✅ Usar chatbot IA
- ✅ Ver progreso personal
- ✅ Obtener recompensas/badges
- ❌ NO acceso a panel admin

**Pantallas:**
- Dashboard: Resumen personal
- Materias: Grid de materias disponibles
- Módulos: Contenido + Chatbot
- Progreso: Gráficos personales
- Recompensas: Badges y logros

### **Rol: Admin (admin)**

**Acceso:**
- ✅ Todo lo de Alumno
- ✅ Panel de administración completo
- ✅ Gestionar usuarios
- ✅ Gestionar materias
- ✅ Ver estadísticas del sistema
- ✅ Configurar Gemini API

**Pantallas Adicionales:**
- Panel Admin con 4 tabs:
  - 📊 Dashboard: Métricas del sistema
  - 👥 Usuarios: Gestión de cuentas
  - 📚 Materias: CRUD de materias
  - 🔧 Sistema: Configuración y logs

---

## 📋 Flujos de Casos de Uso

### **Caso de Uso 1: Estudiante Usa IA**

```
1. Login como ALU001 / 123
2. Ve Dashboard con progreso
3. Click en "Materias"
4. Selecciona "Algoritmos y Estructuras"
5. Click en módulo "Árboles Binarios"
6. Click en "💬 Pregunta a la IA"
7. Escribe: "¿Cómo recorrer un árbol en profundidad?"
8. El sistema:
   - Busca en caché (no encontrado)
   - Intenta Gemini API (3 reintentos)
   - Obtiene respuesta o fallback
   - Almacena en caché
   - Registra en logs
9. Ve respuesta en chat
10. Continúa preguntando
```

### **Caso de Uso 2: Error 503 del Servidor**

```
1. Estudiante hace pregunta
2. Gemini API retorna 503
3. Sistema automáticamente:
   - Registra error en logs
   - Reintenta (espera progresiva)
   - Después de 3 intentos, usa fallback
   - Envía respuesta educativa local
   - Notifica al usuario
4. Estudiante ve respuesta útil
5. Puede continuar usando la app
6. Admin ve error en /api/gemini/health
```

### **Caso de Uso 3: Admin Monitorea Sistema**

```
1. Login como ADMIN001 / 123
2. Click en "⚙️ Panel Admin"
3. Ve Dashboard:
   - Usuarios registrados: 42
   - Materias: 6
   - Horas estudiadas: 1,234
   - Solicitudes IA: 3,456
4. Abre tab "Estadísticas"
5. Verifica:
   - Success Rate: 96.5%
   - Errors en 24h: 12
   - Cache usage: 42%
   - Uptime: 12d 5h
6. Si hay problemas:
   - Actualiza API Key en .env
   - Revisa logs en logs/gemini/
   - Ejecuta: npm start
```

### **Caso de Uso 4: Pregunta Frecuente (Cache Hit)**

```
1. Estudiante A pregunta: "¿Qué es Big O?"
2. Sistema consulta Gemini (3s, guardado en caché)
3. Estudiante B (distinto usuario) pregunta lo mismo
4. Sistema encontró en caché
5. Respuesta instantánea (< 50ms)
6. Hit registrado en logs
7. Ahorro de:
   - Tiempo de respuesta
   - Recursos de API
   - Cuotas de Gemini
```

---

## 🎯 Resumen de Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   ADAPTEC v2.1                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  FRONTEND (HTML/CSS/JS - ES6 Modules)          │
│  ├─ index.html (UI responsivo)                 │
│  ├─ css/styles.css (diseño)                    │
│  ├─ js/app.js (lógica principal)               │
│  └─ js/api.js (cliente HTTP)                   │
│                                                 │
│  ↓ (HTTP REST + JWT Auth)                      │
│                                                 │
│  BACKEND (Node.js + Express)                   │
│  ├─ server.js (entrada)                        │
│  ├─ routes/ (5 endpoints)                      │
│  ├─ middleware/ (JWT verify)                   │
│  ├─ config/ (BD)                               │
│  └─ utils/ (reintentos, cache, logs)           │
│                                                 │
│  ↓ (SQL queries)                               │
│                                                 │
│  DATA LAYER                                    │
│  ├─ SQLite (adaptatec.db)                      │
│  ├─ Cache (cache/gemini/)                      │
│  └─ Logs (logs/gemini/)                        │
│                                                 │
│  ↓ (HTTPS)                                     │
│                                                 │
│  EXTERNAL SERVICES                             │
│  └─ Google Gemini API (con reintentos)         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📊 Tabla Comparativa: Estados de Respuesta

| Escenario | Status | Source | Tiempo | Registrado |
|-----------|--------|--------|--------|-----------|
| Gemini funciona normal | 200 | gemini | ~2-3s | ✅ Success |
| Pregunta en caché | 200 | cache | <100ms | ✅ CacheHit |
| Error 503 (fallback) | 200 | fallback | ~4s | ✅ Fallback |
| Error 503 (no recuperable) | 503 | error | ~4s | ✅ Error |
| API key inválida | 400 | error | <100ms | ✅ ConfigError |
| Token inválido | 401 | error | <100ms | ✅ AuthError |

---

## 🚀 Para Comenzar

### **1. Instalación**
```bash
npm install
```

### **2. Configuración (.env)**
```
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
JWT_SECRET=tu_secreto_jwt
DATABASE_PATH=./adaptatec.db
GEMINI_API_KEY=tu_api_key_de_google
```

### **3. Iniciar Servidor**
```bash
npm start
```

### **4. Acceder a la App**
```
Local: http://localhost:3000
Remota: http://<TU_IP>:3000
```

### **5. Credenciales de Prueba**
```
Alumno: ALU001 / 123
Admin: ADMIN001 / 123
```

---

**Versión:** 2.1
**Última Actualización:** 17/04/2026
**Estado:** ✅ Producción Listo
