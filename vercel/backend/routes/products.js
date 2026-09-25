// routes/products.js
// HU-02: Publicación de un Producto para la Venta -> POST /api/products
// HU-03: Búsqueda y Filtrado de Productos -> GET /api/products
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configuración de Cloudinary (almacenamiento de imágenes)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer: recibe archivos en memoria antes de subirlos a Cloudinary
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Modelo de Producto
const productSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  precio: { type: Number, required: true, index: true },
  categoria: { type: String, required: true, index: true },
  imagenes: [{ type: String }],
  vendedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  estado: { type: String, enum: ['Disponible', 'Vendido'], default: 'Disponible' },
  createdAt: { type: Date, default: Date.now },
});
// Índice de texto para búsqueda eficiente por palabras clave (HU-03)
productSchema.index({ titulo: 'text', descripcion: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// Utilidad para subir buffer a Cloudinary
function subirImagen(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'c2c-productos' }, (err, result) => {
      if (err) reject(err);
      else resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

// POST /api/products (HU-02) - protegido por token
router.post('/', authMiddleware, upload.array('imagenes', 5), async (req, res, next) => {
  try {
    const { titulo, descripcion, precio, categoria } = req.body;

    if (!titulo || !descripcion || !precio || !categoria) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Procesamiento y almacenamiento seguro de imágenes -> URLs
    const urls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await subirImagen(file.buffer);
        urls.push(url);
      }
    }

    const producto = await Product.create({
      titulo,
      descripcion,
      precio,
      categoria,
      imagenes: urls,
      vendedorId: req.user.id, // vincula el producto con el usuario autenticado
    });

    return res.status(201).json({ message: 'Producto publicado exitosamente', producto });
  } catch (err) {
    next(err);
  }
});

// GET /api/products (HU-03) - búsqueda y filtrado, paginado
router.get('/', async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const filtro = { estado: 'Disponible' };
    if (search) filtro.$text = { $search: search };
    if (category) filtro.categoria = category;
    if (minPrice || maxPrice) {
      filtro.precio = {};
      if (minPrice) filtro.precio.$gte = Number(minPrice);
      if (maxPrice) filtro.precio.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [productos, total] = await Promise.all([
      Product.find(filtro).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(filtro),
    ]);

    return res.json({
      productos,
      paginacion: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id - detalle de producto (usado en el checkout del frontend)
router.get('/:id', async (req, res, next) => {
  try {
    const producto = await Product.findById(req.params.id).populate('vendedorId', 'nombre email');
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json({ producto });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.Product = Product;
