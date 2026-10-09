// backend/routes/products.js
// HU-02: Publicar producto -> POST /api/products
// HU-03: Buscar y filtrar  -> GET  /api/products
const express = require('express');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
require('../models/User'); // registra el modelo User (necesario para populate)

const router = express.Router();

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

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// POST /api/products (protegido por token)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { titulo, descripcion, precio, categoria, imagen } = req.body;

    if (!titulo?.trim() || !descripcion?.trim() || precio === undefined || precio === '' || !categoria?.trim()) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const precioNumero = Number(precio);
    if (!Number.isFinite(precioNumero) || precioNumero <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número mayor que cero.' });
    }

    const imagenes = [];
    if (imagen && String(imagen).trim()) {
      try {
        const url = new URL(String(imagen).trim());
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
          return res.status(400).json({ error: 'El enlace de imagen debe ser una URL válida.' });
        }
        imagenes.push(url.href);
      } catch {
        return res.status(400).json({ error: 'Escribe un enlace de imagen válido.' });
      }
    }

    const producto = await Product.create({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      precio: precioNumero,
      categoria: categoria.trim(),
      imagenes,
      vendedorId: req.user.id,
    });

    return res.status(201).json({ message: 'Producto publicado exitosamente.', producto });
  } catch (err) {
    next(err);
  }
});

// GET /api/products: búsqueda, filtros y paginación
router.get('/', async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const numeroPagina = Math.max(1, Number(page) || 1);
    const limite = Math.min(50, Math.max(1, Number(limit) || 12));

    const filtro = { estado: 'Disponible' };

    if (search && String(search).trim()) {
      const regex = new RegExp(escaparRegex(String(search).trim()), 'i');
      filtro.$or = [{ titulo: regex }, { descripcion: regex }];
    }

    if (category) filtro.categoria = category;

    if (minPrice !== undefined && minPrice !== '') {
      const minimo = Number(minPrice);
      if (!Number.isFinite(minimo) || minimo < 0) {
        return res.status(400).json({ error: 'Precio mínimo inválido.' });
      }
      filtro.precio = { ...filtro.precio, $gte: minimo };
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      const maximo = Number(maxPrice);
      if (!Number.isFinite(maximo) || maximo < 0) {
        return res.status(400).json({ error: 'Precio máximo inválido.' });
      }
      filtro.precio = { ...filtro.precio, $lte: maximo };
    }

    const [productos, total] = await Promise.all([
      Product.find(filtro).sort({ createdAt: -1 }).skip((numeroPagina - 1) * limite).limit(limite),
      Product.countDocuments(filtro),
    ]);

    return res.json({
      productos,
      paginacion: { total, page: numeroPagina, limit: limite, totalPages: Math.ceil(total / limite) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'El identificador del producto no es válido.' });
    }

    const producto = await Product.findById(req.params.id).populate('vendedorId', 'nombre email');
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });

    return res.json({ producto });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.Product = Product;