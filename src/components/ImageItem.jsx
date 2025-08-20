import React, { useState, useEffect } from 'react'
import { getImageThumbnail, getImageUrlWithFallback, downloadImage, deleteImage } from '../services/imageService'

const ImageItem = ({ image, onDelete, onResize }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(true)

  // Cargar la URL de la imagen (thumbnail por defecto, con fallback)
  useEffect(() => {
    const loadImageUrl = async () => {
      try {
        setImageLoading(true)
        console.log('Loading image URL for:', getFilename(image))
        
        // Usar thumbnail por defecto (64x64 para la tabla)
        let url = await getImageThumbnail(getFilename(image), 64, 64)
        
        if (!url) {
          // Fallback a proxy si thumbnail falla
          console.log('Thumbnail failed, trying proxy for:', getFilename(image))
          url = await getImageUrlWithFallback(getFilename(image), true)
        }
        
        console.log('Received URL:', url)
        
        if (url) {
          setImageUrl(url)
        } else {
          console.error('Failed to get image URL for:', getFilename(image))
          setImageUrl(null)
        }
      } catch (error) {
        console.error('Error loading image URL:', error)
        setImageUrl(null)
      } finally {
        setImageLoading(false)
      }
    }

    loadImageUrl()
  }, [image])

  const handleView = async () => {
    try {
      if (imageUrl && imageUrl.includes('/proxy')) {
        // Si la imagen actual es del proxy, obtener la URL firmada para verla completa
        console.log('Getting signed URL for full view of:', getFilename(image))
        const { getImageUrl } = await import('../services/imageService')
        const signedUrl = await getImageUrl(getFilename(image))
        
        if (signedUrl) {
          window.open(signedUrl, '_blank')
        } else {
          // Fallback a la URL actual
          window.open(imageUrl, '_blank')
        }
      } else if (imageUrl) {
        // Si ya tenemos una URL válida, usarla
        window.open(imageUrl, '_blank')
      } else {
        alert('No se pudo cargar la imagen')
      }
    } catch (error) {
      console.error('Error viewing image:', error)
      alert('Error al abrir la imagen')
    }
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      await downloadImage(getFilename(image))
    } catch (error) {
      console.error('Error downloading image:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    const filename = getFilename(image)
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${filename}"?`)) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteImage(filename)
      onDelete(filename)
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Error al eliminar la imagen')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'N/A'
    }
  }

  // Obtener el nombre del archivo de diferentes campos posibles
  const getFilename = (image) => {
    return image.nombre || image.filename || image.name || image.key || 'Sin nombre'
  }

  // Obtener el tamaño de diferentes campos posibles
  const getFileSize = (image) => {
    return image.tamaño || image.size || image.file_size || image.length || 0
  }

  // Obtener la fecha de diferentes campos posibles
  const getFileDate = (image) => {
    return image.fecha_creacion || image.created_at || image.upload_date || image.modified_at || image.last_modified || new Date()
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
                 <div className="flex-shrink-0 h-16 w-16">
           {imageLoading ? (
             <div className="h-16 w-16 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
             </div>
           ) : imageUrl ? (
             <div className="relative">
               <img
                 className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                 src={imageUrl}
                 alt={getFilename(image)}
                 onError={(e) => {
                    console.error('Error loading image:', getFilename(image), e)
                    console.error('Image URL that failed:', imageUrl)
                    console.error('Error details:', {
                      filename: getFilename(image),
                      url: imageUrl,
                      error: e,
                      target: e.target
                    })
                    
                    // Establecer una imagen de placeholder en caso de error
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTI4IDI4SDM2VjM2SDI4VjI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', getFilename(image))
                  }}
               />
             </div>
           ) : (
             <div className="h-16 w-16 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
               <div className="text-center">
                 <svg className="h-8 w-8 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
                 <span className="text-xs text-gray-500">Error URL</span>
               </div>
             </div>
           )}
         </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={getFilename(image)}>
          {getFilename(image)}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {formatFileSize(getFileSize(image))}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {formatDate(getFileDate(image))}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={handleView}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="Ver imagen"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
            title="Descargar imagen"
          >
            {isDownloading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
          
          <button
            onClick={() => onResize(image)}
            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
            title="Redimensionar imagen"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
            title="Eliminar imagen"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </td>
    </tr>
  )
}

export default ImageItem
