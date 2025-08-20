import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const MINIO_PUBLIC_URL = import.meta.env.VITE_MINIO_PUBLIC_URL || 'http://localhost:9001'
const USE_PROXY = import.meta.env.VITE_USE_PROXY === 'true' || false

// Configuración para diferentes entornos de MinIO
const MINIO_CONFIG = {
  internal: 'minio:9000',
  public: MINIO_PUBLIC_URL,
  // Agregar más configuraciones según sea necesario
}

// Función de utilidad para limpiar URLs
const cleanUrl = (url) => {
  if (!url) return null
  
  let cleanUrl = url.trim()
  
  // Remover URLs duplicadas (http://http://)
  while (cleanUrl.includes('http://http://')) {
    cleanUrl = cleanUrl.replace('http://http://', 'http://')
  }
  
  // Remover URLs duplicadas (https://https://)
  while (cleanUrl.includes('https://https://')) {
    cleanUrl = cleanUrl.replace('https://https://', 'https://')
  }
  
  // Remover URLs duplicadas (http://https://)
  if (cleanUrl.includes('http://https://')) {
    cleanUrl = cleanUrl.replace('http://https://', 'https://')
  }
  
  // Remover URLs duplicadas (https://http://)
  if (cleanUrl.includes('https://http://')) {
    cleanUrl = cleanUrl.replace('https://http://', 'http://')
  }
  
  // Asegurar que la URL tenga un protocolo válido
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'http://' + cleanUrl
  }
  
  return cleanUrl
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    // Log detallado del error
    if (error.response) {
      console.error('Response data:', error.response.data)
      console.error('Response status:', error.response.status)
      console.error('Response headers:', error.response.headers)
    } else if (error.request) {
      console.error('Request error:', error.request)
    } else {
      console.error('Error message:', error.message)
    }
    throw error
  }
)

