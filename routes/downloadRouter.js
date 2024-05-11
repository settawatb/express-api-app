const express = require("express");
const router = express.Router();
const path = require("path");

const productImagesPath = path.join(__dirname, "..", "uploads");
const profileImagesPath = path.join(__dirname, "..", "profileImage");

router.use("/download/products", express.static(productImagesPath));
router.use("/download/users", express.static(profileImagesPath));

module.exports = router;
