import React, { useState, useEffect } from 'react'
import ImageUpload from './components/ImageUpload'
import ImageList from './components/ImageList'
import { fetchImages } from './services/imageService'

// Componente de debug para mostrar estado de la API
const ApiDebugInfo = ({ apiUrl }) => {
  const [apiStatus, setApiStatus] = useState('checking')
  const [lastCheck, setLastCheck] = useState(null)

  const checkApiStatus = async () => {
    try {
      setApiStatus('checking')
      const response = await fetch(`${apiUrl}/health`, { 
        method: 'GET',
        mode: 'cors'
      })
      if (response.ok) {
        setApiStatus('online')
      } else {
        setApiStatus('error')
      }
    } catch (error) {
      console.error('API status check failed:', error)
      setApiStatus('offline')
    } finally {
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    checkApiStatus()
    const interval = setInterval(checkApiStatus, 30000) // Verificar cada 30 segundos
    return () => clearInterval(interval)
  }, [apiUrl])

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'online': return 'text-green-600 bg-green-50'
      case 'offline': return 'text-red-600 bg-red-50'
      case 'error': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = () => {
    switch (apiStatus) {
      case 'online': return 'API Online'
      case 'offline': return 'API Offline'
      case 'error': return 'API Error'
      default: return 'Verificando...'
    }
  }

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor()}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        apiStatus === 'online' ? 'bg-green-500' : 
        apiStatus === 'offline' ? 'bg-red-500' : 
        apiStatus === 'error' ? 'bg-yellow-500' : 'bg-gray-500'
      }`}></div>
      {getStatusText()}
      {lastCheck && (
        <span className="ml-2 text-xs opacity-75">
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
      <button 
        onClick={checkApiStatus}
        className="ml-2 p-1 hover:bg-white hover:bg-opacity-20 rounded"
        title="Verificar estado de la API"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  )
}

function App() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    try {
      setLoading(true)
      const data = await fetchImages()
      
      // Asegurar que images sea siempre un array
      if (Array.isArray(data)) {
        setImages(data)
      } else if (data && Array.isArray(data.images)) {
        setImages(data.images)
      } else if (data && Array.isArray(data.data)) {
        setImages(data.data)
      } else {
        console.warn('Unexpected API response format:', data)
        setImages([])
      }
      
      setError(null)
    } catch (err) {
      setError('Error al cargar las imágenes')
      console.error('Error loading images:', err)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  const handleImageUploaded = () => {
    loadImages()
  }

  const handleImageDeleted = (filename) => {
    setImages(images.filter(img => img.filename !== filename))
  }

  const handleImageResized = (filename, newData) => {
    setImages(images.map(img => 
      img.filename === filename 
        ? { ...img, ...newData }
        : img
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Gestión de Imágenes
              </h1>
              <p className="mt-2 text-gray-600">
                Sube, gestiona y procesa tus imágenes
              </p>
            </div>
            <ApiDebugInfo apiUrl={import.meta.env.VITE_API_URL || 'http://localhost:8000'} />
          </div>
        </div>

        <ImageUpload onImageUploaded={handleImageUploaded} />

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <ImageList 
          images={images} 
          loading={loading}
          onImageDeleted={handleImageDeleted}
          onImageResized={handleImageResized}
          onRefresh={loadImages}
        />
      </div>
    </div>
  )
}

export default App