export const imageService = {
  // Obtener lista de imágenes
  async fetchImages() {
    const response = await api.get('/api/v1/images')
    return response.data
  },

  // Subir imagen
  async uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/api/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Ver imagen - obtener URL firmada de MinIO
  async getImageUrl(filename) {
    try {
      console.log('Fetching image URL for:', filename)
      console.log('API Base URL:', API_BASE_URL)
      console.log('MinIO Public URL:', MINIO_PUBLIC_URL)
      
      const response = await api.get(`/api/v1/images/${filename}`)
      console.log('API response:', response.data)
      
      // Convertir URL interna de MinIO a URL pública
      let signedUrl = response.data.signed_url
      
      if (signedUrl) {
        console.log('Original signed URL:', signedUrl)
        
        // Reemplazar la URL interna de MinIO con la URL pública
        if (signedUrl.includes(MINIO_CONFIG.internal)) {
          signedUrl = signedUrl.replace(MINIO_CONFIG.internal, MINIO_CONFIG.public)
          console.log('Converted MinIO URL:', signedUrl)
        }
        
        // Limpiar la URL de problemas de formato
        const cleanSignedUrl = cleanUrl(signedUrl)
        if (!cleanSignedUrl) {
          console.error('Failed to clean URL:', signedUrl)
          return null
        }
        
        console.log('Cleaned URL:', cleanSignedUrl)
        
        // Verificar que la URL sea válida
        try {
          new URL(cleanSignedUrl)
          console.log('Final URL is valid:', cleanSignedUrl)
          
          // Comentar la verificación de accesibilidad para evitar errores de CORS
          // try {
          //   const testResponse = await fetch(cleanSignedUrl, { method: 'HEAD' })
          //   if (testResponse.ok) {
          //     console.log('URL is accessible:', cleanSignedUrl)
          //     return cleanSignedUrl
          //   } else {
          //     console.warn('URL returned status:', testResponse.status, cleanSignedUrl)
          //     return cleanSignedUrl // Devolver la URL de todos modos, el navegador la manejará
          //   }
          // } catch (fetchError) {
          //   console.warn('Could not test URL accessibility:', fetchError.message)
          //   return cleanSignedUrl // Devolver la URL de todos modos
          // }
          
          // Simplemente devolver la URL limpia
          return cleanSignedUrl
        } catch (urlError) {
          console.error('Invalid URL format after cleaning:', cleanSignedUrl, urlError)
          return null
        }
      } else {
        console.error('No signed_url in response:', response.data)
        return null
      }
    } catch (error) {
      console.error('Error getting signed URL for', filename, ':', error)
      return null
    }
  },

  // Ver imagen a través del backend (proxy para evitar CORS)
  async getImageUrlViaProxy(filename) {
    try {
      console.log('Fetching image via proxy for:', filename)
      
      // Usar el endpoint del backend que sirve la imagen directamente
      const proxyUrl = `${API_BASE_URL}/api/v1/images/${filename}/proxy`
      console.log('Proxy URL:', proxyUrl)
      
      return proxyUrl
    } catch (error) {
      console.error('Error getting proxy URL for', filename, ':', error)
      return null
    }
  },

  // Obtener thumbnail de imagen (sin CORS, ideal para listas)
  async getImageThumbnail(filename, width = 200, height = 200) {
    try {
      console.log('Fetching thumbnail for:', filename, `${width}x${height}`)
      
      const thumbnailUrl = `${API_BASE_URL}/api/v1/images/${filename}/thumbnail?width=${width}&height=${height}`
      console.log('Thumbnail URL:', thumbnailUrl)
      
      return thumbnailUrl
    } catch (error) {
      console.error('Error getting thumbnail URL for', filename, ':', error)
      return null
    }
  },

  // Obtener URL de imagen con fallback automático
  async getImageUrlWithFallback(filename, preferProxy = true) {
    try {
      if (preferProxy) {
        // Intentar primero con proxy (sin CORS)
        const proxyUrl = await this.getImageUrlViaProxy(filename)
        if (proxyUrl) {
          console.log('Using proxy URL for:', filename)
          return proxyUrl
        }
        
        // Fallback a URL firmada si el proxy falla
        console.log('Proxy failed, falling back to signed URL for:', filename)
        return await this.getImageUrl(filename)
      } else {
        // Intentar primero con URL firmada
        const signedUrl = await this.getImageUrl(filename)
        if (signedUrl) {
          console.log('Using signed URL for:', filename)
          return signedUrl
        }
        
        // Fallback a proxy si la URL firmada falla
        console.log('Signed URL failed, falling back to proxy for:', filename)
        return await this.getImageUrlViaProxy(filename)
      }
    } catch (error) {
      console.error('Error getting image URL with fallback for', filename, ':', error)
      return null
    }
  },

  // Descargar imagen
  async downloadImage(filename) {
    try {
      console.log('Downloading image:', filename)
      
      // Obtener la URL firmada de MinIO para descarga directa
      const signedUrl = await this.getImageUrl(filename)
      
      if (!signedUrl) {
        throw new Error('No se pudo obtener la URL de descarga')
      }
      
      console.log('Download URL:', signedUrl)
      
      // Crear un enlace temporal para descargar desde MinIO
      const link = document.createElement('a')
      link.href = signedUrl
      link.setAttribute('download', filename)
      link.setAttribute('target', '_blank')
      
      // Agregar el enlace al DOM, hacer clic y removerlo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Download initiated for:', filename)
      
    } catch (error) {
      console.error('Error downloading image:', error)
      
      // Fallback: intentar descargar desde el proxy del backend
      try {
        console.log('Trying proxy download for:', filename)
        const proxyUrl = `${API_BASE_URL}/api/v1/images/${filename}/proxy`
        
        const response = await fetch(proxyUrl)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        console.log('Proxy download successful for:', filename)
        
      } catch (proxyError) {
        console.error('Proxy download also failed:', proxyError)
        throw new Error('No se pudo descargar la imagen')
      }
    }
  },

  // Borrar imagen
  async deleteImage(filename) {
    const response = await api.delete(`/api/v1/images/${filename}`)
    return response.data
  },

  // Redimensionar imagen
  async resizeImage(filename, width, height) {
    const response = await api.post(`/api/v1/resize/${filename}`, {
      width: parseInt(width),
      height: parseInt(height),
    })
    return response.data
  },

  // Consultar estado de tarea
  async getTaskStatus(taskId) {
    const response = await api.get(`/api/v1/tasks/${taskId}`)
    return response.data
  },
}

// Funciones de conveniencia para usar directamente
export const fetchImages = imageService.fetchImages
export const uploadImage = imageService.uploadImage
export const deleteImage = imageService.deleteImage
export const resizeImage = imageService.resizeImage
export const getTaskStatus = imageService.getTaskStatus
export const getImageUrl = imageService.getImageUrl
export const downloadImage = imageService.downloadImage
export const getImageUrlViaProxy = imageService.getImageUrlViaProxy
export const getImageThumbnail = imageService.getImageThumbnail
export const getImageUrlWithFallback = imageService.getImageUrlWithFallback
