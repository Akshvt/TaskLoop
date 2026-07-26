const router = require('express').Router();
const Task   = require('../models/Task');
const User   = require('../models/User');
const requireAuth    = require('../middleware/requireAuth');
const requireFounder = require('../middleware/requireFounder');
const { sendTaskAssignment, sendTaskCompletion } = require('../services/emailService');

// All task routes require auth
router.use(requireAuth);

// ─── GET /api/tasks/overdue ──────────────────────────────────────────────────
// Must be defined BEFORE /:id routes
router.get('/overdue', async (req, res) => {
  try {
    const tasks = await Task.find({
      deadline: { $lt: new Date() },
      status:   { $ne: 'Done' },
    }).populate('assignedTo', 'name email');

    res.json(tasks);
  } catch (err) {
    console.error('Get overdue error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/tasks/due-soon ─────────────────────────────────────────────────
router.get('/due-soon', async (req, res) => {
  try {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const tasks = await Task.find({
      deadline: { $gte: now, $lte: in48h },
      status:   { $ne: 'Done' },
    }).populate('assignedTo', 'name email');

    res.json(tasks);
  } catch (err) {
    console.error('Get due-soon error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/tasks ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};

    // Employee sees only their own tasks
    if (req.user.role !== 'founder') {
      filter.assignedTo = req.user._id;
    }

    // Optional query filters
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.status)     filter.status     = req.query.status;
    if (req.query.priority)   filter.priority   = req.query.priority;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('notes.addedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/tasks ─────────────────────────────────────────────────────────
router.post('/', requireFounder, async (req, res) => {
  try {
    const { title, description, assignedTo, deadline, priority } = req.body;

    if (!title || !assignedTo || !deadline) {
      return res.status(400).json({ error: 'Title, assignedTo, and deadline are required' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      assignedTo,
      createdBy: req.user._id,
      deadline,
      priority: priority || 'Medium',
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    // Send assignment email (non-blocking)
    const employee = await User.findById(assignedTo);
    if (employee) {
      const founder = await User.findById(req.user._id);
      sendTaskAssignment(employee, {
        ...task.toObject(),
        createdByName: founder ? founder.name : 'Your manager',
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/tasks/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const previousStatus = task.status;

    if (req.user.role === 'founder') {
      // Founder can edit anything
      const { title, description, assignedTo, deadline, priority, status } = req.body;
      if (title !== undefined)       task.title       = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined)  task.assignedTo  = assignedTo;
      if (deadline !== undefined)    task.deadline    = deadline;
      if (priority !== undefined)    task.priority    = priority;
      if (status !== undefined)      task.status      = status;
    } else {
      // Employee can only update status
      if (req.body.status !== undefined) {
        task.status = req.body.status;
      }
    }

    // If status changed to Done, record completion time
    if (task.status === 'Done' && previousStatus !== 'Done') {
      task.completedAt = Date.now();
    } else if (task.status !== 'Done') {
      task.completedAt = undefined; // clear it if moved out of Done
    }

    await task.save(); // pre-save hook updates lastUpdated

    // If status just changed to Done, email the founder
    if (task.status === 'Done' && previousStatus !== 'Done') {
      const founder  = await User.findOne({ email: process.env.FOUNDER_EMAIL });
      const employee = await User.findById(req.user._id);
      if (founder && employee) {
        sendTaskCompletion(founder, task, employee);
      }
    }

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('notes.addedBy', 'name');

    res.json(populated);
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/tasks/:id ───────────────────────────────────────────────────
router.delete('/:id', requireFounder, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/tasks/:id/notes ───────────────────────────────────────────────
router.post('/:id/notes', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Note text is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.notes.push({
      text,
      addedBy: req.user._id,
      addedAt: Date.now(),
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('notes.addedBy', 'name');

    res.json(populated);
  } catch (err) {
    console.error('Add note error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
