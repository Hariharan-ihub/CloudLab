const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const { authenticate } = require('../middleware/auth');

router.post('/validate', authenticate, githubController.validateRepo);

module.exports = router;
