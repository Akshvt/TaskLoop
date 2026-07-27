const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  text:    { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedAt: { type: Date, default: Date.now },
});

const SubtaskSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  isDone:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const AttachmentSchema = new mongoose.Schema({
  fileName:           { type: String, required: true },
  fileUrl:            { type: String, required: true },
  fileType:           { type: String },
  fileSize:           { type: Number },
  cloudinaryPublicId: { type: String },
  uploadedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt:         { type: Date, default: Date.now },
});

const CommentSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
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
  notes:          [NoteSchema],
  subtasks:       [SubtaskSchema],
  attachments:    [AttachmentSchema],
  comments:       [CommentSchema],
  manualProgress: { type: Number, default: 0, min: 0, max: 100 },
  completedAt:    { type: Date },
  createdAt:      { type: Date, default: Date.now },
  lastUpdated:    { type: Date, default: Date.now },
});

// Virtual: computed progress
TaskSchema.virtual('progress').get(function () {
  if (!this.subtasks || this.subtasks.length === 0) {
    return this.manualProgress || 0;
  }
  const done = this.subtasks.filter(s => s.isDone).length;
  return Math.round((done / this.subtasks.length) * 100);
});

// Ensure virtuals are included in JSON and Object output
TaskSchema.set('toJSON', { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });

// Pre-save hook — update lastUpdated on every save
TaskSchema.pre('save', function () {
  this.lastUpdated = Date.now();
});

module.exports = mongoose.model('Task', TaskSchema);
