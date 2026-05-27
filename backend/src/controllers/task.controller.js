const {
  listTasks,
  createTask: createTaskRecord,
  updateTask: updateTaskRecord,
  deleteTask: deleteTaskRecord,
} = require('../db');

async function getTasks(req, res) {
  try {
    const tasks = listTasks(req.user.id);

    return res.json({ tasks });
  } catch (error) {
    return res.status(500).json({ error: 'failed to load tasks' });
  }
}

async function createTask(req, res) {
  try {
    const task = createTaskRecord(req.user.id, req.body);

    if (!task) {
      return res.status(400).json({ error: 'failed to create task' });
    }

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
    const task = updateTaskRecord(req.params.id, req.user.id, updates);

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
    const deleted = deleteTaskRecord(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'task not found' });
    }

    return res.json({ deleted: true, id: String(req.params.id) });
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
