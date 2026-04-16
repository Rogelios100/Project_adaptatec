// ========== DATA MODEL ==========
let users = JSON.parse(localStorage.getItem('adaptatec_users')) || [
    {
        username: "ALU001",
        password: "123",
        email: "juan.perez@universidad.edu",
        name: "Juan David Pérez",
        role: "alumno",
        nivel: 12,
        puntos: 87,
        logros: 8,
        totalLogros: 24,
        horas: 23,
        materias: [
            { id: 1, name: "Algoritmos y Estructuras de Datos", progress: 75, modulosCompletados: 9, totalModulos: 12, horasEstudio: 24 },
            { id: 2, name: "Desarrollo Web Avanzado", progress: 60, modulosCompletados: 9, totalModulos: 15, horasEstudio: 30 },
            { id: 3, name: "Base de Datos", progress: 85, modulosCompletados: 8, totalModulos: 10, horasEstudio: 20 },
            { id: 4, name: "Inteligencia Artificial", progress: 40, modulosCompletados: 5, totalModulos: 14, horasEstudio: 28 },
            { id: 5, name: "Arquitectura de Software", progress: 55, modulosCompletados: 6, totalModulos: 11, horasEstudio: 22 },
            { id: 6, name: "Seguridad Informática", progress: 30, modulosCompletados: 4, totalModulos: 13, horasEstudio: 26 }
        ],
        recent: [
            "Completaste el módulo de Árboles Binarios - Hace 2 horas",
            "Desbloqueaste el logro 'Racha de 7 días' - Hace 5 horas",
            "Realizaste 15 preguntas a la IA - Hace 1 día",
            "Obtuviste 100% en el examen de SQL - Hace 2 días"
        ]
    },
    {
        username: "DOC001",
        password: "123",
        email: "doc@uni.edu",
        name: "Dr. Martínez",
        role: "docente",
        cursos: ["Matemáticas Avanzadas", "Física General"]
    },
    {
        username: "ADMIN001",
        password: "123",
        email: "admin@adaptatec.com",
        name: "Admin Global",
        role: "admin"
    }
];

let materiasGlobal = JSON.parse(localStorage.getItem('adaptatec_materias')) || [
    { id: 1, nombre: "Algoritmos", desc: "Fundamentos de programación", icon: "📘" },
    { id: 2, nombre: "Base de Datos", desc: "SQL y modelado", icon: "🗄️" },
    { id: 3, nombre: "Desarrollo Web", desc: "HTML, CSS, JavaScript", icon: "🌐" }
];

let currentUser = null;
let currentMateriaId = null;

// Chart instances
let horasChart, califChart, materiasChart;

// Módulos por materia (basados en plan TECNM)
const modulosPorMateria = {
    1: ["Introducción a Algoritmos", "Estructuras de Datos Lineales", "Pilas y Colas", "Árboles Binarios", "Árboles AVL", "Grafos", "Algoritmos de Ordenamiento", "Algoritmos de Búsqueda", "Complejidad Computacional", "Recursividad", "Backtracking", "Programación Dinámica"],
    2: ["HTML5 Semántico", "CSS3 Avanzado", "Flexbox y Grid", "JavaScript Básico", "DOM Manipulación", "Eventos", "Fetch API", "React Introducción", "Componentes", "Estado y Props", "Hooks", "Routing", "Despliegue", "Optimización", "Pruebas Unitarias"],
    3: ["Modelado Entidad-Relación", "SQL Básico", "Consultas Avanzadas", "JOINs", "Subconsultas", "Índices", "Procedimientos Almacenados", "Triggers", "NoSQL", "MongoDB"],
    4: ["Introducción a IA", "Búsqueda no informada", "Búsqueda informada", "Juegos y Minimax", "Aprendizaje Automático", "Regresión Lineal", "Clasificación", "Redes Neuronales", "Deep Learning", "NLP", "Visión Computacional", "Ética en IA", "Agentes Inteligentes", "Sistemas Expertos"],
    5: ["Patrones de Diseño", "Arquitectura MVC", "Microservicios", "SOA", "Arquitectura Hexagonal", "DDD", "Event-Driven", "Serverless", "Monitoreo", "Escalabilidad", "Seguridad en Arquitectura"],
    6: ["Criptografía Básica", "Autenticación", "Autorización", "OWASP Top 10", "Inyección SQL", "XSS", "CSRF", "Seguridad en Redes", "Firewalls", "Auditoría", "Respuesta a Incidentes", "Normativas", "Seguridad en la Nube"]
};

