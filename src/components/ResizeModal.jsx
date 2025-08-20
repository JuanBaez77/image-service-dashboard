import React, { useState, useEffect } from 'react'
import { resizeImage, getTaskStatus } from '../services/imageService'

const ResizeModal = ({ isOpen, image, onClose, onSubmit }) => {
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [isResizing, setIsResizing] = useState(false)
  const [error, setError] = useState(null)
  const [taskId, setTaskId] = useState(null)
  const [taskStatus, setTaskStatus] = useState(null)

  // Función para obtener el nombre del archivo de diferentes campos posibles
  const getFilename = (image) => {
    return image?.nombre || image?.filename || image?.name || image?.key || 'Sin nombre'
  }

  useEffect(() => {
    if (isOpen && image) {
      // Intentar obtener dimensiones originales de la imagen
      const originalWidth = image?.width || image?.ancho || 500
      const originalHeight = image?.height || image?.alto || 500
      
      // Establecer valores por defecto (mitad del tamaño original)
      setWidth(Math.floor(originalWidth / 2).toString())
      setHeight(Math.floor(originalHeight / 2).toString())
      
      setError(null)
      setTaskId(null)
      setTaskStatus(null)
    }
  }, [isOpen, image])

  useEffect(() => {
    let interval
    let timeout
    
    if (taskId && taskStatus !== 'completed' && taskStatus !== 'failed') {
      console.log('Starting task status polling for:', taskId)
      
      // Timeout de 5 minutos para evitar polling infinito
      timeout = setTimeout(() => {
        console.log('Task polling timeout reached, stopping polling')
        clearInterval(interval)
        setError('Tiempo de espera agotado. El redimensionamiento puede estar en proceso. Recarga la página para verificar.')
        setTaskStatus('timeout')
      }, 5 * 60 * 1000) // 5 minutos
      
      interval = setInterval(async () => {
        try {
          console.log('Checking task status for:', taskId)
          const status = await getTaskStatus(taskId)
          console.log('Task status received:', status)
          
          setTaskStatus(status.status)
          
          if (status.status === 'completed' || status.status === 'failed') {
            console.log('Task completed with status:', status.status)
            clearInterval(interval)
            clearTimeout(timeout)
            
            if (status.status === 'completed') {
              // Tarea completada exitosamente
              console.log('Task completed successfully, closing modal')
              onSubmit(parseInt(width), parseInt(height))
              onClose()
            } else {
              // Tarea falló
              console.log('Task failed')
              setError('El redimensionamiento falló. Por favor intenta de nuevo.')
            }
          }
        } catch (error) {
          console.error('Error checking task status:', error)
          // Si hay error al verificar el estado, asumir que falló
          clearInterval(interval)
          clearTimeout(timeout)
          setError('Error al verificar el estado de la tarea. Por favor recarga la página.')
        }
      }, 2000)
    }
    
    return () => {
      if (interval) {
        console.log('Clearing task status polling interval')
        clearInterval(interval)
      }
      if (timeout) {
        console.log('Clearing task polling timeout')
        clearTimeout(timeout)
      }
    }
  }, [taskId, taskStatus, onClose, onSubmit, width, height])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!width || !height) {
      setError('Por favor ingresa tanto el ancho como el alto')
      return
    }

    const widthNum = parseInt(width)
    const heightNum = parseInt(height)

    if (widthNum <= 0 || heightNum <= 0) {
      setError('Las dimensiones deben ser números positivos')
      return
    }

    if (widthNum > 5000 || heightNum > 5000) {
      setError('Las dimensiones no pueden exceder 5000px')
      return
    }

    try {
      setIsResizing(true)
      setError(null)
      
      const result = await resizeImage(getFilename(image), widthNum, heightNum)
      
      if (result.task_id) {
        setTaskId(result.task_id)
        setTaskStatus('processing')
      } else {
        // Si no hay task_id, asumimos que se completó inmediatamente
        onSubmit(widthNum, heightNum)
        onClose()
      }
    } catch (error) {
      console.error('Resize error:', error)
      
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al redimensionar la imagen. Por favor intenta de nuevo.'
      
      if (error.response?.status === 404) {
        errorMessage = 'Imagen no encontrada. Verifica que el archivo exista.'
      } else if (error.response?.status === 400) {
        errorMessage = 'Dimensiones inválidas. Verifica los valores ingresados.'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Error del servidor. Intenta más tarde.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      setError(errorMessage)
    } finally {
      setIsResizing(false)
    }
  }

  const handleClose = () => {
    // Permitir cerrar si no está procesando o si la tarea ya terminó
    if (!isResizing || taskStatus === 'completed' || taskStatus === 'failed' || taskStatus === 'timeout') {
      onClose()
    }
  }

  const handleForceClose = () => {
    // Cierre forzado - siempre permitido
    console.log('Force closing modal')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Redimensionar imagen
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Redimensionar "{getFilename(image)}" a las nuevas dimensiones especificadas.
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="width" className="block text-sm font-medium text-gray-700">
                        Ancho (px)
                      </label>
                      <input
                        type="number"
                        id="width"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="Ej: 800"
                        min="1"
                        max="5000"
                        disabled={isResizing || taskId}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                        Alto (px)
                      </label>
                      <input
                        type="number"
                        id="height"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="Ej: 600"
                        min="1"
                        max="5000"
                        disabled={isResizing || taskId}
                      />
                    </div>
                    
                    {/* Botón para restaurar dimensiones originales */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          const originalWidth = image?.width || image?.ancho || 500
                          const originalHeight = image?.height || image?.alto || 500
                          setWidth(originalWidth.toString())
                          setHeight(originalHeight.toString())
                        }}
                        className="text-sm text-purple-600 hover:text-purple-800 underline"
                        disabled={isResizing || taskId}
                      >
                        Restaurar dimensiones originales
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {taskId && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {taskStatus === 'processing' && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                          {taskStatus === 'completed' && (
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {taskStatus === 'failed' && (
                            <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {taskStatus === 'timeout' && (
                            <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm text-blue-800">
                            {taskStatus === 'processing' && 'Procesando redimensionamiento...'}
                            {taskStatus === 'completed' && 'Redimensionamiento completado'}
                            {taskStatus === 'failed' && 'Error en el redimensionamiento'}
                            {taskStatus === 'timeout' && 'Tiempo de espera agotado'}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            ID de tarea: {taskId}
                          </p>
                          {(taskStatus === 'completed' || taskStatus === 'failed' || taskStatus === 'timeout') && (
                            <p className="text-xs text-blue-600 mt-1">
                              Puedes cerrar este modal y verificar el resultado en la tabla.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isResizing || taskId}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResizing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  'Redimensionar'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleClose}
                disabled={isResizing && !taskStatus}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              
              {/* Botón de cierre forzado cuando hay una tarea en proceso */}
              {taskId && taskStatus === 'processing' && (
                <button
                  type="button"
                  onClick={handleForceClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-red-50 text-base font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cerrar Modal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResizeModal
