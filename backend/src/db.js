const fs = require('fs');
const path = require('path');
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

database.pragma('journal_mode = WAL');

function initializeDatabase() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
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

module.exports = {
  initializeDatabase,
  listSchedules,
  createSchedule,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  getDatabaseStatus,
};