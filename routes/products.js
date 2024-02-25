// routes/products.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('./authMiddleware');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const Product = require('../models/Product.js');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: 'asset/model3d/', // Save files to the specified directory
  filename: function (req, file, cb) {
    const uniqueFilename = `${Date.now()}-${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage: storage });

// GET ALL Products DATA
router.get('/', async (req, res, next) => {
    try {
        const products = await Product.find().exec();
        res.json(products);
    } catch (err) {
        next(err);
    }
});

// GET Product DATA (Single)
router.get('/:id', async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).exec();

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        next(err);
    }
});

// GET Product Model 3D File (.USDZ)
router.get('/:id/model3D', authenticateToken, async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).exec();

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const filePath = path.join(__dirname, '..', 'asset', 'model3d', product.product_model3D);

        if (fs.existsSync(filePath)) {
            res.download(filePath, product.product_model3D); // Send the file for download
        } else {
            res.status(404).json({ message: 'File not found' });
        }
    } catch (err) {
        next(err);
    }
});

// CREATE Product DATA with file upload
router.post('/', upload.single('usdzFile'), async (req, res, next) => {
    try {
        console.log(req.body); // Log the request body

        const newProduct = new Product({
            product_name: req.body.product_name,
            product_price: req.body.product_price,
            product_quantity: req.body.product_quantity,
            product_category: req.body.product_category,
            product_desc: req.body.product_desc,
            product_images: req.body.product_images,
            product_model3D: req.file ? req.file.filename : '',
            // Add other product properties from req.body
        });

        await newProduct.save();

        res.status(201).json(newProduct);
    } catch (err) {
        next(err);
    }
});


// UPDATE Product DATA (Single)
router.put('/:id', async (req, res, next) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(updatedProduct);
    } catch (err) {
        next(err);
    }
});

// DELETE Product
router.delete('/:id', async (req, res, next) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Add the following code to delete associated file
        const filePath = path.join(__dirname, '..', 'asset', 'model3d', deletedProduct.product_model3D);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json(deletedProduct);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
