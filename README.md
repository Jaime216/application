# SPA Base — Módulo Educación

Proyecto local-first con frontend en React (Vite) y backend en Express. Todo el estado vive en tu máquina: SQLite para datos y JWT para sesión.

## Idea de uso

La app está pensada para descargarse y ejecutarse en local. No depende de MongoDB, servicios externos ni despliegues obligatorios.

## Requisitos

- Node.js 18 o superior
- npm

## Arranque rápido

```bash
npm run local
```

Ese comando instala dependencias si faltan, crea datos de demo y arranca frontend y backend en local.

## Cuenta demo

- email: `alumno@spa.app`
- contraseña: `Estudio123!`

## Variables de entorno

Backend (`backend/.env`):

```bash
PORT=3001
SQLITE_PATH=/home/your-user/Escritorio/application/db
JWT_SECRET=una_clave_larga_y_segura
```

Frontend (`frontend/.env`):

```bash
VITE_API_URL=http://localhost:3001
```

## Qué incluye

- Horarios semanales en SQLite.
- Login local con JWT.
- Asignaturas, tareas, exámenes y dashboard.
- Seed reproducible para instalar y probar la app en cualquier máquina.

## Distribución local

Si quieres compartirla con otra persona, basta con pasarle la carpeta del proyecto o un zip del repositorio. Esa persona solo necesita:

1. Instalar Node.js.
2. Ejecutar `npm run local`.
3. Abrir `http://localhost:5173` e iniciar sesión con la cuenta demo.

### Empaquetado para distribución local (build + servidor)

Hemos añadido un helper que genera una versión empaquetada lista para ejecutar en otra máquina. Desde la raíz del repo:

```bash
npm run package-local
```

Esto hará un `build` del frontend, copiará `frontend/dist` a `backend/public` y generará un tarball `spa-app-local-*.tar.gz` en la raíz.

Para desplegar el paquete en una máquina objetivo:

```bash
tar xzf spa-app-local-20260528011012.tar.gz  # o el tar.gz generado
cd backend
npm install --production
export JWT_SECRET=una_clave_segura_aquí
npm start
```

El backend servirá los ficheros estáticos desde `backend/public` si existe, por lo que la app quedará accesible en el puerto configurado (`PORT`, por defecto `3001`).

Más detalles y alternativas están en `Mejoras.md`.

## Endpoints principales

- `GET /`
- `GET /health`
- `GET /schedules`
- `POST /schedules`
- `GET /schedules/:id`
- `PUT /schedules/:id`
- `DELETE /schedules/:id`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/dev-token`
- `GET /education/dashboard`
- `GET /education/subjects`
- `POST /education/subjects`
- `PATCH /education/subjects/:id`
- `DELETE /education/subjects/:id`
- `GET /education/tasks`
- `POST /education/tasks`
- `PATCH /education/tasks/:id`
- `DELETE /education/tasks/:id`
- `GET /education/exams`
- `POST /education/exams`
- `PATCH /education/exams/:id`
- `DELETE /education/exams/:id`
