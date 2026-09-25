// api/products.js
// Adaptación a Vercel: /api/products/* como Serverless Function (HU-02 y HU-03)
// Nota: Multer con memoryStorage funciona en Vercel; el límite de payload es 4.5MB por invocación.
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const productsRouter = require('../backend/routes/products');

const app = express();
app.use(cors());
app.use(express.json());

let conectado = false;
app.use(async (req, res, next) => {
  if (!conectado) {
    await mongoose.connect(process.env.MONGO_URI);
    conectado = true;
  }
  next();
});

app.use('/api/products', productsRouter);

module.exports = app;
module.exports.handler = serverless(app);
