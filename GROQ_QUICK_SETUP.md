# 🚀 Quick Setup - Groq Integration

## Inicio Rápido en 3 Pasos

### 1️⃣ Obtén tu API Key de Groq (2 minutos)

```bash
# Accede a https://console.groq.com/keys
# O usa este enlace directo:
# https://console.groq.com/

# Crea una nueva clave de API (empieza con "gsk_")
```

### 2️⃣ Configura tu Proyecto

```bash
# Copia el archivo de configuración
cp .env.example .env

# Edita .env y añade tu clave
# GROQ_API_KEY=gsk_... (aquí va tu clave)

# O usa sed para hacerlo automático (Linux/Mac):
# sed -i 's/tu_api_key_de_groq_aqui/gsk_TU_CLAVE_AQUI/' .env
```

### 3️⃣ Inicia el Servidor

```bash
# Instala dependencias
npm install

# Inicia el servidor
npm start

# En desarrollo (con auto-reload):
npm run dev
```

## ✅ Verifica que Funciona

```bash
# Terminal 1: El servidor está corriendo en puerto 3000

# Terminal 2: Prueba la salud del sistema
curl http://localhost:3000/api/gemini/health

# Deberías ver algo como:
# {
#   "status": "HEALTHY",
#   "successRate": "100%",
#   ...
# }
```

## 📱 Accede a la App

```
http://localhost:3000
```

## 🔑 Variables de Entorno Necesarias

```env
GROQ_API_KEY=tu_clave_aqui
PORT=3000
HOST=localhost
```

## 🆘 Problemas Comunes

| Problema | Solución |
|----------|----------|
| `GROQ_API_KEY is not configured` | Verifica tu `.env` file |
| `401 Unauthorized` | Revisa tu clave en Groq Console |
| `429 Rate Limited` | Has excedido 30 requests/min |
| `Cannot find module 'groqCache'` | Verifica que `groqCache.js` está en `utils/` |

## 📚 Documentación Completa

- **Migración Detallada:** Ver `GROQ_MIGRACION.md`
- **Configuración Avanzada:** Ver `GROQ_CONFIG.md`
- **API Docs:** https://console.groq.com/docs

## ⚡ Ventajas de Groq

- 🚀 **2-3x más rápido** que otros LLMs
- 🆓 **Generoso plan gratuito** (30 req/min)
- 🤖 **Modelos de código abierto** (Mixtral, Llama2)
- 📊 **Monitoreo incluido**

## 🎯 Próximos Pasos

1. ✅ Configura tu API key
2. ✅ Inicia el servidor
3. ✅ Abre http://localhost:3000
4. ✅ Prueba hacer una pregunta
5. 📈 Monitorea en `/api/gemini/stats`

¡Listo para usar Groq! 🎉
