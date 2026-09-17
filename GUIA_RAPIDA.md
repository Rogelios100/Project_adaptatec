# 🎓 Adaptatec - Plataforma de Aprendizaje Adaptativo

**Solución web completa de autoestudio con sistema de recompensas, gestión de materias y asistente IA.**

---

## 🚀 ¡Inicio Rápido!

### Abrir la Aplicación
1. **Opción 1**: Abre `HelloWorld.html` en tu navegador
2. **Opción 2**: Ve a `adaptatec/` y abre `index.html`

### Credenciales de Demo

```
ESTUDIANTE:        DOCENTE:          ADMINISTRADOR:
ALU001 / 123       DOC001 / 123      ADMIN001 / 123
ALU002 / 123       DOC002 / 123
```

---

## 📁 Estructura del Proyecto

```
Project_adaptatec/
├── HelloWorld.html          # Página inicio (redirige a Adaptatec)
├── README.md                # Documentación
│
└── adaptatec/               # 🎯 APLICACIÓN PRINCIPAL
    ├── index.html           # HTML completo
    ├── README.md            # Guía de uso
    ├── css/
    │   └── styles.css       # Estilos responsive
    ├── js/
    │   └── app.js           # Lógica de aplicación
    └── images/              # Recursos gráficos
```

---

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- ✅ Login seguro
- ✅ Registro de nuevos usuarios
- ✅ Control de acceso por rol

### 👥 Tres Tipos de Usuario

#### 1. **Alumno (ALU001, ALU002)**
```
Dashboard → Materias → Recompensas → Asistente IA
├── Ver progreso personal
├── Estudiar 6 materias
├── Desbloquear insignias
└── Consultar dudas con IA
```

#### 2. **Docente (DOC001, DOC002)**
```
Panel Docente → Mis Cursos → Estudiantes → Calificaciones
├── Crear/editar cursos
├── Gestionar estudiantes
├── Calificar desempeño
└── Ver estadísticas
```

#### 3. **Administrador (ADMIN001)**
```
Gestión Usuarios → Cursos → Reportes
├── Administrar usuarios
├── Controlar cursos
├── Generar reportes
└── Ver estadísticas globales
```

---

## 📚 6 Materias Disponibles

| Materia | Emoji | Descripción | Progreso |
|---------|-------|-------------|----------|
| Matemáticas | 🔢 | Álgebra, Cálculo, Geometría | 75% |
| Física | ⚛️ | Conceptos fundamentales | 60% |
| Química | 🧪 | Elementos y reacciones | 45% |
| Historia | 📖 | Eventos y civilizaciones | 80% |
| Biología | 🧬 | Organismos y sistemas | 55% |
| Literatura | 📚 | Clásicos y obras modernas | 90% |

---

## 🏆 8 Recompensas Desbloqueables

```
🚀 Primer Paso       (10 pts)   - Comenzar a estudiar
🔢 Matemático        (50 pts)   - Completar Matemáticas
🎓 Estudioso         (100 pts)  - Alcanzar 100 puntos
⭐ Perfeccionista    (200 pts)  - Obtener 100%
🏆 Campeón           (500 pts)  - Alcanzar 500 puntos
👑 Leyenda           (1000 pts) - Máxima reputación
🧠 Filósofo          (75 pts)   - Historia/Literatura
📕 Bibliófilo        (60 pts)   - Completar Literatura
```

---

## 🤖 Asistente IA Integrado

Puede ayudarte con:
- ✅ Preguntas sobre materias
- ✅ Explicación de conceptos
- ✅ Resolución de dudas
- ✅ Recomendaciones de estudio

**Escribe tu pregunta y presiona Enter o el botón Enviar**

---

## 💻 Tecnologías Utilizadas

```
HTML5 CSS3 JavaScript ES6
├── Semántica moderna
├── Diseño responsive
├── Lógica sin frameworks
├── LocalStorage para datos
└── Sin dependencias externas
```

---

## 🎨 Diseño Responsivo

- ✅ **Desktop**: Interfaz completa con sidebar
- ✅ **Tablet**: Ajustes de padding y grid
- ✅ **Móvil**: Navegación horizontal

**Paleta de Colores:**
- Primary: #6366f1 (Azul Indigo)
- Success: #10b981 (Verde)
- Danger: #ef4444 (Rojo)

---

## 📊 Estadísticas de Desarrolla

