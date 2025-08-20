import React, { useState } from 'react'
import ImageItem from './ImageItem'
import ResizeModal from './ResizeModal'

const ImageList = ({ images, loading, onImageDeleted, onImageResized, onRefresh }) => {
  const [resizeModal, setResizeModal] = useState({ isOpen: false, image: null })

  const handleResizeClick = (image) => {
    setResizeModal({ isOpen: true, image })
  }

  const handleResizeClose = () => {
    setResizeModal({ isOpen: false, image: null })
  }

  const handleResizeSubmit = async (width, height) => {
    try {
      await onImageResized(resizeModal.image.filename, { width, height })
      handleResizeClose()
    } catch (error) {
      console.error('Error resizing image:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando imágenes...</span>
        </div>
      </div>
    )
  }

  // Asegurar que images sea un array
  if (!Array.isArray(images)) {
    console.error('Images is not an array:', images)
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">Error en el formato de datos</h3>
          <p className="mt-1 text-sm text-gray-500">
            La API devolvió un formato inesperado. Revisa la consola para más detalles.
          </p>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay imágenes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza subiendo tu primera imagen.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Imágenes ({images.length})
            </h2>
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamaño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {images.map((image) => {
                const filename = image.nombre || image.filename || image.name || image.key || 'unknown'
                return (
                  <ImageItem
                    key={filename}
                    image={image}
                    onDelete={onImageDeleted}
                    onResize={handleResizeClick}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ResizeModal
        isOpen={resizeModal.isOpen}
        image={resizeModal.image}
        onClose={handleResizeClose}
        onSubmit={handleResizeSubmit}
      />
    </>
  )
}

export default ImageList
