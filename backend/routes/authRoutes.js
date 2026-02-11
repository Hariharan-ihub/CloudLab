const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Google OAuth routes (only if configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const googleAuthController = require('../controllers/googleAuthController');
  router.get('/google', googleAuthController.googleAuth);
  router.get('/google/callback', googleAuthController.googleCallback);
  router.get('/google/url', googleAuthController.getGoogleAuthUrl);
} else {
  // Provide helpful error message if Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.'
    });
  });
  router.get('/google/callback', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured.'
    });
  });
  router.get('/google/url', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured.'
    });
  });
}

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;

