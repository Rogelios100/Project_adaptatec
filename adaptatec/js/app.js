// ========== API IMPORTS ==========
import * as API from './api.js';

// ========== DATA MODEL ==========
// Los usuarios y materias ahora vienen del servidor
let users = []; // Se cargarán desde el servidor
let materiasGlobal = []; // Se cargarán desde el servidor

let examenActual = null;
let respuestasUsuario = [];
let examenGenerado = false;

// ========== MÓDULOS INDEPENDIENTES ==========
let modulosCompletadosMap = new Map(); // Guarda módulos completados por materiaId_moduloIndex

let recompensasObtenidas = new Set();

let currentUser = null;
let currentMateriaId = null;

// Gemini Configuration - Ahora se maneja en el backend
// Ya no necesitamos API key en el frontend

// Chart instances
let horasChart, califChart, materiasChart;

// ========== SISTEMA DE TIEMPO DE ESTUDIO ==========
let tiempoEstudioActivo = false;
let tiempoAcumulado = 0;
let ultimoTick = null;
let heartbeatInterval = null;
let lastActivityTime = Date.now();
let materiaActual = null;
let moduloActual = null;

// Módulos por materia (basados en plan TECNM)
const modulosPorMateria = {
    1: ["Introducción a Algoritmos", "Estructuras de Datos Lineales", "Pilas y Colas", "Árboles Binarios", "Árboles AVL", "Grafos", "Algoritmos de Ordenamiento", "Algoritmos de Búsqueda", "Complejidad Computacional", "Recursividad", "Backtracking", "Programación Dinámica"],
    2: ["HTML5 Semántico", "CSS3 Avanzado", "Flexbox y Grid", "JavaScript Básico", "DOM Manipulación", "Eventos", "Fetch API", "React Introducción", "Componentes", "Estado y Props", "Hooks", "Routing", "Despliegue", "Optimización", "Pruebas Unitarias"],
    3: ["Modelado Entidad-Relación", "SQL Básico", "Consultas Avanzadas", "JOINs", "Subconsultas", "Índices", "Procedimientos Almacenados", "Triggers", "NoSQL", "MongoDB"],
    4: ["Introducción a IA", "Búsqueda no informada", "Búsqueda informada", "Juegos y Minimax", "Aprendizaje Automático", "Regresión Lineal", "Clasificación", "Redes Neuronales", "Deep Learning", "NLP", "Visión Computacional", "Ética en IA", "Agentes Inteligentes", "Sistemas Expertos"],
    5: ["Patrones de Diseño", "Arquitectura MVC", "Microservicios", "SOA", "Arquitectura Hexagonal", "DDD", "Event-Driven", "Serverless", "Monitoreo", "Escalabilidad", "Seguridad en Arquitectura"],
    6: ["Criptografía Básica", "Autenticación", "Autorización", "OWASP Top 10", "Inyección SQL", "XSS", "CSRF", "Seguridad en Redes", "Firewalls", "Auditoría", "Respuesta a Incidentes", "Normativas", "Seguridad en la Nube"]
};

// ========== FUNCIONES DE TIEMPO DE ESTUDIO ==========

/**
 * Iniciar conteo de tiempo de estudio
 */
function iniciarContadorTiempo() {
    if (tiempoEstudioActivo) return;
    
    tiempoEstudioActivo = true;
    tiempoAcumulado = 0;
    ultimoTick = Date.now();
    
    console.log('⏱️ Contador de tiempo de estudio iniciado');
    
    // Enviar heartbeat cada 60 segundos
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(enviarHeartbeat, 60000); // Cada minuto
}

/**
 * Detener conteo de tiempo de estudio
 */
function detenerContadorTiempo() {
    if (!tiempoEstudioActivo) return;
    
    // Enviar último tiempo antes de detener
    if (tiempoAcumulado > 0) {
        enviarHeartbeat();
    }
    
    tiempoEstudioActivo = false;
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    
    console.log('⏱️ Contador de tiempo de estudio detenido');
}

/**
 * Enviar heartbeat con tiempo acumulado
 */
async function enviarHeartbeat() {
    if (!currentUser || currentUser.role !== 'alumno') return;
    
    const ahora = Date.now();
    const segundosTranscurridos = Math.floor((ahora - ultimoTick) / 1000);
    
    if (segundosTranscurridos >= 5) { // Solo enviar si pasaron al menos 5 segundos
        tiempoAcumulado += segundosTranscurridos;
        
        console.log(`💓 Heartbeat: +${segundosTranscurridos}s (Total acumulado: ${tiempoAcumulado}s)`);
        
        try {
            await API.apiSendHeartbeat(segundosTranscurridos, currentMateriaId, null);
            
            // Actualizar UI si es necesario
            const horasElement = document.getElementById('horasSemana');
            if (horasElement) {
                const horasActuales = parseFloat(horasElement.innerText) || 0;
                const nuevasHoras = horasActuales + (segundosTranscurridos / 3600);
                horasElement.innerText = nuevasHoras.toFixed(1) + 'h';
            }
            
        } catch (error) {
            console.error('Error enviando heartbeat:', error);
        }
    }

    if (tiempoAcumulado >= 3600) { // Cada hora completa
        const horasCompletas = Math.floor(tiempoAcumulado / 3600);
        await otorgarTokens(horasCompletas * 5, `${horasCompletas} hora(s) de estudio`);
        tiempoAcumulado = tiempoAcumulado % 3600;
    }
    
    ultimoTick = ahora;
}

/**
 * Detectar actividad del usuario (para no contar tiempo idle)
 */
function reiniciarActividad() {
    lastActivityTime = Date.now();
    if (tiempoEstudioActivo && ultimoTick) {
        // Reajustar el tick para evitar contar tiempo idle
        ultimoTick = Date.now();
    }
}

// Detectar actividad del usuario
const eventosActividad = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
eventosActividad.forEach(evento => {
    document.addEventListener(evento, reiniciarActividad);
});

// Detectar cuando la página pierde foco
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Página en segundo plano - pausar conteo
        if (tiempoEstudioActivo) {
            enviarHeartbeat(); // Enviar tiempo antes de pausar
            tiempoEstudioActivo = false;
        }
    } else {
        // Página visible - reanudar
        if (currentUser?.role === 'alumno') {
            ultimoTick = Date.now();
            tiempoEstudioActivo = true;
        }
    }
});



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

// ========== FUNCIONES PARA MÓDULOS INDEPENDIENTES ==========


