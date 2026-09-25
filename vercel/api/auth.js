// api/auth.js
// Adaptación a Vercel: la ruta /api/auth/* se convierte en una Serverless Function
// Reutiliza la misma lógica de negocio de HU-01 empaquetada con Express + serverless-http
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const authRouter = require('../../backend/routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión reutilizable entre invocaciones (evita reconectar en cada cold start)
let conectado = false;
app.use(async (req, res, next) => {
  if (!conectado) {
    await mongoose.connect(process.env.MONGO_URI);
    conectado = true;
  }
  next();
});

app.use('/api/auth', authRouter);

module.exports = app;
module.exports.handler = serverless(app);
