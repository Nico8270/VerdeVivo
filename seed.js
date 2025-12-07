require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/verdevivo';

const products = [
  {
    name: 'Bowl Verde Vivo',
    description: 'Quinoa, garbanzos, palta, hojas verdes y dressing cítrico.',
    price: 5990,
    category: 'Bowl',
    imageUrl: 'https://d36fw6y2wq3bat.cloudfront.net/recipes/ensalada-de-quinua-garbanzos-y-aguacate/900/ensalada-de-quinua-garbanzos-y-aguacate_version_1646280100.jpg',
    isAvailable: true,
    stock: 15
  },
  {
    name: 'Wrap Vegano Proteico',
    description: 'Tortilla integral rellena con tofu marinado, hummus y vegetales frescos.',
    price: 5490,
    category: 'Wrap',
    imageUrl: 'https://cdn.nutritionstudies.org/wp-content/uploads/2015/06/edamame-hummus-wrap.jpg',
    isAvailable: true,
    stock: 20
  },
  {
    name: 'Ensalada de Legumbres',
    description: 'Mix de porotos negros, lentejas, maíz y tomate cherry con aliño de hierbas.',
    price: 4990,
    category: 'Ensalada',
    imageUrl: 'https://www.gourmet.cl/_next/image/?url=https%3A%2F%2Fgourmet.iprospect.cl%2Fwp-content%2Fuploads%2F2021%2F10%2Fensalada-de-porotos-internet-1.jpg&w=1920&q=75',
    isAvailable: true,
    stock: 12
  },
  {
    name: 'Postre de Chía y Frutos Rojos',
    description: 'Pudín de chía en leche vegetal con coulis de frutos rojos.',
    price: 3490,
    category: 'Postre',
    imageUrl: 'https://d36fw6y2wq3bat.cloudfront.net/recipes/pudin-de-chia-con-fresas-y-arandanos/900/pudin-de-chia-con-fresas-y-arandanos_version_1646280068.jpg',
    isAvailable: true,
    stock: 18
  },
  {
    name: 'Jugo Detox Verde',
    description: 'Jugo prensado en frío de manzana verde, espinaca, pepino y jengibre.',
    price: 2990,
    category: 'Bebida',
    imageUrl: 'https://deliciaskitchen.b-cdn.net/wp-content/uploads/2015/09/batido-verde-de-espinacas-con-manzana-y-pepino-1170x781.webp',
    isAvailable: true,
    stock: 25
  }
];

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB para seed');
    await Product.deleteMany({});
    console.log('🧹 Colección Product limpiada');
    const inserted = await Product.insertMany(products);
    console.log(`✅ Insertados ${inserted.length} productos de ejemplo`);
  } catch (err) {
    console.error('❌ Error en seed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión cerrada');
  }
}

run();
