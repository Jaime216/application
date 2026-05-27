const {
  listSubjects,
  createSubject: createSubjectRecord,
  updateSubject: updateSubjectRecord,
  deleteSubject: deleteSubjectRecord,
} = require('../db');

async function getSubjects(req, res) {
  try {
    const subjects = listSubjects(req.user.id);

    return res.json({ subjects });
  } catch (error) {
    return res.status(500).json({ error: 'failed to load subjects' });
  }
}

async function createSubject(req, res) {
  try {
    const subject = createSubjectRecord(req.user.id, req.body);

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
    const subject = updateSubjectRecord(req.params.id, req.user.id, updates);

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
    const deleted = deleteSubjectRecord(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'subject not found' });
    }

    return res.json({ deleted: true, subjectId: req.params.id });
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