// ========== UTILITIES ==========
function saveUsers() {
    localStorage.setItem('adaptatec_users', JSON.stringify(users));
}

function saveMaterias() {
    localStorage.setItem('adaptatec_materias', JSON.stringify(materiasGlobal));
}

function calcularEstadisticasGenerales() {
    if (!currentUser || currentUser.role !== 'alumno') return;
    const materias = currentUser.materias || [];
    const totalModulos = materias.reduce((sum, m) => sum + (m.modulosCompletados || 0), 0);
    const totalHoras = materias.reduce((sum, m) => sum + (m.horasEstudio || 0), 0);
    const progresoPromedio = materias.length ? Math.round(materias.reduce((sum, m) => sum + (m.progress || 0), 0) / materias.length) : 0;
    
    const totalModulosEl = document.getElementById('totalModulosCompletados');
    const totalHorasEl = document.getElementById('totalHorasEstudio');
    const progresoPromedioEl = document.getElementById('progresoPromedio');
    
    if (totalModulosEl) totalModulosEl.innerText = totalModulos;
    if (totalHorasEl) totalHorasEl.innerText = totalHoras;
    if (progresoPromedioEl) progresoPromedioEl.innerText = progresoPromedio;
}

function abrirModulosMateria(materiaId, abrirChat = false) {
    const materia = currentUser.materias.find(m => m.id === materiaId);
    if (!materia) return;
    
    currentMateriaId = materiaId;
    const modulos = modulosPorMateria[materiaId] || [`Módulo 1`, `Módulo 2`, `Módulo 3`];
    const completados = materia.modulosCompletados || 0;
    
    const titleEl = document.getElementById('modulosMateriaTitle');
    const descEl = document.getElementById('modulosMateriaDesc');
    if (titleEl) titleEl.innerText = materia.name;
    if (descEl) descEl.innerHTML = `Progreso: ${materia.progress}% completado`;
    
    const container = document.getElementById('modulosGrid');
    if (container) {
        container.innerHTML = modulos.map((modulo, index) => {
            const estaCompletado = index < completados;
            return `
                <div class="modulo-card ${estaCompletado ? 'completado' : ''}">
                    <div class="modulo-info">
                        <h4>📖 ${modulo}</h4>
                        <p>${estaCompletado ? '✅ Completado' : '📌 Por comenzar'}</p>
                    </div>
                    <div class="modulo-status">${estaCompletado ? '✔️' : '🔘'}</div>
                </div>
            `;
        }).join('');
    }
    
    // Cambiar a la vista de módulos
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const modulosView = document.getElementById('modulosView');
    if (modulosView) modulosView.classList.add('active');
    
    // Mostrar la burbuja IA
    const chatFab = document.getElementById('chatFab');
    if (chatFab) chatFab.classList.add('visible');
    
    // Si se solicitó abrir el chat automáticamente
    if (abrirChat) {
        setTimeout(() => {
            abrirChatConContexto(materia.name);
        }, 300);
    }
}

function abrirChatConContexto(materiaName) {
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        chatModal.classList.add('open');
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML += `
                <div class="message bot">📚 Te ayudo con la materia <strong>${materiaName}</strong>. ¿Qué te gustaría saber sobre sus temas, ejercicios o conceptos?</div>
            `;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
}

