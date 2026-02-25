const mongoose = require('mongoose');

const SimulatedResourceSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // For now, simple string ID
  labId: { type: String, default: null }, // Optional: associate resource with a specific lab
  resourceType: { type: String, required: true }, // e.g., "EC2_INSTANCE"
  // Dynamic state bag for the resource
  state: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('SimulatedResource', SimulatedResourceSchema);
