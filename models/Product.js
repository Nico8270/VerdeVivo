const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, default: 'Plato vegano' },
    imageUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
    stock: { type: Number, required: true, min: 0, default: 10 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