function responderIA(pregunta) {
    const p = pregunta.toLowerCase();
    if (p.includes("algoritmo") || p.includes("estructura")) {
        return "Los algoritmos son secuencias de pasos para resolver problemas. Las estructuras de datos como pilas, colas, árboles y grafos son fundamentales en Ingeniería en Sistemas. ¿Te gustaría profundizar en alguna en particular?";
    }
    if (p.includes("web") || p.includes("html") || p.includes("css")) {
        return "El desarrollo web abarca frontend (HTML, CSS, JS) y backend. En el TECNM aprendemos frameworks como React y Node.js. ¿Necesitas ayuda con algún tema específico?";
    }
    if (p.includes("base de datos") || p.includes("sql")) {
        return "Las bases de datos relacionales usan SQL. Los temas clave son: consultas, JOINs, índices, procedimientos almacenados y normalización. También cubrimos NoSQL como MongoDB.";
    }
    if (p.includes("ia") || p.includes("inteligencia artificial")) {
        return "La IA incluye búsqueda, aprendizaje automático, redes neuronales y procesamiento de lenguaje natural. En el plan TECNM se ven desde búsqueda no informada hasta deep learning.";
    }
    if (p.includes("arquitectura") || p.includes("patrón")) {
        return "La arquitectura de software cubre patrones de diseño, MVC, microservicios y sistemas escalables. ¿Te interesa algún patrón en particular?";
    }
    if (p.includes("seguridad") || p.includes("criptografía")) {
        return "Seguridad informática incluye criptografía, autenticación, OWASP, inyección SQL, XSS y buenas prácticas. ¿En qué área necesitas apoyo?";
    }
    return "Puedo ayudarte con temas de algoritmos, desarrollo web, bases de datos, IA, arquitectura de software y seguridad informática según el plan de estudios del TECNM. ¿Qué te gustaría aprender?";
}

// ========== RENDER FUNCTIONS ==========
function renderDashboard() {
    if (!currentUser) return;

    const isStudent = currentUser.role === 'alumno';
    const isTeacher = currentUser.role === 'docente';
    const isAdmin = currentUser.role === 'admin';

    document.querySelectorAll('.student-profile-view, .student-section').forEach(el => {
        el.style.display = isStudent ? 'block' : 'none';
    });
    document.querySelector('.teacher-section').style.display = isTeacher ? 'block' : 'none';
    document.querySelector('.admin-section').style.display = isAdmin ? 'block' : 'none';

    if (isStudent) {
        document.getElementById('profileFullName').innerText = currentUser.name || "Estudiante";
        document.getElementById('profileCareer').innerHTML = "Estudiante de Ingeniería en Sistemas";
        document.getElementById('profileLevel').innerHTML = `Nivel ${currentUser.nivel || 5} - Aprendiz Avanzado`;
        const avatarText = (currentUser.name || "JD").split(' ').map(n => n[0]).join('').slice(0, 2);
        document.getElementById('profileAvatar').innerText = avatarText;

        const infoHtml = `
            <div class="info-row"><span class="info-label">📧 Email:</span> ${currentUser.email || ''}</div>
            <div class="info-row"><span class="info-label">📅 Ingreso:</span> Marzo 2024</div>
            <div class="info-row"><span class="info-label">📍 Ubicación:</span> Ciudad de México, México</div>
            <div class="info-row"><span class="info-label">🆔 Matrícula:</span> 2024-IS-0012</div>
        `;
        document.getElementById('personalInfoGrid').innerHTML = infoHtml;

        const obtenidos = currentUser.logros || 8;
        const total = currentUser.totalLogros || 24;
        document.getElementById('logrosObtenidos').innerHTML = `🏅 ${obtenidos}/${total} Obtenidos`;
        document.getElementById('puntosDisplay').innerHTML = `⭐ ${currentUser.puntos || 87} Puntos Acumulados`;
        const porcentaje = (obtenidos / total) * 100;
        document.getElementById('logrosProgressFill').style.width = `${porcentaje}%`;
        document.getElementById('logrosProgressText').innerHTML = `${Math.round(porcentaje)}% de logros desbloqueados`;

        let materiasHtml = '';
        if (currentUser.materias && currentUser.materias.length > 0) {
            currentUser.materias.forEach(m => {
                materiasHtml += `
                    <p><strong>${m.name}</strong> ${m.progress}%</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${m.progress}%;"></div>
                    </div>
                `;
            });
        } else {
            materiasHtml = "<p>No hay materias inscritas</p>";
        }
        document.getElementById('materiasProgresoList').innerHTML = materiasHtml;

        const acts = currentUser.recent || [
            "Completa el módulo 'Introducción a Algoritmos'",
            "Obtuviste la recompensa 'Primer Paso'",
            "Mejoraste tu puntaje en Matemáticas a 92%"
        ];
        document.getElementById('recentActivitiesList').innerHTML = acts.map(a => `<li>${a}</li>`).join('');
    }

    if (isTeacher) {
        const teacherCoursesHtml = (currentUser.cursos || []).map(c => `
            <div class="course-item">
                <strong>${c}</strong>
                <p>45 estudiantes | 12 módulos</p>
            </div>
        `).join('');
        document.getElementById('teacherCourses').innerHTML = teacherCoursesHtml || "<p>No hay cursos asignados</p>";
    }
}

