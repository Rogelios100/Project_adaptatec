import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { get, all, run } from '../config/database.js';

console.log('✅ Cargando rutas de usuarios...');

const router = express.Router();

// ========== UTILIDADES ==========
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

  return { totalHoras, promedioProgreso, materiasCompletadas, totalLogros, logros, nivel, puntos };
}

async function syncUserSummary(userId) {
  const summary = await computeUserProgressSummary(userId);
  await run(
    'UPDATE users SET horas = ?, puntos = ?, logros = ?, totalLogros = ?, nivel = ? WHERE id = ?',
    [summary.totalHoras, summary.puntos, summary.logros, summary.totalLogros, summary.nivel, userId]
  );
  return summary;
}

// ========== PERFIL ==========
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const materias = await all(`
      SELECT m.*, COALESCE(up.progress, 0) as progress, 
             COALESCE(up.modulosCompletados, 0) as modulosCompletados,
             COALESCE(up.totalModulos, 12) as totalModulos,
             COALESCE(up.horasEstudio, 0) as horasEstudio
      FROM materias m
      LEFT JOIN user_progress up ON m.id = up.materiaId AND up.userId = ?
      ORDER BY m.id
    `, [req.user.id]);

    const summary = await computeUserProgressSummary(req.user.id);
    await run(
      'UPDATE users SET horas = ?, puntos = ?, logros = ?, totalLogros = ?, nivel = ? WHERE id = ?',
      [summary.totalHoras, summary.puntos, summary.logros, summary.totalLogros, summary.nivel, req.user.id]
    );

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
    console.error('Error en profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PROGRESO ==========
router.put('/progress/:materiaId', verifyToken, async (req, res) => {
  try {
    const { materiaId } = req.params;
    const { progress, modulosCompletados, horasEstudio } = req.body;

    const materia = await get('SELECT id FROM materias WHERE id = ?', [materiaId]);
    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    if (horasEstudio && horasEstudio > 0) {
      await run(
        `UPDATE user_progress SET horasEstudio = horasEstudio + ? WHERE userId = ? AND materiaId = ?`,
        [horasEstudio, req.user.id, materiaId]
      );
    }

    await run(
      `INSERT INTO user_progress (userId, materiaId, progress, modulosCompletados, lastAccessed)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         progress = VALUES(progress),
         modulosCompletados = VALUES(modulosCompletados),
         lastAccessed = NOW()`,
      [req.user.id, materiaId, progress || 0, modulosCompletados || 0]
    );

    await syncUserSummary(req.user.id);
    res.json({ message: 'Progreso actualizado' });
  } catch (error) {
    console.error('Error en progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== MÓDULOS COMPLETADOS ==========
router.get('/modulos-completados', verifyToken, async (req, res) => {
  try {
    const modulos = await all(`
      SELECT materiaId, moduloId 
      FROM modulo_progress 
      WHERE userId = ? AND completado = TRUE
    `, [req.user.id]);
    res.json(modulos);
  } catch (error) {
    console.error('Error obteniendo módulos completados:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/modulo-completado', verifyToken, async (req, res) => {
  try {
    const { materiaId, moduloId, moduloNombre } = req.body;
    const userId = req.user.id;

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

// ========== ACTIVIDAD ==========
router.post('/activity', verifyToken, async (req, res) => {
  try {
    const { descripcion, tipo } = req.body;
    if (!descripcion) {
      return res.status(400).json({ error: 'Descripción requerida' });
    }

    await run(
      'INSERT INTO activities (userId, descripcion, tipo, createdAt) VALUES (?, ?, ?, NOW())',
      [req.user.id, descripcion, tipo || 'general']
    );

    res.json({ message: 'Actividad registrada' });
  } catch (error) {
    console.error('Error en activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== HEARTBEAT ==========
const sesionesActivas = new Map();

router.post('/heartbeat', verifyToken, async (req, res) => {
  try {
    const { segundos, materiaId } = req.body;
    const userId = req.user.id;

    if (!segundos || segundos <= 0) {
      return res.status(400).json({ error: 'Tiempo inválido' });
    }

    console.log(`💓 Heartbeat usuario ${userId}: +${segundos}s`);

    if (!sesionesActivas.has(userId)) {
      sesionesActivas.set(userId, { totalSegundos: 0, ultimoHeartbeat: Date.now() });
    }

    const sesion = sesionesActivas.get(userId);
    sesion.totalSegundos += segundos;
    sesion.ultimoHeartbeat = Date.now();

    const horas = segundos / 3600;
    await run(`UPDATE users SET horas = horas + ? WHERE id = ?`, [horas, userId]);

    if (materiaId) {
      const existe = await get('SELECT id FROM user_progress WHERE userId = ? AND materiaId = ?', [userId, materiaId]);
      if (existe) {
        await run(`UPDATE user_progress SET horasEstudio = horasEstudio + ? WHERE userId = ? AND materiaId = ?`, [horas, userId, materiaId]);
      } else {
        await run(`INSERT INTO user_progress (userId, materiaId, progress, horasEstudio) VALUES (?, ?, 0, ?)`, [userId, materiaId, horas]);
      }
    }

    if (segundos >= 300) {
      const minutos = Math.floor(segundos / 60);
      await run(`INSERT INTO activities (userId, descripcion, tipo) VALUES (?, ?, ?)`, [userId, `📖 Estudiado ${minutos} minutos`, 'estudio']);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error en heartbeat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Limpiar sesiones inactivas
setInterval(() => {
  const ahora = Date.now();
  for (const [userId, sesion] of sesionesActivas.entries()) {
    if (ahora - sesion.ultimoHeartbeat > 10 * 60 * 1000) {
      sesionesActivas.delete(userId);
    }
  }
}, 5 * 60 * 1000);

// ========== TOKENS ==========
router.post('/tokens', verifyToken, async (req, res) => {
  try {
    const { cantidad, motivo } = req.body;
    const userId = req.user.id;

    await run(`UPDATE users SET tokens = tokens + ? WHERE id = ?`, [cantidad, userId]);
    const user = await get(`SELECT tokens FROM users WHERE id = ?`, [userId]);

    await run(`INSERT INTO activities (userId, descripcion, tipo) VALUES (?, ?, ?)`, [userId, `🎁 Ganaste ${cantidad} tokens por: ${motivo}`, 'recompensa']);

    res.json({ success: true, tokensTotales: user.tokens });
  } catch (error) {
    console.error('Error en tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== RECOMPENSAS CANJEABLES ==========
router.get('/recompensas-canjeables', verifyToken, async (req, res) => {
  try {
    const recompensas = await all('SELECT * FROM recompensas_canjeables WHERE activo = 1');
    res.json(recompensas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

router.post('/canjear', verifyToken, async (req, res) => {
  try {
    const { recompensaId } = req.body;
    const userId = req.user.id;

    const recompensa = await get('SELECT * FROM recompensas_canjeables WHERE id = ? AND activo = 1', [recompensaId]);
    if (!recompensa) return res.status(404).json({ error: 'Recompensa no disponible' });

    const user = await get('SELECT tokens FROM users WHERE id = ?', [userId]);
    if (user.tokens < recompensa.tokens_necesarios) return res.status(400).json({ error: 'Tokens insuficientes' });

    await run('UPDATE users SET tokens = tokens - ? WHERE id = ?', [recompensa.tokens_necesarios, userId]);
    await run(`INSERT INTO canjes_usuario (userId, recompensaId, estado) VALUES (?, ?, 'pendiente')`, [userId, recompensaId]);

    res.json({ success: true, tokensRestantes: user.tokens - recompensa.tokens_necesarios });
  } catch (error) {
    console.error('Error en canje:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/all-users', verifyToken, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
    }
    
    const users = await all(`
      SELECT id, username, email, name, matricula, role, nivel, puntos, logros, totalLogros, horas, tokens, createdAt 
      FROM users 
      ORDER BY id
    `);
    
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener un usuario específico (solo admin)
router.get('/admin/user/:username', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    const user = await get('SELECT id, username, email, name, matricula, role, nivel, puntos, tokens, createdAt FROM users WHERE username = ?', [req.params.username]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar usuario (solo admin)
router.put('/admin/user/:username', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    const { username } = req.params;
    const { name, email, nivel, puntos } = req.body;
    
    const updates = [];
    const values = [];
    
    if (name) { updates.push('name = ?'); values.push(name); }
    if (email) { updates.push('email = ?'); values.push(email); }
    if (nivel !== undefined) { updates.push('nivel = ?'); values.push(nivel); }
    if (puntos !== undefined) { updates.push('puntos = ?'); values.push(puntos); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    values.push(username);
    await run(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`, values);
    
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar usuario (solo admin)
router.delete('/admin/user/:username', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    const { username } = req.params;
    
    // No permitir eliminar al propio admin
    if (username === req.user.username) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    
    const user = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Eliminar datos relacionados
    await run('DELETE FROM user_progress WHERE userId = ?', [user.id]);
    await run('DELETE FROM modulo_progress WHERE userId = ?', [user.id]);
    await run('DELETE FROM activities WHERE userId = ?', [user.id]);
    await run('DELETE FROM canjes_usuario WHERE userId = ?', [user.id]);
    await run('DELETE FROM users WHERE id = ?', [user.id]);
    
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// Probar conexión Groq (solo admin)
router.get('/admin/test-groq', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    res.json({ status: 'ok', message: 'Conexión con Groq disponible' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

// ========== ADMIN ROUTES ==========
// Obtener todos los usuarios (solo admin)
