# 🤖 Integración de Google Gemini en Adaptatec

## Configuración de Gemini API

### 📋 Requisitos

- Cuenta de Google (gratuita)
- Acceso a Google AI Studio (gratuito)

---

## 🚀 Pasos para Obtener y Configurar la API Key

### 1. Obtener la API Key

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Haz clic en **"Create API Key"** o **"Crear clave de API"**
3. Se creará automáticamente una nueva API key
4. Copia la clave (aparecerá un botón para copiar)

### 2. Guardar en Adaptatec

1. En la pantalla de login de Adaptatec, haz clic en la pestaña **"🤖 Configurar IA"**
2. Pega tu API key en el campo **"🔑 API Key de Google Gemini"**
3. (Opcional) Ingresa tu email para recordar luego
4. Haz clic en **"💾 Guardar Configuración"**
5. (Opcional) Haz clic en **"🧪 Probar Conexión"** para verificar que funciona

### 3. ¡Listo!

Una vez guardada, tu chatbot usará Gemini automáticamente cuando:
- Accedas a cualquier materia como alumno
- Hagas clic en el botón 💬 de una materia
- Escribas preguntas en el chat

---

## 💡 Características de Gemini en Adaptatec

✅ **Respuestas inteligentes** - Gemini responde preguntas complejas sobre materias
✅ **Contexto educativo** - Adaptado al plan TECNM
✅ **Respaldo local** - Si Gemini falla, usa respuestas básicas locales
✅ **Almacenamiento local** - Tu API key se guarda en el navegador (nunca se transmite a nuestros servidores)
✅ **Gratuito** - Google Gemini ofrece un plan gratuito generoso

---

## 🔒 Privacidad y Seguridad

- **Tu API key es privada**: Se almacena únicamente en tu navegador local
- **No almacenamos datos**: No guardamos tu API key en nuestros servidores
- **Conexión directa**: Tu navegador se conecta directamente con Google Gemini
- **Control total**: Puedes cambiar o eliminar tu API key en cualquier momento

---

## ⚠️ Límites y Consideraciones

### Plan Gratuito de Gemini

- **60 requests por minuto** - Suficiente para uso educativo
- **Ilimitado por mes** - No hay límite total de requests mensuales
- **Totalmente gratuito** - Sin tarjeta de crédito

Si necesitas más requests, puedes actualizar a un plan de pago en Google Cloud Console.

---

## 🎓 Casos de Uso

### Preguntas Soportadas

✅ Explicaciones de conceptos
✅ Ayuda con algoritmos y código
✅ Dudas sobre bases de datos
✅ Explicación de temas de IA
✅ Ayuda con arquitectura de software
✅ Dudas sobre seguridad informática

### Ejemplos

**Alumno:** "Explícame qué es una pila y cómo se usa"
**Gemini:** [Explicación detallada con ejemplos de código]

**Alumno:** "¿Cuál es la diferencia entre REST y SOAP?"
**Gemini:** [Comparativa completa]

**Alumno:** "Ayúdame a entender los JOINs en SQL"
**Gemini:** [Explicación con ejemplos de queries]

---

## 🐛 Solución de Problemas

### "Error: API key inválida"
- Verifica que la API key sea correcta
- Copia directamente desde Google AI Studio sin espacios
- Prueba la conexión con el botón 🧪

### "Error: límite de requests alcanzado"
- Espera 1 minuto y vuelve a intentar
- El límite es 60 requests por minuto
- Si necesitas más, considera un plan de pago

### "Gemini no responde"
- Verifica tu conexión a internet
- Recarga la página
- Intenta con otra pregunta más específica

### "¿Dónde se almacena mi API key?"
- Se almacena en el localStorage de tu navegador
- No se envía a nuestros servidores
- Si limpias el historial del navegador, se eliminará

---

## 📝 Cambiar o Eliminar API Key

1. Ve a la pestaña **"🤖 Configurar IA"**
2. Modifica el campo de API key
3. Haz clic en **"💾 Guardar Configuración"**

Para **eliminar**:
1. Abre las herramientas de desarrollo (F12)
2. Ve a Storage → Local Storage
3. Busca `adaptatec_gemini_key` y elimínala

---

## 🔗 Enlaces Útiles

- **Google AI Studio**: https://aistudio.google.com/
- **Documentación Gemini**: https://ai.google.dev/docs/gemini_api_overview
- **Precios y Límites**: https://ai.google.dev/pricing

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo usar otra IA además de Gemini?**
R: Actualmente solo soportamos Gemini. En futuras versiones se agregarán más opciones.

**P: ¿Mi API key es segura?**
R: Sí, se almacena localmente en tu navegador y nunca se comparte.

**P: ¿Hay costo adicional?**
R: No, es totalmente gratuito usando el plan de Google.

**P: ¿Puedo usar una API key compartida?**
R: No recomendamos esto por seguridad. Cada usuario debe tener su propia key.

**P: ¿Qué pasa si el servidor de Gemini cae?**
R: El chatbot usará respuestas fallback locales para no afectar la experiencia.

---

¡Disfruta de Gemini en Adaptatec! 🚀
