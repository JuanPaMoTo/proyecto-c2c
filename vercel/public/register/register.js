// HU-01: Lógica de validación en tiempo real y consumo del endpoint POST /api/auth/register
const API_BASE = window.API_BASE_URL || '/api';

const form = document.getElementById('formRegistro');
const btn = document.getElementById('btnRegistrar');
const campos = {
  nombre: document.getElementById('nombre'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  confirmPassword: document.getElementById('confirmPassword'),
  telefono: document.getElementById('telefono'),
};

function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function evaluarFortaleza(pass) {
  let puntos = 0;
  if (pass.length >= 8) puntos++;
  if (/[A-Z]/.test(pass)) puntos++;
  if (/[0-9]/.test(pass)) puntos++;
  if (/[^A-Za-z0-9]/.test(pass)) puntos++;
  return puntos;
}

function marcarError(input, spanId, mensaje) {
  const span = document.getElementById(spanId);
  if (mensaje) {
    input.classList.add('invalido');
    span.textContent = mensaje;
  } else {
    input.classList.remove('invalido');
    span.textContent = '';
  }
}

function validarFormulario() {
  let valido = true;

  if (!campos.nombre.value.trim()) {
    marcarError(campos.nombre, 'errorNombre', 'El nombre es obligatorio');
    valido = false;
  } else marcarError(campos.nombre, 'errorNombre', '');

  if (!validarEmail(campos.email.value)) {
    marcarError(campos.email, 'errorEmail', 'Formato de correo inválido');
    valido = false;
  } else marcarError(campos.email, 'errorEmail', '');

  const fuerza = evaluarFortaleza(campos.password.value);
  const indicador = document.getElementById('fortalezaPassword');
  if (campos.password.value.length < 8) {
    marcarError(campos.password, 'errorPassword', 'Mínimo 8 caracteres');
    indicador.textContent = '';
    valido = false;
  } else {
    marcarError(campos.password, 'errorPassword', '');
    if (fuerza <= 2) { indicador.textContent = 'Débil'; indicador.className = 'fortaleza debil'; }
    else if (fuerza === 3) { indicador.textContent = 'Media'; indicador.className = 'fortaleza media'; }
    else { indicador.textContent = 'Fuerte'; indicador.className = 'fortaleza fuerte'; }
  }

  if (campos.confirmPassword.value !== campos.password.value || !campos.confirmPassword.value) {
    marcarError(campos.confirmPassword, 'errorConfirmPassword', 'Las contraseñas no coinciden');
    valido = false;
  } else marcarError(campos.confirmPassword, 'errorConfirmPassword', '');

  if (!campos.telefono.value.trim()) {
    marcarError(campos.telefono, 'errorTelefono', 'El teléfono es obligatorio');
    valido = false;
  } else marcarError(campos.telefono, 'errorTelefono', '');

  btn.disabled = !valido;
  return valido;
}

Object.values(campos).forEach((input) => input.addEventListener('input', validarFormulario));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validarFormulario()) return;

  const mensaje = document.getElementById('mensajeServidor');
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  try {
    const respuesta = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: campos.nombre.value,
        email: campos.email.value,
        password: campos.password.value,
        telefono: campos.telefono.value,
      }),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.style.color = '#e11d48';
      mensaje.textContent = datos.error || 'Error al registrar el usuario';
      return;
    }

    localStorage.setItem('token', datos.token);
    mensaje.style.color = '#16a34a';
    mensaje.textContent = '¡Registro exitoso! Redirigiendo...';
    setTimeout(() => (window.location.href = '../search/search.html'), 1200);
  } catch (err) {
    mensaje.style.color = '#e11d48';
    mensaje.textContent = 'No se pudo conectar con el servidor';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Registrarme';
  }
});