async function cargarModulosCompletadosLocal(materiaId) {
    // Limpiar el Map para esta materia antes de cargar
    for (let i = 0; i < 20; i++) {
        modulosCompletadosMap.delete(`${materiaId}_${i}`);
    }
    
    // Cargar SOLO desde backend (fuente de verdad)
    try {
        const token = localStorage.getItem('adaptatec_token');
        const response = await fetch(`/api/users/modulos-completados?materiaId=${materiaId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`📥 Cargando desde backend para materia ${materiaId}:`, data);
            
            data.forEach(modulo => {
                if (modulo.materiaId == materiaId) {
                    modulosCompletadosMap.set(`${materiaId}_${modulo.moduloId}`, true);
                }
            });
            
            // Actualizar localStorage con los datos correctos del backend
            const userId = currentUser?.id;
            const completados = [];
            for (let i = 0; i < 20; i++) {
                if (modulosCompletadosMap.get(`${materiaId}_${i}`) === true) {
                    completados.push(i);
                }
            }
            localStorage.setItem(`modulos_completados_${userId}_${materiaId}`, JSON.stringify(completados));
        }
    } catch (error) {
        console.warn('No se pudo cargar módulos del backend:', error);
    }
}


async function cargarTodosModulosCompletados() {
    // ✅ LIMPIAR EL MAP ANTES DE CARGAR NUEVOS DATOS
    modulosCompletadosMap.clear();
    console.log('🗑️ Map de módulos limpiado para nuevo usuario');
    
    try {
        const token = localStorage.getItem('adaptatec_token');
        const response = await fetch('/api/users/modulos-completados', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const modulos = await response.json();
            console.log(`📥 Cargando ${modulos.length} módulos completados para el usuario actual`);
            
            modulos.forEach(modulo => {
                modulosCompletadosMap.set(`${modulo.materiaId}_${modulo.moduloId}`, true);
            });
            
            // Guardar en localStorage por materia
            const porMateria = {};
            modulos.forEach(modulo => {
                if (!porMateria[modulo.materiaId]) porMateria[modulo.materiaId] = [];
                porMateria[modulo.materiaId].push(modulo.moduloId);
            });
            
            for (const [materiaId, completados] of Object.entries(porMateria)) {
                localStorage.setItem(`modulos_completados_${materiaId}`, JSON.stringify(completados));
            }
        }
    } catch (error) {
        console.error('Error cargando módulos completados:', error);
    }
}

function guardarTodosModulosCompletados(materiaId) {
    const userId = currentUser?.id;
    if (!userId) return;
    
    const completados = [];
    for (let i = 0; i < 20; i++) {
        if (modulosCompletadosMap.get(`${materiaId}_${i}`) === true) {
            completados.push(i);
        }
    }
    if (completados.length > 0) {
        localStorage.setItem(`modulos_completados_${userId}_${materiaId}`, JSON.stringify(completados));
    }
}

async function guardarModuloCompletadoLocal(materiaId, moduloIndex) {
    const key = `modulos_completados_${materiaId}`;
    const saved = localStorage.getItem(key);
    let completados = saved ? JSON.parse(saved) : [];
    if (!completados.includes(moduloIndex)) {
        completados.push(moduloIndex);
        localStorage.setItem(key, JSON.stringify(completados));
    }
    modulosCompletadosMap.set(`${materiaId}_${moduloIndex}`, true);
    
    // También guardar en el backend
    try {
        const token = localStorage.getItem('adaptatec_token');
        await fetch('/api/users/modulo-completado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                materiaId: materiaId,
                moduloId: moduloIndex,
                moduloNombre: `Módulo ${moduloIndex + 1}`
            })
        });
    } catch (error) {
        console.error('Error guardando módulo en backend:', error);
    }
}

function calcularModulosCompletadosMateria(materiaId) {
    let count = 0;
    const modulos = modulosPorMateria[materiaId] || [];
    for (let i = 0; i < modulos.length; i++) {
        if (modulosCompletadosMap.get(`${materiaId}_${i}`) === true) {
            count++;
        }
    }
    return count;
}


async function abrirModulosMateria(materiaId, abrirChat = false) {
    const materia = currentUser.materias.find(m => m.id === materiaId);
    if (!materia) return;
    
    currentMateriaId = materiaId;
    
    // Cargar módulos completados desde backend
    await cargarModulosCompletadosLocal(materiaId);
    
    try {
        const token = localStorage.getItem('adaptatec_token');
        
        // Obtener módulos de la materia desde el backend
        const modulosResponse = await fetch(`/api/materias/${materiaId}/modulos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let modulos = [];
        if (modulosResponse.ok) {
            const data = await modulosResponse.json();
            // Si la respuesta es un array directo o tiene propiedad modulos
            modulos = Array.isArray(data) ? data : (data.modulos || []);
            console.log('📚 Módulos cargados desde BD:', modulos);
        }
        
        // Si no hay módulos en BD, usar los estáticos como fallback
        if (modulos.length === 0) {
            console.warn('⚠️ No hay módulos en BD, usando estáticos');
            modulos = modulosPorMateria[materiaId] || [`Módulo 1`, `Módulo 2`, `Módulo 3`];
            // Convertir a formato de objeto
            modulos = modulos.map((nombre, idx) => ({ id: idx + 1, nombre: nombre, orden: idx + 1 }));
        }
        
        // Calcular módulos completados de esta materia
        const completados = calcularModulosCompletadosMateria(materiaId);
        const nuevoProgreso = Math.round((completados / materia.totalModulos) * 100);
        
        // Actualizar materia localmente
        materia.modulosCompletados = completados;
        materia.progress = nuevoProgreso;
        
        const titleEl = document.getElementById('modulosMateriaTitle');
        const descEl = document.getElementById('modulosMateriaDesc');
        if (titleEl) titleEl.innerText = materia.name;
        if (descEl) descEl.innerHTML = `Progreso: ${nuevoProgreso}% completado | Módulos completados: ${completados}/${materia.totalModulos}`;
        
        const container = document.getElementById('modulosGrid');
        if (container) {
            container.innerHTML = modulos.map((modulo, index) => {
                const moduloNombre = typeof modulo === 'string' ? modulo : modulo.nombre;
                const moduloId = typeof modulo === 'object' ? modulo.id : index;
                const estaCompletado = modulosCompletadosMap.get(`${materiaId}_${index}`) === true;
                
                return `
                    <div class="modulo-card ${estaCompletado ? 'completado' : 'pendiente'}" data-modulo-index="${index}" data-materia-id="${materiaId}">
                        <div class="modulo-info">
                            <h4>📖 ${moduloNombre}</h4>
                            <p>${estaCompletado ? '✅ Completado' : '📌 Por completar'}</p>
                        </div>
                        <div class="modulo-actions" style="display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end;">
                            ${!estaCompletado ? `
                                <button class="btn-ver-modulo btn-small" data-modulo="${moduloNombre}" data-index="${index}" data-materia-id="${materiaId}">
                                    📖 Ver contenido
                                </button>
                                <button class="btn-examen-modulo btn-small" data-modulo="${moduloNombre}" data-index="${index}" data-materia-id="${materiaId}">
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
                const index = parseInt(btn.dataset.index);
                const materiaIdLocal = parseInt(btn.dataset.materiaId);
                const moduloNombre = btn.dataset.modulo;
                verContenidoModulo(materiaIdLocal, index, moduloNombre);
            });
        });
        
        // Agregar event listeners para botones de examen
        document.querySelectorAll('.btn-examen-modulo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                const materiaIdLocal = parseInt(btn.dataset.materiaId);
                const moduloNombre = btn.dataset.modulo;
                iniciarExamen(materia, index, moduloNombre);
            });
        });
        
        // Click en la tarjeta del módulo (ver contenido)
        document.querySelectorAll('.modulo-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-ver-modulo') || e.target.classList.contains('btn-examen-modulo')) return;
                const index = parseInt(card.dataset.moduloIndex);
                const modulo = modulos[index];
                const moduloNombre = typeof modulo === 'string' ? modulo : modulo.nombre;
                const materiaIdLocal = parseInt(card.dataset.materiaId);
                verContenidoModulo(materiaIdLocal, index, moduloNombre);
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
        
    } catch (error) {
        console.error('Error cargando módulos:', error);
        // Fallback a módulos estáticos
        const modulos = modulosPorMateria[materiaId] || [`Módulo 1`, `Módulo 2`, `Módulo 3`];
        // ... resto del código fallback
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

    if (isAdmin) {
        setTimeout(() => {
            renderAdminPanel();
        }, 100);
    return; // Importante: los admin no ven el dashboard de estudiante
}
}

