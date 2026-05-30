/**
 * Sistema de Caché para Respuestas de Gemini
 * Almacena respuestas exitosas para usar como fallback
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '..', 'cache', 'gemini');
const CACHE_FILE = path.join(CACHE_DIR, 'responses.json');
const MAX_CACHE_SIZE = 500; // Máximo 500 respuestas en caché
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos

class GeminiCache {
  constructor() {
    this.cache = new Map();
    this.initializeCache();
  }

  /**
   * Inicializa el caché desde archivo
   */
  initializeCache() {
    try {
      // Crear directorio si no existe
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }

      // Cargar caché desde archivo
      if (fs.existsSync(CACHE_FILE)) {
        const data = fs.readFileSync(CACHE_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        
        parsed.forEach(item => {
          // Solo cargar si no ha expirado
          if (Date.now() - item.timestamp < CACHE_TTL) {
            this.cache.set(item.key, item);
          }
        });

        console.log(`✅ Caché de Gemini cargado: ${this.cache.size} elementos`);
      }
    } catch (error) {
      console.error('❌ Error al cargar caché:', error.message);
    }
  }

  /**
   * Genera clave de caché basada en pregunta y materia
   */
  generateKey(pregunta, materia) {
    const normalized = `${pregunta.toLowerCase().trim()}|${(materia || '').toLowerCase().trim()}`;
    return Buffer.from(normalized).toString('base64');
  }

  /**
   * Obtiene respuesta del caché
   */
  get(pregunta, materia) {
    const key = this.generateKey(pregunta, materia);
    const cached = this.cache.get(key);

    if (cached) {
      // Verificar TTL
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`📦 [CACHÉ HIT] Pregunta encontrada en caché`);
        return cached.respuesta;
      } else {
        // Remover del caché si expiró
        this.cache.delete(key);
      }
    }

    return null;
  }

  /**
   * Guarda respuesta en caché
   */
  set(pregunta, materia, respuesta) {
    const key = this.generateKey(pregunta, materia);

    if (this.cache.size >= MAX_CACHE_SIZE) {
      // Remover entrada más antigua
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
      console.log('🗑️  Entrada antigua removida del caché (límite alcanzado)');
    }

    this.cache.set(key, {
      key,
      pregunta,
      materia: materia || '',
      respuesta,
      timestamp: Date.now()
    });

    this.saveToDisk();
  }

  /**
   * Guarda caché a disco
   */
  saveToDisk() {
    try {
      const data = Array.from(this.cache.values());
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error al guardar caché a disco:', error.message);
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const oldestEntry = entries.length > 0 
      ? new Date(entries.sort((a, b) => a.timestamp - b.timestamp)[0].timestamp)
      : null;
    
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      usage: Math.round((this.cache.size / MAX_CACHE_SIZE) * 100),
      oldestEntry,
      ttlDays: CACHE_TTL / (24 * 60 * 60 * 1000)
    };
  }

  /**
   * Limpia caché expirado
   */
  cleanup() {
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 ${removed} entradas expiradas removidas del caché`);
      this.saveToDisk();
    }
  }

  /**
   * Limpia todo el caché
   */
  clear() {
    this.cache.clear();
    try {
      fs.unlinkSync(CACHE_FILE);
      console.log('🗑️  Caché completamente limpiado');
    } catch (error) {
      // Archivo no existe, ignorar
    }
  }
}

export default new GeminiCache();
