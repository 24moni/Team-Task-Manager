const express = require('express');
const multer = require('multer');
const path = require('path');
const Task = require('../models/Task');
const { Project } = require('../models/Project');
const User = require('../models/User');
const { ActivityLog, Comment, Attachment } = require('../models/Extras');
const { auth, adminAuth } = require('../middleware/auth');
const sendEmail = require('../utils/email');

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const logActivity = async (action, details, userId, taskId = null) => {
  await ActivityLog.create({ action, details, userId, taskId });
};

router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status, dueDate } = req.body;
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const task = await Task.create({ title, description, projectId, assignedTo, status: status || 'todo', dueDate });
    
    await logActivity('Task Created', `Task "${title}" created`, req.user._id, task._id);

    // Email notification
    if (assignedTo) {
      const user = await User.findByPk(assignedTo);
      if (user) {
        await sendEmail(user.email, 'New Task Assigned', `You have been assigned a new task: ${title}`);
      }
    }

    const io = req.app.get('io');
    if (io) io.emit('taskUpdated');

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const whereClause = projectId ? { projectId } : {};
    const tasks = await Task.findAll({ 
      where: whereClause,
      include: [
        { model: Comment },
        { model: Attachment }
      ]
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, status, assignedTo, dueDate } = req.body;
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    if (status && status !== task.status) {
      await logActivity('Status Changed', `Task status changed from ${task.status} to ${status}`, req.user._id, task._id);
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    
    if (assignedTo !== undefined && assignedTo !== task.assignedTo) {
      task.assignedTo = assignedTo;
      if (assignedTo) {
        const user = await User.findByPk(assignedTo);
        if (user) {
          await sendEmail(user.email, 'Task Re-assigned', `You have been re-assigned to task: ${task.title}`);
        }
      }
    }
    
    await task.save();

    const io = req.app.get('io');
    if (io) io.emit('taskUpdated');

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await logActivity('Task Deleted', `Task "${task.title}" deleted`, req.user._id);
    await task.destroy();

    const io = req.app.get('io');
    if (io) io.emit('taskUpdated');

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comments
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const comment = await Comment.create({
      text: req.body.text,
      userId: req.user._id,
      taskId: req.params.id
    });
    await logActivity('Comment Added', 'Added a comment', req.user._id, req.params.id);

    const io = req.app.get('io');
    if (io) io.emit('taskUpdated');

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Attachments
router.post('/:id/attachments', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const attachment = await Attachment.create({
      filename: req.file.originalname,
      path: req.file.path,
      userId: req.user._id,
      taskId: req.params.id
    });
    await logActivity('File Attached', `Attached file ${req.file.originalname}`, req.user._id, req.params.id);

    const io = req.app.get('io');
    if (io) io.emit('taskUpdated');

    res.status(201).json(attachment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
