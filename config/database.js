import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_DATABASE = process.env.DB_DATABASE || 'adaptatec';

let pool = null;

export async function initializeDatabase() {
  try {
    // Conectar al servidor MySQL y crear la base de datos si no existe
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();

    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true
    });

    await createTables();
    await insertDefaultData();
    console.log('✅ Conectado a MySQL en', DB_DATABASE);
  } catch (err) {
    console.error('Error al conectar a MySQL:', err);
    throw err;
  }
}

async function createTables() {
  // 1. Tabla de usuarios (mejorada)
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      matricula VARCHAR(100) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      name VARCHAR(150) NOT NULL,
      role ENUM('alumno', 'docente', 'admin') NOT NULL DEFAULT 'alumno',
      nivel INT DEFAULT 1,
      puntos INT DEFAULT 0,
      logros INT DEFAULT 0,
      totalLogros INT DEFAULT 24,
      horas INT DEFAULT 0,
      ultimo_acceso DATETIME DEFAULT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // 2. Tabla de materias
  await run(`
    CREATE TABLE IF NOT EXISTS materias (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(150) UNIQUE NOT NULL,
      descripcion TEXT,
      icon VARCHAR(50) DEFAULT '📘',
      categoria VARCHAR(100),
      creditos INT DEFAULT 3,
      nivel INT DEFAULT 1,
      total_modulos INT DEFAULT 12,
      activo BOOLEAN DEFAULT TRUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await run(`
    ALTER TABLE materias ADD COLUMN IF NOT EXISTS total_modulos INT DEFAULT 12;
  `);

  await run(`
    ALTER TABLE materias ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
  `);

  // 3. Tabla de módulos (para desglose granular)
  await run(`
    CREATE TABLE IF NOT EXISTS modulos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      materiaId INT NOT NULL,
      nombre VARCHAR(200) NOT NULL,
      descripcion TEXT,
      orden INT DEFAULT 0,
      FOREIGN KEY (materiaId) REFERENCES materias(id) ON DELETE CASCADE ON UPDATE CASCADE,
      UNIQUE KEY uq_modulo_materia (materiaId, orden)
    ) ENGINE=InnoDB;
  `);

  // 4. Tabla materia-docente
  await run(`
    CREATE TABLE IF NOT EXISTS materia_docente (
      id INT AUTO_INCREMENT PRIMARY KEY,
      materiaId INT NOT NULL,
      docenteId INT NOT NULL,
      assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_materia_docente (materiaId, docenteId),
      FOREIGN KEY (materiaId) REFERENCES materias(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (docenteId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 5. Tabla de inscripciones (enrollments)
  await run(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      materiaId INT NOT NULL,
      enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      estado ENUM('inscrito', 'cursando', 'completado', 'reprobado') DEFAULT 'inscrito',
      calificacion_final DECIMAL(4,2) DEFAULT 0,
      UNIQUE KEY uq_enrollment (userId, materiaId),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (materiaId) REFERENCES materias(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 6. Tabla de progreso del usuario
  await run(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      materiaId INT NOT NULL,
      progress INT DEFAULT 0,
      modulosCompletados INT DEFAULT 0,
      totalModulos INT DEFAULT 12,
      horasEstudio INT DEFAULT 0,
      calificacion DECIMAL(4,2) DEFAULT 0,
      estado ENUM('cursando', 'aprobada', 'reprobada') DEFAULT 'cursando',
      comentarios TEXT,
      lastAccessed DATETIME,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_progress (userId, materiaId),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (materiaId) REFERENCES materias(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 7. Tabla de progreso por módulo (detallado)
  await run(`
    CREATE TABLE IF NOT EXISTS modulo_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userProgressId INT NOT NULL,
      moduloId INT NOT NULL,
      completado BOOLEAN DEFAULT FALSE,
      fecha_completado DATETIME DEFAULT NULL,
      UNIQUE KEY uq_modulo_progress (userProgressId, moduloId),
      FOREIGN KEY (userProgressId) REFERENCES user_progress(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (moduloId) REFERENCES modulos(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 8. Tabla de historial de progreso
  await run(`
    CREATE TABLE IF NOT EXISTS progress_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userProgressId INT NOT NULL,
      recordedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      progress INT DEFAULT 0,
      modulosCompletados INT DEFAULT 0,
      horasEstudio INT DEFAULT 0,
      calificacion DECIMAL(4,2) DEFAULT 0,
      nota TEXT,
      FOREIGN KEY (userProgressId) REFERENCES user_progress(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 9. Tabla de actividades
  await run(`
    CREATE TABLE IF NOT EXISTS activities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      descripcion TEXT NOT NULL,
      tipo ENUM('general', 'logro', 'modulo', 'examen', 'ia') DEFAULT 'general',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 10. Tabla de objetivos (gamificación)
  await run(`
    CREATE TABLE IF NOT EXISTS objectives (
      id INT AUTO_INCREMENT PRIMARY KEY,
      clave VARCHAR(100) UNIQUE NOT NULL,
      nombre VARCHAR(150) NOT NULL,
      descripcion TEXT,
      tipo ENUM('progreso', 'horas', 'materia', 'promedio', 'puntos') DEFAULT 'progreso',
      objetivo INT DEFAULT 0,
      unidad VARCHAR(50) DEFAULT 'percent',
      puntos INT DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // 11. Tabla de objetivos por usuario
  await run(`
    CREATE TABLE IF NOT EXISTS user_objectives (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      objectiveId INT NOT NULL,
      estado ENUM('pendiente', 'completado', 'reclamado') DEFAULT 'pendiente',
      progreso INT DEFAULT 0,
      desbloqueadoAt DATETIME,
      UNIQUE KEY uq_user_objective (userId, objectiveId),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (objectiveId) REFERENCES objectives(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);

  // 12. Tabla de recompensas
  await run(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(150) NOT NULL,
      descripcion TEXT,
      icon VARCHAR(50) DEFAULT '🏆',
      requiredPoints INT DEFAULT 0,
      requiredProgress INT DEFAULT 0,
      requiredHours INT DEFAULT 0,
      requiredMaterias INT DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // 13. Tabla de recompensas por usuario
  await run(`
    CREATE TABLE IF NOT EXISTS user_rewards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      rewardId INT NOT NULL,
      unlockedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_reward (userId, rewardId),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (rewardId) REFERENCES rewards(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
  `);
}

async function insertDefaultData() {
  await insertDefaultMaterias();
  await insertDefaultModulos();
  await insertDefaultObjectivesAndRewards();
  await insertAdminUser();
  await insertDemoAlumno();
  await insertDemoProgress();
}

async function insertDefaultMaterias() {
  const materiasExistentes = await all('SELECT COUNT(*) as count FROM materias');
  if (materiasExistentes[0].count > 0) return;

  await run(`
    INSERT INTO materias (nombre, descripcion, icon, categoria, creditos, nivel, total_modulos, activo) VALUES
    ('Algoritmos y Estructuras de Datos', 'Fundamentos de algoritmos, estructuras lineales, árboles y grafos.', '📘', 'Programación', 5, 3, 12, TRUE),
    ('Desarrollo Web Avanzado', 'HTML5, CSS3, JavaScript, React y Node.js para aplicaciones modernas.', '🌐', 'Web', 5, 4, 15, TRUE),
    ('Base de Datos', 'SQL, NoSQL, modelado de datos y optimización de consultas.', '🗄️', 'Datos', 4, 3, 10, TRUE),
    ('Inteligencia Artificial', 'Machine Learning, redes neuronales, NLP y sistemas expertos.', '🤖', 'IA', 5, 5, 14, TRUE),
    ('Arquitectura de Software', 'Patrones de diseño, MVC, microservicios y escalabilidad.', '🏗️', 'Arquitectura', 4, 4, 11, TRUE),
    ('Seguridad Informática', 'Criptografía, OWASP, auditoría y seguridad en redes.', '🔒', 'Seguridad', 4, 4, 13, TRUE)
  `);
}

async function insertDefaultModulos() {
  // Obtener IDs de materias
  const materias = await all('SELECT id, nombre FROM materias');
  const materiaMap = {};
  materias.forEach(m => materiaMap[m.nombre] = m.id);

  const modulosExistentes = await all('SELECT COUNT(*) as count FROM modulos');
  if (modulosExistentes[0].count > 0) return;

  const modulosData = [
    { materia: 'Algoritmos y Estructuras de Datos', modulos: [
      'Introducción a Algoritmos', 'Estructuras de Datos Lineales', 'Pilas y Colas',
      'Árboles Binarios', 'Árboles AVL', 'Grafos', 'Algoritmos de Ordenamiento',
      'Algoritmos de Búsqueda', 'Complejidad Computacional', 'Recursividad',
      'Backtracking', 'Programación Dinámica'
    ]},
    { materia: 'Desarrollo Web Avanzado', modulos: [
      'HTML5 Semántico', 'CSS3 Avanzado', 'Flexbox y Grid', 'JavaScript Básico',
      'DOM Manipulación', 'Eventos', 'Fetch API', 'React Introducción', 'Componentes',
      'Estado y Props', 'Hooks', 'Routing', 'Despliegue', 'Optimización', 'Pruebas Unitarias'
    ]},
    { materia: 'Base de Datos', modulos: [
      'Modelado Entidad-Relación', 'SQL Básico', 'Consultas Avanzadas', 'JOINs',
      'Subconsultas', 'Índices', 'Procedimientos Almacenados', 'Triggers', 'NoSQL', 'MongoDB'
    ]}
  ];

  for (const item of modulosData) {
    const materiaId = materiaMap[item.materia];
    if (materiaId) {
      for (let i = 0; i < item.modulos.length; i++) {
        await run(
          'INSERT INTO modulos (materiaId, nombre, orden) VALUES (?, ?, ?)',
          [materiaId, item.modulos[i], i + 1]
        );
      }
    }
  }
}

async function insertDefaultObjectivesAndRewards() {
  const objetivosExistentes = await all('SELECT COUNT(*) as count FROM objectives');
  if (objetivosExistentes[0].count === 0) {
    await run(`
      INSERT INTO objectives (clave, nombre, descripcion, tipo, objetivo, unidad, puntos) VALUES
      ('primer_curso', 'Primer Curso Completado', 'Completa tu primera materia al 100%', 'materia', 100, 'percent', 10),
      ('diez_horas', '10 Horas de Estudio', 'Acumula 10 horas de estudio en tus materias', 'horas', 10, 'hours', 10),
      ('avance_70', '70% de Progreso Promedio', 'Alcanza 70% de progreso promedio en todas tus materias', 'promedio', 70, 'percent', 15),
      ('maestro_algoritmos', 'Maestro en Algoritmos', 'Alcanza 85% de progreso en Algoritmos', 'progreso', 85, 'percent', 20),
      ('explorador_web', 'Explorador Web', 'Completa 5 módulos de Desarrollo Web', 'modulos', 5, 'count', 10)
    `);
  }

  const recompensasExistentes = await all('SELECT COUNT(*) as count FROM rewards');
  if (recompensasExistentes[0].count === 0) {
    await run(`
      INSERT INTO rewards (nombre, descripcion, icon, requiredPoints, requiredProgress, requiredHours) VALUES
      ('Primer Paso', 'Completa tu primera materia o registra 10 horas de estudio.', '🏅', 0, 100, 10),
      ('Racha de Estudio', 'Mantén un progreso constante en varias materias.', '🔥', 20, 75, 0),
      ('Experto en Algoritmos', 'Alcanza 85% o más en la materia Algoritmos.', '🧠', 50, 85, 0),
      ('Maestro del DOM', 'Alcanza 80% o más en Desarrollo Web.', '⚡', 65, 80, 0),
      ('Arquitecto de Software', 'Completa 8 módulos de Arquitectura de Software.', '🏛️', 40, 0, 0)
    `);
  }
}

async function insertAdminUser() {
  const existingAdmin = await get('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
  if (existingAdmin) return;

  const hashedPassword = bcrypt.hashSync('123', 10);
  await run(
    `INSERT INTO users (matricula, username, password, email, name, role, nivel, puntos, logros, horas) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['ADMIN-0001', 'ADMIN001', hashedPassword, 'admin@adaptatec.com', 'Admin Global', 'admin', 1, 0, 0, 0]
  );
  console.log('✅ Usuario administrador creado');
}

async function insertDemoAlumno() {
  const existingAlumno = await get(
    'SELECT id FROM users WHERE matricula = ? OR username = ? LIMIT 1',
    ['ALU-001', 'ALU001']
  );
  if (existingAlumno) return;

  const hashedPassword = bcrypt.hashSync('123', 10);
  const result = await run(
    `INSERT INTO users (matricula, username, password, email, name, role, nivel, puntos, logros, horas) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['ALU-001', 'ALU001', hashedPassword, 'juan.perez@universidad.edu', 'Juan David Pérez', 'alumno', 5, 75, 3, 23]
  );

  // Inscribir al alumno en todas las materias
  const materias = await all('SELECT id FROM materias');
  for (const materia of materias) {
    await run(
      'INSERT INTO enrollments (userId, materiaId, estado) VALUES (?, ?, ?)',
      [result.id, materia.id, 'cursando']
    );
  }
  console.log('✅ Alumno de demostración creado');
}

async function insertDemoProgress() {
  const alumno = await get('SELECT id FROM users WHERE matricula = ?', ['ALU-001']);
  if (!alumno) return;

  const progresoExiste = await get('SELECT id FROM user_progress WHERE userId = ? LIMIT 1', [alumno.id]);
  if (progresoExiste) return;

  const progresos = [
    { materiaNombre: 'Algoritmos y Estructuras de Datos', progress: 75, modulos: 9, horas: 24, calif: 85 },
    { materiaNombre: 'Desarrollo Web Avanzado', progress: 60, modulos: 9, horas: 30, calif: 78 },
    { materiaNombre: 'Base de Datos', progress: 85, modulos: 8, horas: 20, calif: 92 },
    { materiaNombre: 'Inteligencia Artificial', progress: 40, modulos: 5, horas: 28, calif: 70 },
    { materiaNombre: 'Arquitectura de Software', progress: 55, modulos: 6, horas: 22, calif: 75 },
    { materiaNombre: 'Seguridad Informática', progress: 30, modulos: 4, horas: 26, calif: 68 }
  ];

  for (const prog of progresos) {
    const materia = await get('SELECT id, total_modulos FROM materias WHERE nombre = ?', [prog.materiaNombre]);
    if (materia) {
      await run(
        `INSERT INTO user_progress 
         (userId, materiaId, progress, modulosCompletados, totalModulos, horasEstudio, calificacion, estado, lastAccessed) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [alumno.id, materia.id, prog.progress, prog.modulos, materia.total_modulos, prog.horas, prog.calif, 'cursando']
      );
    }
  }
  console.log('✅ Progreso de demostración creado');
}

// ========== FUNCIONES DE EXPORTACIÓN ==========

export function getPool() {
  return pool;
}

export async function run(sql, params = []) {
  if (!pool) throw new Error('Pool de base de datos no inicializado');
  try {
    const [result] = await pool.execute(sql, params);
    return { id: result.insertId || null, changes: result.affectedRows || 0 };
  } catch (error) {
    console.error('Error en run:', error);
    throw error;
  }
}

export async function get(sql, params = []) {
  if (!pool) throw new Error('Pool de base de datos no inicializado');
  try {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  } catch (error) {
    console.error('Error en get:', error);
    throw error;
  }
}

export async function all(sql, params = []) {
  if (!pool) throw new Error('Pool de base de datos no inicializado');
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Error en all:', error);
    throw error;
  }
}