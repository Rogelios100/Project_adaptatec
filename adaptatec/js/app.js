// ===== APP STATE =====
const appState = {
    currentUser: null,
    users: [
        { id: 'ALU001', username: 'ALU001', password: '123', name: 'Juan Pérez', email: 'juan@adaptatec.com', role: 'alumno' },
        { id: 'ALU002', username: 'ALU002', password: '123', name: 'María García', email: 'maria@adaptatec.com', role: 'alumno' },
        { id: 'DOC001', username: 'DOC001', password: '123', name: 'Prof. Carlos López', email: 'carlos@adaptatec.com', role: 'docente' },
        { id: 'DOC002', username: 'DOC002', password: '123', name: 'Prof. Ana Martínez', email: 'ana@adaptatec.com', role: 'docente' },
        { id: 'ADMIN001', username: 'ADMIN001', password: '123', name: 'Administrador', email: 'admin@adaptatec.com', role: 'admin' },
    ],
    materias: [
        { id: 1, name: 'Matemáticas', icon: '🔢', description: 'Álgebra, Cálculo y Geometría', progress: 75 },
        { id: 2, name: 'Física', icon: '⚛️', description: 'Conceptos de la física clásica', progress: 60 },
        { id: 3, name: 'Química', icon: '🧪', description: 'Tabla periódica y reacciones', progress: 45 },
        { id: 4, name: 'Historia', icon: '📖', description: 'Historia mundial y local', progress: 80 },
        { id: 5, name: 'Biología', icon: '🧬', description: 'Organismos y sistemas', progress: 55 },
        { id: 6, name: 'Literatura', icon: '📚', description: 'Clásicos y obras modernas', progress: 90 },
    ],
    rewards: [
        { id: 1, name: 'Primer Paso', icon: '🚀', points: 10, unlocked: true },
        { id: 2, name: 'Matemático', icon: '🔢', points: 50, unlocked: true },
        { id: 3, name: 'Estudioso', icon: '🎓', points: 100, unlocked: false },
        { id: 4, name: 'Perfeccionista', icon: '⭐', points: 200, unlocked: false },
        { id: 5, name: 'Campeón', icon: '🏆', points: 500, unlocked: false },
        { id: 6, name: 'Leyenda', icon: '👑', points: 1000, unlocked: false },
        { id: 7, name: 'Filósofo', icon: '🧠', points: 75, unlocked: true },
        { id: 8, name: 'Bibliófilo', icon: '📕', points: 60, unlocked: false },
    ],
    userProgress: {
        'ALU001': {
            points: 87,
            level: 5,
            unlockedRewards: [1, 2, 7],
            hoursStudied: 23,
            completedModules: 8
        }
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadFromLocalStorage();
});

function initializeApp() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        appState.currentUser = JSON.parse(savedUser);
        showMainApp();
        renderDashboard();
    }
}

function setupEventListeners() {
    // Auth Tab Switching
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', switchAuthTab);
    });

    // Auth Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Navigation
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', switchView);
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Materias
    const addMateriaBtn = document.getElementById('addMateriaBtn');
    if (addMateriaBtn) {
        addMateriaBtn.addEventListener('click', openMateriaModal);
    }

    document.getElementById('materiaForm')?.addEventListener('submit', handleMateriaSubmit);
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // IA Chat
    document.getElementById('iaSendBtn')?.addEventListener('click', sendIAMessage);
    document.getElementById('iaInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendIAMessage();
    });

    // Admin tabs
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', switchAdminTab);
    });

    // Docente tabs
    document.querySelectorAll('.docente-tab-btn').forEach(btn => {
        btn.addEventListener('click', switchDocenteTab);
    });
}

