import { useEffect, useState } from 'react';

export default function CreateExamForm({ apiUrl, authToken, subjectId = '', onCreated }) {
  const [subject, setSubject] = useState(subjectId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [maxScore, setMaxScore] = useState('');
  const [score, setScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setSubject(subjectId || '');
  }, [subjectId]);

  useEffect(() => {
    async function loadSubjects() {
      if (!authToken) {
        setSubjects([]);
        return;
      }

      setLoadingSubjects(true);
      try {
        const res = await fetch(`${apiUrl}/education/subjects`, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error?.message || body?.error || 'No se pudieron cargar asignaturas');
        }

        setSubjects(body.subjects || []);
      } catch (err) {
        setError(err.message || 'Error cargando asignaturas');
      } finally {
        setLoadingSubjects(false);
      }
    }

    loadSubjects();
  }, [apiUrl, authToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!subject || !subject.trim()) {
      setError('Subject id is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        subject: subject.trim(),
        date: new Date(date).toISOString(),
      };

      if (maxScore !== '') payload.maxScore = Number(maxScore);
      if (score !== '') payload.score = Number(score);

      const res = await fetch(`${apiUrl}/education/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message || body?.error || 'Failed creating exam');
      }

      setMessage('Examen creado');
      setSubject('');
      setMaxScore('');
      setScore('');

      if (onCreated) onCreated(body.exam);
    } catch (err) {
      setError(err.message || 'Error creating exam');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel" style={{ marginTop: 12 }}>
      <div className="panel-header">
        <h2>Crear examen</h2>
        <p>Crea un examen nuevo para una asignatura (usa el Subject ID).</p>
      </div>

      {message ? <div className="notice">{message}</div> : null}
      {error ? <div className="notice error">{error}</div> : null}

      <label>Asignatura</label>
      <select
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        disabled={loadingSubjects}
      >
        <option value="">{loadingSubjects ? 'Cargando asignaturas...' : 'Selecciona una asignatura'}</option>
        {subjects.map((item) => (
          <option key={item._id} value={item._id}>
            {item.name}{item.teacher ? ` - ${item.teacher}` : ''}
          </option>
        ))}
      </select>

      <label>Subject ID (manual, opcional)</label>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="ObjectId de la asignatura" />

      <label>Fecha</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <label>Nota máxima (opcional)</label>
      <input type="number" min="0" step="0.01" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />

      <label>Nota inicial (opcional)</label>
      <input type="number" min="0" step="0.01" value={score} onChange={(e) => setScore(e.target.value)} />

      <div style={{ marginTop: 8 }}>
        <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear examen'}</button>
      </div>
    </form>
  );
}
