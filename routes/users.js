// users.js
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

// GET User Profile
router.get('/profile', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    // Extract username from the authenticated user
    const username = req.user.username;

    // Find the user by username
    const user = await Users.findOne({ username }).exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return additional fields like email, address, phoneNum, and dateOfBirth
    res.json({
      username: user.username,
      email: user.email,
      address: user.address,
      phoneNum: user.phoneNum,
      dateOfBirth: user.dateOfBirth.toISOString().split('T')[0], // Convert date to YYYY-MM-DD format
    });
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
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
        const updatedUser = await Users.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser);
    } catch (err) {
        next(err);
    }
});

// DELETE User by ID
router.delete('/:id', async (req, res, next) => {
    try {
        const deletedUser = await Users.findByIdAndDelete(req.params.id).exec();

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (err) {
        next(err);
    }
});


module.exports = router;
