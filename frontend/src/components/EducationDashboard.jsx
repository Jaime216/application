import React from 'react';
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

export default function EducationDashboard({ apiUrl, authToken }) {
  const { data, loading, error } = useEducationStats({ apiUrl, authToken });

  const average = data?.globalAverage?.value;
  const averageLabel = typeof average === 'number' ? average.toFixed(2) : '--';
  const exams = data?.upcomingExams || [];
  const urgentTasks = data?.dueTasks || [];

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Education Dashboard</h2>
        <p>Resumen de notas, próximos exámenes y tareas urgentes.</p>
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

          <EducationCalendar tasks={urgentTasks} exams={exams} />
        </>
      )}

      {error ? <p className="field-error" style={{ marginTop: 10 }}>{error}</p> : null}
    </section>
  );
}
