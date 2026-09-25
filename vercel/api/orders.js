// api/orders.js
// Adaptación a Vercel: /api/orders/* como Serverless Function (HU-04)
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const ordersRouter = require('../backend/routes/orders');

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

app.use('/api/orders', ordersRouter);

module.exports = app;
module.exports.handler = serverless(app);
