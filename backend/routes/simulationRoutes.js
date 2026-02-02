const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

router.post('/start', simulationController.startLab);
router.post('/validate', simulationController.validateAction);
router.get('/resources', simulationController.getResources);

module.exports = router;
