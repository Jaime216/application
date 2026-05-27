# Backend

API con Node.js, Express, SQLite y MongoDB para horarios, educación y autenticación JWT.

## Endpoints

- `GET /`: estado general y rutas disponibles
- `GET /health`: verifica la API y la conexión con la base de datos
- `GET /schedules`: lista horarios guardados
- `POST /schedules`: crea un horario con `{ "title": "...", "data": {...} }`
- `POST /auth/login`: inicia sesión con email y contraseña
- `GET /auth/me`: devuelve la sesión activa
- `POST /auth/dev-token`: endpoint legado de pruebas
- `/education/*`: rutas protegidas con JWT para asignaturas, tareas, exámenes y dashboard

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
- `MONGO_URI`: URI de MongoDB para el módulo Educación
- `JWT_SECRET`: secreto para firmar y verificar tokens

## CORS

La API responde con CORS habilitado para poder consumirla desde el frontend de Vite en desarrollo.

## Login de demo

Tras ejecutar el seed, puedes entrar con:

- email: `alumno@spa.app`
- contraseña: `Estudio123!`