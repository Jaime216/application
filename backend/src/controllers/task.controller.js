const { Task } = require('../models');

async function getTasks(req, res) {
  try {
    const tasks = await Task.find({ userId: req.user.id })
      .sort({ dueDate: 1 })
      .populate('subject', 'name color teacher')
      .lean();

    return res.json({ tasks });
  } catch (error) {
    return res.status(500).json({ error: 'failed to load tasks' });
  }
}

async function createTask(req, res) {
  try {
    const task = await Task.create({
      ...req.body,
      userId: req.user.id,
    });

    return res.status(201).json({ task });
  } catch (error) {
    return res.status(500).json({ error: 'failed to create task' });
  }
}

async function patchTask(req, res) {
  const allowedFields = ['subject', 'dueDate', 'status', 'isProject', 'title', 'description'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'no valid fields to update' });
  }

  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!task) {
      return res.status(404).json({ error: 'task not found' });
    }

    return res.json({ task });
  } catch (error) {
    return res.status(500).json({ error: 'failed to update task' });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ error: 'task not found' });
    }

    return res.json({ deleted: true, id: String(task._id) });
  } catch (error) {
    return res.status(500).json({ error: 'failed to delete task' });
  }
}

module.exports = {
  getTasks,
  createTask,
  patchTask,
  deleteTask,
};
