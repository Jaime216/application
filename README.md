# SPA Base — Módulo Educación (React + Express)

Proyecto SPA con frontend en React (Vite) y backend en Express.

Estado actual: módulo de Educación funcional con datos mixtos y acceso autenticado:
- `SQLite` para horarios semanales (`/schedules`)
- `MongoDB + Mongoose` para asignaturas, tareas y exámenes (`/education/*`)
- `JWT + login` para entrar a la SPA y consumir rutas protegidas

## Estructura

- `frontend/`: aplicación cliente (Vite + React)
- `backend/`: API y lógica del servidor (Express + SQLite)

## Requisitos

- Node.js (v18+ recomendado)
- npm
- MongoDB en local o remoto (para endpoints `/education/*`)
- `JWT_SECRET` configurado en `backend/.env` para firmar sesiones

## Montaje completo y pruebas

Sigue estos pasos para levantar todo el proyecto desde cero y comprobar que funciona:

### 1) Instalar dependencias

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2) Configurar variables de entorno

Backend (`backend/.env`):

```bash
PORT=3001
JWT_SECRET=una_clave_larga_y_segura
MONGO_URI=mongodb://127.0.0.1:27017/spa-app
SQLITE_PATH=/home/jaime/Escritorio/application/db
```

Frontend (`frontend/.env`):

```bash
VITE_API_URL=http://localhost:3001
```

### 3) Cargar datos de prueba

```bash
npm run seed --prefix backend
```

Eso crea el usuario demo:

- email: `alumno@spa.app`
- contraseña: `Estudio123!`

### 4) Arrancar la aplicación

```bash
npm run dev
```

Si prefieres arrancar cada parte por separado:

```bash
npm run dev:backend
npm run dev:frontend
```

### 5) Probar que todo responde

Comprueba primero los endpoints básicos:

```bash
curl http://localhost:3001/
curl http://localhost:3001/health
curl http://localhost:3001/schedules
```

Inicia sesión y guarda el token:

```bash
curl -X POST http://localhost:3001/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"alumno@spa.app","password":"Estudio123!"}'
```

Con el `token` devuelto, prueba las rutas protegidas:

```bash
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3001/auth/me
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3001/education/dashboard
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3001/education/tasks
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3001/education/exams
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3001/education/subjects
```

### 6) Probar la SPA

1. Abre `http://localhost:5173`.
2. Inicia sesión con `alumno@spa.app` / `Estudio123!`.
3. Entra en `Educación` y verifica dashboard, calendario, tareas y exámenes.
4. Crea o modifica un elemento para confirmar que el token se está usando bien.

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

El seed crea un usuario demo listo para entrar en la SPA:

- email: `alumno@spa.app`
- contraseña: `Estudio123!`

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
- Autenticación: `POST /auth/login` emite JWT y `GET /auth/me` recupera la sesión activa.
- Compatibilidad: `POST /auth/dev-token` sigue disponible como endpoint legado de prueba.

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

- Autenticación:
	- `POST /auth/login`
	- `GET /auth/me`

Notas importantes:

- CORS: en desarrollo el backend responde con `Access-Control-Allow-Origin` para permitir llamadas desde el servidor de Vite.
- La app crea la tabla `schedules` automáticamente la primera vez que arranca.
- `/education/*` requiere cabecera `Authorization: Bearer <token>`.
- La SPA guarda el JWT en `localStorage` y lo reutiliza para sesión persistente.
- El comando `npm run seed --prefix backend` imprime credenciales de demo y un JWT de prueba.

## Frontend

- Código principal: `frontend/src/App.jsx`.
- Módulo de Educación: `frontend/src/components/Education.jsx`.
- Dev server Vite por defecto en `http://localhost:5173`.
- Configuración de API: `frontend/.env.example` define `VITE_API_URL`. Puedes cambiarla en tiempo de ejecución desde la UI.
- La SPA principal incluye pantalla de login, restauración de sesión y logout.

Componentes actuales del módulo Educación:

- `EducationDashboard`: media global, próximos exámenes, tareas urgentes y calendario.
- `EducationCalendar` (react-big-calendar): eventos de tareas y exámenes coloreados por asignatura.
- `SubjectManager` + `ColorPicker`: CRUD de asignaturas.
- `CreateTaskForm`: creación de tareas con validación.
- `SchoolTaskKanban`: visualización y cambio de estado de tareas.
- `GradesQuickEntry`: registro rápido de notas para exámenes pendientes.
- `Acceso API Educación`: usa la sesión autenticada de la SPA; ya no hace falta pegar tokens manuales.

Cómo probar desde la SPA (UI):

1. Abre la SPA en el navegador (`http://localhost:5173`).
2. Inicia sesión con `alumno@spa.app` / `Estudio123!`.
3. Ajusta la `API URL` si fuera necesario (`http://localhost:3001`).
4. Pulsa `Ver raíz` para comprobar `/`.
5. Pulsa `GET /health` para comprobar la conexión a la DB.
6. Entra en `Educación` y usa el dashboard, calendario, asignaturas, tareas y exámenes.

Si prefieres usar curl o un cliente HTTP:

```bash
curl http://localhost:3001/
curl http://localhost:3001/health
curl http://localhost:3001/schedules
curl -X POST -H "Content-Type: application/json" -d '{"title":"Mi horario","data":{}}' http://localhost:3001/schedules

curl -X POST http://localhost:3001/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"alumno@spa.app","password":"Estudio123!"}'

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
	- `backend/src/controllers/auth.controller.js`: login y sesión actual.
	- `backend/src/models/user.js`: usuarios con contraseña hasheada.
	- `backend/src/models/*`: `Subject`, `Task`, `Exam` con ownership por `userId`.
	- `backend/src/controllers/*`: dashboard, CRUD parciales y filtros por usuario.
	- `backend/src/middleware/*`: `protectRoute` (JWT) y `validateRequest` (Zod).
	- `backend/src/validation/schemas.js`: validaciones de payloads.
- Frontend:
	- `frontend/src/components/Education.jsx`: orquestación del módulo.
	- `frontend/src/App.jsx`: login, persistencia de sesión y logout.
	- `frontend/src/components/EducationDashboard.jsx`: KPIs y resumen.
	- `frontend/src/components/EducationCalendar.jsx`: calendario de eventos.
	- `frontend/src/components/SubjectManager.jsx`, `ColorPicker.jsx`: gestión de asignaturas.
	- `frontend/src/components/CreateTaskForm.jsx`: alta de tareas.
	- `frontend/src/components/SchoolTaskKanban.jsx`: tablero Kanban.
	- `frontend/src/components/GradesQuickEntry.jsx`: carga rápida de notas.
	- `frontend/src/hooks/useEducationStats.js`: hook de dashboard.
- Scripts raíz: `package.json` y `scripts/dev.sh` para arrancar ambos servicios con `npm run dev`.

## Cómo contribuir / siguientes pasos sugeridos

- Eliminar o esconder el endpoint legado `POST /auth/dev-token` si ya no hace falta.
- Añadir tests de integración de endpoints protegidos.
- Añadir formularios de creación de exámenes en frontend.

---

Si quieres, actualizo el README con ejemplos concretos de requests para cada endpoint, o genero issues/PRs iniciales para los primeros módulos (por ejemplo: implementar entidades de `habit` y endpoints CRUD). Dime qué prefieres que haga ahora.
