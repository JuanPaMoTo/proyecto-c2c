// backend/routes/orders.js
// HU-04: Proceso de compra -> POST /api/orders, GET /api/orders/:id
const express = require('express');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
require('../models/User');
const { Product } = require('./products');

const router = express.Router();

// Stripe solo se usa si hay una clave real; si no, el pago se simula
// (el formulario del checkout dice "tarjeta simulada").
const claveStripe = process.env.STRIPE_SECRET_KEY || '';
const stripeActivo = /^sk_(test|live)_[A-Za-z0-9]{10,}$/.test(claveStripe) && !/x{4,}|dummy/i.test(claveStripe);
const stripe = stripeActivo ? require('stripe')(claveStripe) : null;

const orderSchema = new mongoose.Schema({
  compradorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  direccionEntrega: { type: String, required: true },
  metodoPago: { type: String, required: true },
  monto: { type: Number, required: true },
  transaccionId: { type: String },
  estado: { type: String, enum: ['Pendiente', 'Pagado', 'Cancelado'], default: 'Pendiente' },
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// POST /api/orders (protegido por token)
router.post('/', authMiddleware, async (req, res, next) => {
  let reservado = false;
  let productoId;
  try {
    const { direccionEntrega, metodoPago, tokenPago } = req.body;
    productoId = req.body.productoId;
    const compradorId = req.user.id;

    if (!mongoose.isValidObjectId(productoId)) {
      return res.status(400).json({ error: 'Producto inválido' });
    }
    if (!direccionEntrega?.trim() || !metodoPago) {
      return res.status(400).json({ error: 'Dirección y método de pago son obligatorios' });
    }

    const producto = await Product.findById(productoId);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    if (String(producto.vendedorId) === String(compradorId)) {
      return res.status(400).json({ error: 'No puedes comprar tu propio producto' });
    }

    // Reserva atómica: solo uno puede pasar de Disponible a Vendido
    const reserva = await Product.findOneAndUpdate(
      { _id: productoId, estado: 'Disponible' },
      { estado: 'Vendido' },
      { new: true }
    );
    if (!reserva) return res.status(409).json({ error: 'El producto ya no está disponible' });
    reservado = true;

    // Pago
    let transaccionId;
    if (stripe) {
      const cargo = await stripe.paymentIntents.create({
        amount: Math.round(producto.precio * 100),
        currency: 'usd',
        payment_method: tokenPago || 'pm_card_visa',
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        description: `Compra de producto ${producto.titulo}`,
      });
      transaccionId = cargo.id;
    } else {
      transaccionId = 'SIM-' + Date.now();
    }

    const orden = await Order.create({
      compradorId,
      productoId,
      direccionEntrega: direccionEntrega.trim(),
      metodoPago,
      monto: producto.precio,
      transaccionId,
      estado: 'Pagado',
    });

    return res.status(201).json({ message: 'Compra realizada con éxito', orden });
  } catch (err) {
    // Si algo falló después de reservar, el producto vuelve a estar disponible
    if (reservado) {
      await Product.updateOne({ _id: productoId }, { estado: 'Disponible' }).catch(() => {});
    }
    if (err && err.type && String(err.type).startsWith('Stripe')) {
      return res.status(402).json({ error: 'El pago fue rechazado: ' + err.message });
    }
    next(err);
  }
});

// GET /api/orders/:id (recibo)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identificador de orden inválido' });
    }
    const orden = await Order.findById(req.params.id).populate('productoId');
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    if (String(orden.compradorId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'No tienes acceso a esta orden' });
    }
    return res.json({ orden });
  } catch (err) {
    next(err);
  }
});

module.exports = router;