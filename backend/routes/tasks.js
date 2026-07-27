const router = require('express').Router();
const Task   = require('../models/Task');
const User   = require('../models/User');
const Notification = require('../models/Notification');
const requireAuth    = require('../middleware/requireAuth');
const requireFounder = require('../middleware/requireFounder');
const { sendTaskAssignment, sendTaskCompletion, sendOverdueNotice } = require('../services/emailService');

const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Multer: memory storage, 10 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Configure Cloudinary from CLOUDINARY_URL env var (auto-detected)
// CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

// ─── Helper: full populate chain ─────────────────────────────────────────────
const populateTask = (query) =>
  query
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('notes.addedBy', 'name')
    .populate('comments.author', 'name')
    .populate('attachments.uploadedBy', 'name');

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

    const tasks = await populateTask(Task.find(filter))
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

    const populated = await populateTask(Task.findById(task._id));

    // Send assignment email (non-blocking)
    const employee = await User.findById(assignedTo);
    if (employee) {
      const founder = await User.findById(req.user._id);
      sendTaskAssignment(employee, {
        ...task.toObject(),
        createdByName: founder ? founder.name : 'Your manager',
      });
      // Create notification
      await Notification.create({
        recipient: assignedTo,
        task: task._id,
        type: 'task_assigned',
        message: `You have been assigned a new task: ${title}`
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
      const { title, description, assignedTo, deadline, priority, status, manualProgress } = req.body;
      if (title !== undefined)          task.title          = title;
      if (description !== undefined)    task.description    = description;
      if (assignedTo !== undefined)     task.assignedTo     = assignedTo;
      if (deadline !== undefined)       task.deadline       = deadline;
      if (priority !== undefined)       task.priority       = priority;
      if (status !== undefined)         task.status         = status;
      if (manualProgress !== undefined) task.manualProgress = manualProgress;
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

    // Trigger notification if assignee changes status
    if (req.user.role === 'employee' && task.status !== previousStatus) {
      if (task.createdBy) {
        await Notification.create({
          recipient: task.createdBy,
          task: task._id,
          type: 'status_changed',
          message: `${req.user.name} changed status of "${task.title}" to ${task.status}`
        });
      }
    }

    const populated = await populateTask(Task.findById(task._id));

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

    // Create notification
    if (req.user.role === 'founder') {
      await Notification.create({
        recipient: task.assignedTo,
        task: task._id,
        type: 'note_added',
        message: `A note was added to your task "${task.title}" by the founder`
      });
    } else if (task.createdBy) {
      await Notification.create({
        recipient: task.createdBy,
        task: task._id,
        type: 'note_added',
        message: `${req.user.name} added a note to "${task.title}"`
      });
    }

    const populated = await populateTask(Task.findById(task._id));

    res.json(populated);
  } catch (err) {
    console.error('Add note error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUBTASK ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /api/tasks/:id/subtasks ────────────────────────────────────────────
router.post('/:id/subtasks', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Subtask title is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Permission: founder or assignee
    const isAssignee = task.assignedTo.toString() === req.user._id;
    if (req.user.role !== 'founder' && !isAssignee) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    task.subtasks.push({ title });
    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    res.json(populated);
  } catch (err) {
    console.error('Add subtask error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/tasks/:id/subtasks/:subtaskId ────────────────────────────────
router.patch('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Permission: founder or assignee
    const isAssignee = task.assignedTo.toString() === req.user._id;
    if (req.user.role !== 'founder' && !isAssignee) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    if (req.body.isDone !== undefined) subtask.isDone = req.body.isDone;
    if (req.body.title !== undefined)  subtask.title  = req.body.title;

    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    res.json(populated);
  } catch (err) {
    console.error('Update subtask error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/tasks/:id/subtasks/:subtaskId ───────────────────────────────
router.delete('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Permission: founder or assignee
    const isAssignee = task.assignedTo.toString() === req.user._id;
    if (req.user.role !== 'founder' && !isAssignee) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    task.subtasks.pull({ _id: req.params.subtaskId });
    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    res.json(populated);
  } catch (err) {
    console.error('Delete subtask error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /api/tasks/:id/comments ────────────────────────────────────────────
router.post('/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Permission: founder or assignee
    const isAssignee = task.assignedTo.toString() === req.user._id;
    if (req.user.role !== 'founder' && !isAssignee) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    task.comments.push({
      text,
      author: req.user._id,
    });

    await task.save();

    // Notification — mirror note pattern
    if (req.user.role === 'founder') {
      await Notification.create({
        recipient: task.assignedTo,
        task: task._id,
        type: 'comment_added',
        message: `New comment on your task "${task.title}" by the founder`
      });
    } else if (task.createdBy) {
      await Notification.create({
        recipient: task.createdBy,
        task: task._id,
        type: 'comment_added',
        message: `${req.user.name} commented on "${task.title}"`
      });
    }

    const populated = await populateTask(Task.findById(task._id));
    res.json(populated);
  } catch (err) {
    console.error('Add comment error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/tasks/:id/comments/:commentId ───────────────────────────────
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const comment = task.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Permission: founder or original author
    const isAuthor = comment.author.toString() === req.user._id;
    if (req.user.role !== 'founder' && !isAuthor) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    task.comments.pull({ _id: req.params.commentId });
    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    res.json(populated);
  } catch (err) {
    console.error('Delete comment error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ATTACHMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /api/tasks/:id/attachments ─────────────────────────────────────────
router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Permission: founder or assignee
    const isAssignee = task.assignedTo.toString() === req.user._id;
    if (req.user.role !== 'founder' && !isAssignee) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'taskloop-attachments',
          resource_type: 'auto',
          public_id: `${task._id}_${Date.now()}_${req.file.originalname}`,
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    task.attachments.push({
      fileName:           req.file.originalname,
      fileUrl:            result.secure_url,
      fileType:           req.file.mimetype,
      fileSize:           req.file.size,
      cloudinaryPublicId: result.public_id,
      uploadedBy:         req.user._id,
    });

    await task.save();

    // Notification
    if (req.user.role === 'founder') {
      await Notification.create({
        recipient: task.assignedTo,
        task: task._id,
        type: 'attachment_added',
        message: `A file was attached to your task "${task.title}" by the founder`
      });
    } else if (task.createdBy) {
      await Notification.create({
        recipient: task.createdBy,
        task: task._id,
        type: 'attachment_added',
        message: `${req.user.name} attached a file to "${task.title}"`
      });
    }

    const populated = await populateTask(Task.findById(task._id));
    res.json(populated);
  } catch (err) {
    console.error('Upload attachment error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/tasks/:id/attachments/:attachmentId ─────────────────────────
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Permission: founder or original uploader
    const isUploader = attachment.uploadedBy.toString() === req.user._id;
    if (req.user.role !== 'founder' && !isUploader) {
      return res.status(403).json({ error: 'Not authorized to delete this attachment' });
    }

    // Delete from Cloudinary
    if (attachment.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(attachment.cloudinaryPublicId, { resource_type: 'raw' });
      } catch (cloudErr) {
        console.error('Cloudinary delete error (non-blocking):', cloudErr.message);
      }
    }

    task.attachments.pull({ _id: req.params.attachmentId });
    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    res.json(populated);
  } catch (err) {
    console.error('Delete attachment error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/tasks/:id/remind ──────────────────────────────────────────────
router.post('/:id/remind', requireFounder, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedTo');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (!task.assignedTo) {
      return res.status(400).json({ error: 'Task has no assignee' });
    }

    await sendOverdueNotice(task.assignedTo, task);
    res.json({ message: 'Reminder sent' });
  } catch (err) {
    console.error('Send reminder error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
