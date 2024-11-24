const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/auth/google/callback', // Use environment variable for callback URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the Google profile contains the required information (e.g., email)
        if (!profile.emails || !profile.emails.length) {
          console.error('Google OAuth profile is missing email information');
          return done(new Error('Google profile is missing email'), null);
        }

        // Find or create the user based on the Google profile ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // If user doesn't exist, create a new user
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value, // Use the first email from the Google profile
            name: profile.displayName || 'Unnamed User', // Use the Google display name, fallback to 'Unnamed User'
          });

          await user.save();
          console.log('New user created from Google OAuth:', user);
        }

        return done(null, user); // Pass the user object to done
      } catch (error) {
        console.error('Error in Google OAuth strategy:', error);
        return done(error, null); // Properly handle error
      }
    }
  )
);

// Serialize user by ID into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user by ID from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (user) {
      done(null, user);
    } else {
      done(new Error('User not found'), null);
    }
  } catch (error) {
    console.error('Error during deserialization:', error);
    done(error, null); // Proper error handling
  }
});

module.exports = passport;
