// seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB conectado para seed");

    await Product.deleteMany({});
    console.log("Colección Product limpiada");

    const productos = [
      {
        name: "Bowl Proteico Verde",
        price: 5990,
        stock: 15,
        description:
          "Bowl vegano con tofu grillado, quinoa y vegetales frescos.",
        imageUrl:
          "https://carolinarice.com/wp-content/uploads/2020/07/Asian-Tofu-Rice-Bowls-6-765x1148-1.jpg",
        isAvailable: true,
      },
      {
        name: "Ensalada Detox",
        price: 4990,
        stock: 20,
        description:
          "Ensalada crudivegana con mix de hojas, palta y semillas.",
        imageUrl: "https://i.blogs.es/1e87bc/1366_2000-5/1366_2000.jpg",
        isAvailable: true,
      },
      {
        name: "Wrap de Garbanzos",
        price: 4590,
        stock: 12,
        description:
          "Wrap integral relleno de hummus de garbanzo y vegetales salteados.",
        imageUrl:
          "https://www.alimentosrichly.com/storage/recipes/OQaiApNdSxnh5gbLQb0DIjPRFQdv5snHd5kP4PP4.jpeg",
        isAvailable: true,
      },
    ];

    await Product.insertMany(productos);
    console.log("Productos insertados correctamente");

    await mongoose.disconnect();
    console.log("Conexión cerrada");
    process.exit(0);
  } catch (err) {
    console.error("Error en seed:", err);
    process.exit(1);
  }
}

run();