// ===== AUTHENTICATION =====
function switchAuthTab(e) {
    const tabName = e.target.dataset.tab;
    
    // Update buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.querySelector(`[data-form="${tabName}"]`).classList.add('active');
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const user = appState.users.find(u => u.username === username && u.password === password);

    if (user) {
        appState.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
        renderDashboard();
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    } else {
        alert('Usuario o contraseña incorrectos');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const name = document.getElementById('regName').value;
    const password = document.getElementById('regPassword').value;

    // Validate username format
    if (!username.startsWith('ALU') && !username.startsWith('DOC') && !username.startsWith('ADMIN')) {
        alert('El usuario debe comenzar con ALU, DOC o ADMIN');
        return;
    }

    // Check if username exists
    if (appState.users.find(u => u.username === username)) {
        alert('El usuario ya existe');
        return;
    }

    // Determine role
    let role = 'alumno';
    if (username.startsWith('DOC')) role = 'docente';
    if (username.startsWith('ADMIN')) role = 'admin';

    // Create user
    const newUser = {
        id: username,
        username,
        password,
        name,
        email,
        role
    };

    appState.users.push(newUser);
    appState.currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    showMainApp();
    renderDashboard();
    document.getElementById('registerForm').reset();

    alert('¡Usuario registrado exitosamente!');
}

function handleLogout() {
    appState.currentUser = null;
    localStorage.removeItem('currentUser');
    showAuthContainer();
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

// ===== UI VISIBILITY =====
function showAuthContainer() {
    document.getElementById('authContainer').classList.remove('inactive');
    document.getElementById('appContainer').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('authContainer').classList.add('inactive');
    document.getElementById('appContainer').classList.remove('hidden');
    updateUserDisplay();
    updateRoleElements();
    renderMaterias();
    renderRecompensas();
    populateAdminPanel();
}

function updateUserDisplay() {
    const user = appState.currentUser;
    document.getElementById('userNameDisplay').textContent = user.name;
    
    const roleElement = document.getElementById('userRoleDisplay');
    const roleText = user.role === 'admin' ? 'Administrador' : user.role === 'docente' ? 'Docente' : 'Estudiante';
    roleElement.textContent = roleText;
    
    // Update role class for CSS
    document.querySelector('.header-user').className = `header-user ${user.role}-role`;
}

function updateRoleElements() {
    const user = appState.currentUser;
    const roleClass = user.role + '-role';
    
    if (user.role === 'alumno') {
        document.querySelectorAll('.student-section').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.teacher-section').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.admin-section').forEach(el => el.style.display = 'none');
    } else if (user.role === 'docente') {
        document.querySelectorAll('.student-section').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.teacher-section').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.admin-section').forEach(el => el.style.display = 'none');
    } else if (user.role === 'admin') {
        document.querySelectorAll('.student-section').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.teacher-section').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.admin-section').forEach(el => el.style.display = 'block');
    }

    // Show/hide role-specific buttons
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
    });

    document.querySelectorAll('.docente-only').forEach(el => {
        el.style.display = user.role === 'docente' ? 'inline-flex' : 'none';
    });
}

// ===== NAVIGATION =====
function switchView(e) {
    const viewName = e.currentTarget.dataset.view;

    // Update button active state
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');

    // Update view visibility
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
    // Hide role-locked views
    if (viewName === 'admin-panel' && appState.currentUser.role !== 'admin') {
        alert('Acceso denegado');
        return;
    }
    if (viewName === 'docente-panel' && appState.currentUser.role !== 'docente') {
        alert('Acceso denegado');
        return;
    }

    document.getElementById(viewName + 'View').classList.add('active');
}

// ===== DASHBOARD =====
function renderDashboard() {
    const user = appState.currentUser;
    
    if (user.role === 'alumno' && appState.userProgress[user.username]) {
        const progress = appState.userProgress[user.username];
        document.getElementById('totalPoints').textContent = progress.points;
        document.getElementById('currentLevel').textContent = progress.level;
        document.getElementById('totalRewards').textContent = progress.unlockedRewards.length;
    }
}

