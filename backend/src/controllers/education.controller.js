const { getEducationDashboard: getEducationDashboardData } = require('../db');

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
};
