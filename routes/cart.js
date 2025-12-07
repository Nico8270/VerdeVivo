const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper: garantiza que exista carrito por sessionId
async function getOrCreateCart(sessionId) {
  let cart = await Cart.findOne({ sessionId }).populate('items.product');
  if (!cart) {
    cart = new Cart({ sessionId, items: [] });
    await cart.save();
    cart = await Cart.findOne({ sessionId }).populate('items.product');
  }
  return cart;
}

// GET /api/cart?sessionId=xxx
router.get('/', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ message: 'sessionId es requerido' });

  try {
    const cart = await getOrCreateCart(sessionId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener carrito', error: err.message });
  }
});

// POST /api/cart/item - agregar/actualizar item en carrito (cantidad absoluta)
router.post('/item', async (req, res) => {
  const { sessionId, productId, quantity } = req.body;
  if (!sessionId || !productId || quantity === undefined) {
    return res.status(400).json({ message: 'sessionId, productId y quantity son requeridos' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      return res.status(404).json({ message: 'Producto no disponible' });
    }

    const cart = await getOrCreateCart(sessionId);
    const idx = cart.items.findIndex((i) => i.product._id.toString() === productId);

    if (quantity <= 0) {
      // eliminar del carrito
      if (idx >= 0) cart.items.splice(idx, 1);
    } else {
      if (idx >= 0) {
        cart.items[idx].quantity = quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar carrito', error: err.message });
  }
});

// DELETE /api/cart/item - eliminar item
router.delete('/item', async (req, res) => {
  const { sessionId, productId } = req.body;
  if (!sessionId || !productId) {
    return res.status(400).json({ message: 'sessionId y productId son requeridos' });
  }

  try {
    const cart = await getOrCreateCart(sessionId);
    cart.items = cart.items.filter((i) => i.product._id.toString() !== productId);
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar del carrito', error: err.message });
  }
});

// DELETE /api/cart - vaciar carrito
router.delete('/', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ message: 'sessionId es requerido' });
  }

  try {
    const cart = await getOrCreateCart(sessionId);
    cart.items = [];
    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error al vaciar carrito', error: err.message });
  }
});

module.exports = router;
