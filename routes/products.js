const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - listar productos
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isAvailable: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos', error: err.message });
  }
});

// GET /api/products/:id - detalle
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener producto', error: err.message });
  }
});

// POST /api/products - crear producto (admin)
router.post('/', async (req, res) => {
  try {
    const prod = new Product(req.body);
    const saved = await prod.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear producto', error: err.message });
  }
});

// PUT /api/products/:id - actualizar producto (admin)
router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!updated) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar producto', error: err.message });
  }
});

// DELETE /api/products/:id - eliminar producto (admin)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar producto', error: err.message });
  }
});

module.exports = router;
