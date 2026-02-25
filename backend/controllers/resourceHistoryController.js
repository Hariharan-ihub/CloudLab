const ResourceHistory = require('../models/ResourceHistory');
const SimulatedResource = require('../models/SimulatedResource');

// Save resource creation history
exports.saveResourceHistory = async (req, res) => {
  try {
    const { userId, labId, resourceType, resourceData, resourceId, stepId } = req.body;

    // Validation
    if (!userId || !resourceType || !resourceData) {
      return res.status(400).json({
        success: false,
        message: 'userId, resourceType, and resourceData are required'
      });
    }

    // Create history entry
    const historyEntry = new ResourceHistory({
      userId,
      labId: labId || null,
      resourceType,
      resourceData, // Store complete form data/configuration
      resourceId: resourceId || null,
      stepId: stepId || null,
      status: 'active'
    });

    await historyEntry.save();

    res.json({
      success: true,
      message: 'Resource history saved successfully',
      history: historyEntry
    });
  } catch (error) {
    console.error('Save resource history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save resource history'
    });
  }
};

// Get user's resource history
exports.getResourceHistory = async (req, res) => {
  try {
    const { userId, labId, resourceType, status = 'active' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    // Build query
    const query = { userId, status };
    
    if (labId) {
      // Get resources for specific lab OR resources not associated with any lab
      query.$or = [
        { labId: labId },
        { labId: null }
      ];
    }
    
    if (resourceType) {
      query.resourceType = resourceType;
    }

    // Get history, sorted by most recent first
    const history = await ResourceHistory.find(query)
      .sort({ createdAt: -1 })
      .populate('resourceId'); // Populate reference to actual resource if it exists

    // Group by resource type for easier frontend consumption
    const groupedHistory = {};
    history.forEach(entry => {
      if (!groupedHistory[entry.resourceType]) {
        groupedHistory[entry.resourceType] = [];
      }
      groupedHistory[entry.resourceType].push(entry);
    });

    res.json({
      success: true,
      history: history,
      groupedHistory: groupedHistory,
      count: history.length
    });
  } catch (error) {
    console.error('Get resource history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get resource history'
    });
  }
};

// Update resource history (e.g., mark as deleted)
exports.updateResourceHistory = async (req, res) => {
  try {
    const { historyId } = req.params;
    const { status, resourceData } = req.body;

    if (!historyId) {
      return res.status(400).json({
        success: false,
        message: 'historyId is required'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (resourceData) updateData.resourceData = resourceData;
    updateData.updatedAt = new Date();

    const updatedHistory = await ResourceHistory.findByIdAndUpdate(
      historyId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedHistory) {
      return res.status(404).json({
        success: false,
        message: 'Resource history not found'
      });
    }

    res.json({
      success: true,
      message: 'Resource history updated successfully',
      history: updatedHistory
    });
  } catch (error) {
    console.error('Update resource history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update resource history'
    });
  }
};

// Delete resource history (soft delete - mark as deleted)
exports.deleteResourceHistory = async (req, res) => {
  try {
    const { historyId } = req.params;

    if (!historyId) {
      return res.status(400).json({
        success: false,
        message: 'historyId is required'
      });
    }

    const deletedHistory = await ResourceHistory.findByIdAndUpdate(
      historyId,
      { status: 'deleted', updatedAt: new Date() },
      { new: true }
    );

    if (!deletedHistory) {
      return res.status(404).json({
        success: false,
        message: 'Resource history not found'
      });
    }

    res.json({
      success: true,
      message: 'Resource history deleted successfully',
      history: deletedHistory
    });
  } catch (error) {
    console.error('Delete resource history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete resource history'
    });
  }
};

// Get resource history by resource type for a specific service
exports.getServiceHistory = async (req, res) => {
  try {
    const { userId, service } = req.query;

    if (!userId || !service) {
      return res.status(400).json({
        success: false,
        message: 'userId and service are required'
      });
    }

    // Map service name to resource types
    const serviceToResourceTypes = {
      'EC2': ['EC2_INSTANCE', 'VPC', 'SUBNET', 'SECURITY_GROUP', 'EBS_VOLUME'],
      'S3': ['S3_BUCKET'],
      'IAM': ['IAM_USER', 'IAM_ROLE', 'IAM_POLICY', 'IAM_GROUP'],
      'VPC': ['VPC', 'SUBNET', 'SECURITY_GROUP'],
      'EBS': ['EBS_VOLUME'],
      'SECRETS_MANAGER': ['SECRETS_MANAGER_SECRET'],
      'CLOUDWATCH': ['CLOUDWATCH_LOG_GROUP']
    };

    const resourceTypes = serviceToResourceTypes[service.toUpperCase()] || [];

    if (resourceTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service name'
      });
    }

    // Get history for all resource types in this service
    const history = await ResourceHistory.find({
      userId,
      resourceType: { $in: resourceTypes },
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .populate('resourceId');

    // Group by resource type
    const groupedHistory = {};
    history.forEach(entry => {
      if (!groupedHistory[entry.resourceType]) {
        groupedHistory[entry.resourceType] = [];
      }
      groupedHistory[entry.resourceType].push(entry);
    });

    res.json({
      success: true,
      service: service.toUpperCase(),
      history: history,
      groupedHistory: groupedHistory,
      count: history.length
    });
  } catch (error) {
    console.error('Get service history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get service history'
    });
  }
};


