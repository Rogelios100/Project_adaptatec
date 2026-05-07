// ========== API IMPORTS ==========
import * as API from './api.js';

// ========== DATA MODEL ==========
// Los usuarios y materias ahora vienen del servidor
let users = []; // Se cargarán desde el servidor
let materiasGlobal = []; // Se cargarán desde el servidor

let examenActual = null;
let respuestasUsuario = [];
let examenGenerado = false;

let currentUser = null;
let currentMateriaId = null;

// Gemini Configuration - Ahora se maneja en el backend
// Ya no necesitamos API key en el frontend

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
    // Ya no se necesita guardar en localStorage - los datos se sincronizan con el servidor
}

function saveMaterias() {
    // Ya no se necesita guardar en localStorage - los datos se sincronizan con el servidor
}

function getMateriaCompletedCount(materia) {
    if (Array.isArray(materia.completedModuleIndexes)) {
        return materia.completedModuleIndexes.length;
    }
    return materia.modulosCompletados || 0;
}

function isModuloCompletado(materia, index) {
    if (Array.isArray(materia.completedModuleIndexes)) {
        return materia.completedModuleIndexes.includes(index);
    }
    return index < (materia.modulosCompletados || 0);
}

function calcularEstadisticasGenerales() {
    if (!currentUser || currentUser.role !== 'alumno') return;
    const materias = currentUser.materias || [];
    const totalModulos = materias.reduce((sum, m) => sum + getMateriaCompletedCount(m), 0);
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
    const completados = getMateriaCompletedCount(materia);
    const completedSet = new Set(materia.completedModuleIndexes || []);

    const titleEl = document.getElementById('modulosMateriaTitle');
    const descEl = document.getElementById('modulosMateriaDesc');
    if (titleEl) titleEl.innerText = materia.name;
    if (descEl) descEl.innerHTML = `Progreso: ${materia.progress}% completado | Módulos completados: ${completados}/${materia.totalModulos}`;

    const container = document.getElementById('modulosGrid');
    if (container) {
        container.innerHTML = modulos.map((modulo, index) => {
            const estaCompletado = completedSet.has(index);
            return `
                <div class="modulo-card ${estaCompletado ? 'completado' : 'pendiente'}" data-modulo-index="${index}" data-materia-id="${materiaId}">
                    <div class="modulo-info">
                        <h4>📖 ${modulo}</h4>
                        <p>${estaCompletado ? '✅ Completado' : '📌 Por completar'}</p>
                    </div>
                    <div class="modulo-actions" style="display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end;">
                        ${!estaCompletado ? `
                            <button class="btn-ver-modulo btn-small" data-modulo="${modulo}" data-index="${index}" data-materia-id="${materiaId}">
                                📖 Ver contenido
                            </button>
                            <button class="btn-examen-modulo btn-small" data-modulo="${modulo}" data-index="${index}" data-materia-id="${materiaId}">
                                📝 Hacer examen
                            </button>
                        ` : `
                            <span class="badge-completado" style="background: #22c55e; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem;">
                                ✅ Completado
                            </span>
                        `}
                    </div>
                    <div class="modulo-status" style="margin-top: 8px; text-align: right; font-size: 0.7rem; color: #64748b;">
                        ${estaCompletado ? '✔️ Completado' : '🔘 Pendiente'}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Agregar event listeners para botones de ver contenido
    document.querySelectorAll('.btn-ver-modulo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modulo = btn.dataset.modulo;
            const index = parseInt(btn.dataset.index);
            const materiaIdLocal = parseInt(btn.dataset.materiaId);
            verContenidoModulo(materiaIdLocal, index, modulo);
        });
    });
    
    // Agregar event listeners para botones de examen
    document.querySelectorAll('.btn-examen-modulo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modulo = btn.dataset.modulo;
            const index = parseInt(btn.dataset.index);
            const materiaIdLocal = parseInt(btn.dataset.materiaId);
            iniciarExamen(materia, index, modulo);
        });
    });
    
    // Clik en la tarjeta del módulo (ver contenido)
    document.querySelectorAll('.modulo-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Si el clic fue en un botón, no hacer nada
            if (e.target.classList.contains('btn-ver-modulo') || 
                e.target.classList.contains('btn-examen-modulo')) return;
            
            const index = parseInt(card.dataset.moduloIndex);
            const modulo = modulos[index];
            const materiaIdLocal = parseInt(card.dataset.materiaId);
            verContenidoModulo(materiaIdLocal, index, modulo);
        });
    });
    
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

// ========== GROQ FUNCTIONS ==========
async function obtenerRespuestaGroq(pregunta, materia = '') {
    try {
        // La API key ahora está en el backend, enviamos el token JWT
        const respuesta = await API.apiGroqQuestion(
            pregunta,
            materia,
            `Contexto educativo del TECNM para Ingeniería en Sistemas`
        );
        return respuesta;
    } catch (error) {
        console.error('Error con Groq:', error);
        return "Disculpa, tuve un problema contactando con la IA. " + responderIA(pregunta);
    }
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
    document.querySelector('.admin-section').style.display = isAdmin ? 'block' : 'none';

    if (isStudent) {
        const materias = currentUser.materias || [];
        const materiasEnCurso = materias.filter(m => (m.progress || 0) < 100).length;
        const totalHoras = materias.reduce((sum, m) => sum + (m.horasEstudio || 0), 0);
        const weeklyHours = currentUser.horas || totalHoras;
        const totalAchievements = Math.max(currentUser.totalLogros || 12, materias.length * 4);
        const completed = materias.filter(m => (m.progress || 0) >= 100).length;
        const averageProgress = materias.length ? Math.round(materias.reduce((sum, m) => sum + (m.progress || 0), 0) / materias.length) : 0;
        const achieved = currentUser.logros || Math.min(totalAchievements, completed * 2 + Math.floor(averageProgress / 25));
        const achievementPercent = totalAchievements ? Math.round((achieved / totalAchievements) * 100) : 0;
        const computedPoints = currentUser.puntos || Math.max(0, totalHoras + averageProgress + completed * 10);
        const computedLevel = currentUser.nivel || Math.max(1, Math.ceil(averageProgress / 20));

        document.getElementById('profileFullName').innerText = currentUser.name || 'Estudiante';
        document.getElementById('profileCareer').innerHTML = currentUser.role === 'alumno' ? 'Estudiante de Ingeniería en Sistemas' : 'Estudiante';
        document.getElementById('profileLevel').innerHTML = `Nivel ${computedLevel} - Aprendiz en Desarrollo`;
        const avatarText = (currentUser.name || 'ES').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        document.getElementById('profileAvatar').innerText = avatarText;

        const infoHtml = `
            <div class="info-row"><span class="info-label">📧 Email:</span> ${currentUser.email || 'No disponible'}</div>
            <div class="info-row"><span class="info-label">🆔 Matrícula:</span> ${currentUser.matricula || 'No disponible'}</div>
            <div class="info-row"><span class="info-label">📚 Materias activas:</span> ${materiasEnCurso}</div>
            <div class="info-row"><span class="info-label">📈 Progreso promedio:</span> ${averageProgress}%</div>
            <div class="info-row"><span class="info-label">⏱️ Horas registradas:</span> ${weeklyHours}h</div>
        `;
        document.getElementById('personalInfoGrid').innerHTML = infoHtml;

        document.getElementById('logrosObtenidos').innerHTML = `🏅 ${achieved}/${totalAchievements} Obtenidos`;
        document.getElementById('puntosDisplay').innerHTML = `⭐ ${computedPoints} Puntos Acumulados`;
        document.getElementById('logrosProgressFill').style.width = `${achievementPercent}%`;
        document.getElementById('logrosProgressText').innerHTML = `${achievementPercent}% de logros desbloqueados`;

        let materiasHtml = '';
        if (materias.length > 0) {
            materias.forEach(m => {
                const completedCount = getMateriaCompletedCount(m);
                materiasHtml += `
                    <div class="materia-progress-item">
                        <p><strong>${m.name}</strong> • ${m.progress}% completado</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${m.progress}%;"></div>
                        </div>
                        <p class="small-text">${completedCount}/${m.totalModulos || 0} módulos • ${m.horasEstudio || 0}h</p>
                    </div>
                `;
            });
            materiasHtml += `<p class="hint">Accede a “Materias” para revisar módulos, avances y preguntar a la IA en cada curso.</p>`;
        } else {
            materiasHtml = '<p>No hay materias registradas aún.</p>';
        }
        document.getElementById('materiasProgresoList').innerHTML = materiasHtml;

        const activities = Array.isArray(currentUser.recent) && currentUser.recent.length > 0
            ? currentUser.recent
            : ['No hay actividad reciente registrada.'];
        document.getElementById('recentActivitiesList').innerHTML = activities.map(a => `<li>${a}</li>`).join('');
    }

    if (isTeacher) {
        const teacherCoursesHtml = (currentUser.cursos || []).map(c => `
            <div class="course-item">
                <strong>${c}</strong>
                <p>45 estudiantes | 12 módulos</p>
            </div>
        `).join('');
        document.getElementById('teacherCourses').innerHTML = teacherCoursesHtml || '<p>No hay cursos asignados</p>';
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
    
    const materias = currentUser.materias || [];
    container.innerHTML = materias.map((m, idx) => {
        const completedCount = getMateriaCompletedCount(m);
        return `
        <div class="materia-card" data-materia-id="${m.id}" style="background: ${coloresCard[idx % coloresCard.length]};">
            <div class="materia-header">
                <h3>${m.name}</h3>
                <span class="materia-icon">${m.icon || '📘'}</span>
            </div>
            <div class="materia-stats">
                <span>📋 ${completedCount}/${m.totalModulos} módulos</span>
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
    `;
    }).join('');
    
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
    if (!currentUser) return;

    const unlockedDiv = document.getElementById('unlockedRewards');
    const availableDiv = document.getElementById('availableRewards');
    const objectiveDiv = document.getElementById('objectiveList');

    if (currentUser.role === 'alumno') {
        const materias = currentUser.materias || [];
        const totalHoras = materias.reduce((sum, m) => sum + (m.horasEstudio || 0), 0);
        const averageProgress = materias.length ? Math.round(materias.reduce((sum, m) => sum + (m.progress || 0), 0) / materias.length) : 0;
        const completed = materias.filter(m => (m.progress || 0) >= 100).length;
        const points = currentUser.puntos || Math.max(0, totalHoras + averageProgress + completed * 10);
        const currentLevel = currentUser.nivel || Math.max(1, Math.ceil(averageProgress / 20));
        const totalRewards = currentUser.logros || Math.min(Math.max(currentUser.totalLogros || 8, materias.length * 4), completed * 2 + Math.floor(averageProgress / 25));

        const unlocked = [];
        const available = [];
        const objectives = [];

        const stepOneComplete = completed >= 1 || totalHoras >= 10;
        const steadyProgress = averageProgress >= 75;
        const algoMaster = materias.some(m => m.name?.toLowerCase().includes('algoritmos') && (m.progress || 0) >= 85);
        const domMaster = materias.some(m => m.name?.toLowerCase().includes('web') && (m.progress || 0) >= 80);

        if (stepOneComplete) {
            unlocked.push('🏅 Primer Paso');
            objectives.push({ title: 'Completa tu primera materia', status: 'Completado' });
        } else {
            available.push('🔓 Primer Paso al completar tu primera materia o registrar 10 horas de estudio.');
            objectives.push({ title: 'Completa tu primera materia', status: `${Math.min(100, Math.round((completed > 0 ? 50 : 0) + (totalHoras / 10) * 50))}%` });
        }

        if (steadyProgress) {
            unlocked.push('⚡ Progreso Constante');
            objectives.push({ title: 'Mantener 75% de progreso promedio', status: 'Completado' });
        } else {
            available.push('🔓 Progreso Constante al mantener 75% o más de avance promedio.');
            objectives.push({ title: 'Mantener 75% de progreso promedio', status: `${averageProgress}%` });
        }

        if (algoMaster) {
            unlocked.push('💯 Experto en algoritmos');
            objectives.push({ title: '85% en Algoritmos', status: 'Completado' });
        } else {
            available.push('🔓 Experto en algoritmos al alcanzar 85% en Algoritmos.');
            objectives.push({ title: '85% en Algoritmos', status: `${Math.max(0, materias.find(m => m.name?.toLowerCase().includes('algoritmos'))?.progress || 0)}%` });
        }

        if (domMaster) {
            unlocked.push('📚 Maestro del DOM');
            objectives.push({ title: '80% en Desarrollo Web', status: 'Completado' });
        } else {
            available.push('🔓 Maestro del DOM al alcanzar 80% en Desarrollo Web.');
            objectives.push({ title: '80% en Desarrollo Web', status: `${Math.max(0, materias.find(m => m.name?.toLowerCase().includes('web'))?.progress || 0)}%` });
        }

        if (unlocked.length === 0) {
            unlocked.push('Aún no se han desbloqueado recompensas. Sigue avanzando en tus materias.');
        }

        unlockedDiv.innerHTML = unlocked.map(item => `<span class="reward-item">${item}</span>`).join('');
        availableDiv.innerHTML = available.map(item => `<span class="reward-item">${item}</span>`).join('');
        objectiveDiv.innerHTML = objectives.map(obj => `
            <div class="reward-item objective-item">
                <strong>${obj.title}</strong>
                <span>${obj.status}</span>
            </div>
        `).join('');
        document.getElementById('totalPoints').innerText = points;
        document.getElementById('currentLevel').innerText = currentLevel;
        document.getElementById('totalRewards').innerText = totalRewards;
    } else {
        unlockedDiv.innerHTML = '<p>Las recompensas están disponibles solo para estudiantes</p>';
        availableDiv.innerHTML = '';
        objectiveDiv.innerHTML = '';
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

    const materias = currentUser?.materias || [];
    const labels = materias.map(m => m.name || `Materia ${m.id}`);
    const horasData = materias.map(m => m.horasEstudio || 0);
    const progresoData = materias.map(m => m.progress || 0);
    const totalHoras = horasData.reduce((sum, h) => sum + h, 0);
    const promedioGeneral = materias.length ? Math.round(progresoData.reduce((sum, p) => sum + p, 0) / materias.length) : 0;
    const modulosCompletados = materias.reduce((sum, m) => sum + (m.modulosCompletados || 0), 0);
    const nivel = currentUser?.nivel || 1;

    if (ctxHoras) {
        horasChart = new Chart(ctxHoras, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Sin materias'],
                datasets: [{
                    label: 'Horas Estudiadas',
                    data: horasData.length ? horasData : [0],
                    backgroundColor: '#3b82f6',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    if (ctxCalif) {
        califChart = new Chart(ctxCalif, {
            type: 'line',
            data: {
                labels: labels.length ? labels : ['Sin materias'],
                datasets: [{
                    label: 'Progreso de Materias',
                    data: progresoData.length ? progresoData : [0],
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249,115,22,0.15)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    }

    if (ctxMaterias) {
        materiasChart = new Chart(ctxMaterias, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['Sin materias'],
                datasets: [{
                    data: progresoData.length ? progresoData : [1],
                    backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#6366f1'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true }
        });
    }

    if (currentUser?.role === 'alumno') {
        document.getElementById('horasSemana').innerText = `${totalHoras}h`;
        document.getElementById('promedioGlobal').innerText = `${promedioGeneral}%`;
        document.getElementById('modulosCompletados').innerText = modulosCompletados;
        document.getElementById('nivelUsuario').innerText = nivel;
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

// Función de panel de docente eliminada (solo alumnos y admin)

function applyRoleVisibility() {
    const isAdmin = currentUser?.role === 'admin';
    const isStudent = currentUser?.role === 'alumno';

    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
    });

    document.querySelectorAll('.nav-button').forEach(btn => {
        if (btn.dataset.view === 'admin-panel') {
            btn.style.display = isAdmin ? 'flex' : 'none';
        } else {
            btn.style.display = isAdmin ? 'none' : 'flex';
        }
    });

    if (isAdmin) {
        renderAdminUsers();
    }
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
}

// ========== EVENT LISTENERS & AUTH ==========
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const user = await API.apiLogin(username, password);
        
        // Cargar perfil completo del usuario
        currentUser = await API.apiGetProfile();
        
        document.getElementById('userNameDisplay').innerText = currentUser.name || currentUser.username;
        document.getElementById('userRoleDisplay').innerText = currentUser.role.toUpperCase();
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('appContainer').classList.add('active');
        applyRoleVisibility();
        if (currentUser.role === 'admin') {
            switchView('admin-panel');
        } else {
            switchView('dashboard');
        }
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Login error:', error);
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const matricula = document.getElementById('regMatricula').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const name = document.getElementById('regName').value;
    
    try {
        const newUser = await API.apiRegister(username, matricula, email, password, name, 'alumno');
        alert('Registro exitoso. Ahora inicia sesión.');
        
        // Limpiar formularios
        document.getElementById('registerForm').reset();
        document.getElementById('loginForm').reset();
        
        // Cambiar a tab de login
        document.querySelector('.tab-button[data-tab="login"]').click();
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Register error:', error);
    }
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
    API.apiLogout();
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

// Event listeners de panel de docente eliminados

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
    async function enviarMensaje() {
        const msg = chatInput.value.trim();
        if (!msg) return;
        
        chatMessages.innerHTML += `<div class="message user">${msg}</div>`;
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Mostrar indicador de carga
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'message bot loading';
        loadingMsg.innerHTML = '⏳ Procesando tu pregunta...';
        chatMessages.appendChild(loadingMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        try {
            // Obtener respuesta de Groq o fallback local
            const respuesta = await obtenerRespuestaGroq(msg, currentMateriaId);
            
            // Remover mensaje de carga
            chatMessages.removeChild(loadingMsg);
            
            // Agregar respuesta
            chatMessages.innerHTML += `<div class="message bot">${respuesta}</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error('Error:', error);
            chatMessages.removeChild(loadingMsg);
            chatMessages.innerHTML += `<div class="message bot">❌ Error al procesar la pregunta. Intenta de nuevo.</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    chatSend.onclick = enviarMensaje;
    chatInput.onkeypress = function(e) {
        if (e.key === 'Enter') enviarMensaje();
    };
});

function verContenidoModulo(materiaId, moduloIndex, moduloNombre) {
    const materia = currentUser.materias.find(m => m.id === materiaId);
    if (!materia) return;
    
    // Mostrar modal con el contenido del módulo
    const modal = document.getElementById('moduloContenidoModal') || crearModalContenido();
    const titulo = document.getElementById('moduloContenidoTitulo');
    const contenido = document.getElementById('moduloContenidoTexto');
    const examenBtn = document.getElementById('moduloExamenBtn');
    
    titulo.innerText = `${moduloNombre} - ${materia.name}`;
    
    // Contenido educativo (desde API o texto)
    contenido.innerHTML = `
        <div class="modulo-contenido">
            <p><strong>Temas cubiertos en este módulo:</strong></p>
            <ul>
                <li>Conceptos fundamentales de ${moduloNombre}</li>
                <li>Ejemplos prácticos y casos de uso</li>
                <li>Ejercicios de aplicación</li>
            </ul>
            <p>Después de revisar el contenido, realiza el examen para completar el módulo.</p>
        </div>
    `;
    
    // Botón para ir al examen
    examenBtn.onclick = () => {
        modal.style.display = 'none';
        iniciarExamen(materia, moduloIndex, moduloNombre);
    };
    
    modal.style.display = 'flex';
}

function crearModalContenido() {
    const modal = document.createElement('div');
    modal.id = 'moduloContenidoModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content-box" style="max-width: 550px;">
            <div class="modal-header-box">
                <h3 id="moduloContenidoTitulo">Contenido del Módulo</h3>
                <button class="close-modal-btn close-btn">&times;</button>
            </div>
            <div id="moduloContenidoTexto" style="max-height: 400px; overflow-y: auto;">
                Cargando contenido...
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button id="moduloExamenBtn" class="btn btn-primary">📝 Ir al examen</button>
                <button class="close-modal-btn btn btn-outline">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Eventos para cerrar modal
    modal.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => modal.style.display = 'none');
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    return modal;
}

async function generarExamenConIA(materia, moduloIndex, moduloNombre) {
    try {
        const token = localStorage.getItem('adaptatec_token');
        
        const response = await fetch('/api/groq/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                materiaId: materia.id,
                moduloIndex: moduloIndex,
                moduloNombre: moduloNombre,
                materiaNombre: materia.name
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.preguntas && data.preguntas.length > 0) {
            examenActual = data.preguntas;
            examenGenerado = true;
            return true;
        } else {
            throw new Error('No se recibieron preguntas');
        }
        
    } catch (error) {
        console.error('Error generando examen con IA:', error);
        // Usar examen de fallback
        examenActual = generarExamenFallback(moduloNombre, materia.name);
        examenGenerado = true;
        return true;
    }
}

function generarExamenFallback(moduloNombre, materiaNombre) {
    // Banco de preguntas completo por área (sin repeticiones)
    const bancosPreguntas = {
        algoritmos: [
            { texto: "¿Qué estructura de datos utiliza el principio LIFO (Last In, First Out)?", opciones: ["Cola", "Pila", "Lista enlazada", "Árbol binario"], correcta: 1, explicacion: "La pila (stack) utiliza LIFO." },
            { texto: "¿Qué estructura de datos utiliza el principio FIFO (First In, First Out)?", opciones: ["Cola", "Pila", "Lista enlazada", "Árbol binario"], correcta: 0, explicacion: "La cola (queue) utiliza FIFO." },
            { texto: "¿Cuál es la complejidad temporal del algoritmo QuickSort en el caso promedio?", opciones: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], correcta: 1, explicacion: "QuickSort tiene un promedio de O(n log n)." },
            { texto: "¿Cuál es la complejidad temporal de una búsqueda binaria en un arreglo ordenado?", opciones: ["O(1)", "O(n)", "O(log n)", "O(n²)"], correcta: 2, explicacion: "La búsqueda binaria tiene complejidad O(log n)." },
            { texto: "¿Qué caracteriza a un árbol binario de búsqueda (BST)?", opciones: ["Todos los nodos tienen dos hijos", "Hijos izquierdos menores que el padre, derechos mayores", "Está completamente balanceado", "Solo tiene nodos hoja"], correcta: 1, explicacion: "En un BST, el subárbol izquierdo contiene valores menores." },
            { texto: "¿Qué es una lista enlazada?", opciones: ["Estructura con nodos que apuntan al siguiente", "Arreglo de tamaño fijo", "Estructura jerárquica", "Tabla hash"], correcta: 0, explicacion: "Las listas enlazadas son estructuras dinámicas con nodos conectados." },
            { texto: "¿Qué es una tabla hash?", opciones: ["Estructura que asocia claves con valores", "Lista ordenada", "Árbol balanceado", "Cola circular"], correcta: 0, explicacion: "Las tablas hash permiten búsqueda rápida por clave." },
            { texto: "¿Qué es el Big O notation?", opciones: ["Medida de complejidad algorítmica", "Tipo de variable", "Estructura de datos", "Lenguaje de programación"], correcta: 0, explicacion: "Big O describe la eficiencia de un algoritmo." }
        ],
        web: [
            { texto: "¿Qué significa HTML?", opciones: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correcta: 0, explicacion: "HTML son las siglas de HyperText Markup Language." },
            { texto: "¿Qué etiqueta se usa para crear un enlace en HTML?", opciones: ["<link>", "<a>", "<href>", "<url>"], correcta: 1, explicacion: "La etiqueta <a> (anchor) se usa para crear enlaces." },
            { texto: "¿Qué propiedad CSS se usa para cambiar el color de fondo?", opciones: ["color", "background-color", "bgcolor", "background"], correcta: 1, explicacion: "background-color es la propiedad correcta." },
            { texto: "¿Qué método HTTP se usa para obtener datos?", opciones: ["POST", "PUT", "GET", "DELETE"], correcta: 2, explicacion: "GET se usa para solicitar datos." },
            { texto: "¿Qué método HTTP se usa para enviar datos?", opciones: ["GET", "POST", "PUT", "DELETE"], correcta: 1, explicacion: "POST se usa para enviar datos al servidor." },
            { texto: "¿Qué framework de JavaScript es desarrollado por Meta?", opciones: ["Angular", "Vue", "React", "Svelte"], correcta: 2, explicacion: "React fue creado por Meta." },
            { texto: "¿Qué significa CSS?", opciones: ["Creative Style Sheets", "Computer Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets"], correcta: 2, explicacion: "CSS significa Cascading Style Sheets." },
            { texto: "¿Qué es JavaScript?", opciones: ["Lenguaje de marcado", "Lenguaje de programación", "Base de datos", "Framework CSS"], correcta: 1, explicacion: "JavaScript es un lenguaje de programación." }
        ],
        basedatos: [
            { texto: "¿Qué comando SQL se usa para extraer datos?", opciones: ["GET", "SELECT", "EXTRACT", "OPEN"], correcta: 1, explicacion: "SELECT es el comando para consultar datos." },
            { texto: "¿Qué comando SQL se usa para insertar datos?", opciones: ["ADD", "INSERT", "CREATE", "UPDATE"], correcta: 1, explicacion: "INSERT se usa para agregar registros." },
            { texto: "¿Qué es una clave primaria?", opciones: ["Campo único que identifica cada registro", "Campo que puede ser nulo", "Campo con valores repetidos", "Campo calculado"], correcta: 0, explicacion: "La clave primaria identifica de forma única cada fila." },
            { texto: "¿Qué es una clave foránea?", opciones: ["Referencia a otra tabla", "Clave principal", "Campo opcional", "Índice único"], correcta: 0, explicacion: "La clave foránea referencia una clave primaria de otra tabla." },
            { texto: "¿Qué significa ACID en bases de datos?", opciones: ["Atomicidad, Consistencia, Aislamiento, Durabilidad", "Almacenamiento, Cache, Índices, Datos", "Actualización, Creación, Inserción, Delete", "Alta, Consulta, Índice, Dato"], correcta: 0, explicacion: "ACID garantiza transacciones confiables." }
        ],
        ia: [
            { texto: "¿Qué tipo de aprendizaje utiliza datos etiquetados?", opciones: ["No supervisado", "Supervisado", "Por refuerzo", "Profundo"], correcta: 1, explicacion: "El aprendizaje supervisado usa datos etiquetados." },
            { texto: "¿Qué es una red neuronal?", opciones: ["Sistema de nodos interconectados", "Base de datos", "Lenguaje de programación", "Navegador web"], correcta: 0, explicacion: "Las redes neuronales imitan el cerebro humano." },
            { texto: "¿Qué es Machine Learning?", opciones: ["Algoritmos que aprenden de datos", "Lenguaje de programación", "Base de datos", "Framework web"], correcta: 0, explicacion: "Machine Learning permite que las máquinas aprendan." },
            { texto: "¿Qué es Deep Learning?", opciones: ["Redes neuronales profundas", "Base de datos", "Lenguaje de programación", "Algoritmo de ordenamiento"], correcta: 0, explicacion: "Deep Learning usa múltiples capas neuronales." },
            { texto: "¿Qué es NLP?", opciones: ["Procesamiento de lenguaje natural", "Base de datos", "Red neuronal", "Lenguaje de programación"], correcta: 0, explicacion: "NLP procesa y entiende el lenguaje humano." }
        ]
    };
    
    // Determinar área según materia
    let area = 'algoritmos';
    const materiaLower = materiaNombre.toLowerCase();
    if (materiaLower.includes('web') || materiaLower.includes('desarrollo') || materiaLower.includes('html') || materiaLower.includes('css')) {
        area = 'web';
    } else if (materiaLower.includes('base') || materiaLower.includes('dato') || materiaLower.includes('sql')) {
        area = 'basedatos';
    } else if (materiaLower.includes('ia') || materiaLower.includes('inteligencia') || materiaLower.includes('machine')) {
        area = 'ia';
    }
    
    const preguntasDisponibles = [...bancosPreguntas[area]];
    
    // Mezclar preguntas aleatoriamente
    for (let i = preguntasDisponibles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [preguntasDisponibles[i], preguntasDisponibles[j]] = [preguntasDisponibles[j], preguntasDisponibles[i]];
    }
    
    // Tomar 5 preguntas únicas
    const preguntas = preguntasDisponibles.slice(0, 5);
    
    return preguntas;
}

function mostrarExamen(materia, moduloIndex, moduloNombre) {
    if (!examenActual || examenActual.length === 0) {
        alert('Error: No se pudo generar el examen. Intenta de nuevo.');
        return;
    }
    
    const modal = document.getElementById('examenModal');
    const tituloSpan = document.getElementById('examenModuloNombre');
    const preguntasDiv = document.getElementById('examenPreguntas');
    const resultadoDiv = document.getElementById('examenResultado');
    const accionesDiv = document.querySelector('.examen-actions');
    const modalTitle = document.getElementById('examenModalTitle');
    
    if (!modal) {
        console.error('Modal de examen no encontrado');
        return;
    }
    
    tituloSpan.innerText = `${moduloNombre} - ${materia.name}`;
    if (modalTitle) modalTitle.innerText = `📝 Examen: ${moduloNombre}`;
    
    // Reiniciar respuestas
    respuestasUsuario = new Array(examenActual.length).fill(null);
    
    // Renderizar preguntas
    preguntasDiv.innerHTML = examenActual.map((pregunta, idx) => `
        <div class="examen-pregunta" style="margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px;">
            <p style="font-weight: 600; margin-bottom: 12px;">${idx + 1}. ${pregunta.texto}</p>
            <div class="opciones" style="margin-left: 20px;">
                ${pregunta.opciones.map((opt, optIdx) => `
                    <label style="display: block; margin: 8px 0; cursor: pointer;">
                        <input type="radio" name="pregunta_${idx}" value="${optIdx}" data-pregunta="${idx}" data-opcion="${optIdx}">
                        <span style="margin-left: 8px;">${String.fromCharCode(65 + optIdx)}. ${opt}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // Agregar event listeners para guardar respuestas
    document.querySelectorAll('#examenPreguntas input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const preguntaIdx = parseInt(e.target.dataset.pregunta);
            const opcionIdx = parseInt(e.target.dataset.opcion);
            respuestasUsuario[preguntaIdx] = opcionIdx;
        });
    });
    
    // Configurar botones
    const enviarBtn = document.getElementById('enviarExamenBtn');
    const cancelarBtn = document.getElementById('cancelarExamenBtn');
    const closeBtn = document.getElementById('closeExamenBtn');
    
    if (enviarBtn) enviarBtn.onclick = () => calificarExamen(materia, moduloIndex, moduloNombre);
    if (cancelarBtn) cancelarBtn.onclick = () => modal.style.display = 'none';
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    
    // Ocultar resultados
    resultadoDiv.style.display = 'none';
    accionesDiv.style.display = 'flex';
    preguntasDiv.style.display = 'block';
    
    modal.style.display = 'flex';
}

async function iniciarExamen(materia, moduloIndex, moduloNombre) {
    const modal = document.getElementById('examenModal');
    const preguntasDiv = document.getElementById('examenPreguntas');
    const resultadoDiv = document.getElementById('examenResultado');
    const accionesDiv = document.querySelector('.examen-actions');
    const modalTitle = document.getElementById('examenModalTitle');
    const moduloNombreSpan = document.getElementById('examenModuloNombre');
    
    // ========== REINICIAR COMPLETAMENTE EL ESTADO ==========
    
    // 1. Limpiar variables globales
    examenActual = null;
    respuestasUsuario = [];
    examenGenerado = false;
    
    // 2. Ocultar y limpiar resultados anteriores
    if (resultadoDiv) {
        resultadoDiv.style.display = 'none';
        resultadoDiv.innerHTML = '';
    }
    
    // 3. Limpiar preguntas anteriores
    if (preguntasDiv) {
        preguntasDiv.innerHTML = '';
    }
    
    // 4. Restablecer títulos
    if (modalTitle) {
        modalTitle.innerText = '📝 Examen';
    }
    if (moduloNombreSpan) {
        moduloNombreSpan.innerText = `${moduloNombre} - ${materia.name}`;
    }
    
    // 5. Mostrar botones de acción (se ocultarán durante la carga)
    if (accionesDiv) {
        accionesDiv.style.display = 'none';
    }
    
    // 6. Mostrar loading
    preguntasDiv.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 2rem; margin-bottom: 15px;">🤖</div>
            <p style="color: #64748b;">Generando preguntas con inteligencia artificial...</p>
            <div style="width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto;"></div>
        </div>
    `;
    
    // 7. Mostrar el modal
    modal.style.display = 'flex';
    
    // 8. Generar examen con IA
    let exito = await generarExamenConIA(materia, moduloIndex, moduloNombre);
    
    // 9. Mostrar el examen o error
    if (exito && examenActual && examenActual.length > 0) {
        mostrarExamen(materia, moduloIndex, moduloNombre);
    } else {
        preguntasDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 2rem; margin-bottom: 15px;">❌</div>
                <p>No se pudo generar el examen en este momento.</p>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 15px;">Reintentar</button>
            </div>
        `;
        if (accionesDiv) accionesDiv.style.display = 'none';
    }
}

async function calificarExamen(materia, moduloIndex, moduloNombre) {
    // Validar respuestas
    const preguntasSinResponder = respuestasUsuario.some(r => r === null);
    if (preguntasSinResponder) {
        alert('⚠️ Por favor responde todas las preguntas antes de calificar.');
        return;
    }
    
    // Calcular aciertos y preparar resultados detallados
    let aciertos = 0;
    const resultadosDetallados = [];
    
    examenActual.forEach((pregunta, idx) => {
        const respuestaUsuario = respuestasUsuario[idx];
        const esCorrecta = (respuestaUsuario === pregunta.correcta);
        const opcionSeleccionada = respuestaUsuario !== null ? pregunta.opciones[respuestaUsuario] : 'No respondida';
        const opcionCorrecta = pregunta.opciones[pregunta.correcta];
        
        if (esCorrecta) aciertos++;
        
        resultadosDetallados.push({
            numero: idx + 1,
            texto: pregunta.texto,
            opciones: pregunta.opciones,
            seleccionada: respuestaUsuario,
            seleccionadaTexto: opcionSeleccionada,
            correcta: pregunta.correcta,
            correctaTexto: opcionCorrecta,
            esCorrecta: esCorrecta,
            explicacion: pregunta.explicacion || ''
        });
    });
    
    const total = examenActual.length;
    const porcentaje = (aciertos / total) * 100;
    const aprobado = aciertos >= 3; // 3 de 5 correctas
    
    const modal = document.getElementById('examenModal');
    const preguntasDiv = document.getElementById('examenPreguntas');
    const resultadoDiv = document.getElementById('examenResultado');
    const accionesDiv = document.querySelector('.examen-actions');
    
    if (aprobado) {
        try {
            await marcarModuloCompletado(materia.id, moduloIndex, moduloNombre);
            
            resultadoDiv.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🎉</div>
                    <h3 style="color: #16a34a; margin-bottom: 10px;">¡Examen aprobado!</h3>
                    <p style="font-size: 1.2rem; margin: 10px 0;">Calificación: ${aciertos}/${total} (${porcentaje}%)</p>
                    <p style="color: #4b5563;">Necesitabas 3 correctas para aprobar. ¡Excelente trabajo!</p>
                    
                    <div style="margin-top: 25px; text-align: left; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                        <h4>📋 Resumen de tus respuestas:</h4>
                        ${resultadosDetallados.map(r => `
                            <div style="margin: 15px 0; padding: 12px; background: ${r.esCorrecta ? '#e8f5e9' : '#ffebee'}; border-radius: 8px; border-left: 4px solid ${r.esCorrecta ? '#4caf50' : '#f44336'};">
                                <p style="font-weight: 600; margin: 0 0 8px 0;">${r.numero}. ${r.texto}</p>
                                <p style="margin: 5px 0; font-size: 0.9rem;">
                                    <strong>Tu respuesta:</strong> ${r.seleccionadaTexto}
                                    ${r.esCorrecta ? ' ✅' : ' ❌'}
                                </p>
                                ${!r.esCorrecta ? `
                                    <p style="margin: 5px 0; font-size: 0.9rem; color: #2e7d32;">
                                        <strong>Respuesta correcta:</strong> ${r.correctaTexto}
                                    </p>
                                    <p style="margin: 5px 0; font-size: 0.85rem; color: #4b5563;">
                                        <strong>Explicación:</strong> ${r.explicacion}
                                    </p>
                                ` : `
                                    <p style="margin: 5px 0; font-size: 0.85rem; color: #4b5563;">
                                        <strong>Explicación:</strong> ${r.explicacion}
                                    </p>
                                `}
                            </div>
                        `).join('')}
                    </div>
                    
                    <button id="cerrarExamenBtn" class="btn btn-primary" style="margin-top: 20px;">Cerrar</button>
                </div>
            `;
            
            document.getElementById('cerrarExamenBtn')?.addEventListener('click', () => {
                modal.style.display = 'none';
                abrirModulosMateria(materia.id, false);
            });
            
        } catch (error) {
            console.error('Error al guardar progreso:', error);
            resultadoDiv.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                    <p>Examen aprobado (${aciertos}/${total}), pero hubo un error al guardar tu progreso.</p>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 15px;">Recargar</button>
                </div>
            `;
        }
        
        accionesDiv.style.display = 'none';
        preguntasDiv.style.display = 'none';
        resultadoDiv.style.display = 'block';
        
    } else {
        // No aprobado - mostrar resumen detallado con opción de reintentar
        resultadoDiv.innerHTML = `
            <div style="padding: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📚</div>
                    <h3 style="color: #dc2626; margin-bottom: 10px;">No aprobaste</h3>
                    <p style="font-size: 1.2rem; margin: 10px 0;">Calificación: ${aciertos}/${total} (${porcentaje}%)</p>
                    <p style="color: #4b5563; margin-bottom: 20px;">Necesitas al menos 3 respuestas correctas para aprobar.</p>
                </div>
                
                <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                    <h4>📋 Resumen de tus respuestas:</h4>
                    ${resultadosDetallados.map(r => `
                        <div style="margin: 15px 0; padding: 12px; background: ${r.esCorrecta ? '#e8f5e9' : '#ffebee'}; border-radius: 8px; border-left: 4px solid ${r.esCorrecta ? '#4caf50' : '#f44336'};">
                            <p style="font-weight: 600; margin: 0 0 8px 0;">${r.numero}. ${r.texto}</p>
                            <p style="margin: 5px 0; font-size: 0.9rem;">
                                <strong>Tu respuesta:</strong> ${r.seleccionadaTexto}
                                ${r.esCorrecta ? ' ✅' : ' ❌'}
                            </p>
                            <p style="margin: 5px 0; font-size: 0.9rem; color: #2e7d32;">
                                <strong>Respuesta correcta:</strong> ${r.correctaTexto}
                            </p>
                            <p style="margin: 5px 0; font-size: 0.85rem; color: #4b5563;">
                                <strong>Explicación:</strong> ${r.explicacion}
                            </p>
                        </div>
                    `).join('')}
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button id="reintentarExamenBtn" class="btn btn-primary">🔄 Reintentar examen</button>
                    <button id="cerrarResultadoBtn" class="btn btn-outline">Cerrar</button>
                </div>
            </div>
        `;
        
        document.getElementById('reintentarExamenBtn')?.addEventListener('click', () => {
            resultadoDiv.style.display = 'none';
            iniciarExamen(materia, moduloIndex, moduloNombre);
        });
        
        document.getElementById('cerrarResultadoBtn')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        accionesDiv.style.display = 'none';
        preguntasDiv.style.display = 'none';
        resultadoDiv.style.display = 'block';
    }
}

async function marcarModuloCompletado(materiaId, moduloIndex, moduloNombre) {
    const materia = currentUser.materias.find(m => m.id === materiaId);
    if (!materia) throw new Error('Materia no encontrada');
    
    const completedIndexes = Array.isArray(materia.completedModuleIndexes) ? [...materia.completedModuleIndexes] : [];
    if (completedIndexes.includes(moduloIndex)) {
        return;
    }

    try {
        const result = await API.apiUpdateModuleProgress(materiaId, moduloIndex);
        
        materia.completedModuleIndexes = Array.from(new Set([...(materia.completedModuleIndexes || []), moduloIndex])).sort((a, b) => a - b);
        materia.modulosCompletados = result.modulosCompletados ?? getMateriaCompletedCount(materia);
        materia.progress = result.progress ?? Math.round((materia.modulosCompletados / materia.totalModulos) * 100);

        await fetch('/api/users/activity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adaptatec_token')}`
            },
            body: JSON.stringify({
                descripcion: `¡Aprobaste el examen de "${moduloNombre}" en ${materia.name}!`,
                tipo: 'examen'
            })
        });

        calcularEstadisticasGenerales();

        console.log(`✅ Módulo "${moduloNombre}" completado. Progreso de materia: ${materia.progress}%`);
    } catch (error) {
        console.error('Error al marcar módulo completado:', error);
        throw error;
    }
}

// ========== GEMINI CONFIGURATION LISTENERS ==========
// Configuración de Gemini ahora se maneja en el backend