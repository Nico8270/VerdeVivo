const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// Registrar usuario (puedes usarlo una vez para crear admin)
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Nombre requerido"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password").isLength({ min: 6 }).withMessage("Mínimo 6 caracteres"),
    body("role").optional().isIn(["cliente", "admin"])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role } = req.body;

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ error: "El correo ya está registrado" });
      }

      const hash = await bcrypt.hash(password, 12);

      const user = await User.create({
        name,
        email,
        password: hash,
        role: role || "cliente",
      });

      return res.status(201).json({ message: "Usuario creado", id: user._id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("Contraseña requerida"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      return res.json({
        token,
        user: { id: user._id, name: user.name, role: user.role },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

module.exports = router;
