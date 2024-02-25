const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('./models/User'); // Adjust the path accordingly

passport.use(new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password',
  },
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });

      if (!user || !user.validatePassword(password)) {
        return done(null, false, { message: 'Incorrect username or password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key', // Use environment variable or fallback to a default key
  },
  async (jwtPayload, done) => {
    try {
      const user = await User.findById(jwtPayload.id);

      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

module.exports = passport;
