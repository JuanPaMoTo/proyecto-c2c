const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
nombre: { type: String, required: true },
email: {
type: String,
required: true,
unique: true,
lowercase: true
},
password: { type: String, required: true },
telefono: { type: String, required: true },
createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
