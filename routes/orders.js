const express = require("express");
const router = express.Router();

const Cart = require("../models/Cart");
const Order = require("../models/Order");

// ======================== CREAR PEDIDO ========================
router.post("/", async (req, res) => {
  try {
    const { sessionId, customerName, customerPhone, customerAddress } = req.body;

    const cart = await Cart.findOne({ sessionId }).populate("items.product");
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Carrito vacío" });
    }

    const items = cart.items.map((i) => ({
      product: i.product._id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
    }));

    const total = items.reduce((acc, it) => acc + it.price * it.quantity, 0);

    const order = await Order.create({
      sessionId,
      items,
      total,
      customerName,
      customerPhone,
      customerAddress,
      status: "PENDIENTE", // antes del pago
    });

    // No vaciamos el carrito hasta que pague
    return res.status(201).json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error al crear pedido" });
  }
});

// ======================== OBTENER PEDIDO ========================
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
    return res.json(order);
  } catch (e) {
    return res.status(500).json({ message: "Error al obtener pedido" });
  }
});

// ======================== CANCELAR PEDIDO ========================
router.put("/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Pedido no encontrado" });

    if (order.status !== "PENDIENTE") {
      return res
        .status(400)
        .json({ message: "Solo se puede cancelar pedidos pendientes" });
    }

    order.status = "CANCELADO";
    await order.save();

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: "No se pudo cancelar el pedido" });
  }
});

// ======================== CONFIRMAR PAGO ========================
router.put("/:id/pay", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Pedido no encontrado" });

    if (order.status !== "PENDIENTE") {
      return res.status(400).json({ message: "El pedido ya fue procesado" });
    }

    order.status = "CONFIRMADO";
    await order.save();

    // Ahora sí vaciar carrito
    await Cart.updateOne({ sessionId: order.sessionId }, { items: [] });

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: "Error al confirmar pago" });
  }
});

// ======================== ESTADOS ADMIN ========================
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const valid = ["CONFIRMADO", "EN_PREPARACION", "EN_RUTA", "FINALIZADO"];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: "Error actualizando estado" });
  }
});

module.exports = router;