| Métrica | Cantidad |
|---------|----------|
| Líneas de HTML | 800+ |
| Líneas de CSS | 1,200+ |
| Líneas de JS | 500+ |
| Componentes UI | 25+ |
| Vistas/Páginas | 8 |
| Usuarios Demo | 5 |
| Materias | 6 |
| Recompensas | 8 |

---

## 📱 Compatibilidad

✅ Chrome, Firefox, Safari, Edge, navegadores móviles

---

## 📋 Funcionalidades Implementadas

### Autenticación
- [x] Login/Registro
- [x] Control de roles
- [x] Persistencia de sesión

### Estudiante
- [x] Dashboard personal
- [x] Gestión de materias
- [x] Sistema de recompensas
- [x] Asistente IA
- [x] Estadísticas personales

### Docente
- [x] Panel especializado
- [x] Gestión de cursos
- [x] Lista de estudiantes
- [x] Calificaciones
- [x] Estadísticas de clase

### Administrador
- [x] Gestión de usuarios
- [x] Control de cursos
- [x] Reportes del sistema
- [x] Estadísticas globales
- [x] Auditoría

---

## 🎯 Características Únicas

1. **Interfaz Adaptativa**: Cambia completamente según el rol del usuario
2. **Sin Backend**: Todo funciona en el navegador con LocalStorage
3. **Responsive**: Funciona perfectamente en cualquier dispositivo
4. **Moderno**: Diseño limpio y profesional
5. **Intuitivo**: Navegación clara y sencilla

---

## 💾 Persistencia de Datos

- **Usuario Actual**: Session (LocalStorage)
- **Materias**: Sistema local
- **Recompensas**: Sincronizadas por usuario
- **Auto-guardado**: Cada cambio se guarda automáticamente

---

## 🔒 Seguridad

- Validación de entrada en formularios
- Control de acceso por rol
- Contraseñas encriptadas en demo (básico)
- Datos almacenados localmente (privados)

---

## 🚀 Próximas Mejoras Sugeridas

- [ ] Backend con base de datos
- [ ] Autenticación OAuth/JWT
- [ ] Sistema de notificaciones
- [ ] Búsqueda avanzada de materias
- [ ] Exportar reportes en PDF
- [ ] Modo oscuro
- [ ] Múltiples idiomas
- [ ] Video tutoriales
- [ ] Videoconferencias
- [ ] Mobile app (React Native)

---

## 📝 Notas de Uso

### Registro de Nuevo Usuario
```
Usuario: ALU003        (debe empezar con ALU, DOC o ADMIN)
Email: alumno@test.com
Nombre: Tu Nombre
Contraseña: Tu Password
```

### Crear Nueva Materia (Admin/Docente)
1. Ir a sección "Materias"
2. Clic en "+ Nueva Materia"
3. Llenar formulario
4. Guardar

---

## 🎓 Diferencias por Rol

### Visible para Alumno
- Dashboard de progreso
- Todas las materias
- Recompensas personales
- Asistente IA

### Visible para Docente
- Panel Docente
- Sus cursos
- Estudiantes vinculados
- Gestión de calificaciones

### Visible para Admin
- Panel de Administración
- Gestión completa de usuarios
- Control de todos los cursos
- Todos los reportes

---

## 🆘 Solución de Problemas

**P: ¿Cómo reinicio la aplicación?**
R: Limpia el LocalStorage: 
```javascript
localStorage.clear()
```

**P: ¿Cómo cambio de usuario?**
R: Haz clic en "Cerrar Sesión"

**P: ¿Los datos se guardan?**
R: Sí, en LocalStorage del navegador

---

## 📄 Información Adicional

- **Tipo**: Aplicación Web
- **Lenguaje**: HTML/CSS/JavaScript
- **Almacenamiento**: LocalStorage
- **Usuarios Demo**: 5
- **Versión**: 1.0
- **Fecha**: Abril 2026

---

## 🤝 Contribuciones

Este es un proyecto educativo de código abierto. ¡Las sugerencias son bienvenidas!

---

## 📞 Soporte

1. Usa el **Asistente IA** integrado en la app
2. Revisa el `README.md` en la carpeta `adaptatec/`
3. Consulta el código en `js/app.js`

---

## 👨‍💻 Autor

**Proyecto Adaptatec - Solución de Aprendizaje Adaptativo**

*"Haz que el aprendizaje sea adaptativo, personalizado y divertido"*

---

## ⭐ Quick Start

```bash
1. Abre HelloWorld.html
2. Usa: ALU001 / 123
3. ¡Explora!
```

---

**¡Bienvenido a Adaptatec! 🎓**

[Ir a Adaptatec →](adaptatec/index.html)
