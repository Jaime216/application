const { Subject } = require('../models');

async function getSubjects(req, res) {
  try {
    const subjects = await Subject.find({ userId: req.user.id })
      .sort({ name: 1 })
      .lean();

    return res.json({ subjects });
  } catch (error) {
    return res.status(500).json({ error: 'failed to load subjects' });
  }
}

async function createSubject(req, res) {
  try {
    const subject = await Subject.create({
      ...req.body,
      userId: req.user.id,
    });

    return res.status(201).json({ subject });
  } catch (error) {
    return res.status(500).json({ error: 'failed to create subject' });
  }
}

async function patchSubject(req, res) {
  const allowedFields = ['name', 'teacher', 'color'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'no valid fields to update' });
  }

  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!subject) {
      return res.status(404).json({ error: 'subject not found' });
    }

    return res.json({ subject });
  } catch (error) {
    return res.status(500).json({ error: 'failed to update subject' });
  }
}

async function deleteSubject(req, res) {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!subject) {
      return res.status(404).json({ error: 'subject not found' });
    }

    return res.json({ deleted: true, subjectId: subject._id });
  } catch (error) {
    return res.status(500).json({ error: 'failed to delete subject' });
  }
}

module.exports = {
  getSubjects,
  createSubject,
  patchSubject,
  deleteSubject,
};
