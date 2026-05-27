# CHANGELOG

Este archivo registra, en orden cronológico inverso, los cambios e implementaciones realizadas en el proyecto.

Formato: cada entrada indica la versión, fecha y lista de cambios importantes.

## [Unreleased]
- Fecha: en progreso
- Autenticación y sesión:
  - `POST /auth/login` emite JWT con usuario demo o usuario real.
  - `GET /auth/me` recupera la sesión activa desde el token Bearer.
  - `frontend/src/App.jsx` guarda el token en `localStorage` y restaura la sesión al recargar.
  - `backend/scripts/seed.js` crea el usuario demo `alumno@spa.app` / `Estudio123!`.
- Backend (Educación + seguridad):
  - Endpoints protegidos con JWT para `/education/dashboard`, `/education/subjects`, `/education/tasks`, `/education/exams`.
  - CRUD de asignaturas (`GET/POST/PATCH/DELETE`) con ownership por `userId`.
  - CRUD parcial de tareas y exámenes (`GET/POST/PATCH`) con ownership por `userId`.
  - Validación de payloads con Zod (`createTaskSchema`, `createExamSchema`, `createSubjectSchema`, `updateSubjectSchema`).
  - Endpoint legado `POST /auth/dev-token` mantenido como compatibilidad de prueba.
- Frontend (módulo Educación):
  - `Education` consume `authToken` desde la SPA y ya no depende de token manual.
  - `EducationDashboard` con media global, próximos exámenes, tareas urgentes y estado loading.
  - `EducationCalendar` con `react-big-calendar` y eventos coloreados por asignatura.
  - Horario semanal con soporte para mostrar la clase y el aula en cada bloque.
  - `SubjectManager` + `ColorPicker` para crear/listar/editar/borrar asignaturas.
  - Integración de `CreateTaskForm`, `SchoolTaskKanban` y `GradesQuickEntry` con soporte de sesión autenticada.
  - Pantalla `Educación` ampliada con acceso protegido y refresco de tareas/exámenes desde backend.
- Infra/documentación:
  - `backend/scripts/seed.js` para poblar SQLite+Mongo con datos de prueba completos (schedules, subjects, tasks, exams) y credenciales demo.
  - Los horarios semilla ahora guardan clase y aula en cada bloque para mostrarlo en el horario.
  - `backend/package.json` incluye `bcryptjs` para el hash de contraseñas.
  - README actualizado con login real, rutas actuales y flujo de uso desde UI.
  - Build de frontend validado tras cambios (`npm run build --prefix frontend`).

## [0.1.0] - 2026-05-27
- Inicialización del repositorio y estructura base (frontend/, backend/).
- Backend (Express + SQLite):
  - `backend/src/db.js`: lógica de inicialización de SQLite y creación de la tabla `schedules`.
  - `backend/src/app.js`: endpoints REST: `GET /`, `GET /health`, `GET /schedules`, `POST /schedules`.
  - CORS sencillo habilitado para desarrollo (responde `Access-Control-Allow-Origin`).
  - Lectura de `backend/.env` para variables (`PORT`, `SQLITE_PATH`).
  - `backend/.env.example` incluido.
  - Tareas básicas de robustez: creación del directorio de almacenamiento SQLite si no existe.

- Frontend (Vite + React):
  - `frontend/src/App.jsx`: SPA mínima para probar endpoints (Ver raíz, GET /health, GET /schedules, POST /schedules) y módulo `Educación` en `frontend/src/components/Education.jsx`.
  - `frontend/src/styles.css`: estilos básicos.
  - `frontend/.env.example` con `VITE_API_URL`.
  - Build verificado (`npm run build` produjo `dist/`).

- Scripts y conveniencia:
  - `package.json` en la raíz con `npm run dev` que ejecuta `scripts/dev.sh`.
  - `scripts/dev.sh` lanza simultáneamente `npm run dev` en `backend` y `frontend`.

- Documentación:
  - `README.md` actualizado con pasos de instalación, ejecución, endpoints y roadmap por módulos (MVP recomendado).

## Notas
- Decisiones pendientes: evaluar integración de Sequelize para modelado y migraciones (no implementado en esta versión).
- Registro de cambios: añade nuevas versiones con fecha y lista de cambios. Mantener la sección `[Unreleased]` para trabajo en curso.

- Limpieza: eliminado scaffolding de pruebas iniciales (`items` y `seed`) y limpieza de endpoints relacionados.

---

Guía rápida para agregar una entrada:

1. Añade una nueva cabecera `## [x.y.z] - YYYY-MM-DD` arriba del historial existente.
2. Lista los cambios en bullets con referencias a archivos y rutas cuando sea relevante.
3. Actualiza el `README.md` si los cambios implican nuevos comandos o endpoints.
