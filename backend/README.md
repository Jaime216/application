# Backend

API local con Node.js, Express, SQLite y JWT para horarios, educación y autenticación.

## Qué hace

- Guarda horarios, usuarios, asignaturas, tareas y exámenes en SQLite.
- Expone una API HTTP local para que el frontend pueda consumirse desde Vite o desde una build estática.
- Usa JWT para proteger las rutas educativas y la sesión.

## Arranque

```bash
npm install
npm run dev
```

## Variables

- `PORT`: puerto de la API, por defecto `3001`
- `SQLITE_PATH`: ruta del archivo SQLite. Si no se define, se usa `~/Escritorio/application/db`
- `JWT_SECRET`: secreto para firmar y verificar tokens

## Login de demo

Tras ejecutar el seed, puedes entrar con:

- email: `alumno@spa.app`
- contraseña: `Estudio123!`