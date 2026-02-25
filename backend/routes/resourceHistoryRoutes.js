const express = require('express');
const router = express.Router();
const resourceHistoryController = require('../controllers/resourceHistoryController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Save resource creation history - requires authentication
router.post('/save', authenticate, resourceHistoryController.saveResourceHistory);

// Get user's resource history - requires authentication
router.get('/history', authenticate, resourceHistoryController.getResourceHistory);

// Get resource history by service - requires authentication
router.get('/service', authenticate, resourceHistoryController.getServiceHistory);

// Update resource history - requires authentication
router.put('/:historyId', authenticate, resourceHistoryController.updateResourceHistory);

// Delete resource history (soft delete) - requires authentication
router.delete('/:historyId', authenticate, resourceHistoryController.deleteResourceHistory);

module.exports = router;

