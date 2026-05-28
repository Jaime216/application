import React, { useEffect, useState } from 'react';

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

function formatClassEntry(entry) {
  if (typeof entry === 'string') return { name: entry, classroom: '' };
  if (!entry || typeof entry !== 'object') return { name: 'Clase', classroom: '' };
  return { name: String(entry.name || entry.title || 'Clase'), classroom: String(entry.classroom || '') };
}

function normalizeScheduleData(rawSchedule) {
  const normalized = emptySchedule();
  if (!rawSchedule || typeof rawSchedule !== 'object') return normalized;
  days.forEach((day) => {
    const dayData = rawSchedule[day];
    if (!dayData || typeof dayData !== 'object') return;
    periods.forEach((period) => {
      const periodSlots = dayData[period];
      if (!Array.isArray(periodSlots)) return;
      normalized[day][period] = periodSlots.map((slot) => {
        if (!Array.isArray(slot)) return [];
        return slot.map((entry) => formatClassEntry(entry));
      });
    });
  });
  return normalized;
}

export default function EducationSchedule({ apiUrl, authToken, currentUser, onBack }) {
  const [title, setTitle] = useState('Horario semanal');
  const [schedule, setSchedule] = useState(() => emptySchedule());
  const [schedulesList, setSchedulesList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [viewingScheduleId, setViewingScheduleId] = useState(null);
  const [newClass, setNewClass] = useState('');
  const [newClassroom, setNewClassroom] = useState('');
  const [saving, setSaving] = useState(false);
  const token = (authToken || '').trim();
  const isReadOnlyView = Boolean(viewingScheduleId && !editingId);

  async function loadSchedules() {
    try {
      const res = await fetch(`${apiUrl}/schedules`);
      const body = await res.json();
      setSchedulesList(body.schedules || []);
    } catch (err) {
      // ignore
    }
  }

  async function submit(ev) {
    ev.preventDefault();
    if (isReadOnlyView) {
      return;
    }
    setSaving(true);
    try {
      const normalized = normalizeScheduleData(schedule);
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${apiUrl}/schedules/${editingId}` : `${apiUrl}/schedules`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, data: normalized }) });
      if (!res.ok) throw new Error('failed');
      await loadSchedules();
      setEditingId(null);
      setViewingScheduleId(null);
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function viewSchedule(id) {
    try {
      const res = await fetch(`${apiUrl}/schedules/${id}`);
      if (!res.ok) throw new Error('not found');
      const body = await res.json();
      setTitle(body.schedule.title || 'Horario');
      setSchedule(normalizeScheduleData(body.schedule.data));
      setViewingScheduleId(body.schedule.id);
      setEditingId(null);
    } catch (e) {}
  }

  async function editLoad(id) {
    try {
      const res = await fetch(`${apiUrl}/schedules/${id}`);
      if (!res.ok) throw new Error('not found');
      const body = await res.json();
      setTitle(body.schedule.title || 'Horario');
      setSchedule(normalizeScheduleData(body.schedule.data));
      setEditingId(body.schedule.id);
      setViewingScheduleId(null);
    } catch (e) {}
  }

  useEffect(() => { loadSchedules(); }, []);

  function addClass(day, period, slot) {
    const name = newClass.trim();
    if (!name) return;
    setSchedule((s) => {
      const next = JSON.parse(JSON.stringify(s));
      next[day][period][slot].push({ name, classroom: newClassroom.trim() });
      return next;
    });
    setNewClass(''); setNewClassroom('');
  }

  function removeClass(day, period, slot, index) {
    setSchedule((s) => {
      const next = JSON.parse(JSON.stringify(s));
      next[day][period][slot].splice(index, 1);
      return next;
    });
  }

  return (
    <div className="shell">
      <button onClick={onBack} style={{ marginBottom: 12 }}>← Volver</button>
      <h1>Horario</h1>
      
      <form onSubmit={submit} className="panel schedule-panel">
        <label>Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={isReadOnlyView} />

        <div style={{ marginTop: 12 }}>
          <input placeholder="Nombre de clase" value={newClass} onChange={(e) => setNewClass(e.target.value)} disabled={isReadOnlyView} />
          <input placeholder="Aula" value={newClassroom} onChange={(e) => setNewClassroom(e.target.value)} disabled={isReadOnlyView} />
        </div>

        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table className="schedule-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0.65rem' }}>
            <thead>
              <tr>
                <th>Dia / Periodo</th>
                {periods.map((p) => (
                  <th key={p} colSpan={slotsPerPeriod} style={{ textAlign: 'center' }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day}>
                  <td><strong>{day}</strong></td>
                  {periods.map((p) => (
                    schedule[day][p].map((slotArr, slotIdx) => (
                      <td key={p + slotIdx} style={{ padding: 8, verticalAlign: 'top' }}>
                        {slotArr.map((c, idx) => (
                          <div key={idx} className="class-item">
                            <div className="class-item-content">
                              <span className="class-item-name">{c.name}</span>
                              {c.classroom ? <span className="class-item-classroom">{c.classroom}</span> : null}
                            </div>
                            {!viewingScheduleId ? <button type="button" className="schedule-inline-button schedule-remove-button" onClick={() => removeClass(day, p, slotIdx, idx)}>x</button> : null}
                          </div>
                        ))}
                        <div style={{ marginTop: 6 }}>
                          {!viewingScheduleId ? <button type="button" className="schedule-inline-button schedule-add-button" onClick={() => addClass(day, p, slotIdx)}>+ Añadir</button> : null}
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
          {isReadOnlyView ? (
            <button
              type="button"
              className="schedule-save-button"
              onClick={() => {
                setEditingId(viewingScheduleId);
                setViewingScheduleId(null);
              }}
            >
              Activar edición
            </button>
          ) : (
            <button type="submit" className="schedule-save-button" disabled={saving}>{saving ? 'Guardando...' : 'Guardar horario'}</button>
          )}
        </div>
      </form>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Horarios guardados</h2>
        {schedulesList.length === 0 ? <p className="empty">No hay horarios.</p> : (
          <ul>{schedulesList.map((s) => (
            <li key={s.id}><strong>{s.title}</strong> — id {s.id}
              <div>
                <button type="button" className="subtle-button schedule-row-button" onClick={() => viewSchedule(s.id)}>Ver</button>
                <button type="button" className="subtle-button schedule-row-button" onClick={() => editLoad(s.id)}>Editar</button>
              </div>
            </li>
          ))}</ul>
        )}
      </div>
    </div>
  );
}
