/**
 * Sistema de Reintentos con Backoff Exponencial
 * Maneja errores temporales como 503 (Service Unavailable)
 */

class RetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000; // 1 segundo
    this.maxDelay = options.maxDelay || 10000; // 10 segundos
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.retryableStatusCodes = options.retryableStatusCodes || [429, 500, 502, 503, 504];
  }

  /**
   * Calcula el delay para el próximo reintento usando backoff exponencial
   * Con jitter aleatorio para evitar thundering herd
   */
  calculateDelay(attempt) {
    const exponentialDelay = Math.min(
      this.initialDelay * Math.pow(this.backoffMultiplier, attempt),
      this.maxDelay
    );
    
    // Agregar jitter aleatorio (±10%)
    const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
    return Math.round(exponentialDelay + jitter);
  }

  /**
   * Espera n milisegundos
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Determina si un error es reintentable
   */
  isRetryable(statusCode, error) {
    // Error de red o timeout
    if (!statusCode && (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT')) {
      return true;
    }
    
    // Códigos HTTP reintentables
    return this.retryableStatusCodes.includes(statusCode);
  }

  /**
   * Ejecuta una función con reintentos automáticos
   */
  async execute(fn, context = 'Operation') {
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const statusCode = error.statusCode || error.status;
        
        // Si no es reintentable, lanzar inmediatamente
        if (!this.isRetryable(statusCode, error)) {
          throw error;
        }

        // Si es el último intento, lanzar error
        if (attempt === this.maxRetries - 1) {
          const fullError = new Error(
            `${context} falló después de ${this.maxRetries} intentos. ${error.message}`
          );
          fullError.statusCode = statusCode;
          fullError.originalError = error;
          fullError.attempts = this.maxRetries;
          throw fullError;
        }

        // Calcular delay para próximo intento
        const delay = this.calculateDelay(attempt);
        console.log(
          `⏳ [${context}] Intento ${attempt + 1}/${this.maxRetries} falló (Status: ${statusCode}). ` +
          `Reintentando en ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Obtiene información de diagnóstico de un error
   */
  getDiagnostics(error) {
    return {
      message: error.message,
      statusCode: error.statusCode || 'Unknown',
      type: error.code || 'Unknown',
      timestamp: new Date().toISOString(),
      retryable: this.isRetryable(error.statusCode, error),
      attempts: error.attempts || 1
    };
  }
}

export default new RetryHandler({
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504]
});
