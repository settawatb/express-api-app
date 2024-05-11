// routes/products.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const authenticateToken = require("./authMiddleware");
const path = require("path");
const mongoose = require("mongoose");
const fs = require("fs");
const Product = require("../models/Product.js");
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: APIs for managing products
 */

// BaseURL for change PATH download URL
const baseURL = "http://192.168.1.33:3000/download/products/";
// const baseURL = "https://8c73-171-97-8-66.ngrok-free.app/download/products/";

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files to the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Optional file size limit (100MB)
  },
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       '200':
 *         description: A list of products
 *       '500':
 *         description: Internal server error
 */
// GET ALL Products DATA
router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find().exec();
    const updatedProducts = products.map((product) => {
      const productImagesArray = product.product_images.split(",").map((filename) => {
        return `${baseURL}${filename.trim()}`;
      });

      return {
        ...product.toJSON(),
        product_images: productImagesArray,
        product_model3D: `${baseURL}${product.product_model3D}`,
      };
    });

    res.json(updatedProducts);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /products/bySellerName/{name}:
 *   get:
 *     summary: Get products by seller name
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller name
 *     responses:
 *       '200':
 *         description: A list of products
 *       '404':
 *         description: No products found for the specified seller name
 *       '500':
 *         description: Internal server error
 */
// GET all data by product_seller.seller_name
router.get("/bySellerName/:name", async (req, res, next) => {
  try {
    const sellerName = req.params.name;
    const products = await Product.find({ "product_seller.seller_name": sellerName }).exec();
    if (products.length === 0) {
      return res.status(404).json({ message: "No products found for the specified seller name" });
    }
    const updatedProducts = products.map((product) => ({
      ...product.toJSON(),
      product_images: baseURL + product.product_images,
      product_model3D: baseURL + product.product_model3D,
    }));
    res.json(updatedProducts);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /products/bySellerId/{sellerId}:
 *   get:
 *     summary: Get products by seller ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *     responses:
 *       '200':
 *         description: A list of products
 *       '400':
 *         description: Invalid seller ID format
 *       '404':
 *         description: No products found for the specified seller ID
 *       '500':
 *         description: Internal server error
 */
// GET all data by product_seller.seller_id
router.get("/bySellerId/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID format" });
    }

    const products = await Product.find({ "product_seller.seller_id": sellerId });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found for the specified seller ID" });
    }

    const updatedProducts = products.map((product) => {
      const productImagesArray = product.product_images.split(",").map((filename) => `${baseURL}${filename.trim()}`);

      return {
        ...product.toJSON(),
        product_images: productImagesArray,
        product_model3D: `${baseURL}${product.product_model3D}`,
      };
    });

    res.json(updatedProducts);
  } catch (err) {
    console.error("Error during GET /products/bySellerId/:sellerId:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET Product DATA (Single)
router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).exec();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const productImagesArray = product.product_images.split(",").map((filename) => {
      return `/download/products/${filename.trim()}`;
    });

    const response = {
      ...product._doc,
      product_images: productImagesArray,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET Product Model 3D File (.USDZ)
router.get("/:id/model3D", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).exec();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("Product:", product);

    const filePath = path.join(__dirname, "..", "asset", "model3d", product.product_model3D);

    console.log("File Path:", filePath);

    if (fs.existsSync(filePath)) {
      res.download(filePath, product.product_model3D); // Send the file for download
    } else {
      res.status(404).json({ message: "File not found" });
    }
  } catch (err) {
    console.error("Error:", err);
    next(err);
  }
});

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * @swagger
 * /products/upload:
 *   post:
 *     summary: Upload a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               productPrice:
 *                 type: number
 *               productQuantity:
 *                 type: number
 *               productCategory:
 *                 type: array
 *                 items:
 *                   type: string
 *               productDescription:
 *                 type: string
 *               productSellerId:
 *                 type: string
 *               productSellerName:
 *                 type: string
 *               productSellerAddress:
 *                 type: string
 *               image0:
 *                 type: string
 *                 format: binary
 *               image1:
 *                 type: string
 *                 format: binary
 *               image2:
 *                 type: string
 *                 format: binary
 *               image3:
 *                 type: string
 *                 format: binary
 *               image4:
 *                 type: string
 *                 format: binary
 *               image5:
 *                 type: string
 *                 format: binary
 *               usdzFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: Product uploaded successfully
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
// CREATE Product DATA with file upload
router.post(
  "/upload",
  upload.fields([
    { name: "image0", maxCount: 1 },
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
    { name: "usdzFile", maxCount: 1 },
  ]),
  async (req, res, next) => {
    console.log("Incoming request body:", req.body);
    console.log("Incoming request files:", req.files);

    try {
      // Destructure incoming request body, make sure field names match schema
      const {
        productName,
        productPrice,
        productQuantity,
        productCategory,
        productDescription,
        productSellerId,
        productSellerName,
        productSellerAddress, // Correct field name
      } = req.body;

      if (!productName || !productPrice || !productQuantity) {
        console.log("Missing required fields.");
        return res.status(400).json({ message: "Product name, price, and quantity are required" });
      }

      if (productSellerId && !isValidObjectId(productSellerId)) {
        console.log("Invalid productSellerId.");
        return res.status(400).json({ message: "Invalid productSellerId" });
      }

      // Check file type for USDZ file
      if (req.files.usdzFile) {
        const usdzFile = req.files.usdzFile[0];
        const usdzExpectedType = "application/octet-stream";
        if (usdzFile.mimetype !== usdzExpectedType) {
          return res.status(400).json({ message: "Unsupported USDZ file type" });
        }
      }

      const productImages = [];
      if (req.files) {
        for (let i = 0; i <= 5; i++) {
          const imageField = `image${i}`;
          if (req.files[imageField] && req.files[imageField][0]) {
            const file = req.files[imageField][0];
            productImages.push(file.filename);
          }
        }
      }

      const productImagesString = productImages.join(", ");

      let productCategories = Array.isArray(productCategory) ? productCategory : [productCategory];
      productCategories.push("All");

      // Create a new product document
      const newProduct = new Product({
        product_name: productName,
        product_price: productPrice,
        product_quantity: productQuantity,
        product_category: productCategories,
        product_desc: productDescription,
        product_images: productImagesString,
        product_model3D: req.files.usdzFile[0]?.filename,
        product_seller: {
          seller_id: productSellerId || null,
          seller_name: productSellerName,
          seller_address: productSellerAddress, // Save the seller_address
        },
        updated_at: Date.now(),
      });

      const savedProduct = await newProduct.save();
      console.log("Product added successfully:", savedProduct);

      res.status(201).json(savedProduct);
    } catch (err) {
      console.error("Error during product upload:", err);
      next(err);
    }
  }
);