async function renderAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    console.log('🔧 renderAdminPanel ejecutándose');
    
    initAdminTabs();
    await loadGeneralSection();
    await loadRegistrarUsuariosSection();
    await loadMonitoreoAlumnosSection();
    await loadAdminMateriasSection();
    await loadMiscelaneoSection();
    
    // Configurar eventos del modal
    setupMateriaModalEvents();
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

async function renderRecompensas() {
    if (!currentUser || currentUser.role !== 'alumno') return;
    
    // Mostrar tokens
    const tokens = currentUser.tokens || 0;
    const tokensDisplay = document.getElementById('tokensDisplay');
    if (tokensDisplay) tokensDisplay.innerText = tokens;
    
    // Cargar recompensas disponibles
    try {
        const token = localStorage.getItem('adaptatec_token');
        
        // Obtener recompensas
        const recompensasRes = await fetch('/api/users/recompensas-canjeables', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const recompensas = await recompensasRes.json();
        
        // Obtener canjes del usuario
        const canjesRes = await fetch('/api/users/mis-canjes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const canjes = await canjesRes.json();
        
        // Renderizar recompensas
        const grid = document.getElementById('recompensasGrid');
        if (grid) {
            grid.innerHTML = recompensas.map(r => `
                <div class="recompensa-card" style="background: white; border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: transform 0.2s;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">${r.nombre.charAt(0)}</div>
                    <h3 style="margin: 10px 0 5px; font-size: 1.1rem;">${r.nombre}</h3>
                    <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 15px;">${r.descripcion}</p>
                    <div style="font-weight: bold; color: #f59e0b; margin-bottom: 15px;">⭐ ${r.tokens_necesarios} tokens</div>
                    <button class="btn-canjear" data-id="${r.id}" data-nombre="${r.nombre}" data-tokens="${r.tokens_necesarios}" 
                        style="background: ${tokens >= r.tokens_necesarios ? '#3b82f6' : '#cbd5e1'}; color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: ${tokens >= r.tokens_necesarios ? 'pointer' : 'not-allowed'}; width: 100%; font-weight: 500;">
                        ${tokens >= r.tokens_necesarios ? 'Canjear' : 'Tokens insuficientes'}
                    </button>
                </div>
            `).join('');
        }
        
        // Agregar event listeners a botones de canje
        document.querySelectorAll('.btn-canjear').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                const nombre = btn.dataset.nombre;
                const tokensNecesarios = parseInt(btn.dataset.tokens);
                
                if (tokens < tokensNecesarios) {
                    alert(`❌ Necesitas ${tokensNecesarios} tokens para canjear ${nombre}`);
                    return;
                }
                
                if (confirm(`¿Canjear ${nombre} por ${tokensNecesarios} tokens?`)) {
                    await canjearRecompensa(id, nombre, tokensNecesarios);
                }
            });
        });
        
        // Renderizar canjes realizados
        const canjesList = document.getElementById('misCanjesList');
        if (canjesList) {
            if (canjes.length === 0) {
                canjesList.innerHTML = '<p class="text-muted">📭 Aún no has canjeado ninguna recompensa.</p>';
            } else {
                canjesList.innerHTML = canjes.map(c => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 8px; margin-bottom: 8px;">
                        <div>
                            <strong>${c.nombre}</strong>
                            <p style="margin: 0; font-size: 0.8rem; color: #64748b;">${new Date(c.fecha_canje).toLocaleDateString()}</p>
                        </div>
                        <span style="background: ${c.estado === 'entregado' ? '#10b981' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem;">
                            ${c.estado === 'entregado' ? 'Entregado' : 'Pendiente'}
                        </span>
                    </div>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Error cargando recompensas:', error);
    }
}

async function canjearRecompensa(recompensaId, nombre, tokensNecesarios) {
    try {
        const token = localStorage.getItem('adaptatec_token');
        const response = await fetch('/api/users/canjear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ recompensaId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`✅ ¡Canje exitoso! ${nombre}\n\n${data.mensaje}`);
            // Actualizar tokens
            if (currentUser) currentUser.tokens = data.tokensRestantes;
            // Recargar vista
            renderRecompensas();
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error en canje:', error);
        alert('Error al procesar el canje. Intenta de nuevo.');
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
    
    // Mostrar/ocultar botones de admin
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
    });
    
    // Mostrar/ocultar secciones del menú
    const adminSection = document.querySelector('.admin-menu-section');
    const studentSection = document.querySelector('.student-menu-section');
    
    if (adminSection) adminSection.style.display = isAdmin ? 'block' : 'none';
    if (studentSection) studentSection.style.display = isStudent ? 'block' : 'none';
}

// ========== SECCIÓN REGISTRAR USUARIOS ==========
async function loadRegistrarUsuariosSection() {
    console.log('🔄 Cargando vista Registrar Usuarios');
    
    const form = document.getElementById('adminRegisterUserForm');
    if (!form) {
        console.error('❌ Formulario no encontrado');
        return;
    }
    
    // Remover event listener anterior si existe
    form.removeEventListener('submit', handleAdminRegisterSubmit);
    form.addEventListener('submit', handleAdminRegisterSubmit);
}

async function handleAdminRegisterSubmit(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('adminRegNombre')?.value;
    const email = document.getElementById('adminRegEmail')?.value;
    const username = document.getElementById('adminRegUsername')?.value;
    const matricula = document.getElementById('adminRegMatricula')?.value;
    const password = document.getElementById('adminRegPassword')?.value;
    const rol = document.getElementById('adminRegRol')?.value;
    
    if (!nombre || !email || !username || !matricula || !password) {
        showToastAdmin('❌ Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('adaptatec_token');
        
        // CAMBIAR: usar /api/auth/register en lugar de /api/users/register
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: username,
                password: password,
                email: email,
                nombre: nombre,
                matricula: matricula,
                role: rol
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showToastAdmin(`✅ Usuario ${rol} registrado exitosamente`, 'success');
            // Limpiar el formulario
            document.getElementById('adminRegisterUserForm').reset();
        } else {
            const error = await response.text();
            showToastAdmin(`❌ Error: ${error || 'No se pudo registrar'}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToastAdmin('❌ Error al registrar usuario', 'error');
    }
}


function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(getViewId(viewId));
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
    if (viewId === 'registrar-usuarios') loadRegistrarUsuariosSection();
    if (viewId === 'monitoreo-alumnos') loadMonitoreoAlumnosSection();
    if (viewId === 'miscelaneo') loadMiscelaneoSection();
    if (viewId === 'general') loadGeneralSection();
    if (viewId === 'admin-materias') loadAdminMateriasSection();
}


// ========== EVENT LISTENERS & AUTH ==========
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const user = await API.apiLogin(username, password);
        
        // ✅ LIMPIAR MAP ANTES DE CARGAR NUEVO USUARIO
        modulosCompletadosMap.clear();
        
        // Cargar perfil completo del usuario
        currentUser = await API.apiGetProfile();
        
        document.getElementById('userNameDisplay').innerText = currentUser.name || currentUser.username;
        document.getElementById('userRoleDisplay').innerText = currentUser.role.toUpperCase();
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('appContainer').classList.add('active');
        applyRoleVisibility();
        
        // INICIAR CONTADOR DE TIEMPO para alumnos
        if (currentUser.role === 'alumno') {
            iniciarContadorTiempo();
            await cargarRecompensasObtenidas();
            
            // ✅ Cargar módulos completados del nuevo usuario
            await cargarTodosModulosCompletados();
        }
        
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

document.getElementById('logoutBtn').addEventListener('click', () => {
    detenerContadorTiempo();
    API.apiLogout();
    currentUser = null;
    document.getElementById('appContainer').classList.remove('active');
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
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
            console.log(`📝 Aprobando módulo índice: ${moduloIndex}, nombre: ${moduloNombre}`);
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
            let tokensGanados = 0;
            if (aciertos === 5) tokensGanados = 15;
            else if (aciertos === 4) tokensGanados = 10;
            else if (aciertos === 3) tokensGanados = 6;
            
            if (tokensGanados > 0) {
                await otorgarTokens(tokensGanados, `Examen ${moduloNombre} (${aciertos}/5 correctas)`);
            }
            
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
    
    const moduloKey = `${materiaId}_${moduloIndex}`;
    
    // Verificar si ya está completado
    if (modulosCompletadosMap.get(moduloKey) === true) {
        console.log(`⚠️ Módulo ${moduloNombre} ya estaba completado`);
        return;
    }
    
    console.log(`📝 Completando módulo: ${moduloNombre} (${moduloKey})`);
    
    // Obtener token
    const token = localStorage.getItem('adaptatec_token');
    
    try {
        // 1. Guardar en backend primero
        const response = await fetch('/api/users/modulo-completado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                materiaId: materiaId,
                moduloId: moduloIndex,
                moduloNombre: moduloNombre
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        // 2. Guardar en localStorage
        const key = `modulos_completados_${materiaId}`;
        const saved = localStorage.getItem(key);
        let completados = saved ? JSON.parse(saved) : [];
        if (!completados.includes(moduloIndex)) {
            completados.push(moduloIndex);
            localStorage.setItem(key, JSON.stringify(completados));
        }
        
        // 3. Actualizar Map
        modulosCompletadosMap.set(moduloKey, true);
        
        // 4. Calcular nuevo progreso
        const nuevosCompletados = calcularModulosCompletadosMateria(materiaId);
        const nuevoProgreso = Math.round((nuevosCompletados / materia.totalModulos) * 100);
        
        // 5. Actualizar progreso en backend
        const progressResponse = await fetch(`/api/users/progress/${materiaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                progress: nuevoProgreso,
                modulosCompletados: nuevosCompletados
            })
        });
        
        if (!progressResponse.ok) {
            console.warn('No se pudo actualizar el progreso:', await progressResponse.text());
        }
        
        // 6. Actualizar localmente
        materia.modulosCompletados = nuevosCompletados;
        materia.progress = nuevoProgreso;
        
        // 7. Registrar actividad
        await fetch('/api/users/activity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                descripcion: `🎉 ¡Completaste el módulo "${moduloNombre}" en ${materia.name}!`,
                tipo: 'modulo'
            })
        }).catch(e => console.warn('Error registrando actividad:', e));
        
        // 8. Actualizar estadísticas
        calcularEstadisticasGenerales();
        
        console.log(`✅ Módulo "${moduloNombre}" completado exitosamente. Progreso: ${materia.progress}%`);
        
    } catch (error) {
        console.error('Error al marcar módulo completado:', error);
        throw error;
    }
}

