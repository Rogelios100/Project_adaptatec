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
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Configurada' : '❌ No encontrada');

// Configurar rutas para archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || 3000, 10);
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'adaptatec')));

// Rutas de API (SOLO UNA VEZ)
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

// ========== INICIAR SERVIDOR (SOLO UNA VEZ) ==========
async function startServer() {
  try {
    await initializeDatabase();
    
    const server = app.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════╗
║       ADAPTATEC SERVER INICIADO        ║
╚════════════════════════════════════════╝
  
  🚀 Servidor: http://${HOST}:${PORT}
  🌐 Para otros dispositivos: http://<tu-ip>:${PORT}
  
  Acceso local: http://localhost:${PORT}
  `);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} está en uso.`);
        console.log(`💡 Soluciones:
  1. Cierra otros programas que usen el puerto ${PORT}
  2. Cambia el PORT en el archivo .env
  3. Ejecuta: taskkill /f /im node.exe (como administrador)
  4. Reinicia tu computadora
        `);
        process.exit(1);
      } else {
        console.error('❌ Error al iniciar el servidor:', err);
        process.exit(1);
      }
    });
    
  } catch (err) {
    console.error('❌ No se pudo iniciar el servidor:', err);
    process.exit(1);
  }
}

startServer();