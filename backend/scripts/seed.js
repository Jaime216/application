const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {
  initializeDatabase,
  listSchedules,
  createSchedule,
  deleteSchedule,
} = require('../src/db');
const { Subject, Task, Exam } = require('../src/models');
const { connectMongo } = require('../src/mongoose');

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

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function buildSeedScheduleA() {
  return {
    Lunes: {
      'Mañana': [['Matemáticas'], ['Historia'], ['Inglés']],
      Tarde: [['Física'], ['Laboratorio'], ['Lectura']],
    },
    Martes: {
      'Mañana': [['Programación'], ['Matemáticas'], ['Deporte']],
      Tarde: [['Química'], ['Tutoría'], ['Proyecto']],
    },
    Miércoles: {
      'Mañana': [['Literatura'], ['Biología'], ['Inglés']],
      Tarde: [['Programación'], ['Estudio libre'], ['Descanso']],
    },
    Jueves: {
      'Mañana': [['Física'], ['Matemáticas'], ['Historia']],
      Tarde: [['Proyecto'], ['Laboratorio'], ['Repaso']],
    },
    Viernes: {
      'Mañana': [['Programación'], ['Inglés'], ['Tutoría']],
      Tarde: [['Evaluación'], ['Deporte'], ['Planificación']],
    },
    Sábado: {
      'Mañana': [['Proyecto personal'], ['Lectura'], ['Descanso']],
      Tarde: [[], [], []],
    },
    Domingo: {
      'Mañana': [[], [], []],
      Tarde: [[], [], []],
    },
  };
}

function buildSeedScheduleB() {
  return {
    Lunes: {
      'Mañana': [['Álgebra'], ['Inglés B2'], ['Katas']],
      Tarde: [['Trabajo equipo'], ['Deporte'], []],
    },
    Martes: {
      'Mañana': [['Física'], ['Historia'], ['Base de datos']],
      Tarde: [['Proyecto final'], [], []],
    },
    Miércoles: {
      'Mañana': [['Programación'], ['Algoritmos'], ['Repaso']],
      Tarde: [['Mentoría'], ['Lectura'], []],
    },
    Jueves: {
      'Mañana': [['Química'], ['Inglés'], ['Práctica']],
      Tarde: [['Proyecto final'], ['Laboratorio'], []],
    },
    Viernes: {
      'Mañana': [['Simulacro examen'], ['Feedback'], ['Plan semanal']],
      Tarde: [['Descanso'], [], []],
    },
    Sábado: {
      'Mañana': [['Profundización'], ['Lectura'], []],
      Tarde: [[], [], []],
    },
    Domingo: {
      'Mañana': [[], [], []],
      Tarde: [[], [], []],
    },
  };
}

async function seed() {
  loadEnvFile();

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required in backend/.env');
  }

  const seedUserObjectId = new mongoose.Types.ObjectId('6654f0000000000000000001');
  const seedUserId = seedUserObjectId.toString();

  initializeDatabase();

  const existingSchedules = listSchedules();
  existingSchedules
    .filter((schedule) => schedule.title.startsWith('[SEED] '))
    .forEach((schedule) => deleteSchedule(schedule.id));

  const seededSchedules = [
    createSchedule('[SEED] Horario base', buildSeedScheduleA()),
    createSchedule('[SEED] Horario exámenes', buildSeedScheduleB()),
  ];

  await connectMongo();

  await Promise.all([
    Subject.deleteMany({ userId: seedUserId }),
    Task.deleteMany({ userId: seedUserObjectId }),
    Exam.deleteMany({ userId: seedUserObjectId }),
  ]);

  const subjects = await Subject.insertMany([
    { userId: seedUserId, name: 'Matemáticas', color: '#4f46e5', teacher: 'Laura Gómez' },
    { userId: seedUserId, name: 'Programación', color: '#0ea5e9', teacher: 'Carlos Ruiz' },
    { userId: seedUserId, name: 'Historia', color: '#f97316', teacher: 'Marina Soler' },
  ]);

  const subjectMap = Object.fromEntries(subjects.map((subject) => [subject.name, subject._id]));

  const tasks = await Task.insertMany([
    {
      userId: seedUserObjectId,
      subject: subjectMap['Programación'],
      dueDate: daysFromNow(2),
      status: 'pendiente',
      isProject: true,
      title: 'Entregar SPA educativa',
      description: 'Deploy y revisión final',
    },
    {
      userId: seedUserObjectId,
      subject: subjectMap['Matemáticas'],
      dueDate: daysFromNow(4),
      status: 'en_progreso',
      isProject: false,
      title: 'Hoja de ejercicios derivadas',
      description: 'Resolver ejercicios 1-20',
    },
    {
      userId: seedUserObjectId,
      subject: subjectMap['Historia'],
      dueDate: daysFromNow(8),
      status: 'pendiente',
      isProject: false,
      title: 'Resumen revolución industrial',
      description: '2 páginas',
    },
    {
      userId: seedUserObjectId,
      subject: subjectMap['Programación'],
      dueDate: daysFromNow(-2),
      status: 'entregada',
      isProject: false,
      title: 'Kata de arrays',
      description: 'Resuelta y subida al repo',
    },
  ]);

  const exams = await Exam.insertMany([
    {
      userId: seedUserObjectId,
      subject: subjectMap['Matemáticas'],
      date: daysFromNow(3),
      maxScore: 10,
      score: null,
    },
    {
      userId: seedUserObjectId,
      subject: subjectMap['Historia'],
      date: daysFromNow(6),
      maxScore: 10,
      score: null,
    },
    {
      userId: seedUserObjectId,
      subject: subjectMap['Programación'],
      date: daysFromNow(-7),
      maxScore: 10,
      score: 8.7,
    },
    {
      userId: seedUserObjectId,
      subject: subjectMap['Matemáticas'],
      date: daysFromNow(-12),
      maxScore: 10,
      score: 7.9,
    },
  ]);

  const token = jwt.sign({ userId: seedUserId }, jwtSecret, { expiresIn: '7d' });

  const output = {
    seededUserId: seedUserId,
    jwtToken: token,
    schedules: seededSchedules.length,
    subjects: subjects.length,
    tasks: tasks.length,
    exams: exams.length,
  };

  console.log('✅ Seed completado');
  console.log(JSON.stringify(output, null, 2));
  console.log('\nÚsalo en la UI como Bearer token o en curl:');
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:${process.env.PORT || 3001}/education/dashboard`);

  await mongoose.connection.close();
}

if (require.main === module) {
  seed().catch(async (error) => {
    console.error('❌ Error ejecutando seed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  });
}

module.exports = {
  seed,
};
