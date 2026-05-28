import { useEffect, useMemo, useState } from 'react';
import EducationHub from './pages/EducationHub';

const defaultApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const authStorageKey = 'spa-app-auth-token';

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
    const error = new Error(data?.error?.message || data?.error || response.statusText || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function App() {
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState({ health: false, schedules: false, create: false });
  const [error, setError] = useState('');
  const [view, setView] = useState('home');

  const [authToken, setAuthToken] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: 'alumno@spa.app', password: 'Estudio123!' });

  const endpoints = useMemo(() => [
    { label: 'GET /', action: 'root' },
    { label: 'GET /health', action: 'health' },
    { label: 'GET /schedules', action: 'schedules' },
  ], []);

  const isAuthenticated = Boolean(authToken && currentUser);

  useEffect(() => {
    setError('');
    setAuthError('');
    setStatus(null);
    setMessage('');
  }, [apiUrl]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedToken = window.localStorage.getItem(authStorageKey);

      if (!storedToken) {
        if (!cancelled) setAuthReady(true);
        return;
      }

      try {
        const data = await requestJson(apiUrl, '/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (cancelled) return;

        setAuthToken(storedToken);
        setCurrentUser(data.user || null);
      } catch {
        window.localStorage.removeItem(authStorageKey);
        if (!cancelled) {
          setAuthToken('');
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    setAuthReady(false);
    restoreSession();

    return () => {
      cancelled = true;
    };
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
    } finally {
      setLoading((current) => ({ ...current, schedules: false }));
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const data = await requestJson(apiUrl, '/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      });

      window.localStorage.setItem(authStorageKey, data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user || null);
      setView('home');
      setStatus(null);
      setMessage('');
    } catch (err) {
      setAuthError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(authStorageKey);
    setAuthToken('');
    setCurrentUser(null);
    setView('home');
    setStatus(null);
    setMessage('Sesión cerrada');
    setError('');
    setAuthError('');
  }

  if (!authReady) {
    return (
      <main className="shell">
        <section className="hero">
          <p className="eyebrow">React SPA</p>
          <h1>Cargando sesión...</h1>
          <p className="lede">Comprobando si ya hay un acceso guardado.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="shell">
        <section className="hero auth-hero">
          <div>
            <p className="eyebrow">React SPA</p>
            <h1>Inicia sesión para entrar en la app</h1>
            <p className="lede">
              Accede con tu cuenta demo y gestiona el módulo de estudio sin generar tokens manuales.
            </p>
          </div>

          <form className="auth-card" onSubmit={handleLogin}>
            <div className="panel-header">
              <h2>Login</h2>
              <p>Usa la cuenta demo creada con el seed.</p>
            </div>

            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
              type="email"
              autoComplete="email"
            />

            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              type="password"
              autoComplete="current-password"
            />

            <button type="submit" disabled={authLoading}>
              {authLoading ? 'Entrando...' : 'Entrar'}
            </button>

            <small className="auth-hint">Demo: <strong>alumno@spa.app</strong> / <strong>Estudio123!</strong></small>

            {authError ? <div className="notice error">{authError}</div> : null}
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>API URL</h2>
            <p>Ajusta la dirección del backend si no corre en local.</p>
          </div>

          <div className="api-row auth-api-row">
            <label htmlFor="apiUrl">API URL</label>
            <input
              id="apiUrl"
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              placeholder="http://localhost:3001"
            />
            <button type="button" onClick={loadRoot}>Ver raíz</button>
          </div>
        </section>
      </main>
    );
  }

  if (view === 'education') {
    return (
      <EducationHub
        apiUrl={apiUrl}
        authToken={authToken}
        currentUser={currentUser}
        onBack={() => setView('home')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <main className="shell">
      <section className="hero app-home-hero">
        <div className="hero-topbar">
          <div>
            <p className="eyebrow">React SPA</p>
            <h1>Panel mínimo para probar el backend</h1>
            <p className="lede">
              Levanta el backend, ajusta la URL de API si hace falta y prueba lectura,
              escritura y siembra de datos desde esta pantalla.
            </p>
          </div>

          <div className="session-pill">
            <span>{currentUser?.name || 'Usuario'}</span>
            <small>{currentUser?.email}</small>
            <button type="button" className="ghost-button" onClick={handleLogout}>Salir</button>
          </div>
        </div>

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

        <div className="modules-row app-home-modules">
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

      <section className="panel app-home-panel">
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

      <section className="panel two-col app-home-panel">
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