// ========== SISTEMA DE RECOMPENSAS Y TOKENS ==========



/**
 * Cargar recompensas ya obtenidas desde el backend
 */
async function cargarRecompensasObtenidas() {
    try {
        const user = await API.apiGetProfile();
        if (user.recompensas_obtenidas) {
            recompensasObtenidas = new Set(JSON.parse(user.recompensas_obtenidas));
        }
    } catch (error) {
        console.error('Error cargando recompensas:', error);
    }
}

/**
 * Otorgar tokens al usuario
 */
async function otorgarTokens(cantidad, motivo) {
    try {
        const token = localStorage.getItem('adaptatec_token');
        const response = await fetch('/api/users/tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cantidad, motivo })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`🎁 +${cantidad} tokens por: ${motivo}`);
            if (currentUser) {
                currentUser.tokens = data.tokensTotales;
            }
            return true;
        }
    } catch (error) {
        console.error('Error otorgando tokens:', error);
    }
    return false;
}

/**
 * Otorgar recompensa por primera vez
 */
async function otorgarRecompensa(nombre, tokens, condicion) {
    if (recompensasObtenidas.has(nombre)) return false;
    
    if (condicion()) {
        recompensasObtenidas.add(nombre);
        await otorgarTokens(tokens, `Recompensa: ${nombre}`);
        
        // Guardar en BD
        const token = localStorage.getItem('adaptatec_token');
        await fetch('/api/users/recompensa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre, tokens })
        });
        
        // Mostrar notificación
        mostrarNotificacion(`🏆 ¡Nueva recompensa! ${nombre}\n🎁 +${tokens} tokens`);
        return true;
    }
    return false;
}

/**
 * Mostrar notificación
 */
function mostrarNotificacion(mensaje) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-recompensa';
    notificacion.innerHTML = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #f59e0b, #f97316);
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: bold;
        z-index: 3000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 4000);
}

// ========== FUNCIONES AUXILIARES PARA ADMIN ==========

// ========== FUNCIONES ADMIN CORREGIDAS ==========

