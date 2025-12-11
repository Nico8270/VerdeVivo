const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const router = express.Router();

/**
 * Obtiene el sessionId desde:
 *  - header:  x-session-id
 *  - query:   ?sessionId=...
 *  - body:    { sessionId }
 *  - fallback: "demo-session"
 */
function getSessionId(req) {
  return (
    req.headers["x-session-id"] ||
    req.query.sessionId ||
    req.body.sessionId ||
    "demo-session"
  );
}

// ===================== OBTENER CARRITO =====================
router.get("/", async (req, res) => {
  try {
    const sessionId = getSessionId(req);

    let cart = await Cart.findOne({ sessionId }).populate("items.product");
    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
    }

    return res.json(cart);
  } catch (err) {
    console.error("Error al obtener carrito:", err);
    return res.status(500).json({ error: "Error al obtener carrito" });
  }
});

// ===================== AGREGAR / ACTUALIZAR ITEM =====================
router.post("/item", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { productId, quantity } = req.body;

    if (!productId || quantity == null || quantity < 0) {
      return res.status(400).json({ error: "Datos de item inválidos" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
    }

    const index = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (index === -1) {
      // Nuevo item
      if (quantity > 0) {
        cart.items.push({ product: productId, quantity });
      }
    } else {
      // Actualizar cantidad o eliminar si quantity = 0
      if (quantity <= 0) {
        cart.items.splice(index, 1);
      } else {
        cart.items[index].quantity = quantity;
      }
    }

    await cart.save();
    await cart.populate("items.product");

    return res.json({ message: "Carrito actualizado", cart });
  } catch (err) {
    console.error("Error al actualizar carrito:", err);
    return res.status(500).json({ error: "Error al actualizar carrito" });
  }
});

// ===================== ELIMINAR ITEM ESPECÍFICO =====================
router.delete("/item", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    // 👇 AHORA acepta desde body o query
    const productId = req.body.productId || req.query.productId;

    if (!productId) {
      return res.status(400).json({ error: "productId requerido" });
    }

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();
    await cart.populate("items.product");

    return res.json({ message: "Item eliminado", cart });
  } catch (err) {
    console.error("Error al eliminar item del carrito:", err);
    return res
      .status(500)
      .json({ error: "Error al eliminar item del carrito" });
  }
});

// ===================== VACIAR CARRITO =====================
router.delete("/", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await Cart.findOne({ sessionId });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.json({ message: "Carrito vaciado" });
  } catch (err) {
    console.error("Error al vaciar carrito:", err);
    return res.status(500).json({ error: "Error al vaciar carrito" });
  }
});

module.exports = router;
