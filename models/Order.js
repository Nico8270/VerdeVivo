const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }
});

const orderSchema = new Schema(
  {
    sessionId: { type: String, required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    status: {
      type: String,
      enum: ['pendiente', 'en preparación', 'listo', 'entregado', 'cancelado'],
      default: 'pendiente'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
