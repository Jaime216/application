# Backend

API simple con Node.js, Express y SQLite para probar comunicación entre backend y base de datos SQL.

## Endpoints

- `GET /`: estado general y rutas disponibles
 - `GET /`: estado general y rutas disponibles
 - `GET /health`: verifica la API y la conexión con la base de datos
 - `GET /schedules`: lista horarios guardados
 - `POST /schedules`: crea un horario con `{ "title": "...", "data": {...} }`

## Arranque

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Ejecutar en desarrollo:

   ```bash
   npm run dev
   ```

## Variables

- `PORT`: puerto de la API, por defecto `3001`
- `SQLITE_PATH`: ruta del archivo SQLite. Si no se define, se usa `~/Escritorio/application/db`

## CORS

La API responde con CORS habilitado para poder consumirla desde el frontend de Vite en desarrollo.