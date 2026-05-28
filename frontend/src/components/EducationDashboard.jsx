import React, { useEffect, useState } from 'react';
import EducationCalendar from './EducationCalendar';

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EducationDashboard({ apiUrl, authToken }) {
  const [metrics, setMetrics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    const token = (authToken || '').trim();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [mRes, dRes] = await Promise.all([
        fetch(`${apiUrl}/education/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/education/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const mBody = await mRes.json().catch(() => ({}));
      const dBody = await dRes.json().catch(() => ({}));

      setMetrics(mBody);
      setDashboard(dBody);
    } catch (err) {
      setError('No se pudieron cargar las métricas');
      setMetrics(null);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [apiUrl, authToken]);

  const counts = metrics?.counts || {};
  const upcoming = metrics?.upcomingExams || dashboard?.upcomingExams || [];
  const dueTasks = dashboard?.dueTasks || [];
  const globalAverage = dashboard?.globalAverage || { value: null, totalCompleted: 0 };

  return (
    <section className="panel" style={{ minWidth: 420 }}>
      <div className="panel-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Education Dashboard</h2>
            <p>Resumen construido a partir de las métricas del backend.</p>
          </div>
          <div>
            <button type="button" className="ghost-button" onClick={load} disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      {loading ? <div>Cargando métricas...</div> : null}
      {error ? <div className="notice error">{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <article className="dashboard-card">
          <h3>Contadores</h3>
          <div><strong>Tareas:</strong> {counts.tasks ?? 0}</div>
          <div><strong>Tareas pendientes:</strong> {counts.tasksByStatus?.pendiente ?? 0}</div>
          <div><strong>Exámenes pendientes:</strong> {counts.examsPending ?? 0}</div>
          <div><strong>Exámenes completados:</strong> {counts.examsCompleted ?? 0}</div>
          <div><strong>Asignaturas:</strong> {counts.subjects ?? 0}</div>
        </article>

        <article className="dashboard-card">
          <h3>Media global</h3>
          <p style={{ fontSize: 24, margin: '8px 0' }}>{typeof globalAverage.value === 'number' ? globalAverage.value.toFixed(2) : '--'}</p>
          <small>Exámenes evaluados: {globalAverage.totalCompleted ?? 0}</small>
        </article>

        <article className="dashboard-card">
          <h3>Próximos exámenes</h3>
          {upcoming.length === 0 ? <p className="empty">No hay exámenes próximos.</p> : (
            <ul className="dashboard-list">
              {upcoming.slice(0, 5).map((exam) => (
                <li key={exam.id || exam._id}>
                  <span className="subject-pill" style={{ backgroundColor: exam?.subject?.color || '#94a3b8' }} />
                  <strong>{exam?.subject?.name || 'Asignatura'}</strong>
                  <small style={{ marginLeft: 8 }}>{formatDate(exam?.date)}</small>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="dashboard-card">
          <h3>Tareas urgentes (7 días)</h3>
          {dueTasks.length === 0 ? <p className="empty">No hay tareas urgentes esta semana.</p> : (
            <ul className="dashboard-list">
              {dueTasks.map((task) => (
                <li key={task.id || task._id}>
                  <strong>{task.title}</strong>
                  <small style={{ marginLeft: 8 }}>{task?.subject?.name ?? ''} · {formatDate(task?.dueDate)}</small>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div style={{ marginTop: 12 }}>
        <EducationCalendar tasks={dueTasks} exams={upcoming} />
      </div>
    </section>
  );
}
