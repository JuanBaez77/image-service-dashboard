// Configuración de debugging
export const DEBUG_CONFIG = {
  // Habilitar logs detallados
  ENABLE_VERBOSE_LOGGING: import.meta.env.VITE_DEBUG_LOGGING === 'true' || false,
  
  // Habilitar verificación de URLs
  ENABLE_URL_VALIDATION: import.meta.env.VITE_URL_VALIDATION === 'true' || true,
  
  // Habilitar verificación de accesibilidad de URLs
  ENABLE_URL_ACCESSIBILITY_CHECK: import.meta.env.VITE_URL_ACCESSIBILITY_CHECK === 'true' || false,
  
  // Timeout para verificación de URLs (ms)
  URL_CHECK_TIMEOUT: parseInt(import.meta.env.VITE_URL_CHECK_TIMEOUT) || 5000,
  
  // Configuración de MinIO
  MINIO: {
    INTERNAL_HOST: 'minio:9000',
    PUBLIC_HOST: import.meta.env.VITE_MINIO_PUBLIC_URL || 'http://localhost:9001',
    BUCKET_NAME: import.meta.env.VITE_MINIO_BUCKET || 'images'
  }
}

// Función de logging condicional
export const debugLog = (level, message, ...args) => {
  if (DEBUG_CONFIG.ENABLE_VERBOSE_LOGGING) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    switch (level.toLowerCase()) {
      case 'error':
        console.error(prefix, message, ...args)
        break
      case 'warn':
        console.warn(prefix, message, ...args)
        break
      case 'info':
        console.info(prefix, message, ...args)
        break
      default:
        console.log(prefix, message, ...args)
    }
  }
}

// Función para validar configuración
export const validateConfig = () => {
  const issues = []
  
  if (!DEBUG_CONFIG.MINIO.PUBLIC_HOST) {
    issues.push('VITE_MINIO_PUBLIC_URL no está configurado')
  }
  
  if (DEBUG_CONFIG.ENABLE_URL_ACCESSIBILITY_CHECK && DEBUG_CONFIG.URL_CHECK_TIMEOUT < 1000) {
    issues.push('VITE_URL_CHECK_TIMEOUT es muy bajo (< 1000ms)')
  }
  
  if (issues.length > 0) {
    console.warn('Configuración de debugging tiene problemas:', issues)
  }
  
  return issues.length === 0
}
