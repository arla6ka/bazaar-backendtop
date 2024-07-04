const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: String, required: true },
  description: { type: String },
  specifications: { type: String },
  reviews: { type: String },
  imageSrc: { type: String, required: true },
  link: { type: String, required: true, unique: true },
  source: { type: String, required: true },
  score: { type: Number, default: 0 } // Adding score field
});

productSchema.index({ title: 'text', description: 'text', specifications: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
