const router       = require('express').Router();
const Announcement = require('../models/Announcement');
const requireAuth    = require('../middleware/requireAuth');
const requireFounder = require('../middleware/requireFounder');

// All announcement routes require auth
router.use(requireAuth);

// GET /api/announcements — all roles, newest first
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    console.error('Get announcements error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/announcements — founder only
router.post('/', requireFounder, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const announcement = await Announcement.create({
      title,
      body,
      createdBy: req.user._id,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Create announcement error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/announcements/:id — founder only
router.delete('/:id', requireFounder, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('Delete announcement error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
