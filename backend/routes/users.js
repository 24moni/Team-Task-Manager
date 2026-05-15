const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    // FIX: Sequelize hamesha 'id' use karta hai. req.user._id ko check karein.
    const currentId = req.user.id || req.user._id;
    const user = await User.findByPk(currentId, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE User Route
router.delete('/:id', auth, async (req, res) => {
  try {
    // DEBUG: Terminal mein check karne ke liye ki request aa rahi hai
    console.log("Attempting to delete user with ID:", req.params.id);

    // 1. Admin Check (Case-insensitive)
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Sirf Admin hi members ko hata sakta hai' });
    }

    // 2. Database mein user dhoondein
    const userToDelete = await User.findByPk(req.params.id);
    
    if (!userToDelete) {
      return res.status(404).json({ error: 'User database mein nahi mila' });
    }

    // 3. Security: Admin khud ko delete na kare
    const currentId = req.user.id || req.user._id;
    if (String(currentId) === String(userToDelete.id)) {
      return res.status(400).json({ error: 'Aap khud ki ID delete nahi kar sakte' });
    }

    // 4. Final Deletion
    await userToDelete.destroy();
    
    console.log("User deleted successfully!");
    res.json({ message: 'User successfully removed' });

  } catch (error) {
    console.error("Delete route error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;