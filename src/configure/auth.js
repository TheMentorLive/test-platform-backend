import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { User } from "../models/user.model.js";

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://test-platform-backend.onrender.com/api/v1/users/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile || !profile.emails || profile.emails.length === 0) {
          return done(new Error('Invalid profile information from Google'), false);
        }

        const email = profile.emails[0].value;
        let user = await User.findOne({ email: email });

        if (!user) {
          user = await User.create({
            email: email,
            name: profile.displayName,
            googleId: profile.id,
            picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
          });
        } else if (!user.googleId) {
          // If user exists but doesn't have a googleId, update it
          user.googleId = profile.id;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error('Error in Google strategy:', err);
        return done(err, false);
      }
    }
  )
);

// LinkedIn OAuth Strategy
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: "https://test-platform-backend.onrender.com/api/v1/users/auth/linkedin/callback",
      scope: ["r_emailaddress", "r_liteprofile"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          user = await User.create({
            email: profile.emails[0].value,
            name: profile.displayName
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Serialize user to the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

