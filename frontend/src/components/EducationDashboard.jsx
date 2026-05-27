import React, { useMemo } from 'react';
import useEducationStats from '../hooks/useEducationStats';
import EducationCalendar from './EducationCalendar';

function formatDate(value) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(value) {
  const date = toDate(value);
  if (!date) return null;

  const current = new Date();
  const diff = date.setHours(0, 0, 0, 0) - current.setHours(0, 0, 0, 0);
  return Math.round(diff / 86400000);
}

function getSubjectMeta(item) {
  const subject = item?.subject;

  if (!subject || typeof subject !== 'object') {
    return { name: 'Asignatura', color: '#94a3b8' };
  }

  return {
    name: subject.name || 'Asignatura',
    color: subject.color || '#94a3b8',
  };
}

export default function EducationDashboard({ apiUrl, authToken }) {
  const { data, loading, error, fetchEducationStats } = useEducationStats({ apiUrl, authToken });

  const average = data?.globalAverage?.value;
  const averageLabel = typeof average === 'number' ? average.toFixed(2) : '--';
  const exams = data?.upcomingExams || [];
  const urgentTasks = data?.dueTasks || [];

  const studyPlan = useMemo(() => {
    const items = [
      ...exams.map((exam) => ({
        type: 'Examen',
        title: exam?.title || exam?.subject?.name || 'Examen pendiente',
        date: exam?.date,
        item: exam,
        urgency: daysUntil(exam?.date),
      })),
      ...urgentTasks.map((task) => ({
        type: 'Tarea',
        title: task?.title || 'Tarea pendiente',
        date: task?.dueDate,
        item: task,
        urgency: daysUntil(task?.dueDate),
      })),
    ];

    return items
      .sort((left, right) => {
        const leftUrgency = typeof left.urgency === 'number' ? left.urgency : 99;
        const rightUrgency = typeof right.urgency === 'number' ? right.urgency : 99;
        return leftUrgency - rightUrgency;
      })
      .slice(0, 4);
  }, [exams, urgentTasks]);

  const studyCounts = useMemo(() => {
    const examSoon = exams.filter((exam) => {
      const delta = daysUntil(exam?.date);
      return delta !== null && delta <= 7;
    }).length;

    const taskSoon = urgentTasks.length;

    return {
      examSoon,
      taskSoon,
      total: examSoon + taskSoon,
    };
  }, [exams, urgentTasks]);

  async function refreshDashboard() {
    await fetchEducationStats();
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="dashboard-header-row">
          <div>
            <h2>Education Dashboard</h2>
            <p>Resumen de notas, próximos exámenes y tareas urgentes.</p>
          </div>
          <button type="button" className="ghost-button" onClick={refreshDashboard} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar métricas'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Cargando estadísticas...</span>
        </div>
      ) : (
        <>
          <div className="education-dashboard-grid">
            <article className="dashboard-card dashboard-card-average">
              <h3>Media global</h3>
              <p className="average-big">{averageLabel}</p>
              <small>Exámenes evaluados: {data?.globalAverage?.totalCompleted || 0}</small>
            </article>

            <article className="dashboard-card">
              <h3>Plan de hoy</h3>
              <p className="dashboard-kpi">{studyCounts.total}</p>
              <small>{studyCounts.total === 1 ? 'acción prioritaria' : 'acciones prioritarias'} en la semana</small>
              <div className="dashboard-mini-stats">
                <span>{studyCounts.examSoon} exámenes</span>
                <span>{studyCounts.taskSoon} tareas</span>
              </div>
            </article>

            <article className="dashboard-card">
              <h3>Próximos 3 exámenes</h3>
              {exams.length === 0 ? (
                <p className="empty">No hay exámenes próximos.</p>
              ) : (
                <ul className="dashboard-list">
                  {exams.map((exam) => (
                    <li key={exam._id}>
                      <span className="subject-pill" style={{ backgroundColor: exam?.subject?.color || '#94a3b8' }} />
                      <strong>{exam?.subject?.name || 'Asignatura'}</strong>
                      <small>{formatDate(exam?.date)}</small>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="dashboard-card">
              <h3>Tareas urgentes (7 días)</h3>
              {urgentTasks.length === 0 ? (
                <p className="empty">No hay tareas urgentes esta semana.</p>
              ) : (
                <ul className="dashboard-list">
                  {urgentTasks.map((task) => (
                    <li key={task._id}>
                      <span className="subject-pill" style={{ backgroundColor: task?.subject?.color || '#94a3b8' }} />
                      <strong>{task?.title || 'Tarea'}</strong>
                      <small>{formatDate(task?.dueDate)}</small>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>

          <article className="dashboard-card dashboard-roadmap">
            <h3>Prioridad de estudio</h3>
            {studyPlan.length === 0 ? (
              <p className="empty">No hay elementos urgentes ahora mismo.</p>
            ) : (
              <ul className="dashboard-roadmap-list">
                {studyPlan.map((entry, index) => {
                  const meta = getSubjectMeta(entry.item);
                  const urgency = typeof entry.urgency === 'number' ? entry.urgency : null;
                  const urgencyLabel = urgency === 0
                    ? 'Hoy'
                    : urgency === 1
                      ? 'Mañana'
                      : urgency && urgency > 1
                        ? `En ${urgency} días`
                        : 'Sin fecha';

                  return (
                    <li key={`${entry.type}-${entry.item?._id || index}`}>
                      <div className="roadmap-index">{index + 1}</div>
                      <span className="subject-pill" style={{ backgroundColor: meta.color }} />
                      <div className="roadmap-content">
                        <strong>{entry.title}</strong>
                        <small>{meta.name} · {entry.type}</small>
                      </div>
                      <div className="roadmap-meta">
                        <span>{urgencyLabel}</span>
                        <small>{formatDate(entry.date)}</small>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <EducationCalendar tasks={urgentTasks} exams={exams} />
        </>
      )}

      {error ? <p className="field-error" style={{ marginTop: 10 }}>{error}</p> : null}
    </section>
  );
}
