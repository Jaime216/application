import React, { useEffect, useState } from 'react';
import CreateExamForm from '../components/CreateExamForm';
import GradesQuickEntry from '../components/GradesQuickEntry';
import ExamHistory from '../components/ExamHistory';

export default function EducationExams({ apiUrl, authToken, currentUser, onBack }) {
  const token = (authToken || '').trim();
  const [exams, setExams] = useState([]);
  const [historyReload, setHistoryReload] = useState(0);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const res = await fetch(`${apiUrl}/education/exams`, { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        if (res.ok) setExams(body.exams || []);
      } catch (e) {}
    }
    load();
  }, [token]);

  return (
    <div className="shell">
      <button onClick={onBack} style={{ marginBottom: 12 }}>← Volver</button>
      <h1>Exámenes</h1>

      <section className="panel">
        <CreateExamForm apiUrl={apiUrl} authToken={token} onCreated={(exam) => setExams((cur) => [exam, ...cur])} />
      </section>

      <section className="panel">
        <GradesQuickEntry
          exams={exams}
          apiUrl={apiUrl}
          authToken={token}
          onSaved={(id, score, moved, source) => {
            if (moved) {
              setExams((cur) => cur.filter((e) => !(e.id === id || e._id === id)));
              if (source === 'score') {
                setHistoryReload((n) => n + 1);
              }
            } else {
              setExams((cur) => cur.map((e) => (e.id === id || e._id === id ? { ...e, score } : e)));
            }
          }}
          onDeleted={(id) => setExams((cur) => cur.filter((e) => !(e.id === id || e._id === id)))}
        />
      </section>

      <ExamHistory apiUrl={apiUrl} authToken={token} limit={20} reload={historyReload} />
    </div>
  );
}
