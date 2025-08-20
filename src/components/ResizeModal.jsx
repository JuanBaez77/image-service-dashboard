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
                  <div className="flex items-center mb-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      Redimensionar imagen
                    </h3>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-700 font-medium">
                        Redimensionar <span className="text-purple-600 font-semibold">"{getFilename(image)}"</span> a las nuevas dimensiones especificadas.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
                          <span className="flex items-center">
                            <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            Ancho (px)
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            id="width"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors duration-200"
                            placeholder="Ej: 800"
                            min="1"
                            max="5000"
                            disabled={isResizing || taskId}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">px</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                          <span className="flex items-center">
                            <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                            Alto (px)
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            id="height"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors duration-200"
                            placeholder="Ej: 600"
                            min="1"
                            max="5000"
                            disabled={isResizing || taskId}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">px</span>
                          </div>
                        </div>
                      </div>
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
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                        disabled={isResizing || taskId}
                      >
                        <svg className="h-4 w-4 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Restaurar dimensiones originales
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Error en el redimensionamiento
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {taskId && (
                    <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-100 border-l-4 border-blue-400 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {taskStatus === 'processing' && (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
                          )}
                          {taskStatus === 'completed' && (
                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-100">
                              <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          {taskStatus === 'failed' && (
                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-100">
                              <svg className="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          )}
                          {taskStatus === 'timeout' && (
                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-yellow-100">
                              <svg className="h-3 w-3 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-blue-800">
                              {taskStatus === 'processing' && '🔄 Procesando redimensionamiento...'}
                              {taskStatus === 'completed' && '✅ Redimensionamiento completado'}
                              {taskStatus === 'failed' && '❌ Error en el redimensionamiento'}
                              {taskStatus === 'timeout' && '⏰ Tiempo de espera agotado'}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {taskStatus === 'processing' && 'En proceso'}
                              {taskStatus === 'completed' && 'Completado'}
                              {taskStatus === 'failed' && 'Fallido'}
                              {taskStatus === 'timeout' && 'Timeout'}
                            </span>
                          </div>
                          
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center text-xs text-blue-600">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              ID de tarea: <code className="ml-1 px-1.5 py-0.5 bg-blue-200 rounded text-blue-800 font-mono">{taskId}</code>
                            </div>
                            
                            {(taskStatus === 'completed' || taskStatus === 'failed' || taskStatus === 'timeout') && (
                              <div className="flex items-center text-xs text-blue-600 bg-blue-50 rounded-md p-2">
                                <svg className="h-3 w-3 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {taskStatus === 'completed' && 'Puedes cerrar este modal y verificar el resultado en la tabla.'}
                                {taskStatus === 'failed' && 'El redimensionamiento no se pudo completar. Revisa los logs del servidor.'}
                                {taskStatus === 'timeout' && 'El proceso está tomando más tiempo del esperado. Verifica el estado en el servidor.'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isResizing || taskId}
                className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-base font-semibold text-white hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {isResizing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Redimensionar
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleClose}
                disabled={isResizing && !taskStatus}
                className="mt-3 w-full inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
              
              {/* Botón de cierre forzado cuando hay una tarea en proceso */}
              {taskId && taskStatus === 'processing' && (
                <button
                  type="button"
                  onClick={handleForceClose}
                  className="mt-3 w-full inline-flex justify-center items-center rounded-lg border border-red-300 shadow-sm px-6 py-3 bg-gradient-to-r from-red-50 to-red-100 text-base font-medium text-red-700 hover:from-red-100 hover:to-red-200 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                >
                  <svg className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
