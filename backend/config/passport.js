const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');  // Adjust the path to your User model
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/auth/google/callback', // Ensure this matches the redirect URI in Google Cloud Console
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find the user based on the Google profile ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // If the user doesn't exist, create a new one
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value, // Get email from Google profile
            name: profile.displayName, // Get user's display name
          });
          await user.save();
        }

        // Continue with the found or newly created user
        return done(null, user);
      } catch (error) {
        console.error('Error in Google Strategy:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize the user ID into the session
passport.serializeUser((user, done) => {
  done(null, user.id); // Serialize user by their ID
});

// Deserialize the user from the session by finding them via their ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (user) {
      done(null, user);
    } else {
      done(new Error('User not found'), null);
    }
  } catch (error) {
    console.error('Error in deserialization:', error);
    done(error, null);
  }
});

module.exports = passport;
