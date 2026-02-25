const mongoose = require('mongoose');

const ResourceHistorySchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true // For faster queries
  },
  labId: { 
    type: String, 
    default: null,
    index: true // For faster queries
  },
  resourceType: { 
    type: String, 
    required: true,
    enum: [
      'EC2_INSTANCE', 
      'S3_BUCKET', 
      'IAM_USER', 
      'IAM_ROLE', 
      'IAM_POLICY', 
      'IAM_GROUP',
      'VPC',
      'SUBNET',
      'SECURITY_GROUP',
      'EBS_VOLUME',
      'SECRETS_MANAGER_SECRET',
      'CLOUDWATCH_LOG_GROUP'
    ]
  },
  // Store the complete configuration/form data that user filled
  resourceData: { 
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Reference to the actual SimulatedResource (if it still exists)
  resourceId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimulatedResource',
    default: null
  },
  // Status: active, deleted, archived
  status: { 
    type: String, 
    enum: ['active', 'deleted', 'archived'],
    default: 'active'
  },
  // Metadata
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now
  },
  // Optional: Store which step/lab step this was created for
  stepId: {
    type: String,
    default: null
  }
});

// Index for efficient queries
ResourceHistorySchema.index({ userId: 1, labId: 1, resourceType: 1 });
ResourceHistorySchema.index({ userId: 1, resourceType: 1, status: 1 });

// Update updatedAt before saving
ResourceHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ResourceHistory', ResourceHistorySchema);


