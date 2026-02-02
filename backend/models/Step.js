const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  stepId: { type: String, required: true }, // e.g., "ec2-select-ami"
  labId: { type: String, required: true },
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  expectedAction: { type: String, required: true }, // e.g., "SELECT_AMI"
  validationLogic: { type: mongoose.Schema.Types.Mixed }, // Rules for validation
  uiComponent: { type: String }, // Identifier for frontend component to highlight
  order: { type: Number, required: true }
});

module.exports = mongoose.model('Step', StepSchema);
