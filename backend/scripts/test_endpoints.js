const http = require('http');
const https = require('https');
const { spawnSync } = require('child_process');

const API = process.env.API_URL || 'http://localhost:3001';
const creds = { email: 'alumno@spa.app', password: 'Estudio123!' };

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
  console.log('[test] login...');
  const login = await request('/auth/login', 'POST', null, creds);
  if (login.status !== 200 || !login.body?.token) {
    console.error('[test] login failed', login.status, login.body);
    process.exit(2);
  }

  const token = login.body.token;
  console.log('[test] token obtained');

  const metrics = await request('/education/metrics', 'GET', token);
  console.log('[test] /education/metrics', metrics.status);
  if (metrics.status !== 200) { console.error(metrics.body); process.exit(3); }

  const subjects = await request('/education/subjects', 'GET', token);
  console.log('[test] /education/subjects', subjects.status);
  if (subjects.status !== 200) { console.error(subjects.body); process.exit(4); }

  const firstSub = subjects.body?.subjects?.[0]?.id;
  if (!firstSub) { console.error('[test] no subject to test subject stats'); process.exit(5); }

  const stats = await request(`/education/subjects/${firstSub}/stats`, 'GET', token);
  console.log('[test] /education/subjects/:id/stats', stats.status);
  if (stats.status !== 200) { console.error(stats.body); process.exit(6); }

  const completed = await request('/education/exams/completed', 'GET', token);
  console.log('[test] /education/exams/completed', completed.status);
  if (completed.status !== 200) { console.error(completed.body); process.exit(7); }

  console.log('[test] all tests passed');
  process.exit(0);
})();
