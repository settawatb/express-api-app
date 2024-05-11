// routes/users.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const Users = require("../models/User.js");

const baseURL = "http://192.168.1.33:3000/download/users/";
// const baseURL = "https://8c73-171-97-8-66.ngrok-free.app/download/users/";
// Upload Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "profileImage/");
  },
  filename: (req, file, cb) => {
    const userId = req.params.id;
    const extension = path.extname(file.originalname);
    const fileName = `profileImage_${userId}${extension}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: APIs for managing users
 */
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ message: "Authentication failed", user, info });
    }

    try {
      // Sign a JWT token with a secure secret key
      const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });

      return res.json({ token });
    } catch (error) {
      // Handle JWT signing error
      console.error("JWT signing error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  })(req, res, next);
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       '200':
 *         description: List of users
 *       '500':
 *         description: Internal server error
 */
// GET All Users DATA
router.get("/", async (req, res, next) => {
  try {
    const users = await Users.find().exec();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User profile data
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
// GET User Profile
router.get("/profile", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const { _id, username } = req.user;
    const user = await Users.findOne({ username }).exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.table({
      id: _id.toString(),
      username: user.username,
      email: user.email,
      address: user.address,
      phoneNum: user.phoneNum,
      dateOfBirth: user.dateOfBirth.toISOString().split("T")[0], // Convert date to YYYY-MM-DD format
      image: user.image ? `${baseURL}${user.image}` : null, // Append baseURL to user's image file name if available
    });

    res.json({
      id: _id.toString(),
      username: user.username,
      email: user.email,
      address: user.address,
      phoneNum: user.phoneNum,
      dateOfBirth: user.dateOfBirth.toISOString().split("T")[0], // Convert date to YYYY-MM-DD format
      image: user.image ? `${baseURL}${user.image}` : null, // Append baseURL to user's image file name if available
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       '200':
 *         description: User data
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
// GET Users DATA (Single)
router.get("/:id", async (req, res, next) => {
  try {
    const user = await Users.findById(req.params.id).exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               phoneNum:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: User updated successfully
 *       '400':
 *         description: Bad request
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
// UPDATE User DATA (Single) and image upload
router.put("/:id", upload.single("image"), async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await Users.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.username = req.body.username;
    user.email = req.body.email;
    user.address = req.body.address;
    user.phoneNum = req.body.phoneNum;
    user.dateOfBirth = req.body.dateOfBirth;
    if (req.file) {
      user.image = req.file.filename;
    }
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       '200':
 *         description: User deleted successfully
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
// DELETE User by ID
router.delete("/:id", async (req, res, next) => {
  try {
    const deletedUser = await Users.findByIdAndDelete(req.params.id).exec();

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", user: deletedUser });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
