const {
  listExams,
  createExam: createExamRecord,
  getExam: getExamRecord,
  updateExam: updateExamRecord,
  deleteExam: deleteExamRecord,
} = require('../db');

async function getExams(req, res) {
  try {
    const exams = listExams(req.user.id);

    return res.json({ exams });
  } catch (error) {
    return res.status(500).json({ error: 'failed to load exams' });
  }
}

async function createExam(req, res) {
  try {
    const exam = createExamRecord(req.user.id, req.body);

    if (!exam) {
      return res.status(400).json({ error: 'failed to create exam' });
    }

    return res.status(201).json({ exam });
  } catch (error) {
    return res.status(500).json({ error: 'failed to create exam' });
  }
}

async function patchExam(req, res) {
  const allowedFields = ['subject', 'date', 'maxScore', 'score'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'no valid fields to update' });
  }

  try {
    const existing = getExamRecord(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'exam not found' });

    // If score is being updated, ensure that the (target) exam date is today or earlier
    if (Object.prototype.hasOwnProperty.call(updates, 'score')) {
      // determine the target date: prefer updated date if provided, otherwise existing date
      const targetDate = updates.date ? new Date(updates.date) : new Date(existing.date);
      if (Number.isNaN(new Date(targetDate).getTime())) {
        return res.status(400).json({ error: 'fecha de examen inválida' });
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const examDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

      if (today < examDay) {
        return res.status(400).json({ error: 'no se puede asignar la nota antes de la fecha del examen' });
      }
    }

    const exam = updateExamRecord(req.params.id, req.user.id, updates);

    if (!exam) {
      return res.status(404).json({ error: 'exam not found' });
    }

    return res.json({ exam });
  } catch (error) {
    return res.status(500).json({ error: 'failed to update exam' });
  }
}

async function deleteExam(req, res) {
  try {
    const deleted = deleteExamRecord(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'exam not found' });
    }

    return res.json({ deleted: true, id: String(req.params.id) });
  } catch (error) {
    return res.status(500).json({ error: 'failed to delete exam' });
  }
}

module.exports = {
  getExams,
  createExam,
  patchExam,
  deleteExam,
};
