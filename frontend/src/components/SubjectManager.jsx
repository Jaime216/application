import React, { useEffect, useMemo, useState } from 'react';
import ColorPicker from './ColorPicker';

const defaultApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function buildHeaders(authToken) {
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

const INITIAL_FORM = {
  name: '',
  teacher: '',
  color: '#4f46e5',
};

export default function SubjectManager({
  apiUrl = defaultApiUrl,
  authToken,
  refreshTrigger,
  selectedSubjectId,
}) {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  async function loadSubjects() {
    if (!authToken) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/education/subjects`, {
        headers: buildHeaders(authToken),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || 'No se pudieron cargar las asignaturas');
      }

      setSubjects(payload.subjects || []);
    } catch (loadError) {
      setError(loadError.message || 'Error cargando asignaturas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, [authToken, refreshTrigger]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(subject) {
    setEditingId(subject._id);
    setForm({
      name: subject.name || '',
      teacher: subject.teacher || '',
      color: subject.color || '#4f46e5',
    });
    setFeedback('Editando asignatura');
    setError('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(INITIAL_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedTeacher = form.teacher.trim();

    if (!trimmedName) {
      setError('El nombre es obligatorio');
      return;
    }

    setSubmitting(true);
    setFeedback('');
    setError('');

    try {
      const response = await fetch(
        isEditing ? `${apiUrl}/education/subjects/${editingId}` : `${apiUrl}/education/subjects`,
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: buildHeaders(authToken),
          body: JSON.stringify({
            name: trimmedName,
            teacher: trimmedTeacher || undefined,
            color: form.color,
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || 'No se pudo guardar la asignatura');
      }

      setFeedback(isEditing ? 'Asignatura actualizada' : 'Asignatura creada');
      resetForm();
      await loadSubjects();
    } catch (submitError) {
      setError(submitError.message || 'Error guardando asignatura');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeSubject(subjectId) {
    const confirmed = window.confirm('¿Eliminar esta asignatura?');
    if (!confirmed) return;

    setError('');
    setFeedback('');

    try {
      const response = await fetch(`${apiUrl}/education/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: buildHeaders(authToken),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || 'No se pudo eliminar la asignatura');
      }

      setFeedback('Asignatura eliminada');
      await loadSubjects();
    } catch (removeError) {
      setError(removeError.message || 'Error eliminando asignatura');
    }
  }

  return (
    <div className="subject-manager">
      <form className="subject-form" onSubmit={handleSubmit}>
        <label htmlFor="subject-name">Nombre</label>
        <input
          id="subject-name"
          value={form.name}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="Ej: Matemáticas"
        />

        <label htmlFor="subject-teacher">Profesor</label>
        <input
          id="subject-teacher"
          value={form.teacher}
          onChange={(event) => updateField('teacher', event.target.value)}
          placeholder="Ej: Laura Gómez"
        />

        <label htmlFor="subject-color">Color de etiqueta</label>
        <ColorPicker id="subject-color" value={form.color} onChange={(color) => updateField('color', color)} />

        {error ? <p className="field-error">{error}</p> : null}
        {feedback ? <p className="field-success">{feedback}</p> : null}

        <div className="subject-form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : isEditing ? 'Actualizar asignatura' : 'Crear asignatura'}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={resetForm}
              className="ghost-button"
              disabled={submitting}
            >
              Cancelar edición
            </button>
          ) : null}
        </div>
      </form>

      <div className="subject-list-wrap">
        <div className="subject-list-header">
          <h3>Asignaturas creadas</h3>
          <button type="button" onClick={loadSubjects} disabled={loading}>
            {loading ? 'Cargando...' : 'Refrescar'}
          </button>
        </div>

        {subjects.length === 0 ? (
          <p className="empty">Aún no hay asignaturas.</p>
        ) : (
          <div className="subject-grid">
            {subjects.map((subject) => {
              const isSelected = selectedSubjectId === subject._id;

              return (
                <article key={subject._id} className={`subject-card ${isSelected ? 'selected' : ''}`}>
                  <div className="subject-card-top">
                    <span className="subject-pill" style={{ backgroundColor: subject.color }} />
                    <strong>{subject.name}</strong>
                  </div>
                  <p>{subject.teacher || 'Sin profesor asignado'}</p>
                  <div className="subject-card-actions">
                    <button type="button" onClick={() => startEdit(subject)} className="ghost-button">
                      Editar
                    </button>
                    <button type="button" onClick={() => removeSubject(subject._id)} className="danger-button">
                      Eliminar
                    </button>
                  </div>
                  {isSelected ? <p className="subject-selected-note">Seleccionada para tareas</p> : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
