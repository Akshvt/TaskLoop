const router = require('express').Router();
const User   = require('../models/User');
const requireAuth    = require('../middleware/requireAuth');
const requireFounder = require('../middleware/requireFounder');

// GET /api/users — founder only, returns all employees (name + email)
router.get('/', requireAuth, requireFounder, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('name email');
    res.json(employees);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
