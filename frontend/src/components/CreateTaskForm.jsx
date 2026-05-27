import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const defaultApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const createTaskFormSchema = z.object({
  title: z.string().trim().min(3, 'El título es muy corto'),
  dueDate: z.string().refine((value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed >= startOfToday();
  }, 'La fecha es inválida'),
  description: z.string().optional(),
  isProject: z.boolean().optional(),
});

export default function CreateTaskForm({
  subjectId,
  apiUrl = defaultApiUrl,
  authToken,
  onCreated,
}) {
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const defaultValues = useMemo(() => ({
    title: '',
    dueDate: '',
    description: '',
    isProject: false,
  }), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm({
    resolver: zodResolver(createTaskFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues,
  });

  async function onSubmit(values) {
    setSubmitError('');
    setSuccessMsg('');

    if (!subjectId) {
      setSubmitError('No hay asignatura seleccionada para crear la tarea');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/education/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          subject: subjectId,
          title: values.title.trim(),
          dueDate: values.dueDate,
          description: values.description?.trim() || undefined,
          isProject: Boolean(values.isProject),
          status: 'pendiente',
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || 'No se pudo crear la tarea');
      }

      setSuccessMsg('Tarea creada correctamente');
      reset(defaultValues);

      if (onCreated) {
        onCreated(payload.task);
      }
    } catch (error) {
      setSubmitError(error.message || 'Error inesperado al crear la tarea');
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Nueva tarea</h2>
        <p>Completa los campos para registrar una tarea.</p>
      </div>

      <form className="create-task-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="task-title">Título</label>
        <input id="task-title" type="text" placeholder="Ej: Resolver tema 3" {...register('title')} />
        {errors.title ? <p className="field-error">{errors.title.message}</p> : null}

        <label htmlFor="task-due-date">Fecha de entrega</label>
        <input id="task-due-date" type="date" {...register('dueDate')} />
        {errors.dueDate ? <p className="field-error">{errors.dueDate.message}</p> : null}

        <label htmlFor="task-description">Descripción (opcional)</label>
        <input id="task-description" type="text" placeholder="Detalles de la tarea" {...register('description')} />

        <label className="checkbox-row" htmlFor="task-is-project">
          <input id="task-is-project" type="checkbox" {...register('isProject')} />
          <span>Es un proyecto grande</span>
        </label>

        {submitError ? <p className="field-error">{submitError}</p> : null}
        {successMsg ? <p className="field-success">{successMsg}</p> : null}

        <button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar tarea'}
        </button>
      </form>
    </section>
  );
}
