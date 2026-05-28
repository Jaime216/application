const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

function loadEnvFile() {
  const envFilePath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envFilePath)) return;

  const contents = fs.readFileSync(envFilePath, 'utf8');
  contents.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex === -1) return;
    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

function resolveDatabasePath() {
  return process.env.SQLITE_PATH || path.join(process.env.HOME || '', 'Escritorio', 'application', 'db');
}

function tableExists(db, tableName) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName);
  return Boolean(row);
}

function ensureBackup(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const backupPath = `${filePath}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function generateId() {
  return crypto.randomUUID();
}

function migrate() {
  loadEnvFile();
  const databasePath = resolveDatabasePath();
  if (!fs.existsSync(databasePath)) {
    console.log(`[migrate] No database file found at ${databasePath}`);
    return;
  }

  const backupPath = ensureBackup(databasePath);
  if (backupPath) {
    console.log(`[migrate] Backup created at ${backupPath}`);
  }

  const db = new Database(databasePath);
  db.pragma('foreign_keys = ON');

  if (!tableExists(db, 'completed_exams')) {
    console.log('[migrate] completed_exams table does not exist; nothing to migrate');
    return;
  }

  const rows = db.prepare('SELECT * FROM completed_exams ORDER BY completed_at ASC, created_at ASC').all();
  console.log(`[migrate] Found ${rows.length} completed exam rows`);

  const insertExam = db.prepare(`
    INSERT INTO exams (id, user_id, subject_id, date, max_score, score, score_scale, created_at)
    VALUES (@id, @user_id, @subject_id, @date, @max_score, @score, @score_scale, @created_at)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      subject_id = excluded.subject_id,
      date = excluded.date,
      max_score = excluded.max_score,
      score = excluded.score,
      score_scale = excluded.score_scale,
      created_at = excluded.created_at
  `);

  const insertHistory = db.prepare(`
    INSERT INTO exam_history (id, exam_id, user_id, subject_id, date, score, score_scale, recorded_at)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM exam_history
      WHERE exam_id = ? AND user_id = ? AND subject_id = ? AND date = ? AND score = ?
    )
  `);

  const migrateTransaction = db.transaction((items) => {
    for (const row of items) {
      const examId = row.original_exam_id || row.id || generateId();
      insertExam.run({
        id: examId,
        user_id: row.user_id,
        subject_id: row.subject_id,
        date: row.date,
        max_score: row.max_score,
        score: row.score,
        score_scale: row.score_scale,
        created_at: row.created_at || row.completed_at || new Date().toISOString(),
      });

      insertHistory.run(
        generateId(),
        examId,
        row.user_id,
        row.subject_id,
        row.date,
        row.score,
        row.score_scale,
        row.completed_at || row.created_at || new Date().toISOString(),
        examId,
        row.user_id,
        row.subject_id,
        row.date,
        row.score,
      );
    }
  });

  migrateTransaction(rows);

  db.exec('DROP TABLE completed_exams');
  console.log('[migrate] completed_exams migrated into exams and exam_history, then dropped');
}

if (require.main === module) {
  try {
    migrate();
  } catch (error) {
    console.error('[migrate] Migration failed:', error.message || error);
    process.exit(1);
  }
}

module.exports = { migrate };
