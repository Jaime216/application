import React from 'react';
import SubjectManager from '../components/SubjectManager';

export default function EducationSubjects({ apiUrl, authToken, currentUser, onBack }) {
  const token = (authToken || '').trim();

  return (
    <div className="shell">
      <button onClick={onBack} style={{ marginBottom: 12 }}>← Volver</button>
      <h1>Asignaturas</h1>
      <section className="panel">
        <SubjectManager apiUrl={apiUrl} authToken={token} />
      </section>
    </div>
  );
}
