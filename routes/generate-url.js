const express = require('express');
const router = express.Router();

// Define the base URL for your products
const baseUrl = 'http://localhost:3000/products/';

// Sample product data
const productId = '65D0821F79C6E565B767DD';
const productModel3D = 'Toy3D.USDZ';

// Create a route handler to construct the complete URL
router.get('/', (req, res) => {
  try {
    // Construct the complete URL using template literals
    const completeUrl = `${baseUrl}${productId}/${productModel3D}`;

    // Log the complete URL to the console
    console.log('Complete URL:', completeUrl);

    // Respond with the complete URL
    res.json({ completeUrl });
  } catch (error) {
    // Handle errors here
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
