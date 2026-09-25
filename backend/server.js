// server.js
// Capa: API REST (Backend) - Contenedor "api" del diagrama C4 nivel 2
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Conexión a base de datos (capa de persistencia)
connectDB();

// Healthcheck (usado por el proxy inverso / balanceador)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'c2c-api' });
});

// Rutas por Historia de Usuario
app.use('/api/auth', authRoutes);      // HU-01
app.use('/api/products', productRoutes); // HU-02, HU-03
app.use('/api/orders', orderRoutes);    // HU-04

// Manejador de errores centralizado
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API C2C escuchando en el puerto ${PORT}`);
});

module.exports = app;
