const mongoose = require('mongoose');

const SimulatedResourceSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // For now, simple string ID
  resourceType: { type: String, required: true }, // e.g., "EC2_INSTANCE"
  // Dynamic state bag for the resource
  state: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('SimulatedResource', SimulatedResourceSchema);