function renderMaterias() {
    const container = document.getElementById('materiasGrid');
    if (!container || currentUser?.role !== 'alumno') return;
    
    // Ocultar burbuja IA cuando estamos en la vista de materias
    const chatFab = document.getElementById('chatFab');
    if (chatFab) chatFab.classList.remove('visible');
    
    // Cerrar chat si estaba abierto
    const chatModal = document.getElementById('chatModal');
    if (chatModal) chatModal.classList.remove('open');
    
    // Colores de fondo para cada tarjeta
    const coloresCard = ['#eff6ff', '#f0fdf4', '#fff7ed', '#faf5ff', '#fff1f2', '#ecfeff'];
    
    container.innerHTML = currentUser.materias.map((m, idx) => `
        <div class="materia-card" data-materia-id="${m.id}" style="background: ${coloresCard[idx % coloresCard.length]};">
            <div class="materia-header">
                <h3>${m.name}</h3>
                <span class="materia-icon">📘</span>
            </div>
            <div class="materia-stats">
                <span>📋 ${m.modulosCompletados}/${m.totalModulos} módulos</span>
                <span>⏱️ ${m.horasEstudio}h</span>
            </div>
            <div class="progress-section">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${m.progress}%; background: #3b82f6;"></div>
                </div>
                <div class="progress-text">${m.progress}% completado</div>
            </div>
            <button class="btn-ia-materia" data-materia-id="${m.id}" data-materia-name="${m.name}">
                💬 Pregunta a la IA sobre esta materia
            </button>
        </div>
    `).join('');
    
    document.querySelectorAll('.materia-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-ia-materia')) return;
            const id = parseInt(card.dataset.materiaId);
            abrirModulosMateria(id, false);
        });
    });
    
    document.querySelectorAll('.btn-ia-materia').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const materiaId = parseInt(btn.dataset.materiaId);
            abrirModulosMateria(materiaId, true);
        });
    });
    
    calcularEstadisticasGenerales();
}

function renderRecompensas() {
    const unlockedDiv = document.getElementById('unlockedRewards');
    const availableDiv = document.getElementById('availableRewards');

    if (currentUser.role === 'alumno') {
        unlockedDiv.innerHTML = `
            <span class="reward-item">🏅 Primer Paso</span>
            <span class="reward-item">⚡ Racha de 7 días</span>
            <span class="reward-item">💯 SQL Master</span>
            <span class="reward-item">📚 Lector Ávido</span>
        `;
        availableDiv.innerHTML = `
            <span class="reward-item">🔓 100 puntos (20 pts)</span>
            <span class="reward-item">🔓 Experto en algoritmos</span>
            <span class="reward-item">🔓 Maestro del DOM</span>
        `;
        document.getElementById('totalPoints').innerText = currentUser.puntos || 87;
        document.getElementById('currentLevel').innerText = currentUser.nivel || 5;
        document.getElementById('totalRewards').innerText = currentUser.logros || 8;
    } else {
        unlockedDiv.innerHTML = '<p>Las recompensas están disponibles solo para estudiantes</p>';
        availableDiv.innerHTML = '';
        document.getElementById('totalPoints').innerText = '-';
        document.getElementById('currentLevel').innerText = '-';
        document.getElementById('totalRewards').innerText = '-';
    }
}

