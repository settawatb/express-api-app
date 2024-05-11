const passport = require("passport");

const authenticateToken = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ message: "Authentication failed", user, info });
    }
    req.user = user;
    return next();
  })(req, res, next);
};

module.exports = authenticateToken;
