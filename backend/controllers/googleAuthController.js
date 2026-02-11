const passport = require('passport');
const { generateToken } = require('../middleware/auth');

// Initiate Google OAuth
exports.googleAuth = (req, res, next) => {
  // Double check credentials exist before using passport
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.'
    });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

// Google OAuth Callback
exports.googleCallback = async (req, res, next) => {
  // Double check credentials exist before using passport
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured.'
    });
  }
  
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err) {
      console.error('Google OAuth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    if (!user) {
      console.error('Google OAuth: User not found');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=user_not_found`);
    }

    try {
      // Generate JWT token
      const token = generateToken(user._id);

      // Redirect to frontend with token and user info
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const userInfo = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };
      // Encode user info in URL (or we can fetch it from backend after redirect)
      res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&userId=${user._id}`);
    } catch (error) {
      console.error('Token generation error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=token_error`);
    }
  })(req, res, next);
};

// Get Google OAuth URL (for frontend to initiate)
exports.getGoogleAuthUrl = (req, res) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.'
    });
  }
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const authUrl = `${backendUrl}/api/auth/google`;
  
  res.json({
    success: true,
    authUrl: authUrl
  });
};

