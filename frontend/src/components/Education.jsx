import React, { useState } from 'react';
import CreateTaskForm from './CreateTaskForm';
import SubjectManager from './SubjectManager';
import EducationDashboard from './EducationDashboard';
import SchoolTaskKanban from './SchoolTaskKanban';
import GradesQuickEntry from './GradesQuickEntry';
import CreateExamForm from './CreateExamForm';

const days = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const periods = ['Mañana','Tarde'];
const slotsPerPeriod = 3;

function emptySchedule() {
  const sched = {};
  days.forEach((day) => {
    sched[day] = {};
    periods.forEach((p) => {
      sched[day][p] = Array.from({ length: slotsPerPeriod }, () => []);
    });
  });
  return sched;
}

export default function Education({ apiUrl, onBack }) {
  const [title, setTitle] = useState('Horario semanal');
  const [schedule, setSchedule] = useState(() => emptySchedule());
  const [newClass, setNewClass] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [schedulesList, setSchedulesList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [viewingScheduleId, setViewingScheduleId] = useState(null);
  const [taskSubjectId, setTaskSubjectId] = useState('');
  const [taskFeedback, setTaskFeedback] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [devTokenLoading, setDevTokenLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [educationError, setEducationError] = useState('');
  const [educationLoading, setEducationLoading] = useState(false);
  const [subjectsRefreshKey, setSubjectsRefreshKey] = useState(0);

  const subjectColorMap = Object.fromEntries(
    [...tasks, ...exams]
      .map((item) => item?.subject)
      .filter((subject) => subject && subject._id)
      .map((subject) => [String(subject._id), subject.color || '#5b728f']),
  );

  async function loadEducationData(tokenOverride) {
    const token = (tokenOverride || authToken).trim();
    if (!token) {
      setEducationError('Añade un JWT para cargar tareas y exámenes');
      return;
    }

    setEducationLoading(true);
    setEducationError('');

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [tasksRes, examsRes] = await Promise.all([
        fetch(`${apiUrl}/education/tasks`, { headers }),
        fetch(`${apiUrl}/education/exams`, { headers }),
      ]);

      const tasksBody = await tasksRes.json().catch(() => ({}));
      const examsBody = await examsRes.json().catch(() => ({}));

      if (!tasksRes.ok) {
        throw new Error(tasksBody?.error?.message || tasksBody?.error || 'No se pudieron cargar las tareas');
      }

      if (!examsRes.ok) {
        throw new Error(examsBody?.error?.message || examsBody?.error || 'No se pudieron cargar los exámenes');
      }

      setTasks(tasksBody.tasks || []);
      setExams(examsBody.exams || []);
    } catch (error) {
      setEducationError(error.message || 'Error cargando datos educativos');
    } finally {
      setEducationLoading(false);
    }
  }

  async function refreshAllData(tokenOverride) {
    setEducationError('');
    const token = (tokenOverride || authToken).trim();

    await Promise.allSettled([
      loadSchedules(),
      loadEducationData(token),
    ]);

    setSubjectsRefreshKey((current) => current + 1);
  }

  async function requestDevToken() {
    setDevTokenLoading(true);
    setEducationError('');

    try {
      const response = await fetch(`${apiUrl}/auth/dev-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '6654f0000000000000000001' }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body?.token) {
        throw new Error(body?.error || 'No se pudo generar token dev');
      }

      setAuthToken(body.token);
      setTaskFeedback('Token dev generado y aplicado en la sesión');
      await refreshAllData(body.token);
    } catch (error) {
      setEducationError(error.message || 'Error generando token dev');
    } finally {
      setDevTokenLoading(false);
    }
  }

  async function loadSchedules() {
    try {
      const res = await fetch(`${apiUrl}/schedules`);
      if (!res.ok) throw new Error('failed');
      const body = await res.json();
      setSchedulesList(body.schedules || []);
    } catch (err) {
      setEducationError('Error al cargar horarios');
    }
  }

  async function editLoad(id) {
    try {
      const res = await fetch(`${apiUrl}/schedules/${id}`);
      if (!res.ok) throw new Error('not found');
      const body = await res.json();
      setTitle(body.schedule.title || 'Horario');
      setSchedule(body.schedule.data || emptySchedule());
      setEditingId(body.schedule.id);
      setViewingScheduleId(null);
      setMessage('Cargando para edición');
    } catch (err) {
      setEducationError('No se pudo cargar para editar');
    }
  }

  async function viewSchedule(id) {
    try {
      const res = await fetch(`${apiUrl}/schedules/${id}`);
      if (!res.ok) throw new Error('not found');
      const body = await res.json();
      setTitle(body.schedule.title || 'Horario');
      setSchedule(body.schedule.data || emptySchedule());
      setEditingId(null);
      setViewingScheduleId(body.schedule.id);
      setMessage('Horario cargado para visualización');
    } catch (err) {
      setEducationError('No se pudo cargar el horario');
    }
  }

  async function removeSchedule(id) {
    if (!confirm('Eliminar horario?')) return;
    try {
      const res = await fetch(`${apiUrl}/schedules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      await loadSchedules();
      setMessage('Horario eliminado');
    } catch (err) {
      setEducationError('Error eliminando');
    }
  }

  function addClass(day, period, slot) {
    const name = newClass.trim();
    if (!name) return;
    setSchedule((s) => {
      const next = JSON.parse(JSON.stringify(s));
      next[day][period][slot].push(name);
      return next;
    });
    setNewClass('');
  }

  function removeClass(day, period, slot, index) {
    setSchedule((s) => {
      const next = JSON.parse(JSON.stringify(s));
      next[day][period][slot].splice(index, 1);
      return next;
    });
  }

  async function submit(ev) {
    ev.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${apiUrl}/schedules/${editingId}` : `${apiUrl}/schedules`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, data: schedule }),
      });

      if (!res.ok) throw new Error('Error guardando');

      const body = await res.json();
      setMessage((editingId ? 'Horario actualizado' : 'Horario guardado') + ' (id: ' + (body.schedule?.id || '?') + ')');
      setEditingId(null);
      setViewingScheduleId(null);
      await loadSchedules();
    } catch (err) {
      setEducationError('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="shell">
      <button onClick={onBack} style={{ marginBottom: 12 }}>← Volver</button>
      <h1>Educación — Crear horario semanal</h1>

      <section className="panel">
        <div className="panel-header">
          <h2>Acceso API Educación</h2>
          <p>Usa el token JWT para consultar dashboard, tareas, exámenes y asignaturas.</p>
        </div>

        <label htmlFor="education-jwt" style={{ display: 'block', marginBottom: 8 }}>JWT Bearer Token</label>
        <input
          id="education-jwt"
          value={authToken}
          onChange={(event) => setAuthToken(event.target.value)}
          placeholder="eyJhbGciOi..."
          style={{ marginBottom: 10 }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={requestDevToken} disabled={devTokenLoading}>
            {devTokenLoading ? 'Generando token...' : 'Generar token dev'}
          </button>

          <button type="button" onClick={() => refreshAllData()} disabled={educationLoading}>
            {educationLoading ? 'Cargando...' : 'Refrescar todo'}
          </button>
        </div>

        {educationError ? <p className="field-error" style={{ marginTop: 10 }}>{educationError}</p> : null}
      </section>

      <EducationDashboard apiUrl={apiUrl} authToken={authToken.trim()} />

      <form onSubmit={submit} className="panel">
        <label style={{ display: 'block', marginBottom: 8 }}>Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={Boolean(viewingScheduleId)} />

        <div style={{ marginTop: 12 }}>
          <label>Añadir clase (nombre)</label>
          <input
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            placeholder="Nombre de la clase"
            disabled={Boolean(viewingScheduleId)}
          />
          <small style={{ color: 'var(--muted)' }}>Escribe el nombre y usa los botones '+' en la casilla destino</small>
        </div>

        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Dia / Periodo</th>
                {periods.map((p) => (
                  <th key={p} colSpan={slotsPerPeriod} style={{ textAlign: 'center' }}>{p}</th>
                ))}
              </tr>
              <tr>
                <th></th>
                {periods.map((p) => Array.from({ length: slotsPerPeriod }).map((_, i) => (
                  <th key={p + i} style={{ textAlign: 'center' }}>Franja {i+1}</th>
                )))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day}>
                  <td style={{ padding: 8, borderTop: '1px solid var(--line)' }}><strong>{day}</strong></td>
                  {periods.map((p) => (
                    schedule[day][p].map((slotArr, slotIdx) => (
                      <td key={p + slotIdx} style={{ padding: 8, verticalAlign: 'top', borderTop: '1px solid var(--line)' }}>
                        <div className="slot-box">
                          {slotArr.length === 0 ? (
                            <div className="empty">vacío</div>
                          ) : (
                            slotArr.map((c, idx) => (
                              <div className="class-item" key={idx}>
                                <span>{c}</span>
                                {!viewingScheduleId ? (
                                  <button type="button" onClick={() => removeClass(day, p, slotIdx, idx)}>x</button>
                                ) : null}
                              </div>
                            ))
                          )}

                          <div style={{ marginTop: 6 }}>
                            {!viewingScheduleId ? (
                              <button type="button" onClick={() => addClass(day, p, slotIdx)}>+ Añadir</button>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    ))
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={saving || Boolean(viewingScheduleId)}>
            {saving ? 'Guardando...' : viewingScheduleId ? 'Solo lectura' : 'Guardar horario'}
          </button>
          <span style={{ marginLeft: 12 }}>{message}</span>
        </div>
      </form>

      <div className="panel" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Horarios guardados</h2>
          <div>
            <button onClick={loadSchedules} style={{ marginRight: 8 }}>Refrescar</button>
            <button onClick={() => { setSchedule(emptySchedule()); setEditingId(null); setViewingScheduleId(null); setTitle('Horario semanal'); }}>Nuevo</button>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          {schedulesList.length === 0 ? (
            <p className="empty">No hay horarios guardados.</p>
          ) : (
            <ul>
              {schedulesList.map((s) => (
                <li key={s.id} style={{ marginBottom: 8 }}>
                  <strong>{s.title}</strong> — id {s.id}
                  <div>
                    <button onClick={() => viewSchedule(s.id)} style={{ marginRight: 8 }}>Ver</button>
                    <button onClick={() => editLoad(s.id)} style={{ marginRight: 8 }}>Editar</button>
                    <button onClick={() => removeSchedule(s.id)}>Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Asignaturas</h2>
          <p>Crea, edita o elimina asignaturas y selecciona una para tareas.</p>
        </div>

        <SubjectManager
          apiUrl={apiUrl}
          authToken={authToken.trim()}
          refreshTrigger={subjectsRefreshKey}
          selectedSubjectId={taskSubjectId}
          onSubjectSelect={(subject) => setTaskSubjectId(subject?._id || '')}
        />
      </section>

      <CreateExamForm
        apiUrl={apiUrl}
        authToken={authToken.trim()}
        subjectId={taskSubjectId}
        onCreated={(exam) => {
          setExams((current) => [exam, ...current]);
        }}
      />

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Tareas del módulo educativo</h2>
          <p>Selecciona o indica un ID de asignatura y crea tareas validadas.</p>
        </div>

        <label htmlFor="task-subject-id" style={{ display: 'block', marginBottom: 8 }}>Subject ID</label>
        <input
          id="task-subject-id"
          value={taskSubjectId}
          onChange={(event) => setTaskSubjectId(event.target.value)}
          placeholder="ObjectId de la asignatura"
          style={{ marginBottom: 8 }}
        />

        {taskFeedback ? <div className="notice">{taskFeedback}</div> : null}

        <CreateTaskForm
          apiUrl={apiUrl}
          authToken={authToken.trim()}
          subjectId={taskSubjectId.trim()}
          onCreated={(task) => {
            setTaskFeedback(`Tarea creada: ${task?.title || 'sin título'}`);
            setTasks((current) => [task, ...current]);
          }}
        />
      </section>

      <SchoolTaskKanban
        tasks={tasks}
        apiUrl={apiUrl}
        authToken={authToken.trim()}
        subjectColorMap={subjectColorMap}
        onTasksChange={setTasks}
      />

      <GradesQuickEntry
        exams={exams}
        apiUrl={apiUrl}
        authToken={authToken.trim()}
        subjectColorMap={subjectColorMap}
        onSaved={(examId, score) => {
          setExams((current) => current.map((exam) => (
            String(exam._id || exam.id) === String(examId)
              ? { ...exam, score }
              : exam
          )));
        }}
        onDeleted={(examId) => {
          setExams((current) => current.filter((exam) => String(exam._id || exam.id) !== String(examId)));
        }}
      />
    </div>
  );
}
