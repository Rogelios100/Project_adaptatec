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

    const materiaIds = materias.map(m => m.id);
    let completedModuleMap = {};

    if (materiaIds.length > 0) {
      const placeholders = materiaIds.map(() => '?').join(',');
      const moduleProgressRows = await all(`
        SELECT mo.materiaId, mo.orden
        FROM modulo_progress mp
        JOIN user_progress up ON mp.userProgressId = up.id
        JOIN modulos mo ON mp.moduloId = mo.id
        WHERE up.userId = ? AND mo.materiaId IN (${placeholders}) AND mp.completado = TRUE
      `, [req.user.id, ...materiaIds]);

      moduleProgressRows.forEach(row => {
        completedModuleMap[row.materiaId] = completedModuleMap[row.materiaId] || [];
        completedModuleMap[row.materiaId].push(row.orden - 1);
      });

      Object.values(completedModuleMap).forEach(arr => arr.sort((a, b) => a - b));
    }

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
      materias: materias.map(m => ({
        id: m.id,
        name: m.nombre,
        desc: m.descripcion || '',
        icon: m.icon,
        progress: m.progress || 0,
        modulosCompletados: m.modulosCompletados || 0,
        totalModulos: m.totalModulos || 12,
        horasEstudio: m.horasEstudio || 0,
        completedModuleIndexes: completedModuleMap[m.id] || []
      })),
      recent: recent.map(r => r.descripcion)
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

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

    // Actualizar o insertar progreso
    await run(
      `INSERT INTO user_progress (userId, materiaId, progress, modulosCompletados, horasEstudio, lastAccessed)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE progress = ?, modulosCompletados = ?, horasEstudio = ?, lastAccessed = CURRENT_TIMESTAMP`,
      [req.user.id, materiaId, progress || 0, modulosCompletados || 0, horasEstudio || 0,
       progress || 0, modulosCompletados || 0, horasEstudio || 0]
    );

    await syncUserSummary(req.user.id);

    res.json({ message: 'Progreso actualizado' });
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    res.status(500).json({ error: 'Error al actualizar progreso' });
  }
});

router.put('/progress/:materiaId/modules/:moduloIndex', verifyToken, async (req, res) => {
  try {
    const { materiaId, moduloIndex } = req.params;
    const orden = parseInt(moduloIndex, 10) + 1;

    const modulo = await get('SELECT id FROM modulos WHERE materiaId = ? AND orden = ?', [materiaId, orden]);
    if (!modulo) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    let userProgress = await get('SELECT id FROM user_progress WHERE userId = ? AND materiaId = ?', [req.user.id, materiaId]);
    if (!userProgress) {
      await run(
        'INSERT INTO user_progress (userId, materiaId, totalModulos, lastAccessed) VALUES (?, ?, (SELECT total_modulos FROM materias WHERE id = ?), CURRENT_TIMESTAMP)',
        [req.user.id, materiaId, materiaId]
      );
      userProgress = await get('SELECT id FROM user_progress WHERE userId = ? AND materiaId = ?', [req.user.id, materiaId]);
    }

    await run(
      `INSERT INTO modulo_progress (userProgressId, moduloId, completado, fecha_completado) VALUES (?, ?, TRUE, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE completado = TRUE, fecha_completado = CURRENT_TIMESTAMP`,
      [userProgress.id, modulo.id]
    );

    const completedCountRow = await get('SELECT COUNT(*) as count FROM modulo_progress WHERE userProgressId = ? AND completado = TRUE', [userProgress.id]);
    const completedCount = completedCountRow?.count || 0;

    const totalCountRow = await get('SELECT COUNT(*) as total FROM modulos WHERE materiaId = ?', [materiaId]);
    const totalModulos = totalCountRow?.total || 0;
    const progress = totalModulos ? Math.round((completedCount / totalModulos) * 100) : 0;

    await run(
      'UPDATE user_progress SET modulosCompletados = ?, progress = ?, lastAccessed = CURRENT_TIMESTAMP WHERE id = ?',
      [completedCount, progress, userProgress.id]
    );

    await syncUserSummary(req.user.id);

    const completedRows = await all(
      'SELECT mo.orden FROM modulo_progress mp JOIN modulos mo ON mp.moduloId = mo.id WHERE mp.userProgressId = ? AND mp.completado = TRUE',
      [userProgress.id]
    );
    const completedModuleIndexes = completedRows.map(r => r.orden - 1);

    res.json({
      message: 'Progreso de módulo actualizado',
      completedModuleIndexes,
      modulosCompletados: completedCount,
      progress
    });
  } catch (error) {
    console.error('Error al actualizar progreso de módulo:', error);
    res.status(500).json({ error: 'Error al actualizar progreso de módulo' });
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