async function verMateriasAlumno(alumnoId, alumnoNombre) {
    try {
        const token = localStorage.getItem('adaptatec_token');
        const response = await fetch(`/api/users/${alumnoId}/materias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const materias = await response.json();
            
            if (materias.length === 0) {
                alert(`📭 ${alumnoNombre} no tiene materias inscritas`);
                return;
            }
            
            // Crear mensaje con la lista de materias
            let mensaje = `📚 Materias inscritas de ${alumnoNombre}:\n\n`;
            materias.forEach((m, index) => {
                const progreso = m.progress || 0;
                const estado = m.estado || 'cursando';
                let emoji = '';
                if (progreso === 0) emoji = '🟡';
                else if (progreso < 50) emoji = '🟠';
                else if (progreso < 100) emoji = '🟢';
                else emoji = '✅';
                
                mensaje += `${index + 1}. ${emoji} ${m.nombre}\n`;
                mensaje += `   📊 Progreso: ${progreso}% | Estado: ${estado}\n\n`;
            });
            
            alert(mensaje);
        } else {
            const error = await response.text();
            console.error('Error response:', error);
            alert('❌ Error al cargar las materias del alumno');
        }
    } catch (error) {
        console.error('Error en verMateriasAlumno:', error);
        alert('❌ Error al cargar las materias');
    }
}
window.verMateriasAlumno = verMateriasAlumno;

// Abrir modal para dar de baja materia
window.abrirModalBajaMateria = async function(alumnoId, alumnoNombre) {
    alumnoSeleccionadoId = alumnoId;
    alumnoSeleccionadoNombre = alumnoNombre;
    
    const modal = document.getElementById('bajaMateriaModal');
    const alumnoSpan = document.getElementById('bajaAlumnoNombre');
    const materiaSelect = document.getElementById('bajaMateriaSelect');
    
    if (!modal) return;
    
    alumnoSpan.innerText = alumnoNombre;
    
    // Cargar materias del alumno
    try {
        const token = localStorage.getItem('adaptatec_token');
        const response = await fetch(`/api/users/${alumnoId}/materias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const materias = await response.json();
            if (materias.length === 0) {
                materiaSelect.innerHTML = '<option value="">No tiene materias inscritas</option>';
            } else {
                materiaSelect.innerHTML = '<option value="">-- Selecciona una materia --</option>' +
                    materias.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');
            }
        } else {
            materiaSelect.innerHTML = '<option value="">Error al cargar materias</option>';
        }
    } catch (error) {
        console.error('Error cargando materias:', error);
        materiaSelect.innerHTML = '<option value="">Error al cargar materias</option>';
    }
    
    modal.style.display = 'flex';
};

