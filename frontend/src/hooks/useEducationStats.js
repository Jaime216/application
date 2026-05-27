import { useCallback, useEffect, useState } from 'react';

const defaultApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function normalizeTaskStatus(status) {
  if (!status) return 'pendiente';

  const normalized = String(status).toLowerCase().trim();

  if (normalized === 'pendiente') return 'pendiente';
  if (normalized === 'en_progreso' || normalized === 'en progreso') return 'en progreso';
  if (normalized === 'entregada' || normalized === 'completado') return 'completado';

  return 'pendiente';
}

function extractExamScore(exam) {
  if (!exam || typeof exam !== 'object') return null;

  const candidates = [exam.score, exam.obtainedScore, exam.grade, exam.nota];
  const value = candidates.find((candidate) => typeof candidate === 'number');

  return typeof value === 'number' ? value : null;
}

export default function useEducationStats(options = {}) {
  const {
    apiUrl = defaultApiUrl,
    endpoint = '/education/dashboard',
    autoFetch = true,
    authToken,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEducationStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : undefined,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || 'Error fetching education stats');
      }

      setData(payload);
      return payload;
    } catch (err) {
      setError(err.message || 'Unexpected error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiUrl, endpoint, authToken]);

  useEffect(() => {
    if (autoFetch) {
      fetchEducationStats();
    }
  }, [autoFetch, fetchEducationStats]);

  const getTasksByStatus = useCallback((tasks = []) => {
    const grouped = {
      pendiente: [],
      'en progreso': [],
      completado: [],
    };

    tasks.forEach((task) => {
      const key = normalizeTaskStatus(task?.status);
      grouped[key].push(task);
    });

    return grouped;
  }, []);

  const getSubjectAverage = useCallback((subjectId) => {
    if (!subjectId || !data) return null;

    const exams = data.completedExams || data.exams || data.upcomingExams || [];

    const filtered = exams
      .filter((exam) => {
        const examSubjectId = typeof exam?.subject === 'object' ? exam.subject?._id : exam?.subject;
        return String(examSubjectId) === String(subjectId);
      })
      .map((exam) => extractExamScore(exam))
      .filter((score) => typeof score === 'number');

    if (filtered.length === 0) return null;

    const total = filtered.reduce((acc, score) => acc + score, 0);
    return Number((total / filtered.length).toFixed(2));
  }, [data]);

  return {
    data,
    loading,
    error,
    fetchEducationStats,
    getTasksByStatus,
    getSubjectAverage,
  };
}
