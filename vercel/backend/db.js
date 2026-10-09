// backend/db.js
// Conexión a MongoDB reutilizable entre invocaciones de Vercel (serverless)
const mongoose = require('mongoose');

let promesa = null;

async function connectDB() {
  // Si ya hay una conexión activa, se reutiliza
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!process.env.MONGO_URI) {
    throw new Error('Falta la variable de entorno MONGO_URI en Vercel');
  }

  // Si la conexión anterior se cayó, se vuelve a intentar desde cero
  if (!promesa || mongoose.connection.readyState === 0) {
    promesa = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        promesa = null; // permite reintentar en la siguiente petición
        throw err;
      });
  }

  await promesa;
  return mongoose.connection;
}

module.exports = connectDB;