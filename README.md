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