function renderProgresoCharts() {
    if (horasChart) horasChart.destroy();
    if (califChart) califChart.destroy();
    if (materiasChart) materiasChart.destroy();

    const ctxHoras = document.getElementById('horasChart')?.getContext('2d');
    const ctxCalif = document.getElementById('calificacionesChart')?.getContext('2d');
    const ctxMaterias = document.getElementById('materiasChart')?.getContext('2d');

    if (ctxHoras) {
        horasChart = new Chart(ctxHoras, {
            type: 'bar',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Horas Estudiadas',
                    data: [3, 2.5, 4, 3.2, 2.8, 1.5, 0.5],
                    backgroundColor: '#3b82f6',
                    borderRadius: 8
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }

    if (ctxCalif) {
        califChart = new Chart(ctxCalif, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
                datasets: [{
                    label: 'Calificaciones',
                    data: [78, 82, 88, 92, 95],
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249,115,22,0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: { responsive: true }
        });
    }

    if (ctxMaterias) {
        materiasChart = new Chart(ctxMaterias, {
            type: 'doughnut',
            data: {
                labels: ['Algoritmos', 'Web Avanzado', 'Base de Datos'],
                datasets: [{
                    data: [75, 60, 85],
                    backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true }
        });
    }

    if (currentUser?.role === 'alumno') {
        document.getElementById('horasSemana').innerText = '17.3h';
        document.getElementById('promedioGlobal').innerText = '90%';
        document.getElementById('modulosCompletados').innerText = '47';
        document.getElementById('nivelUsuario').innerText = currentUser.nivel || 12;
    }
}

function renderAdminUsers() {
    const tbody = document.getElementById('usuariosTableBody');
    if (tbody) {
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.username}</td>
                <td>${u.email || '-'}</td>
                <td>${u.role}</td>
                <td>
                    <button class="btn-small delete-user" data-user="${u.username}" ${u.username === currentUser?.username ? 'disabled' : ''}>
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = btn.getAttribute('data-user');
                if (username !== currentUser?.username && confirm('¿Eliminar este usuario?')) {
                    users = users.filter(u => u.username !== username);
                    saveUsers();
                    renderAdminUsers();
                } else if (username === currentUser?.username) {
                    alert('No puedes eliminarte a ti mismo');
                }
            });
        });
    }
}

function renderTeacherPanel() {
    const coursesContainer = document.getElementById('teacherCoursesList');
    if (coursesContainer && currentUser?.role === 'docente') {
        coursesContainer.innerHTML = (currentUser.cursos || []).map(c => `
            <div class="course-card">
                <h4>${c}</h4>
                <p>45 estudiantes | 12 módulos</p>
                <div class="course-actions">
                    <button class="btn btn-small">Ver Detalles</button>
                    <button class="btn btn-small">Editar</button>
                </div>
            </div>
        `).join('');
    }
}

function applyRoleVisibility() {
    const isAdmin = currentUser?.role === 'admin';
    const isDocente = currentUser?.role === 'docente';

    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
    });
    document.querySelectorAll('.docente-only').forEach(el => {
        el.style.display = isDocente ? 'flex' : 'none';
    });

    if (isAdmin) renderAdminUsers();
    if (isDocente) renderTeacherPanel();
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(viewId + 'View');
    if (targetView) targetView.classList.add('active');

    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-button[data-view="${viewId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Ocultar burbuja IA y cerrar chat SI NO estamos en la vista de módulos
    const chatFab = document.getElementById('chatFab');
    const chatModal = document.getElementById('chatModal');
    
    if (viewId !== 'modulos') {
        if (chatFab) chatFab.classList.remove('visible');
        if (chatModal) chatModal.classList.remove('open');
    } else {
        if (chatFab) chatFab.classList.add('visible');
    }

    if (viewId === 'dashboard') renderDashboard();
    if (viewId === 'materias') renderMaterias();
    if (viewId === 'recompensas') renderRecompensas();
    if (viewId === 'progreso') setTimeout(renderProgresoCharts, 100);
    if (viewId === 'admin-panel' && currentUser?.role === 'admin') renderAdminUsers();
    if (viewId === 'docente-panel' && currentUser?.role === 'docente') renderTeacherPanel();
}

