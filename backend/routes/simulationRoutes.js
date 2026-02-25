const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

router.post('/start', simulationController.startLab);
router.post('/validate', simulationController.validateAction);
router.post('/submit', simulationController.submitLab);
router.get('/resources', simulationController.getResources);
router.get('/submission/:submissionId', simulationController.getSubmission);
router.get('/submission', simulationController.getUserSubmission);
router.get('/progress', simulationController.getUserProgress);

module.exports = router;
