const { Exam } = require('../models');

async function getExams(req, res) {
  try {
    const exams = await Exam.find({ userId: req.user.id })
      .sort({ date: 1 })
      .populate('subject', 'name color teacher')
      .lean();

    return res.json({ exams });
  } catch (error) {
    return res.status(500).json({ error: 'failed to load exams' });
  }
}

async function createExam(req, res) {
  try {
    const exam = await Exam.create({
      ...req.body,
      userId: req.user.id,
    });

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
    // load existing exam to validate business rules (score only after exam date)
    const existing = await Exam.findOne({ _id: req.params.id, userId: req.user.id });
    if (!existing) return res.status(404).json({ error: 'exam not found' });

    // If score is being updated, ensure that the (target) exam date is today or earlier
    if (Object.prototype.hasOwnProperty.call(updates, 'score')) {
      // determine the target date: prefer updated date if provided, otherwise existing date
      const targetDate = updates.date ? new Date(updates.date) : existing.date;
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

    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true },
    );

    return res.json({ exam });
  } catch (error) {
    return res.status(500).json({ error: 'failed to update exam' });
  }
}

async function deleteExam(req, res) {
  try {
    const exam = await Exam.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!exam) {
      return res.status(404).json({ error: 'exam not found' });
    }

    return res.json({ deleted: true, id: String(exam._id) });
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
