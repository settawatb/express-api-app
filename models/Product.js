const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_name: String,
  product_price: Number,
  product_quantity: Number,
  product_category: [String],
  product_desc: String,
  product_images: String,
  product_model3D: String,
  update_at: { type: Date, default: Date.now },
  product_seller: {
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      unique: false, // Allowing multiple products with the same seller
      required: false, // Allowing null values
    },
    // You may add other seller-related fields here
  },
  product_rating: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Allowing null values
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: false, // Allowing null values
    },
    review_text: String,
  }],
});

module.exports = mongoose.model('Product', productSchema);
