import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get } from '../config/database.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'adaptatec_default_secret';
const router = express.Router();

// REGISTRARSE
router.post('/register', async (req, res) => {
  try {
    const { username, matricula, email, password, name, role } = req.body;

    // Validaciones
    if (!username || !matricula || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (password.length < 7) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 7 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await get(
      'SELECT id FROM users WHERE username = ? OR email = ? OR matricula = ?',
      [username, email, matricula]
    );
    if (existingUser) {
      return res.status(409).json({ error: 'El usuario, email o matrícula ya existe' });
    }

    // Hashear contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newRole = 'alumno';

    // Crear usuario siempre como alumno en registro público
    const result = await run(
      'INSERT INTO users (username, matricula, password, email, name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, matricula, hashedPassword, email, name || username, newRole]
    );

    // Generar token
    const token = jwt.sign(
      { id: result.id, username, matricula, role: newRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: result.id, username, matricula, email, name, role: newRole }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// REGISTRAR USUARIO/ADMIN (solo admin puede crear roles especiales)
router.post('/register-admin', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { username, matricula, email, password, name, role } = req.body;

    if (!username || !matricula || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (password.length < 7) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 7 caracteres' });
    }

    const existingUser = await get(
      'SELECT id FROM users WHERE username = ? OR email = ? OR matricula = ?',
      [username, email, matricula]
    );
    if (existingUser) {
      return res.status(409).json({ error: 'El usuario, email o matrícula ya existe' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newRole = role || 'admin';

    const result = await run(
      'INSERT INTO users (username, matricula, password, email, name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, matricula, hashedPassword, email, name || username, newRole]
    );

    res.status(201).json({
      message: 'Usuario creado por admin exitosamente',
      user: { id: result.id, username, matricula, email, name, role: newRole }
    });
  } catch (error) {
    console.error('Error en register-admin:', error);
    res.status(500).json({ error: 'Error al registrar usuario como admin' });
  }
});

// INICIAR SESIÓN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    // Buscar usuario por username o matrícula
    const user = await get(
      'SELECT * FROM users WHERE username = ? OR matricula = ?',
      [username, username]
    );
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Verificar contraseña
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Iniciado sesión exitosamente',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        nivel: user.nivel,
        puntos: user.puntos,
        logros: user.logros,
        totalLogros: user.totalLogros,
        horas: user.horas
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

export default router;
