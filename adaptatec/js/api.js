// ========== API CONFIGURATION ==========
const API_BASE = (() => {
  // Si estamos en la misma URL que el servidor, usar /api directamente
  // El servidor sirve los archivos estáticos y la API en /api
  return '/api';
})();

// ========== AUTH TOKEN MANAGEMENT ==========
function setToken(token) {
  if (token) {
    localStorage.setItem('adaptatec_token', token);
  } else {
    localStorage.removeItem('adaptatec_token');
  }
}

function getToken() {
  return localStorage.getItem('adaptatec_token');
}

function getAuthHeader() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ========== API CALLS ==========

/**
 * Registrar un nuevo usuario
 */
export async function apiRegister(username, matricula, email, password, name, role = 'alumno') {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, matricula, email, password, name, role })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error en registro');
    }

    setToken(data.token);
    return data.user;
  } catch (error) {
    console.error('Error en apiRegister:', error);
    throw error;
  }
}

/**
 * Iniciar sesión
 */
export async function apiLogin(username, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error en login');
    }

    setToken(data.token);
    return data.user;
  } catch (error) {
    console.error('Error en apiLogin:', error);
    throw error;
  }
}

/**
 * Cerrar sesión
 */
export function apiLogout() {
  setToken(null);
}

/**
 * Obtener perfil del usuario actual
 */
export async function apiGetProfile() {
  try {
    const response = await fetch(`${API_BASE}/users/profile`, {
      headers: getAuthHeader()
    });

    if (response.status === 401) {
      apiLogout();
      throw new Error('Sesión expirada');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener perfil');
    }

    return data;
  } catch (error) {
    console.error('Error en apiGetProfile:', error);
    throw error;
  }
}

/**
 * Obtener todas las materias
 */
export async function apiGetMaterias() {
  try {
    const response = await fetch(`${API_BASE}/materias`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener materias');
    }
    return data;
  } catch (error) {
    console.error('Error en apiGetMaterias:', error);
    throw error;
  }
}

/**
 * Obtener módulos de una materia
 */
export async function apiGetModulosMateria(materiaId) {
  try {
    const response = await fetch(`${API_BASE}/materias/${materiaId}/modules`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener módulos');
    }
    return data.modulos;
  } catch (error) {
    console.error('Error en apiGetModulosMateria:', error);
    return [];
  }
}

/**
 * Actualizar progreso del usuario en una materia
 */
export async function apiUpdateProgress(materiaId, progress, modulosCompletados, horasEstudio) {
  try {
    const response = await fetch(`${API_BASE}/users/progress/${materiaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ progress, modulosCompletados, horasEstudio })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al actualizar progreso');
    }

    return data;
  } catch (error) {
    console.error('Error en apiUpdateProgress:', error);
    throw error;
  }
}

/**
 * Registrar una actividad del usuario
 */
export async function apiRegisterActivity(descripcion, tipo = 'general') {
  try {
    const response = await fetch(`${API_BASE}/users/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ descripcion, tipo })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al registrar actividad');
    }

    return data;
  } catch (error) {
    console.error('Error en apiRegisterActivity:', error);
    // No lanzar error, solo loguear
  }
}

/**
 * Verificar si hay sesión activa
 */
export function isLoggedIn() {
  return !!getToken();
}

/**
 * Obtener token actual
 */
export function getCurrentToken() {
  return getToken();
}

/**
 * Enviar pregunta a Groq
 */
export async function apiGroqQuestion(pregunta, materia = '', contexto = '') {
  try {
    const response = await fetch(`${API_BASE}/groq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ pregunta, materia, contexto })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al procesar con Groq');
    }

    return data.respuesta;
  } catch (error) {
    console.error('Error en apiGroqQuestion:', error);
    throw error;
  }
}

// Alias para compatibilidad con código antiguo
export const apiGeminiQuestion = apiGroqQuestion;
