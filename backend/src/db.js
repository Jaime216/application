const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

function loadEnvFile() {
  const envFilePath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const contents = fs.readFileSync(envFilePath, 'utf8');

  contents.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const databasePath = process.env.SQLITE_PATH || path.join(process.env.HOME || '', 'Escritorio', 'application', 'db');
if (databasePath !== ':memory:') {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

const database = new Database(databasePath);

database.pragma('foreign_keys = ON');
database.pragma('journal_mode = WAL');

function generateId() {
  return crypto.randomUUID();
}

function toIsoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toBoolean(value) {
  return value === true || value === 1 || value === '1';
}

function serializeUser(row) {
  if (!row) return null;

  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  };
}

function serializeSubject(row) {
  if (!row) return null;

  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    name: row.name,
    teacher: row.teacher || '',
    color: row.color,
    createdAt: row.created_at,
  };
}

function serializeTask(row, subjectRow) {
  if (!row) return null;

  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    subject: serializeSubject(subjectRow),
    dueDate: row.due_date,
    status: row.status,
    isProject: toBoolean(row.is_project),
    title: row.title,
    description: row.description || '',
    createdAt: row.created_at,
  };
}

function serializeExam(row, subjectRow) {
  if (!row) return null;

  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    subject: serializeSubject(subjectRow),
    date: row.date,
    maxScore: Number(row.max_score),
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    scoreScale: row.score_scale === null || row.score_scale === undefined ? null : Number(row.score_scale),
    createdAt: row.created_at,
  };
}

