// config/db.js
// Capa de acceso a datos - conexión a MongoDB
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/c2c_db');
    console.log('Base de datos conectada correctamente');
  } catch (error) {
    console.error('Error al conectar la base de datos:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
