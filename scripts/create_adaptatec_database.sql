-- Script MySQL para crear la base de datos de Adaptatec
-- Tablas: usuarios, materias, docentes, inscripciones y progreso de estudiantes

CREATE DATABASE IF NOT EXISTS adaptatec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE adaptatec;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'alumno',
  nivel INT DEFAULT 1,
  puntos INT DEFAULT 0,
  logros INT DEFAULT 0,
  totalLogros INT DEFAULT 24,
  horas INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS materias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) UNIQUE NOT NULL,
  descripcion TEXT,
  icon VARCHAR(50),
  categoria VARCHAR(100),
  creditos INT DEFAULT 3,
  nivel INT DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS materia_docente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  materiaId INT NOT NULL,
  docenteId INT NOT NULL,
  assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_materia_docente (materiaId, docenteId),
  FOREIGN KEY (materiaId) REFERENCES materias(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (docenteId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  materiaId INT NOT NULL,
  enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'inscrito',
  UNIQUE KEY uq_enrollment (userId, materiaId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (materiaId) REFERENCES materias(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  materiaId INT NOT NULL,
  progress INT DEFAULT 0,
  modulosCompletados INT DEFAULT 0,
  totalModulos INT DEFAULT 12,
  horasEstudio INT DEFAULT 0,
  calificacion DECIMAL(4,2) DEFAULT 0,
  comentarios TEXT,
  lastAccessed DATETIME,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_progress (userId, materiaId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (materiaId) REFERENCES materias(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  descripcion TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'general',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS objectives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) DEFAULT 'progreso',
  objetivo INT DEFAULT 0,
  unidad VARCHAR(50) DEFAULT 'percent',
  puntos INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_objectives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  objectiveId INT NOT NULL,
  estado VARCHAR(50) DEFAULT 'pendiente',
  progreso INT DEFAULT 0,
  desbloqueadoAt DATETIME,
  UNIQUE KEY uq_user_objective (userId, objectiveId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (objectiveId) REFERENCES objectives(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  requiredPoints INT DEFAULT 0,
  requiredProgress INT DEFAULT 0,
  requiredHours INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  rewardId INT NOT NULL,
  unlockedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_reward (userId, rewardId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (rewardId) REFERENCES rewards(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- Solo usuario administrador de prueba
INSERT IGNORE INTO users (matricula, username, password, email, name, role, nivel, puntos, logros, horas)
VALUES
  ('ADMIN-0001', 'ADMIN001', 'password_hash_example', 'admin@adaptatec.com', 'Admin Global', 'admin', 1, 0, 0, 0);
--Objetivos de ejemplo
INSERT IGNORE INTO objectives (clave, nombre, descripcion, tipo, objetivo, unidad, puntos) VALUES
  ('primer_curso', 'Completa tu primera materia', 'Alcanza 100% en al menos una materia.', 'materia', 100, 'percent', 10),
  ('diez_horas', 'Acumula 10 horas de estudio', 'Registra al menos 10 horas de estudio en tus materias.', 'horas', 10, 'hours', 10),
  ('avance_promedio', 'Promedio de progreso 70%', 'Mantén un promedio de progreso de al menos 70% en tus materias.', 'promedio', 70, 'percent', 10);
--Recompensas de ejemplo
INSERT IGNORE INTO rewards (nombre, descripcion, requiredPoints, requiredProgress, requiredHours) VALUES
  ('Primer Paso', 'Completa tu primera materia o registra 10 horas de estudio.', 0, 100, 10),
  ('Racha de Estudio', 'Mantén un progreso constante en varias materias.', 20, 75, 0),
  ('Experto en Algoritmos', 'Alcanza 85% o más en la materia Algoritmos.', 50, 85, 0),
  ('Maestro del DOM', 'Alcanza 80% o más en Desarrollo Web.', 65, 80, 0);