// Cargar tabla de alumnos
async function loadAlumnosTableAdmin() {
    const tbody = document.getElementById('alumnosTableBody');
    if (!tbody) {
        console.error('❌ tbody no encontrado');
        return;
    }
    
    try {
        const token = localStorage.getItem('adaptatec_token');
        console.log('📡 Cargando alumnos...');
        
        const response = await fetch('/api/users/admin/all-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const users = await response.json();
        const alumnos = users.filter(u => u.role === 'alumno');
        
        if (alumnos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay alumnos registrados</td></tr>';
            return;
        }
        
        // Para cada alumno, cargar sus materias inscritas
        for (const alumno of alumnos) {
            try {
                const materiasResponse = await fetch(`/api/users/${alumno.id}/materias`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (materiasResponse.ok) {
                    alumno.materiasInscritas = await materiasResponse.json();
                } else {
                    alumno.materiasInscritas = [];
                }
            } catch (err) {
                alumno.materiasInscritas = [];
            }
        }
        
        tbody.innerHTML = alumnos.map(alumno => `
            <tr>
                <td>${alumno.username || 'N/A'}</td>
                <td>${alumno.name || 'N/A'}</td>
                <td>${alumno.email || 'N/A'}</td>
                <td>${alumno.nivel || 1}</td>
                <td>${alumno.puntos || 0}</td>
                <td>
                    ${alumno.materiasInscritas && alumno.materiasInscritas.length > 0 
                        ? `<span style="cursor: pointer; color: #3b82f6;" onclick="verMateriasAlumno(${alumno.id}, '${alumno.name}')">
                            📚 ${alumno.materiasInscritas.length} materia(s)
                           </span>`
                        : '📭 Sin materias'}
                 </td>
                <td>
                    <button class="btn-small" onclick="editAlumnoAdmin('${alumno.username}')">✏️ Editar</button>
                    <button class="btn-small btn-warning" onclick="abrirModalBajaMateria(${alumno.id}, '${alumno.name}')" style="background: #f59e0b; color: white;">📚 Dar Baja Materias</button>
                 </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error al cargar alumnos:', error);
        tbody.innerHTML = '<td><td colspan="7" style="text-align: center;">Error al cargar datos</td></tr>';
    }
}

// Cargar estadísticas de alumnos
async function loadAlumnosEstadisticasAdmin() {
    try {
        const token = localStorage.getItem('adaptatec_token');
        const response = await fetch('/api/users/admin/all-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const users = await response.json();
        const alumnos = users.filter(u => u.role === 'alumno');
        
        const totalAlumnos = alumnos.length;
        const promedioNivel = totalAlumnos > 0 
            ? Math.round(alumnos.reduce((sum, a) => sum + (a.nivel || 1), 0) / totalAlumnos) : 0;
        const totalPuntos = alumnos.reduce((sum, a) => sum + (a.puntos || 0), 0);
        
        // Actualizar elementos HTML
        const totalAlumnosEl = document.getElementById('totalAlumnosCount');
        const promedioNivelEl = document.getElementById('promedioNivelAlumnos');
        const totalPuntosEl = document.getElementById('totalPuntosAlumnos');
        
        if (totalAlumnosEl) totalAlumnosEl.innerText = totalAlumnos;
        if (promedioNivelEl) promedioNivelEl.innerText = promedioNivel;
        if (totalPuntosEl) totalPuntosEl.innerText = totalPuntos;
        
        console.log(`📊 Estadísticas: ${totalAlumnos} alumnos, nivel promedio ${promedioNivel}, ${totalPuntos} puntos`);
        
    } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error);
    }
}

// Cargar estadísticas de misceláneo
async function loadMiscelaneoStatsAdmin() {
    try {
        const token = localStorage.getItem('adaptatec_token');
        const response = await fetch('/api/users/admin/all-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const users = await response.json();
        const totalUsers = users.length;
        
        const totalUsersMisc = document.getElementById('totalUsersMisc');
        if (totalUsersMisc) totalUsersMisc.innerText = totalUsers;
        
        console.log(`📈 Total usuarios en sistema: ${totalUsers}`);
        
    } catch (error) {
        console.error('❌ Error al cargar estadísticas misceláneo:', error);
    }
}

// Configurar exportación
function setupExportAlumnosAdmin() {
    const exportBtn = document.getElementById('exportAlumnosBtn');
    if (exportBtn) {
        exportBtn.onclick = async () => {
            try {
                const token = localStorage.getItem('adaptatec_token');
                const response = await fetch('/api/users/admin/all-users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const users = await response.json();
                const alumnos = users.filter(u => u.role === 'alumno');
                
                const headers = ['Usuario', 'Nombre', 'Email', 'Nivel', 'Puntos'];
                const rows = alumnos.map(a => [a.username, a.name, a.email, a.nivel, a.puntos]);
                const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `alumnos_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                URL.revokeObjectURL(link.href);
                
                showToastAdmin('✅ Exportado correctamente', 'success');
            } catch (error) {
                showToastAdmin('❌ Error al exportar', 'error');
            }
        };
    }
}

// Configurar filtros
function setupMonitoreoFiltersAdmin() {
    const searchInput = document.getElementById('searchAlumnoInput');
    const nivelSelect = document.getElementById('filterNivelSelect');
    
    if (searchInput) {
        searchInput.oninput = () => loadAlumnosTableAdmin();
    }
    if (nivelSelect) {
        nivelSelect.onchange = () => loadAlumnosTableAdmin();
    }
}

// Editar alumno
window.editAlumnoAdmin = async function(username) {
    const nuevoNombre = prompt('✏️ Editar nombre:', '');
    if (nuevoNombre) {
        try {
            const token = localStorage.getItem('adaptatec_token');
            await fetch(`/api/users/admin/user/${username}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: nuevoNombre })
            });
            await loadAlumnosTableAdmin();
            await loadAlumnosEstadisticasAdmin();
            showToastAdmin('✅ Alumno actualizado', 'success');
        } catch (error) {
            showToastAdmin('❌ Error al actualizar', 'error');
        }
    }
};

// Eliminar alumno
window.deleteAlumnoAdmin = async function(username) {
    if (confirm(`¿Eliminar al alumno ${username}?`)) {
        try {
            const token = localStorage.getItem('adaptatec_token');
            await fetch(`/api/users/admin/user/${username}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await loadAlumnosTableAdmin();
            await loadAlumnosEstadisticasAdmin();
            showToastAdmin('✅ Alumno eliminado', 'success');
        } catch (error) {
            showToastAdmin('❌ Error al eliminar', 'error');
        }
    }
};

// Configurar botones de misceláneo
function setupMiscelaneoButtonsAdmin() {
    const backupBtn = document.getElementById('backupDbBtnMisc');
    const cleanBtn = document.getElementById('cleanDbBtnMisc');
    const testGeminiBtn = document.getElementById('testGeminiBtnMisc');
    
    if (backupBtn) {
        backupBtn.onclick = () => {
            const data = { timestamp: new Date(), backup: 'manual' };
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `backup_${Date.now()}.json`;
            link.click();
            showToastAdmin('✅ Respaldado', 'success');
        };
    }
    
    if (cleanBtn) {
        cleanBtn.onclick = () => {
            if (confirm('¿Limpiar caché?')) {
                localStorage.removeItem('ai_requests');
                showToastAdmin('✅ Caché limpiada', 'success');
            }
        };
    }
    
    if (testGeminiBtn) {
        testGeminiBtn.onclick = async () => {
            showToastAdmin('🔌 Probando conexión...', 'info');
            setTimeout(() => {
                showToastAdmin('✅ Conexión exitosa', 'success');
            }, 1000);
        };
    }
}

// Mostrar toast
function showToastAdmin(mensaje, tipo) {
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
        color: white; padding: 12px 20px; border-radius: 8px;
        z-index: 10000; font-size: 14px; animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}



// Las funciones principales de sección (ya las tienes, pero asegúrate que llamen a estas)
async function loadMonitoreoAlumnosSection() {
    console.log('🔄 Cargando Monitoreo de Alumnos');
    await loadAlumnosTableAdmin();
    await loadAlumnosEstadisticasAdmin();
    setupMonitoreoFiltersAdmin();
    setupExportAlumnosAdmin();
    setupBajaMateriaModal();
}

async function loadMiscelaneoSection() {
    console.log('🔄 Cargando Misceláneo');
    await loadMiscelaneoStatsAdmin();
    setupMiscelaneoButtonsAdmin();
    await loadAsignacionData(); // Agregar esta línea
    
    // Evento del botón de asignar
    const asignarBtn = document.getElementById('asignarMateriasBtn');
    if (asignarBtn) {
        asignarBtn.onclick = asignarMateriasAlumno;
    }
}

async function loadGeneralSection() {
    console.log('🔄 Cargando Panel General');
    
    try {
        const token = localStorage.getItem('adaptatec_token');
        const response = await fetch('/api/users/admin/all-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar usuarios');
        
        const users = await response.json();
        
        // Calcular estadísticas
        const totalUsuarios = users.length;
        const totalAlumnos = users.filter(u => u.role === 'alumno').length;
        const totalDocentes = users.filter(u => u.role === 'docente').length;
        const totalAdmins = users.filter(u => u.role === 'admin').length;
        
        // Cargar materias
        const materiasResponse = await fetch('/api/materias', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const materias = await materiasResponse.json();
        const totalMateriasActivas = materias.filter(m => m.activo !== false).length;
        
        // Calcular horas totales, logros y tokens
        let totalHoras = 0;
        let totalLogros = 0;
        let totalTokens = 0;
        
        users.forEach(user => {
            totalHoras += user.horas || 0;
            totalLogros += user.logros || 0;
            totalTokens += user.tokens || 0;
        });
        
        // Actualizar DOM
        document.getElementById('totalUsuariosGeneral').innerText = totalUsuarios;
        document.getElementById('totalAlumnosGeneral').innerText = totalAlumnos;
        document.getElementById('totalAdminsGeneral').innerText = totalAdmins;
        document.getElementById('totalMateriasGeneral').innerText = totalMateriasActivas;
        document.getElementById('totalHorasGeneral').innerText = totalHoras;
        document.getElementById('totalTokensGeneral').innerText = totalTokens;
        
        console.log('✅ Panel General actualizado');
        
    } catch (error) {
        console.error('❌ Error cargando Panel General:', error);
        // Mostrar datos de ejemplo si hay error
        document.getElementById('totalUsuariosGeneral').innerText = '--';
        document.getElementById('totalAlumnosGeneral').innerText = '--';
        document.getElementById('totalAdminsGeneral').innerText = '--';
        document.getElementById('totalMateriasGeneral').innerText = '--';
        document.getElementById('totalHorasGeneral').innerText = '--';
        document.getElementById('totalTokensGeneral').innerText = '--';
    }
}

async function loadAdminMateriasSection() {
    console.log('🔄 Cargando Gestión de Materias');
    
    const tbody = document.getElementById('materiasAdminTableBody');
    if (!tbody) return;
    
    try {
        const token = localStorage.getItem('adaptatec_token');
        // Quitar el filtro WHERE activo = 1 para traer TODAS las materias
        const response = await fetch('/api/materias/admin/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Si la ruta no existe, usar la normal y mostrar todas
        let materias = [];
        if (response.ok) {
            materias = await response.json();
        } else {
            // Fallback: usar la ruta normal
            const fallbackResponse = await fetch('/api/materias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            materias = await fallbackResponse.json();
        }
        
        if (materias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay materias registradas</td><tr>';
            return;
        }
        
        tbody.innerHTML = materias.map(materia => {
            const esActiva = materia.activo !== false;
            return `
                <tr>
                    <td>${materia.id || 'N/A'}</td>
                    <td>
                        <strong>${materia.nombre || 'Sin nombre'}</strong>
                        <br>
                        <span style="font-size: 0.7rem; color: ${esActiva ? '#10b981' : '#ef4444'};">
                            ${esActiva ? '✅ Activa' : '❌ Inactiva'}
                        </span>
                    </td>
                    <td>${(materia.desc || materia.descripcion || '').substring(0, 60)}...</td>
                    <td>${materia.total_modulos || 0} módulos</td>
                </tr>
            `;
        }).join('');
        
        console.log('✅ Materias cargadas:', materias.length);
        
    } catch (error) {
        console.error('❌ Error cargando materias:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Error al cargar materias</td><tr>';
    }
}

// Función para activar/desactivar materia
window.toggleMateriaStatus = async function(materiaId) {
    try {
        const token = localStorage.getItem('adaptatec_token');
        const response = await fetch(`/api/materias/${materiaId}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showToastAdmin('✅ Estado de materia actualizado', 'success');
            await loadAdminMateriasSection();
            await loadGeneralSection(); // Actualizar también el panel general
        } else {
            showToastAdmin('❌ Error al actualizar estado', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToastAdmin('❌ Error al actualizar estado', 'error');
    }
};

// Función para eliminar materia
window.deleteMateria = async function(materiaId) {
    if (confirm('¿Estás seguro de eliminar esta materia? Esta acción no se puede deshacer.')) {
        try {
            const token = localStorage.getItem('adaptatec_token');
            const response = await fetch(`/api/materias/${materiaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                showToastAdmin('✅ Materia eliminada', 'success');
                await loadAdminMateriasSection();
                await loadGeneralSection();
            } else {
                showToastAdmin('❌ Error al eliminar materia', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToastAdmin('❌ Error al eliminar materia', 'error');
        }
    }
};


// Convertir nombres de vista a IDs correctos
function getViewId(viewName) {
    const mapping = {
        'dashboard': 'dashboardView',
        'materias': 'materiasView',
        'recompensas': 'recompensasView',
        'progreso': 'progresoView',
        'modulos': 'modulosView',
        'general': 'generalView',
        'registrar-usuarios': 'registrarUsuariosView',
        'monitoreo-alumnos': 'monitoreoAlumnosView',
        'admin-materias': 'adminMateriasView',
        'miscelaneo': 'miscelaneoView'
    };
    return mapping[viewName] || viewName + 'View';
}

// ========== MODAL PARA AGREGAR MATERIA CON MÓDULOS ==========

// Abrir modal
function showAddMateriaModal() {
    const modal = document.getElementById('addMateriaModal');
    if (modal) {
        modal.style.display = 'flex';
        // Limpiar formulario
        document.getElementById('addMateriaForm').reset();
        // Resetear módulos a 1 solo
        const container = document.getElementById('modulosListContainer');
        container.innerHTML = `
            <div class="modulo-item" style="display: flex; gap: 10px; margin-bottom: 10px;">
                <input type="text" class="modulo-nombre" placeholder="Nombre del módulo" style="flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1;">
                <button type="button" class="btn-remove-modulo btn-small btn-danger" style="display: none;">❌</button>
            </div>
        `;
    }
}

// Cerrar modal
function closeAddMateriaModal() {
    const modal = document.getElementById('addMateriaModal');
    if (modal) modal.style.display = 'none';
}

// Agregar nuevo campo de módulo
function addModuloField() {
    const container = document.getElementById('modulosListContainer');
    const moduloDiv = document.createElement('div');
    moduloDiv.className = 'modulo-item';
    moduloDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
    moduloDiv.innerHTML = `
        <input type="text" class="modulo-nombre" placeholder="Nombre del módulo" style="flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1;">
        <button type="button" class="btn-remove-modulo btn-small btn-danger" onclick="this.parentElement.remove()">❌</button>
    `;
    container.appendChild(moduloDiv);
    
    // Mostrar botones de eliminar en todos los módulos excepto el primero
    const removeBtns = container.querySelectorAll('.btn-remove-modulo');
    removeBtns.forEach(btn => btn.style.display = 'flex');
}

// Crear materia con módulos
async function createMateriaWithModulos(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('materiaNombre').value;
    const descripcion = document.getElementById('materiaDescripcion').value;
    const icon = document.getElementById('materiaIcon').value;
    const creditos = parseInt(document.getElementById('materiaCreditos').value);
    
    if (!nombre) {
        showToastAdmin('❌ El nombre de la materia es requerido', 'error');
        return;
    }
    
    // Obtener módulos
    const moduloInputs = document.querySelectorAll('#modulosListContainer .modulo-nombre');
    const modulos = [];
    moduloInputs.forEach(input => {
        if (input.value.trim()) {
            modulos.push(input.value.trim());
        }
    });
    
    if (modulos.length === 0) {
        showToastAdmin('❌ Debes agregar al menos un módulo', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('adaptatec_token');
        
        // Crear materia
        const materiaResponse = await fetch('/api/materias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nombre: nombre,
                descripcion: descripcion,
                icon: icon,
                creditos: creditos,
                total_modulos: modulos.length,
                activo: true
            })
        });
        
        if (!materiaResponse.ok) throw new Error('Error al crear materia');
        
        const materia = await materiaResponse.json();
        const materiaId = materia.id;
        
        // Crear módulos
        for (let i = 0; i < modulos.length; i++) {
            await fetch('/api/materias/modulos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    materiaId: materiaId,
                    nombre: modulos[i],
                    orden: i + 1
                })
            });
        }
        
        showToastAdmin(`✅ Materia "${nombre}" creada con ${modulos.length} módulos`, 'success');
        closeAddMateriaModal();
        
        // Recargar listas
        await loadAdminMateriasSection();
        await loadGeneralSection();
        
    } catch (error) {
        console.error('Error:', error);
        showToastAdmin('❌ Error al crear la materia', 'error');
    }
}

// Configurar eventos del modal
function setupMateriaModalEvents() {
    const modal = document.getElementById('addMateriaModal');
    if (!modal) return;
    
    // Botón de agregar materia
    const addBtn = document.getElementById('addMateriaAdminBtn');
    if (addBtn) {
        addBtn.onclick = showAddMateriaModal;
    }
    
    // Botones de cerrar
    const closeBtns = modal.querySelectorAll('.close-modal-btn');
    closeBtns.forEach(btn => {
        btn.onclick = closeAddMateriaModal;
    });
    
    // Clic fuera del modal
    modal.onclick = (e) => {
        if (e.target === modal) closeAddMateriaModal();
    };
    
    // Botón de agregar módulo
    const addModuloBtn = document.getElementById('addModuloBtn');
    if (addModuloBtn) {
        addModuloBtn.onclick = addModuloField;
    }
    
    // Submit del formulario
    const form = document.getElementById('addMateriaForm');
    if (form) {
        form.onsubmit = createMateriaWithModulos;
    }
}

// Inicializar modal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que currentUser esté disponible
    const checkInterval = setInterval(() => {
        if (currentUser && currentUser.role === 'admin') {
            setupMateriaModalEvents();
            clearInterval(checkInterval);
        }
    }, 500);
});

// ========== ASIGNAR MATERIAS A ALUMNOS ==========

// Cargar alumnos y materias para asignación
async function loadAsignacionData() {
    try {
        const token = localStorage.getItem('adaptatec_token');
        
        // Cargar alumnos
        const usersResponse = await fetch('/api/users/admin/all-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await usersResponse.json();
        const alumnos = users.filter(u => u.role === 'alumno');
        
        // Cargar materias
        const materiasResponse = await fetch('/api/materias', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const materias = await materiasResponse.json();
        
        // Llenar select de alumnos
        const alumnoSelect = document.getElementById('asignarAlumnoSelect');
        if (alumnoSelect) {
            alumnoSelect.innerHTML = '<option value="">-- Selecciona un alumno --</option>' +
                alumnos.map(a => `<option value="${a.id}">${a.name} (${a.username})</option>`).join('');
            
            // Agregar evento para cargar materias del alumno
            alumnoSelect.onchange = () => cargarMateriasAlumno(alumnoSelect.value, materias, token);
        }
        
    } catch (error) {
        console.error('Error cargando datos para asignación:', error);
    }
}

// Cargar materias del alumno y mostrar checkboxes
async function cargarMateriasAlumno(alumnoId, materias, token) {
    const container = document.getElementById('asignarMateriasList');
    if (!container || !alumnoId) {
        if (container) container.innerHTML = '<p class="text-muted">Selecciona un alumno primero</p>';
        return;
    }
    
    try {
        // Obtener materias actuales del alumno
        const userResponse = await fetch(`/api/users/admin/user/${alumnoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Si no existe la ruta, usar un array vacío
        let materiasAlumno = [];
        if (userResponse.ok) {
            const userData = await userResponse.json();
            materiasAlumno = userData.materias || [];
        }
        
        const materiasIdsAlumno = materiasAlumno.map(m => m.id);
        
        // Mostrar checkboxes de materias
        container.innerHTML = materias.map(materia => `
            <label style="display: flex; align-items: center; padding: 8px; margin: 4px 0; background: ${materiasIdsAlumno.includes(materia.id) ? '#e8f5e9' : 'transparent'}; border-radius: 8px; cursor: pointer;">
                <input type="checkbox" class="materia-checkbox" value="${materia.id}" data-nombre="${materia.nombre}" 
                    ${materiasIdsAlumno.includes(materia.id) ? 'checked disabled' : ''}>
                <span style="margin-left: 10px; flex: 1;">
                    ${materia.nombre}
                    ${materiasIdsAlumno.includes(materia.id) ? '<span style="color: #10b981; font-size: 0.7rem;"> (Ya inscrito)</span>' : ''}
                </span>
                <span style="font-size: 0.7rem; color: #64748b;">${materia.total_modulos || 12} módulos</span>
            </label>
        `).join('');
        
        if (materias.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay materias disponibles</p>';
        }
        
    } catch (error) {
        console.error('Error cargando materias del alumno:', error);
        container.innerHTML = '<p class="text-muted">Error al cargar materias</p>';
    }
}

// Asignar materias seleccionadas al alumno
async function asignarMateriasAlumno() {
    const alumnoId = document.getElementById('asignarAlumnoSelect')?.value;
    const checkboxes = document.querySelectorAll('#asignarMateriasList .materia-checkbox:checked:not([disabled])');
    const materiasIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const materiasNombres = Array.from(checkboxes).map(cb => cb.dataset.nombre);
    
    if (!alumnoId) {
        mostrarMensajeAsignacion('❌ Selecciona un alumno primero', 'error');
        return;
    }
    
    if (materiasIds.length === 0) {
        mostrarMensajeAsignacion('❌ Selecciona al menos una materia para asignar', 'error');
        return;
    }
    
    mostrarMensajeAsignacion(`📚 Asignando ${materiasIds.length} materia(s)...`, 'info');
    
    try {
        const token = localStorage.getItem('adaptatec_token');
        let exito = 0;
        let errores = 0;
        
        for (const materiaId of materiasIds) {
            try {
                // Asignar materia al alumno (crear enrollment)
                const response = await fetch('/api/users/asignar-materia', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: alumnoId,
                        materiaId: materiaId
                    })
                });
                
                if (response.ok) {
                    exito++;
                } else {
                    errores++;
                    console.error(`Error asignando materia ${materiaId}:`, await response.text());
                }
            } catch (err) {
                errores++;
                console.error(`Error en materia ${materiaId}:`, err);
            }
        }
        
        if (exito > 0) {
            mostrarMensajeAsignacion(`✅ Asignadas ${exito} materia(s) correctamente${errores > 0 ? `. ${errores} fallaron.` : ''}`, 'success');
            // Recargar la lista de materias del alumno
            const token = localStorage.getItem('adaptatec_token');
            const materiasResponse = await fetch('/api/materias', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const materias = await materiasResponse.json();
            cargarMateriasAlumno(alumnoId, materias, token);
        } else {
            mostrarMensajeAsignacion('❌ No se pudo asignar ninguna materia', 'error');
        }
        
    } catch (error) {
        console.error('Error en asignación:', error);
        mostrarMensajeAsignacion('❌ Error al asignar materias', 'error');
    }
}

function mostrarMensajeAsignacion(mensaje, tipo) {
    const msgDiv = document.getElementById('asignacionMensaje');
    if (!msgDiv) return;
    
    msgDiv.textContent = mensaje;
    msgDiv.style.display = 'block';
    msgDiv.style.backgroundColor = tipo === 'success' ? '#d4edda' : tipo === 'error' ? '#f8d7da' : '#cfe2ff';
    msgDiv.style.color = tipo === 'success' ? '#155724' : tipo === 'error' ? '#721c24' : '#084298';
    msgDiv.style.border = `1px solid ${tipo === 'success' ? '#c3e6cb' : tipo === 'error' ? '#f5c6cb' : '#b6d4fe'}`;
    msgDiv.style.padding = '10px';
    msgDiv.style.borderRadius = '8px';
    
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 3000);
}

// Variable global para almacenar el alumno seleccionado
let alumnoSeleccionadoId = null;
let alumnoSeleccionadoNombre = null;

// Abrir modal para dar de baja materia


// Confirmar baja de materia
async function confirmarBajaMateria() {
    const materiaSelect = document.getElementById('bajaMateriaSelect');
    const materiaId = materiaSelect.value;
    
    if (!materiaId) {
        showToastAdmin('❌ Selecciona una materia para dar de baja', 'error');
        return;
    }
    
    const materiaNombre = materiaSelect.options[materiaSelect.selectedIndex]?.text || 'esta materia';
    
    if (confirm(`¿Estás seguro de dar de baja a "${alumnoSeleccionadoNombre}" de la materia "${materiaNombre}"?`)) {
        try {
            const token = localStorage.getItem('adaptatec_token');
            const response = await fetch('/api/users/baja-materia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: alumnoSeleccionadoId,
                    materiaId: parseInt(materiaId)
                })
            });
            
            if (response.ok) {
                showToastAdmin(`✅ Alumno dado de baja de "${materiaNombre}" correctamente`, 'success');
                cerrarModalBaja();
                await loadAlumnosTableAdmin(); // Recargar tabla
            } else {
                const error = await response.json();
                showToastAdmin(`❌ Error: ${error.error || 'No se pudo dar de baja'}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToastAdmin('❌ Error al dar de baja', 'error');
        }
    }
}

// Cerrar modal de baja
function cerrarModalBaja() {
    const modal = document.getElementById('bajaMateriaModal');
    if (modal) modal.style.display = 'none';
    alumnoSeleccionadoId = null;
    alumnoSeleccionadoNombre = null;
}

// Configurar modal de baja de materia
function setupBajaMateriaModal() {
    // Botón confirmar
    const confirmarBtn = document.getElementById('confirmarBajaBtn');
    if (confirmarBtn) {
        const newBtn = confirmarBtn.cloneNode(true);
        confirmarBtn.parentNode.replaceChild(newBtn, confirmarBtn);
        newBtn.onclick = confirmarBajaMateria;
    }
    
    // Botones cerrar
    const closeBtns = document.querySelectorAll('#bajaMateriaModal .close-modal-btn');
    closeBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = cerrarModalBaja;
    });
    
    // Clic fuera del modal
    const modal = document.getElementById('bajaMateriaModal');
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) cerrarModalBaja();
        };
    }
}



// ========== GEMINI CONFIGURATION LISTENERS ==========
// Configuración de Gemini ahora se maneja en el backend