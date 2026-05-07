# 🚀 Adaptatec - Guía de Instalación y Uso

## Transformación Node.js Completada ✅

Adaptatec ahora funciona con un servidor Node.js que permite conexiones desde múltiples dispositivos en la misma red local e incluso desde internet.

---

## 📋 Requisitos

- **Node.js** v16 o superior ([Descargar](https://nodejs.org/))
- **npm** (se instala con Node.js)
- Un navegador moderno (Chrome, Firefox, Safari, Edge)

---

## 🔧 Instalación

### 1. Descargar e instalar Node.js

Si no tienes Node.js instalado:
1. Visita https://nodejs.org/
2. Descarga la versión LTS (Long Term Support)
3. Instálalo normalmente

Verifica la instalación:
```bash
node --version
npm --version
```

### 2. Instalar dependencias del proyecto

En la carpeta raíz del proyecto (donde está package.json):

```bash
npm install
```

Esto descargará e instalará:
- Express (servidor web)
- SQLite (base de datos)
- JWT (autenticación)
- CORS (permitir conexiones remotas)
- Bcrypt (encriptación de contraseñas)

---

## 🎯 Uso

### Iniciar el servidor

En la terminal, desde la carpeta raíz:

```bash
npm start
```

O en modo desarrollo (reinicia automáticamente):
```bash
npm run dev
```

Deberías ver algo como:
```
╔════════════════════════════════════════╗
║       ADAPTATEC SERVER INICIADO        ║
╚════════════════════════════════════════╝

  🚀 Servidor: http://0.0.0.0:3000
  🌐 Para otros dispositivos: http://<tu-ip>:3000
  
  Acceso local: http://localhost:3000
  Acceso remoto: http://<IP-LOCAL>:3000
```

### Acceder a la aplicación

**Desde el mismo dispositivo:**
- http://localhost:3000

**Desde otro dispositivo en la red:**
1. Obtén tu IP local:
   - **Windows**: Abre PowerShell y escribe `ipconfig` (busca IPv4 Address)
   - **Mac/Linux**: Abre Terminal y escribe `ifconfig`
   - Ejemplo: `192.168.1.100`

2. Accede desde otro dispositivo a: `http://192.168.1.100:3000`

---

## 👤 Usuarios de Prueba

### Alumno
- **Usuario:** ALU001
- **Contraseña:** 123
- **Rol:** Estudiante con acceso a materias, progreso, recompensas

### Docente
- **Usuario:** DOC001
- **Contraseña:** 123
- **Rol:** Profesor con panel de gestión

### Administrador
- **Usuario:** ADMIN001
- **Contraseña:** 123
- **Rol:** Admin con acceso a panel administrativo

---

## 🗂️ Estructura del Proyecto

```
Project_adaptatec/
├── adaptatec/                 # Carpeta de la aplicación web
│   ├── index.html            # Página principal
│   ├── css/
│   │   └── styles.css        # Estilos
│   └── js/
│       ├── app.js            # Lógica de la aplicación
│       └── api.js            # Cliente API
├── config/
│   └── database.js           # Configuración de base de datos
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── users.js             # Rutas de usuarios
│   └── materias.js          # Rutas de materias
├── middleware/
│   └── auth.js              # Middleware de autenticación
├── server.js                # Servidor principal
├── package.json             # Dependencias
└── .env                     # Variables de entorno
```

---

## 🔌 API REST

### Autenticación

#### Registrarse
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "ALU002",
  "email": "nuevo@email.com",
  "password": "123",
  "name": "Juan Nuevo",
  "role": "alumno"
}
```

#### Iniciar sesión
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "ALU001",
  "password": "123"
}
```

### Usuarios

#### Obtener perfil
```bash
GET /api/users/profile
Authorization: Bearer <token>
```

#### Actualizar progreso
```bash
PUT /api/users/progress/:materiaId
Authorization: Bearer <token>
Content-Type: application/json

{
  "progress": 75,
  "modulosCompletados": 9,
  "horasEstudio": 24
}
```

### Materias

#### Obtener todas las materias
```bash
GET /api/materias
```

#### Obtener módulos de una materia
```bash
GET /api/materias/:materiaId/modules
```

---

## 💾 Base de Datos

La aplicación usa **SQLite** por defecto, que almacena los datos en `adaptatec.db`.

Los datos incluyen:
- ✅ Usuarios registrados
- ✅ Materias
- ✅ Progreso de estudiantes
- ✅ Actividades registradas

---

## ⚙️ Variables de Entorno

En `.env` puedes configurar:

```env
NODE_ENV=development        # development o production
PORT=3000                   # Puerto del servidor
HOST=0.0.0.0               # Host (0.0.0.0 = acepta conexiones remotas)
JWT_SECRET=tu_secreto      # Secreto para JWT
DATABASE_PATH=./adaptatec.db
```

---

## 🐛 Solución de Problemas

### Puerto 3000 ya está en uso
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

Luego mata el proceso o cambia el puerto en `.env`.

### No puedo conectarme desde otro dispositivo
- Verifica que estén en la misma red WiFi
- Comprueba tu IP local con `ipconfig`
- Asegúrate de que no hay firewall bloqueando el puerto 3000
- En Windows, puede ser necesario permitir el acceso en Firewall

### Base de datos corrupta
Elimina `adaptatec.db` y el servidor la recreará con datos de ejemplo.

---

## 📱 Características

✅ **Conexiones múltiples:** Varios usuarios pueden conectarse simultáneamente
✅ **Sincronización en tiempo real:** Los datos se guardan en el servidor
✅ **Autenticación JWT:** Segura y escalable
✅ **API REST:** Fácil de integrar con otros sistemas
✅ **Roles de usuario:** Alumno, Docente, Admin
✅ **Seguimiento de progreso:** Por estudiante y por materia
✅ **Base de datos persistente:** SQLite local

---

## 🚀 Próximos pasos

Para mejorar aún más:
- Integrar IA real (OpenAI, Gemini, Llama)
- Implementar WebSockets para notificaciones en tiempo real
- Crear aplicación móvil (React Native)
- Desplegar en la nube (Heroku, Render, AWS)
- Agregar más funcionalidades de gamificación

---

## 📞 Soporte

Para preguntas o problemas:
1. Revisa esta guía completa
2. Verifica los logs en la terminal del servidor
3. Abre la consola del navegador (F12) para ver errores

¡Bienvenido a Adaptatec! 🎓🤖
