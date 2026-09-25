// routes/auth.js
// HU-01: Registro de Usuarios
// Endpoint: POST /api/auth/register
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const router = express.Router();

// Modelo de Usuario (capa de datos)
const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  telefono: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Validaciones de entrada (equivalente backend de la validación en tiempo real del frontend)
const validateRegister = [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Formato de correo inválido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('telefono').notEmpty().withMessage('El teléfono es obligatorio'),
];

// POST /api/auth/register
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email, password, telefono } = req.body;

    // Verificación de unicidad de correo
    const existente = await User.findOne({ email });
    if (existente) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Encriptación segura de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await User.create({
      nombre,
      email,
      password: hashedPassword,
      telefono,
    });

    // Emisión de token JWT tras registro exitoso
    const token = jwt.sign(
      { id: nuevoUsuario._id, email: nuevoUsuario.email },
      process.env.JWT_SECRET || 'secret_dev',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: nuevoUsuario._id, nombre, email },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login (soporte complementario para HU-02/03/04, que requieren sesión)
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const usuario = await User.findOne({ email });
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email },
      process.env.JWT_SECRET || 'secret_dev',
      { expiresIn: '7d' }
    );

    return res.json({ token, user: { id: usuario._id, nombre: usuario.nombre, email } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