// ========== EVENT LISTENERS & AUTH ==========
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const found = users.find(u => u.username === username && u.password === password);

    if (found) {
        currentUser = found;
        document.getElementById('userNameDisplay').innerText = found.name || found.username;
        document.getElementById('userRoleDisplay').innerText = found.role.toUpperCase();
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('appContainer').classList.add('active');
        applyRoleVisibility();
        switchView('materias');
    } else {
        alert('Credenciales inválidas. Prueba con ALU001/123, DOC001/123 o ADMIN001/123');
    }
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newUser = {
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value,
        email: document.getElementById('regEmail').value,
        name: document.getElementById('regName').value,
        role: 'alumno',
        puntos: 0,
        nivel: 1,
        logros: 0,
        totalLogros: 24,
        materias: [],
        recent: []
    };

    if (users.find(u => u.username === newUser.username)) {
        alert('El usuario ya existe');
        return;
    }

    users.push(newUser);
    saveUsers();
    alert('Registro exitoso. Ahora inicia sesión.');
    document.querySelector('.tab-button[data-tab="login"]').click();
});

document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(tab + 'Form').classList.add('active');
    });
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    currentUser = null;
    document.getElementById('appContainer').classList.remove('active');
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
});

document.querySelectorAll('.nav-button').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if (view) switchView(view);
    });
});

const backBtn = document.getElementById('backToMateriasBtn');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        switchView('materias');
    });
}

const modal = document.getElementById('materiaModal');
document.getElementById('addMateriaBtn')?.addEventListener('click', () => {
    if (modal) modal.style.display = 'flex';
});

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
    });
});

document.getElementById('materiaForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newMateria = {
        id: Date.now(),
        nombre: document.getElementById('materiaName').value,
        desc: document.getElementById('materiaDesc').value,
        icon: document.getElementById('materiaIcon').value || '📘'
    };
    materiasGlobal.push(newMateria);
    saveMaterias();
    renderMaterias();
    if (modal) modal.style.display = 'none';
    document.getElementById('materiaForm').reset();
});

document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-admin-tab');
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tab + 'Tab').classList.add('active');
    });
});

document.querySelectorAll('.docente-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-docente-tab');
        document.querySelectorAll('.docente-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.docente-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tab + 'Tab').classList.add('active');
    });
});

document.getElementById('addCourseBtn')?.addEventListener('click', () => {
    alert('Funcionalidad de agregar curso en desarrollo');
});

// ========== CHAT IA FLOTANTE - VERSIÓN SIMPLE Y FUNCIONAL ==========
document.addEventListener('DOMContentLoaded', function() {
    const chatFab = document.getElementById('chatFab');
    const chatModal = document.getElementById('chatModal');
    const chatClose = document.getElementById('chatCloseBtn');
    const chatSend = document.getElementById('chatSendBtn');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    // Función para cerrar el chat
    function cerrarChat() {
        chatModal.classList.remove('open');
        console.log('Chat cerrado');
    }

    // Función para abrir el chat
    function abrirChat() {
        chatModal.classList.add('open');
        console.log('Chat abierto');
    }

    // Evento para la burbuja (toggle)
    chatFab.onclick = function(e) {
        e.stopPropagation();
        if (chatModal.classList.contains('open')) {
            cerrarChat();
        } else {
            abrirChat();
        }
    };

    // Evento para el botón X
    chatClose.onclick = function(e) {
        e.stopPropagation();
        cerrarChat();
    };

    // Cerrar con tecla ESC
    document.onkeydown = function(e) {
        if (e.key === 'Escape') {
            cerrarChat();
        }
    };

    // Enviar mensaje
    function enviarMensaje() {
        const msg = chatInput.value.trim();
        if (!msg) return;
        chatMessages.innerHTML += `<div class="message user">${msg}</div>`;
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        setTimeout(() => {
            chatMessages.innerHTML += `<div class="message bot">${responderIA(msg)}</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 500);
    }

    chatSend.onclick = enviarMensaje;
    chatInput.onkeypress = function(e) {
        if (e.key === 'Enter') enviarMensaje();
    };
});

if (chatSend) {
    chatSend.addEventListener('click', enviarMensaje);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensaje();
    });
}