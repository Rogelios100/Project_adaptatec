import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { get, all, run } from '../config/database.js';

const router = express.Router();

// ========== RUTAS PÚBLICAS ==========

// Obtener todas las materias
router.get('/', async (req, res) => {
  try {
    const materias = await all('SELECT * FROM materias WHERE activo = 1');
    
    res.json(
      materias.map(m => ({
        id: m.id,
        nombre: m.nombre,
        desc: m.descripcion || '',
        icon: m.icon || '📚',
        total_modulos: m.total_modulos || 12,
        activo: m.activo
      }))
    );
  } catch (error) {
    console.error('Error al obtener materias:', error);
    res.status(500).json({ error: 'Error al obtener materias' });
  }
});

// Obtener una materia específica
router.get('/:id', async (req, res) => {
  try {
    const materia = await get('SELECT * FROM materias WHERE id = ?', [req.params.id]);
    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }
    res.json(materia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RUTAS ADMIN (requieren autenticación) ==========

// Crear una nueva materia (solo admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
    }
    
    const { nombre, descripcion, icon, creditos, total_modulos, activo } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la materia es requerido' });
    }
    
    const result = await run(
      `INSERT INTO materias (nombre, descripcion, icon, creditos, total_modulos, activo) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion || '', icon || '📘', creditos || 4, total_modulos || 12, activo !== false]
    );
    
    res.status(201).json({ 
      id: result.id, 
      message: 'Materia creada exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear materia:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar materia (solo admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    const { id } = req.params;
    const { nombre, descripcion, icon, creditos, total_modulos, activo } = req.body;
    
    const updates = [];
    const values = [];
    
    if (nombre !== undefined) { updates.push('nombre = ?'); values.push(nombre); }
    if (descripcion !== undefined) { updates.push('descripcion = ?'); values.push(descripcion); }
    if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
    if (creditos !== undefined) { updates.push('creditos = ?'); values.push(creditos); }
    if (total_modulos !== undefined) { updates.push('total_modulos = ?'); values.push(total_modulos); }
    if (activo !== undefined) { updates.push('activo = ?'); values.push(activo); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    values.push(id);
    await run(`UPDATE materias SET ${updates.join(', ')} WHERE id = ?`, values);
    
    res.json({ message: 'Materia actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar materia:', error);
    res.status(500).json({ error: error.message });
  }
});

// Activar/Desactivar materia (toggle)
router.patch('/:id/toggle', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    const { id } = req.params;
    const materia = await get('SELECT activo FROM materias WHERE id = ?', [id]);
    
    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }
    
    const nuevoEstado = materia.activo === 1 ? 0 : 1;
    await run('UPDATE materias SET activo = ? WHERE id = ?', [nuevoEstado, id]);
    
    res.json({ message: `Materia ${nuevoEstado === 1 ? 'activada' : 'desactivada'} correctamente` });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar materia (solo admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    const { id } = req.params;
    
    // Verificar si la materia existe
    const materia = await get('SELECT id FROM materias WHERE id = ?', [id]);
    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }
    
    // Eliminar módulos relacionados primero
    await run('DELETE FROM modulo_progress WHERE materiaId = ?', [id]);
    await run('DELETE FROM modulos WHERE materiaId = ?', [id]);
    await run('DELETE FROM user_progress WHERE materiaId = ?', [id]);
    await run('DELETE FROM enrollments WHERE materiaId = ?', [id]);
    await run('DELETE FROM materias WHERE id = ?', [id]);
    
    res.json({ message: 'Materia eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar materia:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== RUTAS PARA MÓDULOS ==========

// Obtener módulos de una materia
router.get('/:materiaId/modulos', async (req, res) => {
  try {
    const { materiaId } = req.params;
    const modulos = await all(
      'SELECT id, nombre, orden FROM modulos WHERE materiaId = ? ORDER BY orden',
      [materiaId]
    );
    res.json(modulos);
  } catch (error) {
    console.error('Error al obtener módulos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear un módulo (solo admin)
router.post('/modulos', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    const { materiaId, nombre, orden } = req.body;
    
    if (!materiaId || !nombre) {
      return res.status(400).json({ error: 'MateriaId y nombre son requeridos' });
    }
    
    const result = await run(
      'INSERT INTO modulos (materiaId, nombre, orden) VALUES (?, ?, ?)',
      [materiaId, nombre, orden || 0]
    );
    
    res.status(201).json({ id: result.id, message: 'Módulo creado exitosamente' });
  } catch (error) {
    console.error('Error al crear módulo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener TODAS las materias (activas e inactivas) - solo admin
router.get('/admin/all', verifyToken, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    const materias = await all('SELECT * FROM materias ORDER BY id');
    res.json(materias);
  } catch (error) {
    console.error('Error al obtener todas las materias:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;