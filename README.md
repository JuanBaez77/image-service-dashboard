# Panel de Gestión de Imágenes

Un panel web minimalista construido en React para interactuar con un microservicio de gestión de imágenes desarrollado en FastAPI.

## 🚀 Características

- **Upload de imágenes**: Drag & drop o selección de archivos
- **Listado de imágenes**: Tabla con información detallada (nombre, tamaño, fecha)
- **Acciones sobre imágenes**:
  - Ver imagen en nueva pestaña
  - Descargar imagen
  - Eliminar imagen
  - Redimensionar imagen con formulario modal
- **Notificaciones visuales**: Estado de jobs y operaciones en tiempo real
- **Interfaz responsive**: Diseño limpio y moderno con TailwindCSS

## 🛠️ Tecnologías

- **Frontend**: React 18 + Vite
- **Estilos**: TailwindCSS
- **HTTP Client**: Axios
- **Build Tool**: Vite

## 📋 Requisitos

- Node.js 16+ 
- npm o yarn
- API de imágenes FastAPI ejecutándose en `http://localhost:8000`

## 🚀 Instalación

1. **Clonar el repositorio**:
```bash
git clone <url-del-repositorio>
cd image-service-dashboard
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
```bash
# Crear archivo .env.local en la raíz del proyecto
VITE_API_URL=http://localhost:8000
```

4. **Ejecutar en modo desarrollo**:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ImageUpload.jsx # Componente de upload con drag & drop
│   ├── ImageList.jsx   # Lista de imágenes con tabla
│   ├── ImageItem.jsx   # Item individual de imagen
│   └── ResizeModal.jsx # Modal para redimensionar
├── services/           # Servicios de API
│   └── imageService.js # Cliente HTTP para endpoints de imágenes
├── App.jsx            # Componente principal
├── main.jsx          # Punto de entrada
└── index.css         # Estilos globales y TailwindCSS
```

## 🔌 Endpoints de API Esperados

El panel espera que tu API FastAPI implemente los siguientes endpoints:

- `GET /images` - Listar todas las imágenes
- `POST /upload` - Subir nueva imagen
- `GET /images/{filename}` - Obtener imagen específica
- `DELETE /images/{filename}` - Eliminar imagen
- `POST /resize/{filename}` - Redimensionar imagen
- `GET /tasks/{id}` - Consultar estado de tarea

## 🎨 Personalización

### Colores y Tema
Los estilos se pueden personalizar modificando `tailwind.config.js` o sobrescribiendo clases en los componentes.

### Configuración de API
Modifica `src/services/imageService.js` para ajustar timeouts, headers o lógica de manejo de errores.

## 📱 Uso

1. **Subir imagen**: Arrastra y suelta una imagen en el área designada o haz clic para seleccionar
2. **Ver imagen**: Haz clic en el botón de ojo para abrir la imagen en nueva pestaña
3. **Descargar**: Usa el botón de descarga para guardar la imagen localmente
4. **Redimensionar**: Haz clic en el botón de redimensionar y especifica las nuevas dimensiones
5. **Eliminar**: Usa el botón de eliminar (se pedirá confirmación)

## 🚀 Build para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Vista previa del build
- `npm run lint` - Linting del código

## 🐛 Solución de Problemas

### Error de CORS
Si encuentras errores de CORS, asegúrate de que tu API FastAPI tenga configurado el middleware CORS apropiado.

### Imágenes no se cargan
Verifica que la URL de la API en `.env.local` sea correcta y que el servidor esté ejecutándose.

### Error de redimensionamiento
Asegúrate de que el endpoint `/resize/{filename}` esté implementado y devuelva un `task_id` para seguimiento asíncrono.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias o mejoras.
