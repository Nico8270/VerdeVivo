// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { auth, role } = require("../middleware/auth");

// GET /api/products  (lista para el catálogo, pública)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({}).sort({ name: 1 });
    return res.json(products); // devolvemos SIEMPRE un array
  } catch (err) {
    console.error("Error al listar productos:", err);
    return res.status(500).json({ error: "Error al obtener productos" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    return res.json(product);
  } catch (err) {
    console.error("Error al obtener producto:", err);
    return res.status(500).json({ error: "Error al obtener producto" });
  }
});

// POST /api/products  (solo admin)
router.post("/", auth, role("admin"), async (req, res) => {
  try {
    const { name, price, stock, description, imageUrl, isAvailable } = req.body;

    const product = await Product.create({
      name,
      price,
      stock,
      description,
      imageUrl,
      isAvailable: isAvailable !== false,
    });

    return res.status(201).json(product);
  } catch (err) {
    console.error("Error al crear producto:", err);
    return res.status(500).json({ error: "Error al crear producto" });
  }
});

// PUT /api/products/:id  (solo admin)
router.put("/:id", auth, role("admin"), async (req, res) => {
  try {
    const { name, price, stock, description, imageUrl, isAvailable } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, stock, description, imageUrl, isAvailable },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    return res.json(product);
  } catch (err) {
    console.error("Error al actualizar producto:", err);
    return res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// DELETE /api/products/:id  (solo admin)
router.delete("/:id", auth, role("admin"), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    return res.json({ message: "Producto eliminado" });
  } catch (err) {
    console.error("Error al eliminar producto:", err);
    return res.status(500).json({ error: "Error al eliminar producto" });
  }
});

module.exports = router;
