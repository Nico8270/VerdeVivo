const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// POST /api/orders - crear pedido a partir del carrito
router.post('/', async (req, res) => {
  const { sessionId, customerName, customerPhone, customerAddress } = req.body;

  if (!sessionId || !customerName || !customerPhone || !customerAddress) {
    return res.status(400).json({ message: 'Datos de cliente incompletos' });
  }

  try {
    const cart = await Cart.findOne({ sessionId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    const items = cart.items.map((i) => ({
      product: i.product._id,
      quantity: i.quantity,
      price: i.product.price
    }));

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = new Order({
      sessionId,
      items,
      total,
      customerName,
      customerPhone,
      customerAddress,
      status: 'pendiente'
    });

    const saved = await order.save();

    // vaciar carrito
    cart.items = [];
    await cart.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear pedido', error: err.message });
  }
});

// GET /api/orders/:id - consultar estado del pedido
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener pedido', error: err.message });
  }
});

// PUT /api/orders/:id/status - actualizar estado (admin)
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['pendiente', 'en preparación', 'listo', 'entregado', 'cancelado'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Estado no válido' });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar estado', error: err.message });
  }
});

module.exports = router;
