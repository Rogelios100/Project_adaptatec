# 🔄 Cambios Recientes - Adaptatec v2.1

## Fecha: 17 de Abril, 2026

Se ha realizado una actualización importante al sistema con cambios arquitectónicos significativos.

---

## ✨ Cambios Principales

### 1. **API Key de Gemini → Backend Seguro**

**Antes:**
- Los usuarios ingresaban su API Key de Gemini en la aplicación frontend
- La clave se guardaba en localStorage del navegador
- Se transmitía con cada solicitud

**Ahora:**
- La API Key se configura en el archivo `.env` del servidor
- Solo los administradores del servidor la configuran una sola vez
- Los usuarios **NO** necesitan ingresar API Key
- El chatbot IA funciona automáticamente sin configuración adicional
- **Más seguro**: La clave nunca sale del servidor

**Para Configurar:**
```bash
# Edita el archivo .env
GEMINI_API_KEY=tu_api_key_aqui
```

Obtén tu API Key gratuita en: https://aistudio.google.com/app/apikey

---

### 2. **Eliminación del Rol de Docente**

**Cambios:**
- ❌ Usuario de prueba `DOC001` eliminado
- ❌ Interfaz de docente removida completamente
- ❌ Rutas de docente desactivadas
- ✅ Sistema simplificado: Solo **Alumno** y **Admin**

**Usuarios Demo Actuales:**
- `ALU001` / `123` → Estudiante (acceso completo a materias)
- `ADMIN001` / `123` → Administrador (panel mejorado)

---

### 3. **Nuevo Panel de Administrador 🎨**

El panel de administrador fue completamente rediseñado con:

#### **Tab 1: Dashboard 📊**
- **Tarjetas de Métricas:**
  - Usuarios Registrados
  - Materias Disponibles
  - Horas Estudiadas
  - Solicitudes de IA

- **Estadísticas Recientes:**
  - Tasa de Completitud
  - Promedio de Sesión
  - Satisfacción de Usuarios

#### **Tab 2: Gestión de Usuarios 👥**
- Lista completa de usuarios del sistema
- Búsqueda y filtrado por rol
- Información detallada (email, nivel, puntos, fecha de registro)
- Botón para exportar datos
- Acciones de usuario (edit, delete, etc.)

#### **Tab 3: Gestión de Materias 📚**
- Grid visual de todas las materias disponibles
- Información de módulos y estudiantes por materia
- Opciones para editar o eliminar materias
- Botón para agregar nuevas materias

#### **Tab 4: Configuración del Sistema 🔧**
- **Información de Base de Datos**
  - Ruta: `./adaptatec.db`
  - Tipo: SQLite3
  - Opciones: Respaldar, Limpiar Cache

- **Integración de IA**
  - Estado de Gemini API
  - Modelo configurado
  - Prueba de conexión

- **Versión del Sistema**
  - Información de la aplicación
  - Última actualización
  - API Base

---

## 📋 Resumen de Cambios de Código

### Backend
| Archivo | Cambio |
|---------|--------|
| `.env` | ✨ Agregó `GEMINI_API_KEY` |
| `config/database.js` | 🗑️ Eliminó usuario DOC001 |
| `routes/gemini.js` | 🔄 Lee API Key de .env en lugar de headers |
| `server.js` | ✅ Funciona igual, solo cambios en Gemini route |

### Frontend
| Archivo | Cambio |
|---------|--------|
| `adaptatec/index.html` | 🗑️ Eliminó tab Gemini config, panel docente, mejoró admin |
| `adaptatec/js/api.js` | 🔄 Simplificó `apiGeminiQuestion()` |
| `adaptatec/js/app.js` | 🗑️ Eliminó 100+ líneas de código de docente |

---

## 🚀 Cómo Usar

### Acceso al Chatbot IA (Alumnos)

1. **Inicia sesión** como ALU001 / 123
2. **Selecciona una materia** (ej: Algoritmos)
3. **Haz clic en "💬 Pregunta a la IA"**
4. El chatbot usa automáticamente Gemini (sin configuración)
5. ¡Haz tus preguntas!

### Acceso al Panel Admin

1. **Inicia sesión** como ADMIN001 / 123
2. **Haz clic en "⚙️ Panel Admin"**
3. Tienes acceso a todos los tabs de administración

---

## ⚙️ Configuración Necesaria

**IMPORTANTE:** Debes configurar la API Key de Gemini para que el chatbot funcione:

```bash
# 1. Abre el archivo .env
# 2. Reemplaza esto:
GEMINI_API_KEY=tu_api_key_de_google_gemini_aqui

# Con tu API Key real de Google
GEMINI_API_KEY=AIzaSyD...tu_clave_aqui...
```

**Obtener API Key:**
1. Ve a https://aistudio.google.com/app/apikey
2. Haz clic en "Crear API Key"
3. Selecciona tu proyecto o crea uno nuevo
4. Copia la clave
5. Pégala en .env

---

## 🔐 Ventajas de Seguridad

✅ **API Key nunca en navegador**
✅ **No se transmite por HTTPS inseguro**
✅ **Solo administradores pueden cambiarla**
✅ **Protegida en variable de entorno**
✅ **Validada en servidor antes de usar**

---

## 📝 Notas Técnicas

- La arquitectura sigue siendo **Node.js + Express + SQLite**
- **JWT authentication** funciona igual
- **CORS** configurado para multi-dispositivo
- **Fallback local** si Gemini falla
- Compatible con **Gemini Pro** (modelo actual)

---

## ❓ Preguntas Frecuentes

### ¿Por qué se eliminó el rol de docente?

Para simplificar la arquitectura. Ahora el sistema tiene roles claros:
- **Alumno**: Acceso a materias y chatbot IA
- **Admin**: Control total del sistema

### ¿Los alumnos pueden cambiar la API Key?

No, es imposible. Solo existe en el servidor (.env).
Los alumnos solo disfrutan del chatbot, sin preocuparse de configuración.

### ¿Qué pasa si la API Key es inválida?

El sistema retorna un error claro:
```
"API key de Gemini no está configurada en el servidor. Contacta al administrador."
```

### ¿Se pierden datos del usuario DOC001?

No existe en la nueva versión. Si necesitas recuperar datos, verifica la base de datos anterior.

---

## 🔄 Próximos Pasos

1. ✅ Configurar `.env` con API Key válida
2. ✅ Reiniciar servidor: `npm start`
3. ✅ Probar login con ALU001/123
4. ✅ Explorar nuevo panel admin con ADMIN001/123
5. ✅ Usar chatbot IA en materias

---

## 📞 Soporte

Si encuentras problemas:
1. Verifica que `.env` tiene una API Key válida
2. Revisa la consola del servidor: `npm start`
3. Revisa la consola del navegador (F12)
4. Verifica que el servidor está corriendo en puerto 3000

---

**Versión:** 2.1
**Última actualización:** 17/04/2026
**Estado:** ✅ Probado y funcional
