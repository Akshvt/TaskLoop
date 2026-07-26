const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  text:    { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedAt: { type: Date, default: Date.now },
});

const TaskSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deadline:    { type: Date, required: true },
  priority:    { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  status: {
    type:    String,
    enum:    ['To Do', 'In Progress', 'Done', 'Blocked'],
    default: 'To Do',
  },
  notes:       [NoteSchema],
  completedAt: { type: Date },
  createdAt:   { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
});

// Pre-save hook — update lastUpdated on every save
TaskSchema.pre('save', function () {
  this.lastUpdated = Date.now();
});

module.exports = mongoose.model('Task', TaskSchema);
