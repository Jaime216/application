import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const defaultApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function isPastUnscoredExam(exam, now) {
  const examDate = new Date(exam?.date);
  if (Number.isNaN(examDate.getTime())) return false;

  const score = exam?.score;
  return examDate < now && (score === null || score === undefined);
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Fecha invalida';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getSubjectId(exam) {
  if (typeof exam?.subject === 'object') return String(exam.subject?._id || '');
  return String(exam?.subject || '');
}

function getExamId(exam) {
  return String(exam?.id || exam?._id || '');
}

export default function GradesQuickEntry({
  exams = [],
  subjectColorMap = {},
  apiUrl = defaultApiUrl,
  authToken,
  onSaved,
  onDeleted,
}) {
  const [rows, setRows] = useState([]);
  const [draftScores, setDraftScores] = useState({});
  const [dateDrafts, setDateDrafts] = useState({});
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [undoState, setUndoState] = useState(null);
  const deletionTimerRef = useRef(null);

  const pendingExams = useMemo(
    () => (exams || []).filter((exam) => exam?.score === null || exam?.score === undefined),
    [exams],
  );

  useEffect(() => {
    setRows(pendingExams);
    const initialDates = {};
    pendingExams.forEach((exam) => {
      const id = getExamId(exam);
      if (exam?.date) {
        try {
          initialDates[id] = new Date(exam.date).toISOString().slice(0, 10);
        } catch (e) {
          initialDates[id] = '';
        }
      } else {
        initialDates[id] = '';
      }
    });
    setDateDrafts(initialDates);
  }, [exams, pendingExams]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (deletionTimerRef.current) {
        clearTimeout(deletionTimerRef.current);
      }
    };
  }, []);

  const updateDraft = useCallback((examId, value) => {
    setDraftScores((current) => ({
      ...current,
      [examId]: value,
    }));
  }, []);

  const saveGrade = useCallback(async (exam) => {
    const examId = getExamId(exam);
    if (!examId) return;

    setError('');

    const value = draftScores[examId];
    const parsedScore = Number(value);
    const maxScore = Number(exam?.maxScore);

    // determine exam date to validate scoring permission
    const dateStr = dateDrafts[examId] || exam.date;
    const examDate = new Date(dateStr);
    if (Number.isNaN(examDate.getTime())) {
      setError('Fecha de examen inválida');
      return;
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const examDay = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());

    if (today < examDay) {
      setError('No se puede asignar nota antes de la fecha del examen');
      return;
    }

    if (!Number.isFinite(parsedScore)) {
      setError('La nota debe ser numerica');
      return;
    }

    if (parsedScore < 0) {
      setError('La nota no puede ser negativa');
      return;
    }

    if (Number.isFinite(maxScore) && parsedScore > maxScore) {
      setError(`La nota no puede superar la nota maxima (${maxScore})`);
      return;
    }

    setSavingId(examId);

    try {
      const response = await fetch(`${apiUrl}/education/exams/${examId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ score: parsedScore }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'No se pudo guardar la nota');
      }
      const body = await response.json().catch(() => ({}));

      // If backend indicates the exam was moved to completed, remove it.
      if (body.movedToCompleted) {
        setRows((current) => current.filter((row) => getExamId(row) !== examId));
        if (onDeleted) onDeleted(examId);
      } else {
        // Update the exam in-place with returned exam
        if (body.exam) {
          setRows((current) => current.map((row) => (getExamId(row) === examId ? body.exam : row)));
        } else {
          setRows((current) => current.filter((row) => getExamId(row) !== examId));
        }
      }
      setDraftScores((current) => {
        const next = { ...current };
        delete next[examId];
        return next;
      });
      setToast('Nota guardada correctamente');

      if (onSaved) {
        onSaved(examId, parsedScore, body.movedToCompleted === true, 'score');
      }
    } catch (err) {
      setError(err.message || 'Error al guardar la nota');
    } finally {
      setSavingId('');
    }
  }, [apiUrl, draftScores, dateDrafts, authToken, onSaved]);

  const finalizeDeleteExam = useCallback(async (examId, previousRows) => {
    try {
      const response = await fetch(`${apiUrl}/education/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'No se pudo eliminar el examen');
      }

      setDraftScores((current) => {
        const next = { ...current };
        delete next[examId];
        return next;
      });
      setDateDrafts((current) => {
        const next = { ...current };
        delete next[examId];
        return next;
      });
      setToast('Examen eliminado');
      if (onDeleted) onDeleted(examId);
      setUndoState(null);
    } catch (err) {
      setRows(previousRows);
      setError(err.message || 'Error eliminando examen');
      setUndoState(null);
    } finally {
      setSavingId('');
    }
  }, [apiUrl, authToken, onDeleted]);

  const undoDeleteExam = useCallback(() => {
    if (!undoState) return;

    if (deletionTimerRef.current) {
      clearTimeout(deletionTimerRef.current);
    }

    setRows(undoState.previousRows);
    setError('');
    setUndoState(null);
    setSavingId('');
    setToast('Eliminación cancelada');
  }, [undoState]);

  const deleteExam = useCallback((examId) => {
    if (!examId) return;
    if (!window.confirm('¿Eliminar este examen?')) return;

    setError('');
    if (deletionTimerRef.current) {
      clearTimeout(deletionTimerRef.current);
    }

    const previousRows = rows;
    const nextRows = previousRows.filter((exam) => getExamId(exam) !== String(examId));
    setRows(nextRows);
    setSavingId(String(examId));

    setUndoState({
      examId,
      previousRows,
    });

    setToast('Examen enviado a papelera temporal');
    deletionTimerRef.current = setTimeout(() => {
      finalizeDeleteExam(examId, previousRows);
    }, 8000);
  }, [finalizeDeleteExam, rows]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Registro rapido de notas</h2>
        <p>Introduce la nota de examenes pasados pendientes de calificacion.</p>
      </div>

      {undoState ? (
        <div className="mini-toast mini-toast-undo">
          <span>Examen eliminado temporalmente. Puedes deshacer durante 8 segundos.</span>
          <button type="button" className="ghost-button" onClick={undoDeleteExam}>Deshacer</button>
        </div>
      ) : null}

      {toast ? <div className="mini-toast">{toast}</div> : null}
      {error ? <div className="notice error">{error}</div> : null}

      <div className="grades-table-wrap">
        <table className="grades-table">
          <thead>
            <tr>
              <th>Asignatura</th>
              <th>Fecha</th>
              <th>Nota maxima</th>
              <th>Registrar nota</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">No hay examenes pendientes de calificar.</td>
              </tr>
            ) : (
              rows.map((exam) => {
                const examId = getExamId(exam);
                const subjectId = getSubjectId(exam);
                const subjectColor = subjectColorMap[subjectId] || '#5b728f';
                const isSaving = savingId === examId;

                return (
                  <tr key={examId}>
                    <td>
                      <div className="grade-subject-cell">
                        <span className="subject-pill" style={{ backgroundColor: subjectColor }} />
                        <span>{exam?.subject?.name || 'Asignatura'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="grade-date-row">
                        <input
                          type="date"
                          value={dateDrafts[examId] ?? ''}
                          onChange={(e) => setDateDrafts((c) => ({ ...c, [examId]: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            setError('');
                            setSavingId(examId);
                            try {
                              const res = await fetch(`${apiUrl}/education/exams/${examId}`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                                },
                                body: JSON.stringify({ date: dateDrafts[examId] }),
                              });
                              if (!res.ok) {
                                const p = await res.json().catch(() => ({}));
                                throw new Error(p?.error || 'No se pudo guardar la fecha');
                              }
                              const body = await res.json();
                              if (body.movedToCompleted) {
                                setRows((current) => current.filter((r) => getExamId(r) !== examId));
                                if (onDeleted) onDeleted(examId);
                              } else if (body.exam) {
                                setRows((current) => current.map((r) => (getExamId(r) === examId ? body.exam : r)));
                              }
                              setToast('Fecha guardada');
                            } catch (err) {
                              setError(err.message || 'Error guardando fecha');
                            } finally {
                              setSavingId('');
                            }
                          }}
                          disabled={savingId === examId}
                        >Guardar fecha</button>
                      </div>
                    </td>
                    <td>{exam.maxScore ?? '-'}</td>
                    <td>
                      <div className="grade-input-row">
                        <input
                          type="number"
                          min="0"
                          max={exam.maxScore ?? undefined}
                          step="0.01"
                          value={draftScores[examId] ?? ''}
                          onChange={(event) => updateDraft(examId, event.target.value)}
                          onBlur={() => {
                            if (draftScores[examId] !== undefined && draftScores[examId] !== '') {
                              saveGrade(exam);
                            }
                          }}
                          placeholder="Nota"
                          disabled={isSaving}
                        />
                        <button
                          type="button"
                          onClick={() => saveGrade(exam)}
                          disabled={isSaving || draftScores[examId] === undefined || draftScores[examId] === ''}
                        >
                          {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => deleteExam(examId)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
