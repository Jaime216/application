const { Exam, Task } = require('../models');

async function getEducationDashboard(req, res) {
  const userId = req.user.id;
  const now = new Date();
  const next7Days = new Date(now);
  next7Days.setDate(next7Days.getDate() + 7);

  try {
    const [upcomingExams, dueTasks, averageResult] = await Promise.all([
      Exam.find({ userId, date: { $gte: now } })
        .sort({ date: 1 })
        .limit(3)
        .populate('subject', 'name color teacher')
        .lean(),

      Task.find({
        userId,
        dueDate: { $gte: now, $lte: next7Days },
        status: { $in: ['pendiente', 'en_progreso', 'en progreso'] },
      })
        .sort({ dueDate: 1 })
        .populate('subject', 'name color teacher')
        .lean(),

      Exam.aggregate([
        {
          $match: {
            userId,
            date: { $lte: now },
            score: { $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$score' },
            totalCompleted: { $sum: 1 },
          },
        },
      ]),
    ]);

    const average = averageResult[0]
      ? {
          value: Number(averageResult[0].averageScore.toFixed(2)),
          totalCompleted: averageResult[0].totalCompleted,
        }
      : {
          value: null,
          totalCompleted: 0,
        };

    return res.json({
      upcomingExams,
      dueTasks,
      globalAverage: average,
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
