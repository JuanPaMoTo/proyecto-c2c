// api/products.js
// Función serverless de Vercel para /api/products/*
const express = require('express');
const cors = require('cors');
const connectDB = require('../backend/db');
const router = require('../backend/routes/products');

const app = express();
app.use(cors());
app.use(express.json());

// Conecta a MongoDB antes de atender cualquier petición
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Error de conexión a MongoDB:', err.message);
    res.status(500).json({ error: 'No se pudo conectar a la base de datos: ' + err.message });
  }
});

app.use('/api/products', router);

// Manejador de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;