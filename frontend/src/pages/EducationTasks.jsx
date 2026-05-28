import React from 'react';
import CreateTaskForm from '../components/CreateTaskForm';
import SchoolTaskKanban from '../components/SchoolTaskKanban';

export default function EducationTasks({ apiUrl, authToken, currentUser, onBack }) {
  const token = (authToken || '').trim();
  const [tasks, setTasks] = React.useState([]);
  const [subjects, setSubjects] = React.useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState('');
  const [loadingSubjects, setLoadingSubjects] = React.useState(false);
  const [subjectError, setSubjectError] = React.useState('');

  React.useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const res = await fetch(`${apiUrl}/education/tasks`, { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        if (res.ok) setTasks(body.tasks || []);
      } catch (e) {
        // ignore
      }
    }
    load();
  }, [token]);

  React.useEffect(() => {
    async function loadSubjects() {
      if (!token) return;

      setLoadingSubjects(true);
      setSubjectError('');
      try {
        const res = await fetch(`${apiUrl}/education/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(body?.error?.message || body?.error || 'No se pudieron cargar las asignaturas');
        }

        const nextSubjects = body.subjects || [];
        setSubjects(nextSubjects);
        setSelectedSubjectId((current) => {
          if (current && nextSubjects.some((subject) => subject._id === current)) return current;
          return nextSubjects[0]?._id || '';
        });
      } catch (err) {
        setSubjects([]);
        setSelectedSubjectId('');
        setSubjectError(err.message || 'Error cargando asignaturas');
      } finally {
        setLoadingSubjects(false);
      }
    }

    loadSubjects();
  }, [apiUrl, token]);

  return (
    <div className="shell">
      <button onClick={onBack} style={{ marginBottom: 12 }}>← Volver</button>
      <h1>Tareas</h1>

      <section className="panel">
        <div className="panel-header">
          <h2>Asignatura para la tarea</h2>
          <p>Selecciona una asignatura antes de crear tareas.</p>
        </div>

        {subjectError ? <div className="notice error">{subjectError}</div> : null}

        <div className="subject-picker-panel">
          <label htmlFor="task-subject-picker">Asignatura</label>
          <select
            id="task-subject-picker"
            className="subject-picker-select"
            value={selectedSubjectId}
            onChange={(event) => setSelectedSubjectId(event.target.value)}
            disabled={loadingSubjects || subjects.length === 0}
          >
            <option value="">
              {loadingSubjects
                ? 'Cargando asignaturas...'
                : subjects.length === 0
                  ? 'No hay asignaturas disponibles'
                  : 'Selecciona una asignatura'}
            </option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}{subject.teacher ? ` - ${subject.teacher}` : ''}
              </option>
            ))}
          </select>
        </div>

        <CreateTaskForm
          apiUrl={apiUrl}
          authToken={token}
          subjectId={selectedSubjectId}
          onCreated={(t) => setTasks((cur) => [t, ...cur])}
        />
      </section>

      <section className="panel">
        <SchoolTaskKanban tasks={tasks} apiUrl={apiUrl} authToken={token} onTasksChange={setTasks} />
      </section>
    </div>
  );
}
