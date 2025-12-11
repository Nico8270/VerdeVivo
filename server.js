// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");

// Modelos
const User = require("./models/User");

// Rutas
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orders");

const app = express();

/* ===================== ADMIN POR DEFECTO ===================== */
async function ensureDefaultAdmin() {
  try {
    const email = "admin@gmail.com";
    const existing = await User.findOne({ email });

    if (!existing) {
      const hash = await bcrypt.hash("1234", 10);
      await User.create({
        name: "Admin Verde Vivo",
        email,
        password: hash,
        role: "admin",
      });
      console.log("Admin por defecto creado: admin@gmail.com / 1234");
    } else {
      console.log("Admin por defecto ya existe.");
    }
  } catch (err) {
    console.error("Error creando admin por defecto:", err);
  }
}

/* ===================== MIDDLEWARE ===================== */

// JSON
app.use(express.json());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Servir frontend estático desde /public
app.use(express.static(path.join(__dirname, "public")));

/* ===================== RUTAS API ===================== */

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

/* ===================== CONEXIÓN A MONGODB ===================== */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB conectado correctamente");
    await ensureDefaultAdmin();
  })
  .catch((e) => console.error("Error conectando a MongoDB:", e));

/* ===================== LEVANTAR SERVIDOR ===================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Backend en http://localhost:${PORT}`);
});