function initializeDatabase() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      teacher TEXT DEFAULT '',
      color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendiente',
      is_project INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      date TEXT NOT NULL,
      max_score REAL NOT NULL,
      score REAL,
      score_scale INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_subject_id ON tasks(subject_id);
    CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams(user_id);
    CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON exams(subject_id);
  `);
}



function listSchedules() {
  return database.prepare('SELECT id, title, data, created_at FROM schedules ORDER BY id DESC').all().map((row) => ({
    id: row.id,
    title: row.title,
    data: JSON.parse(row.data),
    created_at: row.created_at,
  }));
}

function createSchedule(title, dataObj) {
  const statement = database.prepare('INSERT INTO schedules (title, data) VALUES (?, ?)');
  const result = statement.run(title, JSON.stringify(dataObj));

  return {
    id: result.lastInsertRowid,
    title,
    data: dataObj,
  };
}

function getSchedule(id) {
  const row = database.prepare('SELECT id, title, data, created_at FROM schedules WHERE id = ?').get(id);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    data: JSON.parse(row.data),
    created_at: row.created_at,
  };
}

function updateSchedule(id, title, dataObj) {
  const stmt = database.prepare('UPDATE schedules SET title = ?, data = ? WHERE id = ?');
  const info = stmt.run(title, JSON.stringify(dataObj), id);
  if (info.changes === 0) return null;
  return getSchedule(id);
}

function deleteSchedule(id) {
  const stmt = database.prepare('DELETE FROM schedules WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
}

function getDatabaseStatus() {
  return database.prepare('SELECT 1 AS ok').get();
}

function createUser({ id = generateId(), name, email, passwordHash, role = 'student' }) {
  database
    .prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, email, passwordHash, role);

  return findUserById(id);
}

function findUserByEmail(email) {
  const row = database.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').get(email);
  return serializeUser(row);
}

function findUserById(id) {
  const row = database.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').get(id);
  return serializeUser(row);
}

function deleteUserByEmail(email) {
  return database.prepare('DELETE FROM users WHERE email = ?').run(email).changes > 0;
}

function deleteUserById(id) {
  return database.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
}

function deleteSubjectsByUser(userId) {
  return database.prepare('DELETE FROM subjects WHERE user_id = ?').run(userId).changes;
}

function deleteTasksByUser(userId) {
  return database.prepare('DELETE FROM tasks WHERE user_id = ?').run(userId).changes;
}

function deleteExamsByUser(userId) {
  return database.prepare('DELETE FROM exams WHERE user_id = ?').run(userId).changes;
}

function listSubjects(userId) {
  return database
    .prepare('SELECT * FROM subjects WHERE user_id = ? ORDER BY name ASC, created_at ASC')
    .all(userId)
    .map(serializeSubject);
}

function getSubject(id, userId) {
  const row = database
    .prepare('SELECT * FROM subjects WHERE id = ? AND user_id = ? LIMIT 1')
    .get(id, userId);
  return serializeSubject(row);
}

function createSubject(userId, data) {
  const id = generateId();
  database
    .prepare('INSERT INTO subjects (id, user_id, name, teacher, color) VALUES (?, ?, ?, ?, ?)')
    .run(id, userId, data.name, data.teacher || '', data.color);

  return getSubject(id, userId);
}

function updateSubject(id, userId, updates) {
  const current = getSubject(id, userId);
  if (!current) return null;

  const next = {
    name: updates.name ?? current.name,
    teacher: updates.teacher ?? current.teacher,
    color: updates.color ?? current.color,
  };

  database
    .prepare('UPDATE subjects SET name = ?, teacher = ?, color = ? WHERE id = ? AND user_id = ?')
    .run(next.name, next.teacher || '', next.color, id, userId);

  return getSubject(id, userId);
}

function deleteSubject(id, userId) {
  return database.prepare('DELETE FROM subjects WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}

function listTasks(userId) {
  const rows = database
    .prepare(
      `SELECT
        t.*,
        s.id AS subject_id,
        s.user_id AS subject_user_id,
        s.name AS subject_name,
        s.teacher AS subject_teacher,
        s.color AS subject_color,
        s.created_at AS subject_created_at
      FROM tasks t
      JOIN subjects s ON s.id = t.subject_id
      WHERE t.user_id = ?
      ORDER BY datetime(t.due_date) ASC, t.created_at ASC`,
    )
    .all(userId);

  return rows.map((row) => serializeTask(row, {
    id: row.subject_id,
    user_id: row.subject_user_id,
    name: row.subject_name,
    teacher: row.subject_teacher,
    color: row.subject_color,
    created_at: row.subject_created_at,
  }));
}

function getTask(id, userId) {
  const row = database
    .prepare(
      `SELECT
        t.*,
        s.id AS subject_id,
        s.user_id AS subject_user_id,
        s.name AS subject_name,
        s.teacher AS subject_teacher,
        s.color AS subject_color,
        s.created_at AS subject_created_at
      FROM tasks t
      JOIN subjects s ON s.id = t.subject_id
      WHERE t.id = ? AND t.user_id = ?
      LIMIT 1`,
    )
    .get(id, userId);

  if (!row) return null;

  return serializeTask(row, {
    id: row.subject_id,
    user_id: row.subject_user_id,
    name: row.subject_name,
    teacher: row.subject_teacher,
    color: row.subject_color,
    created_at: row.subject_created_at,
  });
}

function createTask(userId, data) {
  const subject = getSubject(data.subject, userId);
  if (!subject) return null;

  const dueDate = toIsoDate(data.dueDate);
  if (!dueDate) return null;

  const id = generateId();
  database
    .prepare(
      'INSERT INTO tasks (id, user_id, subject_id, due_date, status, is_project, title, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      id,
      userId,
      subject._id,
      dueDate,
      data.status || 'pendiente',
      data.isProject ? 1 : 0,
      data.title,
      data.description || '',
    );

  return getTask(id, userId);
}

function updateTask(id, userId, updates) {
  const current = getTask(id, userId);
  if (!current) return null;

  const nextSubjectId = updates.subject ? String(updates.subject) : current.subject._id;
  const subject = getSubject(nextSubjectId, userId);
  if (!subject) return null;

  const nextDueDate = updates.dueDate ? toIsoDate(updates.dueDate) : current.dueDate;
  if (!nextDueDate) return null;

  const next = {
    subjectId: subject._id,
    dueDate: nextDueDate,
    status: updates.status ?? current.status,
    isProject: updates.isProject === undefined ? current.isProject : Boolean(updates.isProject),
    title: updates.title ?? current.title,
    description: updates.description ?? current.description,
  };

  database
    .prepare(
      'UPDATE tasks SET subject_id = ?, due_date = ?, status = ?, is_project = ?, title = ?, description = ? WHERE id = ? AND user_id = ?',
    )
    .run(
      next.subjectId,
      next.dueDate,
      next.status,
      next.isProject ? 1 : 0,
      next.title,
      next.description || '',
      id,
      userId,
    );

  return getTask(id, userId);
}

function deleteTask(id, userId) {
  return database.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}

function listExams(userId) {
  const rows = database
    .prepare(
      `SELECT
        e.*,
        s.id AS subject_id,
        s.user_id AS subject_user_id,
        s.name AS subject_name,
        s.teacher AS subject_teacher,
        s.color AS subject_color,
        s.created_at AS subject_created_at
      FROM exams e
      JOIN subjects s ON s.id = e.subject_id
      WHERE e.user_id = ?
      ORDER BY datetime(e.date) ASC, e.created_at ASC`,
    )
    .all(userId);

  return rows.map((row) => serializeExam(row, {
    id: row.subject_id,
    user_id: row.subject_user_id,
    name: row.subject_name,
    teacher: row.subject_teacher,
    color: row.subject_color,
    created_at: row.subject_created_at,
  }));
}

function getExam(id, userId) {
  const row = database
    .prepare(
      `SELECT
        e.*,
        s.id AS subject_id,
        s.user_id AS subject_user_id,
        s.name AS subject_name,
        s.teacher AS subject_teacher,
        s.color AS subject_color,
        s.created_at AS subject_created_at
      FROM exams e
      JOIN subjects s ON s.id = e.subject_id
      WHERE e.id = ? AND e.user_id = ?
      LIMIT 1`,
    )
    .get(id, userId);

  if (!row) return null;

  return serializeExam(row, {
    id: row.subject_id,
    user_id: row.subject_user_id,
    name: row.subject_name,
    teacher: row.subject_teacher,
    color: row.subject_color,
    created_at: row.subject_created_at,
  });
}

function createExam(userId, data) {
  const subject = getSubject(data.subject, userId);
  if (!subject) return null;

  const date = toIsoDate(data.date);
  if (!date) return null;

  const id = generateId();
  database
    .prepare(
      'INSERT INTO exams (id, user_id, subject_id, date, max_score, score, score_scale) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      id,
      userId,
      subject._id,
      date,
      data.maxScore || 10,
      data.score === undefined || data.score === null ? null : data.score,
      data.scoreScale === undefined ? null : data.scoreScale,
    );

  return getExam(id, userId);
}

function updateExam(id, userId, updates) {
  const current = getExam(id, userId);
  if (!current) return null;

  const nextSubjectId = updates.subject ? String(updates.subject) : current.subject._id;
  const subject = getSubject(nextSubjectId, userId);
  if (!subject) return null;

  const nextDate = updates.date ? toIsoDate(updates.date) : current.date;
  if (!nextDate) return null;

  const next = {
    subjectId: subject._id,
    date: nextDate,
    maxScore: updates.maxScore ?? current.maxScore,
    score: Object.prototype.hasOwnProperty.call(updates, 'score') ? updates.score : current.score,
    scoreScale: Object.prototype.hasOwnProperty.call(updates, 'scoreScale') ? updates.scoreScale : current.scoreScale,
  };

  database
    .prepare('UPDATE exams SET subject_id = ?, date = ?, max_score = ?, score = ?, score_scale = ? WHERE id = ? AND user_id = ?')
    .run(
      next.subjectId,
      next.date,
      next.maxScore,
      next.score === undefined ? null : next.score,
      next.scoreScale === undefined ? null : next.scoreScale,
      id,
      userId,
    );

  return getExam(id, userId);
}

function deleteExam(id, userId) {
  return database.prepare('DELETE FROM exams WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}

function getEducationDashboard(userId) {
  const now = new Date();
  const next7Days = new Date(now);
  next7Days.setDate(next7Days.getDate() + 7);

  const exams = listExams(userId)
    .filter((exam) => {
      const examDate = new Date(exam.date);
      return !Number.isNaN(examDate.getTime()) && examDate >= now;
    })
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .slice(0, 3);

  const dueTasks = listTasks(userId)
    .filter((task) => {
      const taskDate = new Date(task.dueDate);
      return !Number.isNaN(taskDate.getTime())
        && taskDate >= now
        && taskDate <= next7Days
        && ['pendiente', 'en_progreso', 'en progreso'].includes(task.status);
    })
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate));

  const completedExams = listExams(userId).filter((exam) => {
    const examDate = new Date(exam.date);
    return !Number.isNaN(examDate.getTime()) && examDate <= now && exam.score !== null;
  });

  const totalCompleted = completedExams.length;
  const value = totalCompleted
    ? Number((completedExams.reduce((sum, exam) => sum + Number(exam.score || 0), 0) / totalCompleted).toFixed(2))
    : null;

  return {
    upcomingExams: exams,
    dueTasks,
    globalAverage: {
      value,
      totalCompleted,
    },
  };
}

module.exports = {
  initializeDatabase,
  listSchedules,
  createSchedule,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  getDatabaseStatus,
  generateId,
  createUser,
  findUserByEmail,
  findUserById,
  deleteUserByEmail,
  deleteUserById,
  deleteSubjectsByUser,
  deleteTasksByUser,
  deleteExamsByUser,
  listSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  listExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  getEducationDashboard,
};