const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  initializeDatabase,
  listSchedules,
  createSchedule,
  deleteSchedule,
  createUser,
  deleteUserById,
  deleteUserByEmail,
  deleteSubjectsByUser,
  deleteTasksByUser,
  deleteExamsByUser,
  createSubject,
  createTask,
  createExam,
} = require('../src/db');

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

function classEntry(name, classroom) {
  return { name, classroom };
}

function buildSeedScheduleA() {
  return {
    Lunes: {
      'Mañana': [[classEntry('Matemáticas', 'Aula 201')], [classEntry('Historia', 'Aula 104')], [classEntry('Inglés', 'Aula 303')]],
      Tarde: [[classEntry('Física', 'Laboratorio 1')], [classEntry('Laboratorio', 'Lab. de ciencias')], [classEntry('Lectura', 'Biblioteca')]],
    },
    Martes: {
      'Mañana': [[classEntry('Programación', 'Aula 302')], [classEntry('Matemáticas', 'Aula 201')], [classEntry('Deporte', 'Pabellón')]],
      Tarde: [[classEntry('Química', 'Laboratorio 2')], [classEntry('Tutoría', 'Sala 1')], [classEntry('Proyecto', 'Aula de trabajo')]],
    },
    Miércoles: {
      'Mañana': [[classEntry('Literatura', 'Aula 105')], [classEntry('Biología', 'Laboratorio 2')], [classEntry('Inglés', 'Aula 303')]],
      Tarde: [[classEntry('Programación', 'Aula 302')], [classEntry('Estudio libre', 'Biblioteca')], [classEntry('Descanso', 'Casa')]],
    },
    Jueves: {
      'Mañana': [[classEntry('Física', 'Laboratorio 1')], [classEntry('Matemáticas', 'Aula 201')], [classEntry('Historia', 'Aula 104')]],
      Tarde: [[classEntry('Proyecto', 'Aula de trabajo')], [classEntry('Laboratorio', 'Lab. de ciencias')], [classEntry('Repaso', 'Biblioteca')]],
    },
    Viernes: {
      'Mañana': [[classEntry('Programación', 'Aula 302')], [classEntry('Inglés', 'Aula 303')], [classEntry('Tutoría', 'Sala 1')]],
      Tarde: [[classEntry('Evaluación', 'Aula 201')], [classEntry('Deporte', 'Pabellón')], [classEntry('Planificación', 'Biblioteca')]],
    },
    Sábado: {
      'Mañana': [[classEntry('Proyecto personal', 'Casa')], [classEntry('Lectura', 'Biblioteca')], [classEntry('Descanso', 'Casa')]],
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
      'Mañana': [[classEntry('Álgebra', 'Aula 210')], [classEntry('Inglés B2', 'Aula 303')], [classEntry('Katas', 'Aula 402')]],
      Tarde: [[classEntry('Trabajo equipo', 'Sala colaborativa')], [classEntry('Deporte', 'Pabellón')], []],
    },
    Martes: {
      'Mañana': [[classEntry('Física', 'Laboratorio 1')], [classEntry('Historia', 'Aula 104')], [classEntry('Base de datos', 'Aula 402')]],
      Tarde: [[classEntry('Proyecto final', 'Aula de trabajo')], [], []],
    },
    Miércoles: {
      'Mañana': [[classEntry('Programación', 'Aula 302')], [classEntry('Algoritmos', 'Aula 402')], [classEntry('Repaso', 'Biblioteca')]],
      Tarde: [[classEntry('Mentoría', 'Sala 1')], [classEntry('Lectura', 'Biblioteca')], []],
    },
    Jueves: {
      'Mañana': [[classEntry('Química', 'Laboratorio 2')], [classEntry('Inglés', 'Aula 303')], [classEntry('Práctica', 'Aula 302')]],
      Tarde: [[classEntry('Proyecto final', 'Aula de trabajo')], [classEntry('Laboratorio', 'Lab. de ciencias')], []],
    },
    Viernes: {
      'Mañana': [[classEntry('Simulacro examen', 'Aula 201')], [classEntry('Feedback', 'Sala 1')], [classEntry('Plan semanal', 'Biblioteca')]],
      Tarde: [[classEntry('Descanso', 'Casa')], [], []],
    },
    Sábado: {
      'Mañana': [[classEntry('Profundización', 'Biblioteca')], [classEntry('Lectura', 'Biblioteca')], []],
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

  const demoEmail = process.env.AUTH_SEED_EMAIL || 'alumno@spa.app';
  const demoPassword = process.env.AUTH_SEED_PASSWORD || 'Estudio123!';
  const demoName = process.env.AUTH_SEED_NAME || 'Alumno demo';

  const seedUserId = '6654f0000000000000000001';

  initializeDatabase();

  const existingSchedules = listSchedules();
  existingSchedules
    .filter((schedule) => schedule.title.startsWith('[SEED] '))
    .forEach((schedule) => deleteSchedule(schedule.id));

  const seededSchedules = [
    createSchedule('[SEED] Horario base', buildSeedScheduleA()),
    createSchedule('[SEED] Horario exámenes', buildSeedScheduleB()),
  ];

  deleteUserById(seedUserId);
  deleteUserByEmail(demoEmail);
  deleteSubjectsByUser(seedUserId);
  deleteTasksByUser(seedUserId);
  deleteExamsByUser(seedUserId);

  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const demoUser = createUser({
    id: seedUserId,
    name: demoName,
    email: demoEmail,
    passwordHash,
    role: 'student',
  });

  const subjects = [
    createSubject(seedUserId, { name: 'Matemáticas', color: '#4f46e5', teacher: 'Laura Gómez' }),
    createSubject(seedUserId, { name: 'Programación', color: '#0ea5e9', teacher: 'Carlos Ruiz' }),
    createSubject(seedUserId, { name: 'Historia', color: '#f97316', teacher: 'Marina Soler' }),
  ];

  const subjectMap = Object.fromEntries(subjects.map((subject) => [subject.name, subject._id]));

  const tasks = [
    createTask(seedUserId, {
      subject: subjectMap['Programación'],
      dueDate: daysFromNow(2),
      status: 'pendiente',
      isProject: true,
      title: 'Entregar SPA educativa',
      description: 'Deploy y revisión final',
    }),
    createTask(seedUserId, {
      subject: subjectMap['Matemáticas'],
      dueDate: daysFromNow(4),
      status: 'en_progreso',
      isProject: false,
      title: 'Hoja de ejercicios derivadas',
      description: 'Resolver ejercicios 1-20',
    }),
    createTask(seedUserId, {
      subject: subjectMap['Historia'],
      dueDate: daysFromNow(8),
      status: 'pendiente',
      isProject: false,
      title: 'Resumen revolución industrial',
      description: '2 páginas',
    }),
    createTask(seedUserId, {
      subject: subjectMap['Programación'],
      dueDate: daysFromNow(-2),
      status: 'entregada',
      isProject: false,
      title: 'Kata de arrays',
      description: 'Resuelta y subida al repo',
    }),
  ];

  const exams = [
    createExam(seedUserId, {
      subject: subjectMap['Matemáticas'],
      date: daysFromNow(3),
      maxScore: 10,
      score: null,
    }),
    createExam(seedUserId, {
      subject: subjectMap['Historia'],
      date: daysFromNow(6),
      maxScore: 10,
      score: null,
    }),
    createExam(seedUserId, {
      subject: subjectMap['Programación'],
      date: daysFromNow(-7),
      maxScore: 10,
      score: 8.7,
    }),
    createExam(seedUserId, {
      subject: subjectMap['Matemáticas'],
      date: daysFromNow(-12),
      maxScore: 10,
      score: 7.9,
    }),
  ];

  const token = jwt.sign({ userId: seedUserId }, jwtSecret, { expiresIn: '7d' });

  const output = {
    seededUserId: seedUserId,
    demoLogin: {
      email: demoUser.email,
      password: demoPassword,
    },
    jwtToken: token,
    schedules: seededSchedules.length,
    subjects: subjects.length,
    tasks: tasks.length,
    exams: exams.length,
  };

  console.log('✅ Seed completado');
  console.log(JSON.stringify(output, null, 2));
  console.log('\nLogin de demo:');
  console.log(`email: ${demoUser.email}`);
  console.log(`password: ${demoPassword}`);
  console.log('\nTambién puedes usar el JWT en curl:');
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:${process.env.PORT || 3001}/education/dashboard`);
}

if (require.main === module) {
  seed().catch(async (error) => {
    console.error('❌ Error ejecutando seed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  seed,
};
