# SPA Base — Módulo Educación (React + Express)

Proyecto SPA con frontend en React (Vite) y backend en Express.

Estado actual: módulo de Educación funcional con datos mixtos:
- `SQLite` para horarios semanales (`/schedules`)
- `MongoDB + Mongoose` para asignaturas, tareas y exámenes (`/education/*`)

## Estructura

- `frontend/`: aplicación cliente (Vite + React)
- `backend/`: API y lógica del servidor (Express + SQLite)

## Requisitos

- Node.js (v18+ recomendado)
- npm
- MongoDB en local o remoto (para endpoints `/education/*`)

## Comandos principales

Desde la raíz puedes iniciar frontend y backend simultáneamente:

```bash
# desde la raíz del repo
npm run dev
```

Comandos individuales:

```bash
# backend
npm run dev:backend

# frontend
npm run dev:frontend
```

Poblar datos de prueba del backend:

```bash
# desde la raíz
npm run seed --prefix backend
```

Generar token de desarrollo (sin login real):

```bash
curl -X POST http://localhost:3001/auth/dev-token \
	-H "Content-Type: application/json" \
	-d '{"userId":"6654f0000000000000000001"}'
```

Instalación de dependencias (si es necesario):

```bash
# instalar deps del backend
cd backend && npm install

# instalar deps del frontend
cd frontend && npm install
```

## Backend

- Punto de entrada: `backend/src/server.js`
- API básica en `backend/src/app.js`
- Base de datos híbrida:
	- SQLite gestionada desde `backend/src/db.js` para horarios.
	- MongoDB/Mongoose para módulo Educación (`Subject`, `Task`, `Exam`).
- Variables de entorno: copia `backend/.env.example` a `backend/.env`.
- Script de seed: `backend/scripts/seed.js` inserta datos de prueba en SQLite y MongoDB.
- Endpoint de desarrollo: `POST /auth/dev-token` devuelve JWT para probar rutas protegidas.

Endpoints disponibles:

- `GET /` — estado general y endpoints disponibles
- `GET /health` — comprueba conexión a la base de datos
- Horarios (`SQLite`):
	- `GET /schedules`
	- `POST /schedules`
	- `GET /schedules/:id`
	- `PUT /schedules/:id`
	- `DELETE /schedules/:id`
- Educación (`MongoDB`, protegidos con JWT Bearer):
	- `GET /education/dashboard`
	- `GET /education/subjects`
	- `POST /education/subjects`
	- `PATCH /education/subjects/:id`
	- `DELETE /education/subjects/:id`
	- `GET /education/tasks`
	- `POST /education/tasks`
	- `PATCH /education/tasks/:id`
	- `GET /education/exams`
	- `POST /education/exams`
	- `PATCH /education/exams/:id`

Notas importantes:

- CORS: en desarrollo el backend responde con `Access-Control-Allow-Origin` para permitir llamadas desde el servidor de Vite.
- La app crea la tabla `schedules` automáticamente la primera vez que arranca.
- `/education/*` requiere cabecera `Authorization: Bearer <token>`.
- El comando `npm run seed --prefix backend` imprime un JWT de prueba listo para usar en frontend/curl.

## Frontend

- Código principal: `frontend/src/App.jsx`.
- Módulo de Educación: `frontend/src/components/Education.jsx`.
- Dev server Vite por defecto en `http://localhost:5173`.
- Configuración de API: `frontend/.env.example` define `VITE_API_URL`. Puedes cambiarla en tiempo de ejecución desde la UI.

Componentes actuales del módulo Educación:

- `EducationDashboard`: media global, próximos exámenes, tareas urgentes y calendario.
- `EducationCalendar` (react-big-calendar): eventos de tareas y exámenes coloreados por asignatura.
- `SubjectManager` + `ColorPicker`: CRUD de asignaturas.
- `CreateTaskForm`: creación de tareas con validación.
- `SchoolTaskKanban`: visualización y cambio de estado de tareas.
- `GradesQuickEntry`: registro rápido de notas para exámenes pendientes.
- `Acceso API Educación`: botón `Generar token dev` para autocompletar JWT de pruebas.

Cómo probar desde la SPA (UI):

