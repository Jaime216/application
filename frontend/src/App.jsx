import { useEffect, useMemo, useState } from 'react';
import Education from './components/Education';

const defaultApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function requestJson(apiUrl, path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const error = new Error(data?.error || response.statusText || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function App() {
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [status, setStatus] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState({ health: false, schedules: false, create: false });
  const [error, setError] = useState('');

  const endpoints = useMemo(() => [
    { label: 'GET /', action: 'root' },
    { label: 'GET /health', action: 'health' },
    { label: 'GET /schedules', action: 'schedules' },
  ], []);

  const [view, setView] = useState('home');

  useEffect(() => {
    setError('');
  }, [apiUrl]);

  async function loadRoot() {
    setMessage('');
    setError('');

    try {
      const data = await requestJson(apiUrl, '/');
      setStatus(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadHealth() {
    setLoading((current) => ({ ...current, health: true }));
    setError('');

    try {
      const data = await requestJson(apiUrl, '/health');
      setStatus(data);
      setMessage('Health obtenido correctamente');
    } catch (err) {
      setError(err.message);
      // keep error in local notice area
    } finally {
      setLoading((current) => ({ ...current, health: false }));
    }
  }

  async function loadSchedules() {
    setLoading((current) => ({ ...current, schedules: true }));
    setError('');

    try {
      const data = await requestJson(apiUrl, '/schedules');
      setMessage(`Se cargaron ${data.schedules?.length || 0} horarios`);
    } catch (err) {
      setError(err.message);
      // keep error in local notice area
    } finally {
      setLoading((current) => ({ ...current, schedules: false }));
    }
  }

  if (view === 'education') {
    return (
      <Education apiUrl={apiUrl} onBack={() => setView('home')} />
    );
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">React SPA</p>
        <h1>Panel mínimo para probar el backend</h1>
        <p className="lede">
          Levanta el backend, ajusta la URL de API si hace falta y prueba lectura,
          escritura y siembra de datos desde esta pantalla.
        </p>

        <div className="api-row">
          <label htmlFor="apiUrl">API URL</label>
          <input
            id="apiUrl"
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            placeholder="http://localhost:3001"
          />
          <button type="button" onClick={loadRoot}>Ver raíz</button>
        </div>

        <div className="modules-row">
          <div className="module-card" onClick={() => setView('education')}>
            <h3>Educación</h3>
            <p>Horario semanal, clases y grupos</p>
          </div>
          <div className="module-card disabled">
            <h3>Deporte</h3>
            <p>Rutinas y entrenamientos</p>
          </div>
          <div className="module-card disabled">
            <h3>Salud</h3>
            <p>Sueño, agua y alimentación</p>
          </div>
        </div>

        <div className="status-grid">
          <button type="button" onClick={loadHealth} disabled={loading.health}>
            {loading.health ? 'Consultando...' : 'GET /health'}
          </button>
          <button type="button" onClick={loadSchedules} disabled={loading.schedules}>
            {loading.schedules ? 'Cargando...' : 'GET /schedules'}
          </button>
        </div>
      </section>

      

      <section className="panel">
        <div className="panel-header">
          <h2>Endpoints</h2>
          <p>Lo justo para validar la API.</p>
        </div>

        <ul className="endpoint-list">
          {endpoints.map((endpoint) => (
            <li key={endpoint.action}>{endpoint.label}</li>
          ))}
        </ul>
      </section>

      <section className="panel two-col">
        <div>
          <div className="panel-header">
            <h2>Estado / Respuesta</h2>
            <p>Resultado de / y /health.</p>
          </div>

          <pre>{status ? JSON.stringify(status, null, 2) : 'Pulsa "Ver raíz" o "GET /health"'}</pre>
        </div>

        <div>
          <div className="panel-header">
            <h2>Mensajes</h2>
            <p>Los mensajes aparecen como notificaciones en pantalla.</p>
          </div>

          <div className={`notice ${error ? 'error' : ''}`}>
            {message || error || 'Sin eventos todavía'}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;