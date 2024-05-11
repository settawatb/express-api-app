// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const passport = require("passport");
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: APIs for user authentication
 */
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               phoneNum:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User registered successfully
 *       '400':
 *         description: Bad request, all fields are required
 *       '500':
 *         description: Internal server error
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password, email, address, phoneNum, dateOfBirth } = req.body;

    // Validate that required fields are provided
    if (!username || !password || !email || !address || !phoneNum || !dateOfBirth) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      address,
      phoneNum,
      dateOfBirth,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to the application
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User logged in successfully
 *       '401':
 *         description: Authentication failed
 *       '500':
 *         description: Internal server error
 */
// Login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (!user) {
      console.error(info);
      return res.status(401).json({ message: "Authentication failed", user, info });
    }

    // Assuming you have a user model with an '_id' field
    const token = jwt.sign({ id: user._id, username: user.username }, "your-secret-key", { expiresIn: "1h" });
    console.log("Login route reached.");
    // Log the username and token to the console
    console.log(`User: ${user.username} logged in successfully.\nToken: ${token}`);
    return res.json({ token });
  })(req, res, next);
});

module.exports = router;
