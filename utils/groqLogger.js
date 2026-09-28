/**
 * Logger Profesional para Groq API
 * Registra errores, reintentos y estadísticas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(__dirname, '..', 'logs', 'groq');
const ERROR_LOG_FILE = path.join(LOGS_DIR, 'errors.json');
const STATS_LOG_FILE = path.join(LOGS_DIR, 'stats.json');
const MAX_LOG_SIZE = 1000; // Máximo 1000 registros por archivo

class GroqLogger {
  constructor() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedResponses: 0,
      fallbackResponses: 0,
      errorCounts: {},
      averageRetries: 0,
      uptime: Date.now()
    };
    
    this.initializeLogging();
  }

  /**
   * Inicializa el sistema de logging
   */
  initializeLogging() {
    try {
      if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
      }
      
      // Cargar estadísticas existentes
      if (fs.existsSync(STATS_LOG_FILE)) {
        const data = fs.readFileSync(STATS_LOG_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        this.stats = { ...this.stats, ...parsed };
      }

      if (!fs.existsSync(ERROR_LOG_FILE)) {
        fs.writeFileSync(ERROR_LOG_FILE, JSON.stringify([], null, 2));
      }

      console.log('✅ Sistema de logging de Groq inicializado');
    } catch (error) {
      console.error('❌ Error al inicializar logging:', error.message);
    }
  }

  /**
   * Registra una solicitud exitosa
   */
  logSuccess(pregunta, materia, responseTime) {
    this.stats.totalRequests++;
    this.stats.successfulRequests++;
    
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'SUCCESS',
      pregunta: pregunta.substring(0, 100),
      materia,
      responseTime,
      statusCode: 200
    };

    console.log(`✅ [Groq] Solicitud exitosa (${responseTime}ms)`);
    this._appendToLog(ERROR_LOG_FILE, entry);
  }

  /**
   * Registra un error con reintentos
   */
  logError(statusCode, message, attempts = 1, pregunta = '', materia = '') {
    this.stats.totalRequests++;
    this.stats.failedRequests++;
    
    // Contar errores por tipo
    if (!this.stats.errorCounts[statusCode]) {
      this.stats.errorCounts[statusCode] = 0;
    }
    this.stats.errorCounts[statusCode]++;

    const entry = {
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      statusCode,
      message,
      attempts,
      pregunta: pregunta.substring(0, 100),
      materia,
      severity: this._getSeverity(statusCode)
    };

    const icon = statusCode === 503 ? '⚠️' : '❌';
    console.error(`${icon} [Groq] Error ${statusCode} - ${message} (Intento ${attempts})`);
    
    this._appendToLog(ERROR_LOG_FILE, entry);
  }

  /**
   * Registra uso de caché
   */
  logCacheHit(pregunta, materia) {
    this.stats.totalRequests++;
    this.stats.cachedResponses++;

    const entry = {
      timestamp: new Date().toISOString(),
      type: 'CACHE_HIT',
      pregunta: pregunta.substring(0, 100),
      materia
    };

    console.log(`📦 [Groq] Respuesta desde caché`);
    this._appendToLog(ERROR_LOG_FILE, entry);
  }

  /**
   * Registra uso de fallback
   */
  logFallback(statusCode, pregunta, materia, reason = 'API unavailable') {
    this.stats.totalRequests++;
    this.stats.fallbackResponses++;

    const entry = {
      timestamp: new Date().toISOString(),
      type: 'FALLBACK',
      statusCode,
      reason,
      pregunta: pregunta.substring(0, 100),
      materia
    };

    console.log(`🔄 [Groq] Usando respuesta fallback (${reason})`);
    this._appendToLog(ERROR_LOG_FILE, entry);
  }

  /**
   * Registra un reintento
   */
  logRetry(attempt, statusCode, delay, pregunta = '') {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'RETRY',
      attempt,
      statusCode,
      delayMs: delay,
      pregunta: pregunta.substring(0, 100)
    };

    console.log(`⏳ [Groq] Reintento ${attempt} programado en ${delay}ms`);
    this._appendToLog(ERROR_LOG_FILE, entry);
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats() {
    const uptime = Date.now() - this.stats.uptime;
    const successRate = this.stats.totalRequests > 0 
      ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      successRate: `${successRate}%`,
      uptime: this._formatUptime(uptime),
      uptimeMs: uptime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtiene reporte de errores
   */
  getErrorReport() {
    try {
      if (!fs.existsSync(ERROR_LOG_FILE)) {
        return { totalErrors: 0, errors24h: 0, errorsByStatus: {}, recentErrors: [] };
      }

      const data = fs.readFileSync(ERROR_LOG_FILE, 'utf-8');
      let entries = [];
      try {
        entries = JSON.parse(data);
      } catch {
        const lines = data.split('\n').filter(line => line.trim());
        entries = lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(Boolean);
      }
      const errors = Array.isArray(entries)
        ? entries.filter(entry => entry && entry.type === 'ERROR')
        : [];

      const last24Hours = errors.filter(e => {
        const timestamp = new Date(e.timestamp);
        const now = new Date();
        return (now - timestamp) < (24 * 60 * 60 * 1000);
      });

      return {
        totalErrors: errors.length,
        errors24h: last24Hours.length,
        errorsByStatus: this._groupBy(errors, 'statusCode'),
        recentErrors: errors.slice(-10)
      };
    } catch (error) {
      console.error('Error al generar reporte:', error.message);
      return { totalErrors: 0, errors24h: 0, errorsByStatus: {}, recentErrors: [] };
    }
  }

  /**
   * Guarda estadísticas a disco
   */
  saveStats() {
    try {
      fs.writeFileSync(STATS_LOG_FILE, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error('Error al guardar estadísticas:', error.message);
    }
  }

  /**
   * Limpia logs antiguos
   */
  cleanupOldLogs(maxDays = 30) {
    try {
      if (!fs.existsSync(ERROR_LOG_FILE)) return;

      const data = fs.readFileSync(ERROR_LOG_FILE, 'utf-8');
      let entries = [];
      try {
        entries = JSON.parse(data);
      } catch {
        const lines = data.split('\n').filter(line => line.trim());
        entries = lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(Boolean);
      }
      const cutoffTime = Date.now() - (maxDays * 24 * 60 * 60 * 1000);

      const recentEntries = Array.isArray(entries)
        ? entries.filter(entry => {
            try {
              return new Date(entry.timestamp).getTime() > cutoffTime;
            } catch {
              return true;
            }
          })
        : [];

      fs.writeFileSync(ERROR_LOG_FILE, JSON.stringify(recentEntries, null, 2));
      console.log(`🧹 Logs limpiados: ${entries.length - recentEntries.length} entradas removidas`);
    } catch (error) {
      console.error('Error al limpiar logs:', error.message);
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Obtiene nivel de severidad
   */
  _getSeverity(statusCode) {
    if (statusCode === 503 || statusCode === 504) return 'HIGH';
    if (statusCode === 502 || statusCode === 429) return 'MEDIUM';
    if (statusCode >= 500) return 'HIGH';
    if (statusCode >= 400) return 'LOW';
    return 'UNKNOWN';
  }

  /**
   * Agrega entrada a log
   */
  _appendToLog(filePath, entry) {
    try {
      let entries = [];
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        try {
          const parsed = JSON.parse(content);
          entries = Array.isArray(parsed) ? parsed : [];
        } catch {
          const lines = content.split('\n').filter(line => line.trim());
          entries = lines.map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          }).filter(Boolean);
        }
      }

      entries.push(entry);
      const truncated = entries.length > MAX_LOG_SIZE
        ? entries.slice(-MAX_LOG_SIZE)
        : entries;

      fs.writeFileSync(filePath, JSON.stringify(truncated, null, 2));

      if (entries.length > MAX_LOG_SIZE) {
        console.log(`📋 Log truncado: ${entries.length - MAX_LOG_SIZE} entradas removidas`);
      }
    } catch (error) {
      console.error('Error al escribir log:', error.message);
    }
  }

  /**
   * Formatea uptime
   */
  _formatUptime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  /**
   * Agrupa array por propiedad
   */
  _groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = 0;
      result[group]++;
      return result;
    }, {});
  }
}

export default new GroqLogger();
