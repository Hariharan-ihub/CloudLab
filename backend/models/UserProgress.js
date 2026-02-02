const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  labId: { type: String, required: true },
  completedSteps: [{ type: String }], // Array of stepIds
  currentStep: { type: String },
  status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);
