const express = require('express');
const Task = require('../models/Task');
const { Project } = require('../models/Project');
const User = require('../models/User');
const { ActivityLog } = require('../models/Extras');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — aggregated dashboard data
router.get('/', auth, async (req, res) => {
  try {
    const [tasks, projects, users, activities] = await Promise.all([
      Task.findAll(),
      Project.findAll(),
      User.findAll({ attributes: { exclude: ['password'] } }),
      ActivityLog.findAll({
        include: [{ model: User, as: 'user', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: 20,
      }),
    ]);

    // Aggregate task stats
    const tasksByStatus = {
      todo: tasks.filter(t => t.status === 'todo').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };

    // Tasks per project
    const tasksByProject = projects.map(p => ({
      projectId: p._id,
      projectName: p.name,
      taskCount: tasks.filter(t => t.projectId === p._id).length,
    }));

    // Overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;

    res.json({
      tasksByStatus,
      totalTasks: tasks.length,
      projectCount: projects.length,
      teamSize: users.length,
      overdueTasks,
      tasksByProject,
      recentActivity: activities,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
