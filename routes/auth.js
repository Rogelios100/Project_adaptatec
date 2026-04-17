import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get } from '../config/database.js';

const router = express.Router();

// REGISTRARSE
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, role } = req.body;

    // Validaciones
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (password.length < 3) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 3 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(409).json({ error: 'El usuario o email ya existe' });
    }

    // Hashear contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Crear usuario
    const result = await run(
      'INSERT INTO users (username, password, email, name, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, name || username, role || 'alumno']
    );

    // Generar token
    const token = jwt.sign(
      { id: result.id, username, role: role || 'alumno' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: result.id, username, email, name, role: role || 'alumno' }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// INICIAR SESIÓN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    // Buscar usuario
    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
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
      process.env.JWT_SECRET,
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
