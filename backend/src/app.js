const express = require('express');
const jwt = require('jsonwebtoken');
const { getDatabaseStatus, initializeDatabase, listSchedules, createSchedule, getSchedule, updateSchedule, deleteSchedule } = require('./db');
const { getEducationDashboard } = require('./controllers/education.controller');
const { getTasks, createTask, patchTask, deleteTask } = require('./controllers/task.controller');
const { getExams, createExam, patchExam, deleteExam } = require('./controllers/exam.controller');
const { getSubjects, createSubject, patchSubject, deleteSubject } = require('./controllers/subject.controller');
const { login, me } = require('./controllers/auth.controller');
const { protectRoute } = require('./middleware/protectRoute');
const { validateRequest } = require('./middleware/validateRequest');
const {
  createTaskSchema,
  createExamSchema,
  createSubjectSchema,
  updateSubjectSchema,
  loginSchema,
} = require('./validation/schemas');

initializeDatabase();

const app = express();

app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', request.headers.origin || '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response.sendStatus(204);
  }

  return next();
});

app.use(express.json());

app.get('/', (request, response) => {
  response.json({
    status: 'ok',
    message: 'Backend simple listo',
    endpoints: [
      '/health',
      '/auth/login',
      '/auth/me',
      '/schedules',
      '/education/dashboard',
      '/education/subjects',
      '/education/tasks',
      '/education/exams',
    ],
  });
});

app.get('/health', (request, response) => {
  const dbStatus = getDatabaseStatus();

  response.json({
    status: 'ok',
    database: dbStatus.ok === 1 ? 'connected' : 'unavailable',
  });
});

app.post('/auth/dev-token', (req, res) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ error: 'JWT_SECRET is not configured' });
  }

  const userIdFromBody = req.body?.userId;
  const expiresIn = req.body?.expiresIn;
  const userId = typeof userIdFromBody === 'string' && userIdFromBody.trim()
    ? userIdFromBody.trim()
    : '6654f0000000000000000001';

  const token = jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn: typeof expiresIn === 'string' && expiresIn.trim() ? expiresIn.trim() : '7d' }
  );

  return res.json({
    token,
    tokenType: 'Bearer',
    userId,
  });
});

app.post('/auth/login', validateRequest(loginSchema), login);
app.get('/auth/me', protectRoute, me);

// removed test 'items' and 'seed' endpoints

// Schedules endpoints
app.get('/schedules', (req, res) => {
  try {
    const schedules = listSchedules();
    res.json({ schedules });
  } catch (err) {
    res.status(500).json({ error: 'failed to list schedules' });
  }
});

app.post('/schedules', (req, res) => {
  const { title, data } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' });
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'data (object) is required' });
  }

  try {
    const schedule = createSchedule(title.trim(), data);
    return res.status(201).json({ schedule });
  } catch (err) {
    return res.status(500).json({ error: 'failed to create schedule' });
  }
});

app.get('/schedules/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  const schedule = getSchedule(id);
  if (!schedule) return res.status(404).json({ error: 'not found' });
  return res.json({ schedule });
});

app.put('/schedules/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, data } = req.body;

  if (!id) return res.status(400).json({ error: 'invalid id' });
  if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title is required' });
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'data object required' });

  try {
    const updated = updateSchedule(id, title.trim(), data);
    if (!updated) return res.status(404).json({ error: 'not found' });
    return res.json({ schedule: updated });
  } catch (err) {
    return res.status(500).json({ error: 'failed to update' });
  }
});

app.delete('/schedules/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  try {
    const ok = deleteSchedule(id);
    return res.json({ deleted: ok });
  } catch (err) {
    return res.status(500).json({ error: 'failed to delete' });
  }
});

app.get('/education/dashboard', protectRoute, getEducationDashboard);
app.get('/education/subjects', protectRoute, getSubjects);
app.post('/education/subjects', protectRoute, validateRequest(createSubjectSchema), createSubject);
app.patch('/education/subjects/:id', protectRoute, validateRequest(updateSubjectSchema), patchSubject);
app.delete('/education/subjects/:id', protectRoute, deleteSubject);

app.get('/education/tasks', protectRoute, getTasks);
app.post('/education/tasks', protectRoute, validateRequest(createTaskSchema), createTask);
app.patch('/education/tasks/:id', protectRoute, patchTask);
app.delete('/education/tasks/:id', protectRoute, deleteTask);

app.get('/education/exams', protectRoute, getExams);
app.post('/education/exams', protectRoute, validateRequest(createExamSchema), createExam);
app.patch('/education/exams/:id', protectRoute, patchExam);
app.delete('/education/exams/:id', protectRoute, deleteExam);

module.exports = app;