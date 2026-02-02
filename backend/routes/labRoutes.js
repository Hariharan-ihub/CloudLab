const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');

router.get('/', labController.getAllLabs);
router.get('/:labId', labController.getLabById);

module.exports = router;