1. Abre la SPA en el navegador (`http://localhost:5173`).
2. Ajusta la `API URL` si fuera necesario (`http://localhost:3001`).
3. Pulsa `Ver raíz` para comprobar `/`.
4. Pulsa `GET /health` para comprobar la conexión a la DB.
5. En la lista de módulos, entra en `Educación`.
6. Usa `Generar token dev` (o pega tu JWT) en `Acceso API Educación` para habilitar endpoints protegidos.
7. Usa el dashboard, calendario, asignaturas, tareas y exámenes desde la UI.

If prefieres usar curl o HTTP cliente:

```bash
curl http://localhost:3001/
curl http://localhost:3001/health
curl http://localhost:3001/schedules
curl -X POST -H "Content-Type: application/json" -d '{"title":"Mi horario","data":{}}' http://localhost:3001/schedules

curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3001/education/dashboard
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3001/education/tasks
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3001/education/exams
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3001/education/subjects
```

## Roadmap por módulos (priorizado por dependencia)

Regla de orden: primero las piezas que no dependen de nada; luego las que dependen de ellas. Si A depende de B, B aparece antes.

Prioridad 1 — Base mínima imprescindible
- Autenticación y usuarios (registro/login) — base para multicliente (opcional para MVP local)
- Perfil y configuración básica

Prioridad 2 — Sistema central
- Agenda / calendario (vistas diaria/semanal)
- Eventos y recordatorios básicos

Prioridad 3 — Sistema de hábitos genérico
- Crear hábito, cadencia (diaria/semanal), registro de cumplimiento
- Rachas y progreso

Prioridad 4 — Módulo Estudios
- Bloques de estudio, objetivos por materia, seguimiento de sesiones

Prioridad 5 — Módulo Deporte
- Rutinas, entrenamientos, frecuencia y progreso

Prioridad 6 — Módulo Salud
- Sueño, hidratación, alimentación y métricas de bienestar

Prioridad 7 — Analítica y visualización
- Estadísticas, rachas, comparativas por módulo

Prioridad 8 — Personalización y automatizaciones
- Reglas, recomendaciones, notificaciones avanzadas

### MVP recomendado

Para avanzar rápido y tener una app usable lo antes posible recomiendo implementar:

1. Base de usuario mínima (o modo local sin autenticación para facilitar pruebas)
2. Agenda simple (crear eventos)
3. Hábitos genéricos (crear hábito y marcar cumplimiento)
4. Un módulo inicial (por ejemplo, Estudios)

Esto permite guardar datos, mostrarlos en la UI y probar reglas básicas.

## Qué he añadido y dónde

- Backend:
	- `backend/src/app.js`: rutas completas de horarios y educación.
	- `backend/src/models/*`: `Subject`, `Task`, `Exam` con ownership por `userId`.
	- `backend/src/controllers/*`: dashboard, CRUD parciales y filtros por usuario.
	- `backend/src/middleware/*`: `protectRoute` (JWT) y `validateRequest` (Zod).
	- `backend/src/validation/schemas.js`: validaciones de payloads.
- Frontend:
	- `frontend/src/components/Education.jsx`: orquestación del módulo.
	- `frontend/src/components/EducationDashboard.jsx`: KPIs y resumen.
	- `frontend/src/components/EducationCalendar.jsx`: calendario de eventos.
	- `frontend/src/components/SubjectManager.jsx`, `ColorPicker.jsx`: gestión de asignaturas.
	- `frontend/src/components/CreateTaskForm.jsx`: alta de tareas.
	- `frontend/src/components/SchoolTaskKanban.jsx`: tablero Kanban.
	- `frontend/src/components/GradesQuickEntry.jsx`: carga rápida de notas.
	- `frontend/src/hooks/useEducationStats.js`: hook de dashboard.
- Scripts raíz: `package.json` y `scripts/dev.sh` para arrancar ambos servicios con `npm run dev`.

## Cómo contribuir / siguientes pasos sugeridos

- Conectar emisión real de JWT (login) para no pegar token manualmente en la UI.
- Añadir tests de integración de endpoints protegidos.
- Añadir formularios de creación de exámenes en frontend.

---

Si quieres, actualizo el README con ejemplos concretos de requests para cada endpoint, o genero issues/PRs iniciales para los primeros módulos (por ejemplo: implementar entidades de `habit` y endpoints CRUD). Dime qué prefieres que haga ahora.
