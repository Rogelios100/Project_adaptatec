import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import materiasRoutes from './routes/materias.js';
import groqRoutes from './routes/groq.js';

// Cargar variables de entorno
dotenv.config();

// Configurar rutas para archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors({
  origin: '*', // Permite conexiones desde cualquier dispositivo
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Inicializar base de datos
initializeDatabase();

// Servir archivos estáticos de la aplicación
app.use(express.static(path.join(__dirname, 'adaptatec')));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/gemini', groqRoutes);
app.use('/api/groq', groqRoutes);

// Ruta de verificación de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'adaptatec', 'index.html'));
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    status: err.status || 500
  });
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════╗
║       ADAPTATEC SERVER INICIADO        ║
╚════════════════════════════════════════╝
  
  🚀 Servidor: http://${HOST}:${PORT}
  🌐 Para otros dispositivos: http://<tu-ip>:${PORT}
  
  Puedes encontrar tu IP local con: ipconfig (Windows)
  o ifconfig (Mac/Linux)
  
  Acceso local: http://localhost:${PORT}
  Acceso remoto: http://<IP-LOCAL>:${PORT}
  `);
});
