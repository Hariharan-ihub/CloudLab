const mongoose = require('mongoose');

const LabSchema = new mongoose.Schema({
  labId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  service: { type: String, required: true }, // e.g., "EC2"
  estimatedTime: { type: String }, // e.g., "15 min"
  steps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Step' }],
  initialState: { type: mongoose.Schema.Types.Mixed } // e.g. { ec2: [], vpc: [...] }
});

module.exports = mongoose.model('Lab', LabSchema);
