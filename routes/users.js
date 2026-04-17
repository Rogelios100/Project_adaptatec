import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { get, all } from '../config/database.js';

const router = express.Router();

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

    // Obtener actividades recientes
    const recent = await all(`
      SELECT descripcion FROM activities WHERE userId = ? ORDER BY createdAt DESC LIMIT 4
    `, [req.user.id]);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      nivel: user.nivel,
      puntos: user.puntos,
      logros: user.logros,
      totalLogros: user.totalLogros,
      horas: user.horas,
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
    await new Promise((resolve, reject) => {
      const db = require('../config/database.js').getDatabase();
      db.run(`
        INSERT INTO user_progress (userId, materiaId, progress, modulosCompletados, horasEstudio, lastAccessed)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(userId, materiaId) 
        DO UPDATE SET progress=?, modulosCompletados=?, horasEstudio=?, lastAccessed=CURRENT_TIMESTAMP
      `, [req.user.id, materiaId, progress || 0, modulosCompletados || 0, horasEstudio || 0,
          progress || 0, modulosCompletados || 0, horasEstudio || 0],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ message: 'Progreso actualizado' });
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    res.status(500).json({ error: 'Error al actualizar progreso' });
  }
});

// Registrar actividad
router.post('/activity', verifyToken, async (req, res) => {
  try {
    const { descripcion, tipo } = req.body;

    if (!descripcion) {
      return res.status(400).json({ error: 'Descripción requerida' });
    }

    await require('../config/database.js').run(
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
