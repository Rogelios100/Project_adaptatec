import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { get, all, run } from '../config/database.js';

const router = express.Router();

async function computeUserProgressSummary(userId) {
  const materias = await all(`
    SELECT m.id, m.nombre, up.progress, up.horasEstudio, up.modulosCompletados
    FROM materias m
    LEFT JOIN user_progress up ON m.id = up.materiaId AND up.userId = ?
    ORDER BY m.id
  `, [userId]);

  const totalHoras = materias.reduce((sum, m) => sum + (m.horasEstudio || 0), 0);
  const progressValues = materias.map(m => m.progress || 0);
  const promedioProgreso = materias.length ? Math.round(progressValues.reduce((sum, p) => sum + p, 0) / materias.length) : 0;
  const materiasCompletadas = materias.filter(m => (m.progress || 0) >= 100).length;
  const totalLogros = Math.max(12, materias.length * 4);
  const logros = Math.min(totalLogros, materiasCompletadas * 2 + Math.floor(promedioProgreso / 25));
  const nivel = Math.max(1, Math.min(20, Math.ceil(promedioProgreso / 10)));
  const puntos = totalHoras + promedioProgreso + materiasCompletadas * 10;

  return {
    totalHoras,
    promedioProgreso,
    materiasCompletadas,
    totalLogros,
    logros,
    nivel,
    puntos,
    materias
  };
}

async function syncUserSummary(userId) {
  const summary = await computeUserProgressSummary(userId);
  await run(
    'UPDATE users SET horas = ?, puntos = ?, logros = ?, totalLogros = ?, nivel = ? WHERE id = ?',
    [summary.totalHoras, summary.puntos, summary.logros, summary.totalLogros, summary.nivel, userId]
  );
  return summary;
}

// Obtener perfil del usuario actual
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener materias del usuario
    const materias = await all(`
      SELECT m.*, up.progress, up.modulosCompletados, up.totalModulos, up.horasEstudio
      FROM materias m
      LEFT JOIN user_progress up ON m.id = up.materiaId AND up.userId = ?
      ORDER BY m.id
    `, [req.user.id]);

    const summary = await computeUserProgressSummary(req.user.id);
    await run(
      'UPDATE users SET horas = ?, puntos = ?, logros = ?, totalLogros = ?, nivel = ? WHERE id = ?',
      [summary.totalHoras, summary.puntos, summary.logros, summary.totalLogros, summary.nivel, req.user.id]
    );

    // Obtener actividades recientes
    const recent = await all(`
      SELECT descripcion FROM activities WHERE userId = ? ORDER BY createdAt DESC LIMIT 4
    `, [req.user.id]);

    res.json({
      id: user.id,
      username: user.username,
      matricula: user.matricula,
      email: user.email,
      name: user.name,
      role: user.role,
      nivel: summary.nivel,
      puntos: summary.puntos,
      logros: summary.logros,
      totalLogros: summary.totalLogros,
      horas: summary.totalHoras,
      tokens: user.tokens || 0,
      recompensas_obtenidas: user.recompensas_obtenidas || null,
      materias: materias.map(m => ({
        id: m.id,
        name: m.nombre,
        desc: m.descripcion || '',
        icon: m.icon,
        progress: m.progress || 0,
        modulosCompletados: m.modulosCompletados || 0,
        totalModulos: m.totalModulos || 12,
        horasEstudio: m.horasEstudio || 0
      })),
      recent: recent.map(r => r.descripcion)
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Actualizar progreso del usuario
// Actualizar progreso del usuario
router.put('/progress/:materiaId', verifyToken, async (req, res) => {
    try {
        const { materiaId } = req.params;
        const { progress, modulosCompletados, horasEstudio } = req.body;

        // Verificar que la materia existe
        const materia = await get('SELECT id FROM materias WHERE id = ?', [materiaId]);
        if (!materia) {
            return res.status(404).json({ error: 'Materia no encontrada' });
        }

        // ✅ CORREGIDO: horasEstudio no se sobrescribe, solo se actualiza si se envía
        const horasUpdate = horasEstudio ? `horasEstudio = horasEstudio + ?` : '';
        
        if (horasEstudio && horasEstudio > 0) {
            // Solo actualizar horas si se envían (para el heartbeat)
            await run(
                `UPDATE user_progress SET horasEstudio = horasEstudio + ? WHERE userId = ? AND materiaId = ?`,
                [horasEstudio, req.user.id, materiaId]
            );
        }
        
        // Actualizar progreso y módulos completados
        await run(
            `INSERT INTO user_progress (userId, materiaId, progress, modulosCompletados, lastAccessed)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON DUPLICATE KEY UPDATE 
                progress = VALUES(progress),
                modulosCompletados = VALUES(modulosCompletados),
                lastAccessed = CURRENT_TIMESTAMP`,
            [req.user.id, materiaId, progress || 0, modulosCompletados || 0]
        );

        await syncUserSummary(req.user.id);

        res.json({ message: 'Progreso actualizado' });
    } catch (error) {
        console.error('Error al actualizar progreso:', error);
        res.status(500).json({ error: 'Error al actualizar progreso' });
    }
});

// Obtener módulos completados del usuario
// Obtener módulos completados del usuario
// Obtener módulos completados del usuario
router.get('/modulos-completados', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Consulta para obtener módulos completados
        const modulos = await all(`
            SELECT mp.materiaId, mp.moduloId 
            FROM modulo_progress mp
            WHERE mp.userId = ? AND mp.completado = TRUE
        `, [userId]);
        
        res.json(modulos);
    } catch (error) {
        console.error('Error obteniendo módulos completados:', error);
        res.status(500).json({ error: error.message });
    }
});

