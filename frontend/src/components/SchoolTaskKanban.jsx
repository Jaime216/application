import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const defaultApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const COLUMNS = [
  { key: 'pendiente', title: 'Pendientes' },
  { key: 'en progreso', title: 'En Progreso' },
  { key: 'entregada', title: 'Entregadas' },
];

function normalizeStatus(status) {
  const value = String(status || '').toLowerCase().trim();
  if (value === 'pendiente') return 'pendiente';
  if (value === 'en progreso' || value === 'en_progreso') return 'en progreso';
  if (value === 'entregada' || value === 'completado') return 'entregada';
  return 'pendiente';
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getTaskSubjectId(task) {
  if (!task) return '';
  if (typeof task.subject === 'object') return String(task.subject?._id || '');
  return String(task.subject || '');
}

export default function SchoolTaskKanban({
  tasks = [],
  subjectColorMap = {},
  apiUrl = defaultApiUrl,
  authToken,
  onTasksChange,
}) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [error, setError] = useState('');
  const [undoState, setUndoState] = useState(null);
  const deletionTimerRef = useRef(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    return () => {
      if (deletionTimerRef.current) {
        clearTimeout(deletionTimerRef.current);
      }
    };
  }, []);

  const groupedTasks = useMemo(() => {
    const grouped = {
      pendiente: [],
      'en progreso': [],
      entregada: [],
    };

    localTasks.forEach((task) => {
      const status = normalizeStatus(task.status);
      grouped[status].push({ ...task, status });
    });

    return grouped;
  }, [localTasks]);

  const applyStatusChange = useCallback((sourceTasks, taskId, newStatus) => {
    return sourceTasks.map((task) => {
      if (String(task.id || task._id) !== String(taskId)) return task;
      return { ...task, status: newStatus };
    });
  }, []);

  const updateTaskStatus = useCallback(async (taskId, newStatus) => {
    setError('');
    const normalizedStatus = normalizeStatus(newStatus);

    const previous = localTasks;
    const next = applyStatusChange(previous, taskId, normalizedStatus);

    setLocalTasks(next);
    if (onTasksChange) onTasksChange(next);

    setUpdatingTaskId(taskId);

    try {
      const response = await fetch(`${apiUrl}/education/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ status: normalizedStatus }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'No se pudo actualizar la tarea');
      }

    } catch (err) {
      setLocalTasks(previous);
      if (onTasksChange) onTasksChange(previous);
      setError(err.message || 'Error actualizando estado');
    } finally {
      setUpdatingTaskId(null);
    }
  }, [apiUrl, applyStatusChange, localTasks, onTasksChange]);

  const finalizeDeleteTask = useCallback(async (taskId, previousTasks) => {
    try {
      const response = await fetch(`${apiUrl}/education/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'No se pudo eliminar la tarea');
      }

      setUndoState(null);
    } catch (err) {
      setLocalTasks(previousTasks);
      if (onTasksChange) onTasksChange(previousTasks);
      setError(err.message || 'Error eliminando tarea');
      setUndoState(null);
    } finally {
      setUpdatingTaskId(null);
    }
  }, [apiUrl, authToken, onTasksChange]);

  const undoDeleteTask = useCallback(() => {
    if (!undoState) return;

    if (deletionTimerRef.current) {
      clearTimeout(deletionTimerRef.current);
    }

    setLocalTasks(undoState.previousTasks);
    if (onTasksChange) onTasksChange(undoState.previousTasks);
    setError('');
    setUndoState(null);
    setUpdatingTaskId(null);
  }, [onTasksChange, undoState]);

  const deleteTask = useCallback((taskId) => {
    if (!taskId) return;
    if (!window.confirm('¿Eliminar esta tarea?')) return;

    setError('');
    if (deletionTimerRef.current) {
      clearTimeout(deletionTimerRef.current);
    }

    const previous = localTasks;
    const next = previous.filter((task) => String(task.id || task._id) !== String(taskId));
    setLocalTasks(next);
    if (onTasksChange) onTasksChange(next);
    setUpdatingTaskId(taskId);

    setUndoState({
      kind: 'task',
      taskId,
      previousTasks: previous,
    });

    deletionTimerRef.current = setTimeout(() => {
      finalizeDeleteTask(taskId, previous);
    }, 8000);
  }, [finalizeDeleteTask, localTasks, onTasksChange]);

  // Placeholder listo para integrar drag-and-drop externo si se necesita.
  const onDragEnd = useCallback(({ taskId, destinationStatus }) => {
    if (!taskId || !destinationStatus) return;
    updateTaskStatus(taskId, destinationStatus);
  }, [updateTaskStatus]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Gestor de tareas</h2>
        <p>Organiza tus entregas en un tablero Kanban.</p>
      </div>

      {undoState ? (
        <div className="mini-toast mini-toast-undo">
          <span>Tarea eliminada. Puedes deshacer durante 8 segundos.</span>
          <button type="button" className="ghost-button" onClick={undoDeleteTask}>Deshacer</button>
        </div>
      ) : null}

      {error ? <div className="notice error">{error}</div> : null}

      <div className="kanban-board" data-has-drag-handler={Boolean(onDragEnd)}>
        {COLUMNS.map((column) => (
          <article key={column.key} className="kanban-column">
            <header className="kanban-column-header">
              <h3>{column.title}</h3>
              <span>{groupedTasks[column.key].length}</span>
            </header>

            <div className="kanban-list">
              {groupedTasks[column.key].length === 0 ? (
                <p className="empty">Sin tareas</p>
              ) : (
                groupedTasks[column.key].map((task) => {
                  const taskId = task.id || task._id;
                  const subjectId = getTaskSubjectId(task);
                  const subjectColor = subjectColorMap[subjectId] || '#5b728f';
                  const isUpdating = String(updatingTaskId) === String(taskId);

                  return (
                    <div key={taskId} className="kanban-task-card">
                      <div className="kanban-task-top">
                        <strong>{task.title || 'Tarea sin titulo'}</strong>
                        <span
                          className="subject-pill"
                          style={{ backgroundColor: subjectColor }}
                          title={task.subject?.name || 'Asignatura'}
                        />
                      </div>

                      <p className="kanban-task-meta">Entrega: {formatDate(task.dueDate || task.deadline)}</p>

                      <div className="kanban-actions">
                        <button
                          type="button"
                          disabled={isUpdating || normalizeStatus(task.status) === 'pendiente'}
                          onClick={() => updateTaskStatus(taskId, 'pendiente')}
                        >
                          Pendiente
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating || normalizeStatus(task.status) === 'en progreso'}
                          onClick={() => updateTaskStatus(taskId, 'en progreso')}
                        >
                          En progreso
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating || normalizeStatus(task.status) === 'entregada'}
                          onClick={() => updateTaskStatus(taskId, 'entregada')}
                        >
                          Entregada
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => deleteTask(taskId)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