// ===== MATERIAS =====
function renderMaterias() {
    const container = document.getElementById('materiasGrid');
    container.innerHTML = '';

    appState.materias.forEach(materia => {
        const card = document.createElement('div');
        card.className = 'materia-card';
        card.innerHTML = `
            <div class="materia-icon">${materia.icon}</div>
            <h4>${materia.name}</h4>
            <p>${materia.description}</p>
            <div class="materia-progress">
                <div class="materia-progress-fill" style="width: ${materia.progress}%"></div>
            </div>
            <p style="font-size: 12px; color: #64748b;">${materia.progress}% Completado</p>
            <div class="materia-actions">
                <button class="btn btn-primary btn-small">Estudiar</button>
                <button class="btn btn-outline btn-small" onclick="editMateria(${materia.id})" style="display: ${appState.currentUser.role === 'admin' || appState.currentUser.role === 'docente' ? 'inline' : 'none'}">Editar</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openMateriaModal() {
    document.getElementById('materiaModal').style.display = 'flex';
    document.getElementById('materiaModalTitle').textContent = 'Nueva Materia';
    document.getElementById('materiaForm').reset();
}

function editMateria(id) {
    const materia = appState.materias.find(m => m.id === id);
    if (materia) {
        document.getElementById('materiaModalTitle').textContent = 'Editar Materia';
        document.getElementById('materiaName').value = materia.name;
        document.getElementById('materiaDesc').value = materia.description;
        document.getElementById('materiaIcon').value = materia.icon;
        document.getElementById('materiaForm').dataset.editId = id;
        document.getElementById('materiaModal').style.display = 'flex';
    }
}

function handleMateriaSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('materiaName').value;
    const desc = document.getElementById('materiaDesc').value;
    const icon = document.getElementById('materiaIcon').value || '📚';
    const editId = e.target.dataset.editId;

    if (editId) {
        const materia = appState.materias.find(m => m.id === parseInt(editId));
        if (materia) {
            materia.name = name;
            materia.description = desc;
            materia.icon = icon;
        }
    } else {
        const newId = Math.max(...appState.materias.map(m => m.id)) + 1;
        appState.materias.push({
            id: newId,
            name,
            description: desc,
            icon,
            progress: 0
        });
    }

    closeModal();
    renderMaterias();
    delete e.target.dataset.editId;
}

function closeModal() {
    document.getElementById('materiaModal').style.display = 'none';
    document.getElementById('materiaForm').reset();
}

// ===== RECOMPENSAS =====
function renderRecompensas() {
    const user = appState.currentUser;
    const userData = appState.userProgress[user.username] || { unlockedRewards: [] };

    // Recompensas desbloqueadas
    const unlockedContainer = document.getElementById('unlockedRewards');
    unlockedContainer.innerHTML = '';

    appState.rewards
        .filter(r => userData.unlockedRewards && userData.unlockedRewards.includes(r.id))
        .forEach(reward => {
            const card = createRewardCard(reward, true);
            unlockedContainer.appendChild(card);
        });

    // Recompensas disponibles
    const availableContainer = document.getElementById('availableRewards');
    availableContainer.innerHTML = '';

    appState.rewards
        .filter(r => !userData.unlockedRewards || !userData.unlockedRewards.includes(r.id))
        .forEach(reward => {
            const card = createRewardCard(reward, false);
            availableContainer.appendChild(card);
        });
}

function createRewardCard(reward, unlocked) {
    const card = document.createElement('div');
    card.className = `reward-card ${unlocked ? 'unlocked' : ''}`;
    card.innerHTML = `
        <div class="reward-icon" style="opacity: ${unlocked ? 1 : 0.5}">${reward.icon}</div>
        <div class="reward-name">${reward.name}</div>
        <div class="reward-points">${reward.points} pts</div>
        ${!unlocked ? '<p style="font-size: 10px; margin-top: 8px; color: #94a3b8;">Bloqueada</p>' : ''}
    `;
    return card;
}

// ===== IA ASISTENTE =====
const iaResponses = {
    'hola': 'Hola! Estoy aquí para ayudarte con tus preguntas. ¿Qué necesitas saber?',
    'ayuda': 'Puedo ayudarte con preguntas sobre materias, explicar conceptos, resolver problemas y mucho más. ¿En qué tema necesitas ayuda?',
    'matematica': 'En Matemáticas podemos estudiar Álgebra, Cálculo, Geometría y más. ¿Qué tema específico te interesa?',
    'fisica': 'La Física es fascinante! Podemos hablar de Mecánica, Electricidad, Magnetismo, Termodinámica. ¿Cuál te interesa?',
    'quimica': 'En Química exploramos la estructura atómica, reacciones químicas y la tabla periódica. ¿Qué quieres saber?',
    'historia': 'La Historia nos enseña del pasado. Podemos hablar de diferentes épocas y civilizaciones. ¿Cuál te interesa?',
    'biologia': 'La Biología estudia los organismos y sistemas vivos. ¿Qué tema te gustaría explorar?',
    'default': 'Esa es una pregunta interesante. Te recomiendo estudiar más sobre el tema con los módulos disponibles. ¿Tienes otra pregunta?'
};

function sendIAMessage() {
    const input = document.getElementById('iaInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    addChatMessage(message, 'user');
    input.value = '';

    // Simulate IA response delay
    setTimeout(() => {
        const response = generateIAResponse(message);
        addChatMessage(response, 'bot');
    }, 500);
}

function generateIAResponse(userMessage) {
    const lowercaseMessage = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(iaResponses)) {
        if (lowercaseMessage.includes(key)) {
            return response;
        }
    }
    
    return iaResponses.default;
}

function addChatMessage(message, sender) {
    const chatBox = document.getElementById('iaChat');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
    `;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== ADMIN PANEL =====
function switchAdminTab(e) {
    const tabName = e.currentTarget.dataset.adminTab;
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function populateAdminPanel() {
    if (appState.currentUser.role !== 'admin') return;

    // Usuarios
    const tbody = document.getElementById('usuariosTableBody');
    tbody.innerHTML = '';
    appState.users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td><span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;">Activo</span></td>
            <td>
                <button class="btn btn-small">Editar</button>
                <button class="btn btn-small" style="color: #ef4444;">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Cursos
    const cursosBody = document.getElementById('cursosTableBody');
    cursosBody.innerHTML = '';
    ['Matemáticas Avanzadas', 'Física General', 'Química Orgánica'].forEach((course, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course}</td>
            <td>Prof. ${['Carlos López', 'Ana Martínez', 'Pedro González'][idx]}</td>
            <td>${[45, 38, 32][idx]} estudiantes</td>
            <td><span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;">Activo</span></td>
            <td>
                <button class="btn btn-small">Editar</button>
                <button class="btn btn-small" style="color: #ef4444;">Eliminar</button>
            </td>
        `;
        cursosBody.appendChild(row);
    });
}

// ===== DOCENTE PANEL =====
function switchDocenteTab(e) {
    const tabName = e.currentTarget.dataset.docenteTab;
    
    document.querySelectorAll('.docente-tab-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    document.querySelectorAll('.docente-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// ===== LOCAL STORAGE =====
function loadFromLocalStorage() {
    const saved = localStorage.getItem('appState');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(appState, data);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('appState', JSON.stringify(appState));
}

// Auto-save changes
window.addEventListener('beforeunload', saveToLocalStorage);
