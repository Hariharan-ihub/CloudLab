// Ensure dotenv is loaded before checking environment variables
require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Google OAuth Strategy (only initialize if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('🔍 Initializing Google OAuth strategy...');
  console.log('📍 Client ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI || '/api/auth/google/callback',
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, update last login
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if user exists with this email
        user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Create new user (no password for OAuth users)
        const newUser = new User({
          googleId: profile.id,
          email: profile.emails[0].value.toLowerCase(),
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          username: profile.emails[0].value.split('@')[0] + '_' + profile.id.substring(0, 6), // Generate unique username
          authProvider: 'google',
          lastLogin: new Date(),
          password: undefined // Explicitly set to undefined for OAuth users
        });

        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
  );
  console.log('✅ Google OAuth strategy initialized');
} else {
  console.log('⚠️  Google OAuth not configured (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing)');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

