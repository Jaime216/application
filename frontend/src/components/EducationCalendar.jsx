import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getSubject(examOrTask) {
  if (typeof examOrTask?.subject === 'object') return examOrTask.subject;
  return null;
}

function buildTaskEvent(task) {
  const date = parseDate(task?.dueDate || task?.deadline);
  if (!date) return null;

  const subject = getSubject(task);
  const title = `📝 ${task?.title || 'Tarea'}${subject?.name ? ` · ${subject.name}` : ''}`;

  return {
    id: `task-${task?._id || task?.id || Math.random().toString(36).slice(2)}`,
    title,
    start: date,
    end: date,
    allDay: true,
    type: 'task',
    color: subject?.color || '#4f46e5',
  };
}

function buildExamEvent(exam) {
  const start = parseDate(exam?.date);
  if (!start) return null;

  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const subject = getSubject(exam);
  const title = `📘 Examen${subject?.name ? ` · ${subject.name}` : ''}`;

  return {
    id: `exam-${exam?._id || exam?.id || Math.random().toString(36).slice(2)}`,
    title,
    start,
    end,
    allDay: true,
    type: 'exam',
    color: subject?.color || '#ef4444',
  };
}

export default function EducationCalendar({ tasks = [], exams = [] }) {
  const events = useMemo(() => {
    const taskEvents = tasks.map(buildTaskEvent).filter(Boolean);
    const examEvents = exams.map(buildExamEvent).filter(Boolean);

    return [...taskEvents, ...examEvents];
  }, [tasks, exams]);

  const messages = useMemo(() => ({
    next: 'Sig.',
    previous: 'Ant.',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    noEventsInRange: 'No hay eventos en este rango.',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
  }), []);

  const eventPropGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color,
        borderColor: event.color,
        color: '#fff',
      },
    };
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Calendario educativo</h2>
        <p>Tareas y exámenes en un solo calendario por asignatura.</p>
      </div>

      <div className="education-calendar-wrap">
        <Calendar
          culture="es"
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="month"
          views={['month', 'week', 'agenda']}
          messages={messages}
          eventPropGetter={eventPropGetter}
          popup
        />
      </div>
    </section>
  );
}