// Registrar actividad
router.post('/activity', verifyToken, async (req, res) => {
  try {
    const { descripcion, tipo } = req.body;

    if (!descripcion) {
      return res.status(400).json({ error: 'Descripción requerida' });
    }

    await run(
      'INSERT INTO activities (userId, descripcion, tipo) VALUES (?, ?, ?)',
      [req.user.id, descripcion, tipo || 'general']
    );

    res.json({ message: 'Actividad registrada' });
  } catch (error) {
    console.error('Error al registrar actividad:', error);
    res.status(500).json({ error: 'Error al registrar actividad' });
  }
});

export default router;

// ========== HEARTBEAT Y TIEMPO DE ESTUDIO ==========

// Variable para almacenar sesiones activas (en memoria)
const sesionesActivas = new Map();

/**
 * Heartbeat - Recibe tiempo de estudio del frontend
 */
router.post('/heartbeat', verifyToken, async (req, res) => {
    try {
        const { segundos, materiaId, moduloId } = req.body;
        const userId = req.user.id;
        
        if (!segundos || segundos <= 0) {
            return res.status(400).json({ error: 'Tiempo inválido' });
        }
        
        console.log(`💓 Heartbeat usuario ${userId}: +${segundos}s en materia ${materiaId || 'general'}`);
        
        // Acumular tiempo en la sesión actual (en memoria)
        if (!sesionesActivas.has(userId)) {
            sesionesActivas.set(userId, {
                totalSegundos: 0,
                ultimoHeartbeat: Date.now(),
                materiaActual: materiaId,
                moduloActual: moduloId
            });
        }
        
        const sesion = sesionesActivas.get(userId);
        sesion.totalSegundos += segundos;
        sesion.ultimoHeartbeat = Date.now();
        sesion.materiaActual = materiaId;
        sesion.moduloActual = moduloId;
        
        // Actualizar en la base de datos
        await actualizarTiempoEstudio(userId, segundos, materiaId, moduloId);
        
        res.json({ 
            success: true, 
            totalAcumulado: sesion.totalSegundos,
            mensaje: `${Math.floor(segundos / 60)} minutos registrados`
        });
        
    } catch (error) {
        console.error('Error en heartbeat:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Actualizar tiempo de estudio en BD
 */
async function actualizarTiempoEstudio(userId, segundos, materiaId, moduloId) {
    // Actualizar horas totales del usuario
    const horas = segundos / 3600;
    
    await run(
        `UPDATE users SET horas = horas + ? WHERE id = ?`,
        [horas, userId]
    );
    
    // Si hay materia específica, actualizar progreso
    if (materiaId) {
        // Verificar si existe registro de progreso
        const progreso = await get(
            `SELECT id, horasEstudio FROM user_progress WHERE userId = ? AND materiaId = ?`,
            [userId, materiaId]
        );
        
        if (progreso) {
            await run(
                `UPDATE user_progress SET horasEstudio = horasEstudio + ? WHERE userId = ? AND materiaId = ?`,
                [horas, userId, materiaId]
            );
        } else {
            // Crear registro si no existe
            await run(
                `INSERT INTO user_progress (userId, materiaId, progress, horasEstudio) VALUES (?, ?, 0, ?)`,
                [userId, materiaId, horas]
            );
        }
    }
    
    // Registrar actividad si se acumularon suficientes minutos
    if (segundos >= 300) { // Cada 5 minutos
        const minutos = Math.floor(segundos / 60);
        await run(
            `INSERT INTO activities (userId, descripcion, tipo) VALUES (?, ?, ?)`,
            [userId, `📖 Estudiado ${minutos} minutos en ${materiaId ? `materia ${materiaId}` : 'la plataforma'}`, 'estudio']
        );
    }
}

/**
 * Obtener estadísticas de tiempo de estudio del usuario
 */
router.get('/tiempo-estudio', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Obtener tiempo del usuario
        const usuario = await get(
            `SELECT horas, created_at FROM users WHERE id = ?`,
            [userId]
        );
        
        // Obtener tiempo por materia
        const materias = await all(
            `SELECT m.nombre, up.horasEstudio 
             FROM user_progress up
             JOIN materias m ON up.materiaId = m.id
             WHERE up.userId = ?
             ORDER BY up.horasEstudio DESC`,
            [userId]
        );
        
        // Obtener sesión activa
        const sesion = sesionesActivas.get(userId) || { totalSegundos: 0 };
        
        res.json({
            totalHoras: usuario?.horas || 0,
            desde: usuario?.created_at,
            sesionActual: {
                segundos: sesion.totalSegundos,
                horas: (sesion.totalSegundos / 3600).toFixed(2),
                materiaActual: sesion.materiaActual,
                inicioSesion: sesion.ultimoHeartbeat
            },
            tiempoPorMateria: materias,
            metaDiaria: 2 // 2 horas de meta diaria
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Limpiar sesiones inactivas cada 5 minutos
setInterval(() => {
    const ahora = Date.now();
    for (const [userId, sesion] of sesionesActivas.entries()) {
        // Si pasaron más de 10 minutos sin heartbeat, considerar sesión inactiva
        if (ahora - sesion.ultimoHeartbeat > 10 * 60 * 1000) {
            console.log(`🕐 Sesión de usuario ${userId} terminada por inactividad`);
            sesionesActivas.delete(userId);
        }
    }
}, 5 * 60 * 1000);

// ========== TOKENS Y RECOMPENSAS ==========

// Otorgar tokens
router.post('/tokens', verifyToken, async (req, res) => {
    try {
        const { cantidad, motivo } = req.body;
        const userId = req.user.id;
        
        await run(`UPDATE users SET tokens = tokens + ? WHERE id = ?`, [cantidad, userId]);
        
        const user = await get(`SELECT tokens FROM users WHERE id = ?`, [userId]);
        
        // Registrar actividad
        await run(
            `INSERT INTO activities (userId, descripcion, tipo) VALUES (?, ?, ?)`,
            [userId, `🎁 Ganaste ${cantidad} tokens por: ${motivo}`, 'recompensa']
        );
        
        res.json({ success: true, tokensTotales: user.tokens });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Guardar recompensa obtenida
router.post('/recompensa', verifyToken, async (req, res) => {
    try {
        const { nombre, tokens } = req.body;
        const userId = req.user.id;
        
        const user = await get(`SELECT recompensas_obtenidas FROM users WHERE id = ?`, [userId]);
        let recompensas = user.recompensas_obtenidas ? JSON.parse(user.recompensas_obtenidas) : [];
        
        if (!recompensas.includes(nombre)) {
            recompensas.push(nombre);
            await run(
                `UPDATE users SET recompensas_obtenidas = ? WHERE id = ?`,
                [JSON.stringify(recompensas), userId]
            );
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener estadísticas de tokens
router.get('/tokens-stats', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await get(`SELECT tokens, recompensas_obtenidas FROM users WHERE id = ?`, [userId]);
        
        res.json({
            tokens: user?.tokens || 0,
            recompensas: user?.recompensas_obtenidas ? JSON.parse(user.recompensas_obtenidas) : []
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== RECOMPENSAS CANJEABLES ==========

// Obtener recompensas disponibles
router.get('/recompensas-canjeables', verifyToken, async (req, res) => {
    try {
        const recompensas = await all('SELECT * FROM recompensas_canjeables WHERE activo = 1');
        res.json(recompensas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener canjes del usuario
router.get('/mis-canjes', verifyToken, async (req, res) => {
    try {
        const canjes = await all(`
            SELECT c.*, r.nombre, r.descripcion, r.beneficio
            FROM canjes_usuario c
            JOIN recompensas_canjeables r ON c.recompensaId = r.id
            WHERE c.userId = ?
            ORDER BY c.fecha_canje DESC
        `, [req.user.id]);
        res.json(canjes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Canjear recompensa
router.post('/canjear', verifyToken, async (req, res) => {
    try {
        const { recompensaId } = req.body;
        const userId = req.user.id;
        
        // Obtener recompensa
        const recompensa = await get('SELECT * FROM recompensas_canjeables WHERE id = ? AND activo = 1', [recompensaId]);
        if (!recompensa) {
            return res.status(404).json({ error: 'Recompensa no disponible' });
        }
        
        // Verificar tokens
        const user = await get('SELECT tokens FROM users WHERE id = ?', [userId]);
        if (user.tokens < recompensa.tokens_necesarios) {
            return res.status(400).json({ error: 'Tokens insuficientes' });
        }
        
        // Descontar tokens
        await run('UPDATE users SET tokens = tokens - ? WHERE id = ?', [recompensa.tokens_necesarios, userId]);
        
        // Registrar canje
        await run(`
            INSERT INTO canjes_usuario (userId, recompensaId, estado) 
            VALUES (?, ?, 'pendiente')
        `, [userId, recompensaId]);
        
        // Registrar actividad
        // Registrar actividad (solo si el usuario existe)
        try {
            await run(`
                INSERT INTO activities (userId, descripcion, tipo) 
                VALUES (?, ?, 'canje')
            `, [userId, `🎁 Canjeaste "${recompensa.nombre}" por ${recompensa.tokens_necesarios} tokens`, 'canje']);
        } catch (activityError) {
            console.warn('No se pudo registrar actividad (usuario puede no existir):', activityError.message);
            // No fallar por esto
        }
        
        res.json({ 
            success: true, 
            tokensRestantes: user.tokens - recompensa.tokens_necesarios,
            mensaje: `¡Has canjeado ${recompensa.nombre}!`
        });
        
    } catch (error) {
        console.error('Error en canje:', error);
        res.status(500).json({ error: error.message });
    }
});

// Guardar módulo completado
// Guardar módulo completado
router.post('/modulo-completado', verifyToken, async (req, res) => {
    try {
        const { materiaId, moduloId, moduloNombre } = req.body;
        const userId = req.user.id;
        
        // Verificar si ya existe
        const existing = await get(
            `SELECT id FROM modulo_progress WHERE userId = ? AND materiaId = ? AND moduloId = ?`,
            [userId, materiaId, moduloId]
        );
        
        if (!existing) {
            await run(
                `INSERT INTO modulo_progress (userId, materiaId, moduloId, completado, fecha_completado)
                 VALUES (?, ?, ?, TRUE, NOW())`,
                [userId, materiaId, moduloId]
            );
            
            // Recalcular progreso de la materia
            const completadosCount = await get(
                `SELECT COUNT(*) as total FROM modulo_progress 
                 WHERE userId = ? AND materiaId = ? AND completado = TRUE`,
                [userId, materiaId]
            );
            
            const materia = await get(`SELECT total_modulos FROM materias WHERE id = ?`, [materiaId]);
            const totalModulos = materia?.total_modulos || 12;
            const progress = Math.round((completadosCount.total / totalModulos) * 100);
            
            await run(
                `INSERT INTO user_progress (userId, materiaId, progress, modulosCompletados, lastAccessed)
                 VALUES (?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                    progress = VALUES(progress),
                    modulosCompletados = VALUES(modulosCompletados),
                    lastAccessed = NOW()`,
                [userId, materiaId, progress, completadosCount.total]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error guardando módulo completado:', error);
        res.status(500).json({ error: error.message });
    }
});