/**
 * @swagger
 * /products/update/{id}:
 *   put:
 *     summary: Update product details
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               productPrice:
 *                 type: number
 *               productQuantity:
 *                 type: number
 *               productCategory:
 *                 type: array
 *                 items:
 *                   type: string
 *               productDescription:
 *                 type: string
 *               productSellerId:
 *                 type: string
 *               productSellerName:
 *                 type: string
 *               image0:
 *                 type: string
 *                 format: binary
 *               image1:
 *                 type: string
 *                 format: binary
 *               image2:
 *                 type: string
 *                 format: binary
 *               image3:
 *                 type: string
 *                 format: binary
 *               image4:
 *                 type: string
 *                 format: binary
 *               image5:
 *                 type: string
 *                 format: binary
 *               usdzFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Product updated successfully
 *       '400':
 *         description: Bad request
 *       '404':
 *         description: Product not found
 *       '500':
 *         description: Internal server error
 */
// Update a single product data with file upload
router.put(
  "/update/:id",
  upload.fields([
    { name: "image0", maxCount: 1 },
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
    { name: "usdzFile", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Destructure fields from request body
      const { productName, productPrice, productQuantity, productCategory, productDescription, productSellerId, productSellerName } = req.body;

      // Update product attributes based on provided data
      if (productName) existingProduct.product_name = productName;
      if (productPrice) existingProduct.product_price = productPrice;
      if (productQuantity) existingProduct.product_quantity = productQuantity;
      if (productDescription) existingProduct.product_desc = productDescription;
      if (productSellerId) existingProduct.product_seller.seller_id = productSellerId;
      if (productSellerName) existingProduct.product_seller.seller_name = productSellerName;

      // Update product category and push "All" to it
      if (productCategory) {
        existingProduct.product_category = Array.isArray(productCategory) ? productCategory : [productCategory];
        existingProduct.product_category.push("All"); // Add "All" category
      }

      // Handle image updates
      const productImages = [];
      if (req.files) {
        for (let i = 0; i <= 5; i++) {
          const imageField = `image${i}`;
          if (req.files[imageField] && req.files[imageField][0]) {
            const file = req.files[imageField][0];
            productImages.push(file.filename);
          }
        }
        if (productImages.length > 0) {
          existingProduct.product_images = productImages.join(", ");
        }
      }

      // Handle USDZ file update
      if (req.files.usdzFile && req.files.usdzFile[0]) {
        existingProduct.product_model3D = req.files.usdzFile[0].filename;
      }

      // Update timestamp for the product
      existingProduct.updated_at = Date.now();

      // Save the updated product to the database
      const updatedProduct = await existingProduct.save();

      // Send the updated product as a response
      res.status(200).json(updatedProduct);
    } catch (err) {
      console.error("Error during product update:", err);
      next(err);
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       '200':
 *         description: Product deleted successfully
 *       '404':
 *         description: Product not found
 *       '500':
 *         description: Internal server error
 */
// DELETE Product
// router.delete("/:id", async (req, res, next) => {
//   try {
//     const deletedProduct = await Product.findByIdAndDelete(req.params.id);

//     if (!deletedProduct) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     const imagesPath = path.join(__dirname, "..", "uploads");
//     const model3DPath = path.join(__dirname, "..", "asset", "model3d");

//     if (deletedProduct.product_images) {
//       const imageFilenames = deletedProduct.product_images.split(",").map((filename) => filename.trim());

//       imageFilenames.forEach((filename) => {
//         const imagePath = path.join(imagesPath, filename);
//         try {
//           if (fs.existsSync(imagePath)) {
//             fs.unlinkSync(imagePath);
//           }
//         } catch (err) {
//           console.error(`Failed to delete image file ${filename}:`, err);
//         }
//       });
//     }

//     if (deletedProduct.product_model3D) {
//       const model3DFilePath = path.join(model3DPath, deletedProduct.product_model3D);
//       try {
//         if (fs.existsSync(model3DFilePath)) {
//           fs.unlinkSync(model3DFilePath);
//         }
//       } catch (err) {
//         console.error(`Failed to delete 3D model file ${deletedProduct.product_model3D}:`, err);
//       }
//     }

//     res.json(deletedProduct);
//   } catch (err) {
//     console.error("Error while deleting product:", err);
//     next(err);
//   }
// });
router.delete("/:id", async (req, res, next) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    const uploadsPath = path.join(__dirname, "..", "uploads");

    if (deletedProduct.product_images) {
      const imageFilenames = deletedProduct.product_images.split(",").map((filename) => filename.trim());

      imageFilenames.forEach((filename) => {
        const imagePath = path.join(uploadsPath, filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted image file: ${filename}`);
        } else {
          console.warn(`Image file not found: ${filename}`);
        }
      });
    }

    if (deletedProduct.product_model3D) {
      const model3DFilePath = path.join(uploadsPath, path.basename(deletedProduct.product_model3D));
      if (fs.existsSync(model3DFilePath)) {
        fs.unlinkSync(model3DFilePath);
        console.log(`Deleted 3D model file: ${path.basename(deletedProduct.product_model3D)}`);
      } else {
        console.warn(`3D model file not found: ${path.basename(deletedProduct.product_model3D)}`);
      }
    }

    res.json(deletedProduct);
  } catch (err) {
    console.error("Error while deleting product:", err);
    next(err);
  }
});

module.exports = router;
