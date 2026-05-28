const http = require('http');
const https = require('https');

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
  const login = await request('/auth/login', 'POST', null, creds);
  if (login.status !== 200 || !login.body?.token) {
    console.error('login failed', login.status, login.body);
    process.exit(2);
  }
  const token = login.body.token;
  const dash = await request('/education/dashboard', 'GET', token);
  console.log('/education/dashboard', dash.status);
  console.log(JSON.stringify(dash.body, null, 2));
})();
