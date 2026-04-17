import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'adaptatec.db');

let db = null;

export function initializeDatabase() {
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error al conectar a la base de datos:', err);
      return;
    }
    console.log('✅ Conectado a la base de datos SQLite');
    createTables();
  });
}

function createTables() {
  db.serialize(() => {
    // Tabla de usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'alumno',
        nivel INTEGER DEFAULT 1,
        puntos INTEGER DEFAULT 0,
        logros INTEGER DEFAULT 0,
        totalLogros INTEGER DEFAULT 24,
        horas INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de materias
    db.run(`
      CREATE TABLE IF NOT EXISTS materias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        icon TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de progreso del usuario en materias
    db.run(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        materiaId INTEGER NOT NULL,
        progress INTEGER DEFAULT 0,
        modulosCompletados INTEGER DEFAULT 0,
        totalModulos INTEGER DEFAULT 12,
        horasEstudio INTEGER DEFAULT 0,
        lastAccessed DATETIME,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (materiaId) REFERENCES materias(id),
        UNIQUE(userId, materiaId)
      )
    `);

    // Tabla de actividades recientes
    db.run(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        descripcion TEXT NOT NULL,
        tipo TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // Insertar datos de ejemplo
    insertDefaultData();
  });
}

function insertDefaultData() {
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err || row.count > 0) return;

    const hashedPassword = bcrypt.hashSync('123', 10);

    // Usuarios de ejemplo
    db.run(`
      INSERT INTO users (username, password, email, name, role, nivel, puntos, logros, horas)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'ALU001', hashedPassword, 'juan.perez@universidad.edu', 'Juan David Pérez', 'alumno', 12, 87, 8, 23,
      'ADMIN001', hashedPassword, 'admin@adaptatec.com', 'Admin Global', 'admin', 1, 0, 0, 0
    ]);

    // Materias
    db.run(`
      INSERT INTO materias (nombre, descripcion, icon)
      VALUES 
        (?, ?, ?),
        (?, ?, ?),
        (?, ?, ?),
        (?, ?, ?),
        (?, ?, ?),
        (?, ?, ?)
    `, [
      'Algoritmos y Estructuras de Datos', 'Fundamentos de programación', '📘',
      'Desarrollo Web Avanzado', 'HTML, CSS, JavaScript', '🌐',
      'Base de Datos', 'SQL y modelado', '🗄️',
      'Inteligencia Artificial', 'Machine Learning y redes neuronales', '🤖',
      'Arquitectura de Software', 'Patrones y diseño', '🏗️',
      'Seguridad Informática', 'Criptografía y protección', '🔐'
    ]);

    // Progreso de ejemplo para ALU001
    db.run(`
      INSERT INTO user_progress (userId, materiaId, progress, modulosCompletados, totalModulos, horasEstudio)
      VALUES 
        (1, 1, 75, 9, 12, 24),
        (1, 2, 60, 9, 15, 30),
        (1, 3, 85, 8, 10, 20),
        (1, 4, 40, 5, 14, 28),
        (1, 5, 55, 6, 11, 22),
        (1, 6, 30, 4, 13, 26)
    `);

    console.log('✅ Datos de ejemplo insertados');
  });
}

export function getDatabase() {
  return db;
}

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
