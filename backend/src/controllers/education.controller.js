const { getEducationDashboard: getEducationDashboardData } = require('../db');

const { getEducationMetrics: getEducationMetricsData, getSubjectStats: getSubjectStatsData } = require('../db');

async function getEducationDashboard(req, res) {
  try {
    const data = getEducationDashboardData(req.user.id);

    return res.json({
      upcomingExams: data.upcomingExams,
      dueTasks: data.dueTasks,
      globalAverage: data.globalAverage,
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'EDUCATION_DASHBOARD_ERROR',
        message: 'No se pudo construir el dashboard educativo',
      },
    });
  }
}

module.exports = {
  getEducationDashboard,
  getEducationMetrics: async function getEducationMetrics(req, res) {
    try {
      const data = getEducationMetricsData(req.user.id);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: { code: 'EDUCATION_METRICS_ERROR', message: 'No se pudieron obtener métricas' } });
    }
  },
  getSubjectStats: async function getSubjectStats(req, res) {
    try {
      const stats = getSubjectStatsData(req.params.id, req.user.id);
      if (!stats) return res.status(404).json({ error: { code: 'SUBJECT_NOT_FOUND', message: 'Asignatura no encontrada' } });
      return res.json(stats);
    } catch (err) {
      return res.status(500).json({ error: { code: 'SUBJECT_STATS_ERROR', message: 'No se pudieron obtener estadísticas' } });
    }
  },
};
