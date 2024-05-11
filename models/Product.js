// models/Product.js
const mongoose = require("mongoose");

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
      ref: "Seller",
      required: false,
    },
    seller_name: String,
    seller_address: String,
  },
});

module.exports = mongoose.model("Product", productSchema);
