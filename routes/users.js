// routes/users.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const Users = require('../models/User.js');

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Authentication failed', user, info });
    }

    try {
      // Sign a JWT token with a secure secret key
      const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token });
    } catch (error) {
      // Handle JWT signing error
      console.error('JWT signing error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  })(req, res, next);
});

// GET All Users DATA
router.get('/', async (req, res, next) => {
    try {
        const users = await Users.find().exec();
        res.json(users);
    } catch (err) {
        next(err);
    }
});

// GET Users DATA (Single)
router.get('/:id', async (req, res, next) => {
    try {
        const user = await Users.findById(req.params.id).exec();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
});

// UPDATE User DATA (Single)
router.put('/:id', async (req, res, next) => {
    try {
        // Validate that req.body follows the User schema
        const validationResult = Users.validate(req.body);

        if (validationResult.error) {
            return res.status(400).json({ message: 'Invalid request body', error: validationResult.error.details });
        }

        const updatedUser = await Users.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error', error: err.details });
        }

        next(err);
    }
});


// Users Authentication
router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
