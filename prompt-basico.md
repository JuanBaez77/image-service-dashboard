Prompt para IA de generación de código (Front mínimo)

Quiero que generes un proyecto en React usando TailwindCSS para consumir una API de gestión de imágenes hecha en FastAPI.

Requisitos:

Pantalla principal tipo Dashboard con:

Upload de imágenes: formulario para arrastrar/seleccionar un archivo y enviarlo al endpoint POST /upload.

Listado de imágenes: tabla o grid que muestre la respuesta de GET /images (nombre, tamaño, fecha).

Acciones sobre cada imagen:

Ver (abrir con GET /images/{filename} en nueva pestaña).

Descargar (mismo endpoint).

Borrar (DELETE /images/{filename}).

Redimensionar → formulario modal que pide width y height y hace POST /resize/{filename}.

Notificación visual del estado de los jobs (ej: mostrar si un resize terminó consultando un endpoint /tasks/{id}).

Usar fetch o axios para las requests.

Estilos con TailwindCSS, minimal pero limpio.

Estructura clara de componentes: components/, pages/, services/.

Incluir un archivo de configuración .env para definir la URL base de la API (VITE_API_URL=http://localhost:8000).

Debe compilar con Vite (no Create React App).

Objetivo: un panel web mínimo para interactuar con el microservicio de imágenes, pensado como repo separado.