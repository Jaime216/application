import React, { useCallback, useEffect, useState } from 'react';

export default function ExamHistory({ apiUrl, authToken, limit = 20, reload }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingExamId, setEditingExamId] = useState('');
  const [drafts, setDrafts] = useState({});
  const [savingExamId, setSavingExamId] = useState('');

  const loadHistory = useCallback(async (mountedRef = { current: true }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/education/exams/history`, { headers: { Authorization: `Bearer ${authToken || ''}` } });
      if (!res.ok) throw new Error('failed');
      const body = await res.json();
      if (!mountedRef.current) return;
      setHistory((body.history || []).slice(0, limit));
    } catch (e) {
      if (!mountedRef.current) return;
      setError('No se pudo cargar el historial');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [apiUrl, authToken, limit]);

  useEffect(() => {
    const mountedRef = { current: true };

    if (authToken) loadHistory(mountedRef);
    return () => { mountedRef.current = false; };
  }, [authToken, loadHistory, reload]);

  function startEdit(item) {
    setEditingExamId(item.examId);
    setDrafts({
      [item.examId]: {
        date: item.date ? String(item.date).slice(0, 10) : '',
        score: item.score ?? '',
      },
    });
  }

  function cancelEdit() {
    setEditingExamId('');
    setDrafts({});
    setSavingExamId('');
  }

  const saveEdit = useCallback(async (item) => {
    const draft = drafts[item.examId] || {};
    const parsedScore = draft.score === '' || draft.score === null || draft.score === undefined
      ? null
      : Number(draft.score);

    if (parsedScore === null || Number.isNaN(parsedScore)) {
      setError('La nota es obligatoria para actualizar un examen ya entregado');
      return;
    }

    setSavingExamId(item.examId);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/education/exams/${item.examId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          date: draft.date || undefined,
          score: parsedScore,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || payload?.error || 'No se pudo actualizar el examen');
      }

      setEditingExamId('');
      setDrafts({});
      await loadHistory({ current: true });
    } catch (err) {
      setError(err.message || 'Error actualizando examen');
    } finally {
      setSavingExamId('');
    }
  }, [apiUrl, authToken, drafts, loadHistory]);

  if (!authToken) return null;

  return (
    <section className="panel" style={{ marginTop: 16 }}>
      <div className="panel-header">
        <h2>Historial de notas</h2>
        <p>Últimas {limit} notas registradas</p>
      </div>

      {loading ? <div>Cargando...</div> : null}
      {error ? <div className="notice error">{error}</div> : null}

      {!loading && !error ? (
        history && history.length > 0 ? (
          <ul className="exam-history-list">
            {history.map((h) => (
              <li
                key={h.id}
                className={`exam-history-item ${editingExamId === h.examId ? 'editing' : 'clickable'}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (editingExamId !== h.examId) startEdit(h);
                }}
                onKeyDown={(event) => {
                  if (editingExamId === h.examId) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    startEdit(h);
                  }
                }}
              >
                <div className="exam-history-main">
                  <strong>{h.subject?.name || 'Asignatura'}</strong>
                  <span>{new Date(h.recordedAt).toLocaleString()}</span>
                  <span>Nota: {h.score}</span>
                </div>

                {editingExamId === h.examId ? (
                  <div className="exam-history-edit">
                    <label>
                      Fecha
                      <input
                        type="date"
                        value={drafts[h.examId]?.date || ''}
                        onChange={(event) => setDrafts((current) => ({
                          ...current,
                          [h.examId]: {
                            ...(current[h.examId] || {}),
                            date: event.target.value,
                          },
                        }))}
                      />
                    </label>
                    <label>
                      Nota
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={drafts[h.examId]?.score ?? ''}
                        onChange={(event) => setDrafts((current) => ({
                          ...current,
                          [h.examId]: {
                            ...(current[h.examId] || {}),
                            score: event.target.value,
                          },
                        }))}
                      />
                    </label>
                    <div className="exam-history-actions">
                      <button type="button" className="subtle-button" onClick={() => saveEdit(h)} disabled={savingExamId === h.examId}>
                        {savingExamId === h.examId ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button type="button" className="subtle-button" onClick={cancelEdit} disabled={savingExamId === h.examId}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">No hay historial de notas.</p>
        )
      ) : null}
    </section>
  );
}
