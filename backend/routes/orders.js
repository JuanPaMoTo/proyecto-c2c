// routes/orders.js
// HU-04: Proceso de Compra de Producto -> POST /api/orders
const express = require('express');
const mongoose = require('mongoose');
const Stripe = require('stripe');
const authMiddleware = require('../middleware/auth');
const { Product } = require('./products');

require('../../backend/models/User'); // <-- Esta es la línea que soluciona el error

const Order = require('../../backend/models/Order');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// Modelo de Orden
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

// POST /api/orders (HU-04) - protegido por token
router.post('/', authMiddleware, async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { productoId, direccionEntrega, metodoPago, tokenPago } = req.body;
    const compradorId = req.user.id;

    const producto = await Product.findById(productoId);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    // Validar que el comprador no sea el mismo vendedor
    if (String(producto.vendedorId) === String(compradorId)) {
      return res.status(400).json({ error: 'No puedes comprar tu propio producto' });
    }

    // Validar disponibilidad del producto
    if (producto.estado !== 'Disponible') {
      return res.status(409).json({ error: 'El producto ya no está disponible' });
    }

    // Integración con pasarela de pago (Stripe)
    const cargo = await stripe.paymentIntents.create({
      amount: Math.round(producto.precio * 100), // en centavos
      currency: 'usd',
      payment_method: tokenPago,
      confirm: true,
      description: `Compra de producto ${producto.titulo}`,
    });

    session.startTransaction();

    const orden = await Order.create(
      [
        {
          compradorId,
          productoId,
          direccionEntrega,
          metodoPago,
          monto: producto.precio,
          transaccionId: cargo.id,
          estado: 'Pagado',
        },
      ],
      { session }
    );

    // Actualización automática del estado del producto a "Vendido"
    producto.estado = 'Vendido';
    await producto.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ message: 'Compra realizada con éxito', orden: orden[0] });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    next(err);
  }
});

// GET /api/orders/:id - recibo/confirmación (usado por la pantalla de confirmación del frontend)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const orden = await Order.findById(req.params.id).populate('productoId');
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    return res.json({ orden });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
