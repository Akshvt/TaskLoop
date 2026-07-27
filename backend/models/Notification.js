const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  task:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  type:      { type: String, enum: ['note_added', 'status_changed', 'task_assigned'], required: true },
  message:   { type: String, required: true },
  isRead:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
