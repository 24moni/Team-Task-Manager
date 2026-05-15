const express = require('express');
const { Project, ProjectMembers } = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['_id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['_id', 'name', 'email'], through: { attributes: [] } }
      ]
    });
    // Format response to match members: [userId] if needed, but returning full object is usually better.
    // Let's map it to match user request
    const formattedProjects = projects.map(p => {
      const pJson = p.toJSON();
      return {
        _id: pJson._id,
        name: pJson.name,
        description: pJson.description,
        createdBy: pJson.createdBy,
        members: pJson.members.map(m => m._id),
        createdAt: pJson.createdAt
      };
    });
    res.json(formattedProjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const project = await Project.create({ name, description, createdBy: req.user._id });
    
    // Add members if provided
    if (members && members.length > 0) {
      await project.addMembers(members);
    }
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    await project.save();

    if (members !== undefined) {
      await project.setMembers(members);
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
