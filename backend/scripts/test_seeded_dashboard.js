const http = require('http');
const https = require('https');

const { seed } = require('./seed');

const API = process.env.API_URL || 'http://localhost:3001';
const demoEmail = process.env.AUTH_SEED_EMAIL || 'alumno@spa.app';
const demoPassword = process.env.AUTH_SEED_PASSWORD || 'Estudio123!';

function request(path, method = 'GET', token = null, body = null) {
  const url = new URL(path, API);
  const lib = url.protocol === 'https:' ? https : http;

  const opts = {
    method,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) opts.headers.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async function main() {
  console.log('[test-seed] Running seed to ensure known data...');
  try {
    await seed();
  } catch (err) {
    console.error('[test-seed] Seed failed:', err.message || err);
    process.exit(2);
  }

  console.log('[test-seed] Seed completed. Waiting briefly for DB to settle...');
  await new Promise((r) => setTimeout(r, 500));

  console.log('[test-seed] Logging in...');
  const login = await request('/auth/login', 'POST', null, { email: demoEmail, password: demoPassword });
  if (login.status !== 200 || !login.body?.token) {
    console.error('[test-seed] login failed', login.status, login.body);
    process.exit(3);
  }
  const token = login.body.token;

  console.log('[test-seed] Fetching /education/metrics...');
  const metrics = await request('/education/metrics', 'GET', token);
  console.log('[test-seed] /education/metrics', metrics.status);
  if (metrics.status !== 200) { console.error(metrics.body); process.exit(4); }

  console.log('[test-seed] Fetching /education/dashboard...');
  const dash = await request('/education/dashboard', 'GET', token);
  console.log('[test-seed] /education/dashboard', dash.status);
  if (dash.status !== 200) { console.error(dash.body); process.exit(5); }

  console.log('[test-seed] Fetching /education/exams/history...');
  const history = await request('/education/exams/history', 'GET', token);
  console.log('[test-seed] /education/exams/history', history.status);
  if (history.status !== 200) { console.error(history.body); process.exit(6); }

  console.log('[test-seed] Fetching /education/exams/completed...');
  const completed = await request('/education/exams/completed', 'GET', token);
  console.log('[test-seed] /education/exams/completed', completed.status);
  if (completed.status !== 200) { console.error(completed.body); process.exit(7); }

  // Expected values from seed.js
  const expected = {
    subjects: 3,
    tasks: 4,
    exams: 4,
    examsUpcoming: 2,
    examsPending: 2,
    examsCompleted: 2,
    globalAverage: 8.3,
    history: 2,
    completedList: 2,
  };

  const m = metrics.body || {};
  const d = dash.body || {};

  const got = {
    subjects: m.counts?.subjects,
    tasks: m.counts?.tasks,
    exams: m.counts?.exams,
    examsUpcoming: m.counts?.examsUpcoming,
    examsPending: m.counts?.examsPending,
    examsCompleted: m.counts?.examsCompleted,
    globalAverage: d.globalAverage?.value,
    history: history.body?.history?.length,
    completedList: completed.body?.exams?.length,
  };

  console.log('[test-seed] Expected:', expected);
  console.log('[test-seed] Got:', got);

  let ok = true;
  if (got.subjects !== expected.subjects) { console.error('[test-seed] subjects mismatch'); ok = false; }
  if (got.tasks !== expected.tasks) { console.error('[test-seed] tasks mismatch'); ok = false; }
  if (got.exams !== expected.exams) { console.error('[test-seed] exams mismatch'); ok = false; }
  if (got.examsUpcoming !== expected.examsUpcoming) { console.error('[test-seed] examsUpcoming mismatch'); ok = false; }
  if (got.examsPending !== expected.examsPending) { console.error('[test-seed] examsPending mismatch'); ok = false; }
  if (got.examsCompleted !== expected.examsCompleted) { console.error('[test-seed] examsCompleted mismatch'); ok = false; }
  // compare globalAverage approximately
  const ga = typeof got.globalAverage === 'number' ? Number(got.globalAverage.toFixed(2)) : got.globalAverage;
  if (ga !== expected.globalAverage) { console.error('[test-seed] globalAverage mismatch'); ok = false; }
  if (got.history !== expected.history) { console.error('[test-seed] history mismatch'); ok = false; }
  if (got.completedList !== expected.completedList) { console.error('[test-seed] completedList mismatch'); ok = false; }

  if (ok) {
    console.log('[test-seed] All seeded dashboard metrics match expected values');
    process.exit(0);
  }

  console.error('[test-seed] Some seeded metrics did not match expected values');
  process.exit(6);
})();
