const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  price: Number,
  quantity: Number,
});

const orderSchema = new Schema(
  {
    sessionId: { type: String, required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "PENDIENTE",
        "CONFIRMADO",
        "EN_PREPARACION",
        "EN_RUTA",
        "FINALIZADO",
        "CANCELADO",
      ],
      default: "PENDIENTE",
    },
    customerName: String,
    customerPhone: String,
    customerAddress: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
