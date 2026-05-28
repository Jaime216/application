import React, { useEffect, useState } from 'react';
import EducationDashboard from '../components/EducationDashboard';
import EducationSchedule from './EducationSchedule';
import EducationTasks from './EducationTasks';
import EducationExams from './EducationExams';
import EducationSubjects from './EducationSubjects';

export default function EducationHub({ apiUrl, authToken, currentUser, onBack, onLogout }) {
  const [subView, setSubView] = useState('home');
  useEffect(() => {}, [authToken, subView]);

  if (subView === 'schedule') {
    return <EducationSchedule apiUrl={apiUrl} authToken={authToken} currentUser={currentUser} onBack={() => setSubView('home')} />;
  }

  if (subView === 'tasks') {
    return <EducationTasks apiUrl={apiUrl} authToken={authToken} currentUser={currentUser} onBack={() => setSubView('home')} />;
  }

  if (subView === 'exams') {
    return <EducationExams apiUrl={apiUrl} authToken={authToken} currentUser={currentUser} onBack={() => setSubView('home')} />;
  }

  if (subView === 'subjects') {
    return <EducationSubjects apiUrl={apiUrl} authToken={authToken} currentUser={currentUser} onBack={() => setSubView('home')} />;
  }

  return (
    <div className="shell">
      <button onClick={onBack} style={{ marginBottom: 12 }}>← Volver</button>
      <h1>Módulo Educación</h1>

      <div className="education-hub-dashboard">
        <EducationDashboard apiUrl={apiUrl} authToken={authToken} />
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="education-hub-modules">
          <div className="module-card" onClick={() => setSubView('schedule')}>
            <h3>Horario</h3>
            <p>Ver y editar horarios semanales</p>
          </div>
          <div className="module-card" onClick={() => setSubView('tasks')}>
            <h3>Tareas</h3>
            <p>Kanban y creación rápida</p>
          </div>
          <div className="module-card" onClick={() => setSubView('exams')}>
            <h3>Exámenes</h3>
            <p>Calendario, creación y notas</p>
          </div>
          <div className="module-card" onClick={() => setSubView('subjects')}>
            <h3>Asignaturas</h3>
            <p>Crear y gestionar asignaturas</p>
          </div>
        </div>
      </section>

      <div style={{ marginTop: 16 }}>
        <button onClick={onLogout} className="ghost-button">Cerrar sesión</button>
      </div>
    </div>
  );
}
