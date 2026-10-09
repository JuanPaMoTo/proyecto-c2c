
 // HU-01: Validación y registro de usuarios
 // Endpoint: POST /api/auth/register

const API_BASE = window.API_BASE_URL || '/api';

const form = document.getElementById('formRegistro');
const btn = document.getElementById('btnRegistrar');

const campos = {
  nombre: document.getElementById('nombre'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  confirmPassword: document.getElementById('confirmPassword'),
  telefono: document.getElementById('telefono')
};

// Validar formato del correo electrónico
function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

// Evaluar fortaleza de la contraseña
function evaluarFortaleza(pass) {
  let puntos = 0;

  if (pass.length >= 8) puntos++;
  if (/[A-Z]/.test(pass)) puntos++;
  if (/[0-9]/.test(pass)) puntos++;
  if (/[^A-Za-z0-9]/.test(pass)) puntos++;

  return puntos;
}

// Mostrar o quitar errores de los campos
function marcarError(input, spanId, mensaje) {
  const span = document.getElementById(spanId);

  if (!input || !span) return;

  if (mensaje) {
    input.classList.add('invalido');
    span.textContent = mensaje;
  } else {
    input.classList.remove('invalido');
    span.textContent = '';
  }
}

// Validar todos los campos del formulario
function validarFormulario() {
  let valido = true;

  // Nombre
  if (!campos.nombre.value.trim()) {
    marcarError(
      campos.nombre,
      'errorNombre',
      'El nombre es obligatorio'
    );
    valido = false;
  } else {
    marcarError(campos.nombre, 'errorNombre', '');
  }

  // Correo
  if (!validarEmail(campos.email.value.trim())) {
    marcarError(
      campos.email,
      'errorEmail',
      'Formato de correo inválido'
    );
    valido = false;
  } else {
    marcarError(campos.email, 'errorEmail', '');
  }

  // Contraseña
  const password = campos.password.value;
  const fuerza = evaluarFortaleza(password);
  const indicador = document.getElementById('fortalezaPassword');

  if (password.length < 8) {
    marcarError(
      campos.password,
      'errorPassword',
      'Mínimo 8 caracteres'
    );

    if (indicador) indicador.textContent = '';
    valido = false;
  } else {
    marcarError(campos.password, 'errorPassword', '');

    if (indicador) {
      if (fuerza <= 2) {
        indicador.textContent = 'Débil';
        indicador.className = 'fortaleza debil';
      } else if (fuerza === 3) {
        indicador.textContent = 'Media';
        indicador.className = 'fortaleza media';
      } else {
        indicador.textContent = 'Fuerte';
        indicador.className = 'fortaleza fuerte';
      }
    }
  }

  // Confirmación de contraseña
  if (
    !campos.confirmPassword.value ||
    campos.confirmPassword.value !== password
  ) {
    marcarError(
      campos.confirmPassword,
      'errorConfirmPassword',
      'Las contraseñas no coinciden'
    );
    valido = false;
  } else {
    marcarError(
      campos.confirmPassword,
      'errorConfirmPassword',
      ''
    );
  }

  // Teléfono
  if (!campos.telefono.value.trim()) {
    marcarError(
      campos.telefono,
      'errorTelefono',
      'El teléfono es obligatorio'
    );
    valido = false;
  } else {
    marcarError(campos.telefono, 'errorTelefono', '');
  }

  btn.disabled = !valido;

  return valido;
}

// Validar en tiempo real al escribir
Object.values(campos).forEach((input) => {
  input.addEventListener('input', validarFormulario);
});

// Procesar el registro
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validarFormulario()) return;

  const mensaje = document.getElementById('mensajeServidor');

  btn.disabled = true;
  btn.textContent = 'Registrando...';
  mensaje.textContent = '';
  mensaje.style.color = '#e11d48';

  try {
    const respuesta = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: campos.nombre.value.trim(),
        email: campos.email.value.trim(),
        password: campos.password.value,
        telefono: campos.telefono.value.trim()
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.textContent =
        datos.error || 'Error al registrar el usuario.';
      return;
    }

    // Guardar la sesión si el backend devuelve un token
    if (datos.token) {
      localStorage.setItem('token', datos.token);
    }

    // Guardar los datos del usuario
    const usuario = datos.user || datos.usuario;

    if (usuario) {
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }

    // Confirmar el resultado del registro
    mensaje.style.color = '#20c45a';

    if (datos.token && usuario) {
      mensaje.textContent =
        '¡Registro exitoso! Redirigiendo al catálogo...';

      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } else {
      mensaje.textContent =
        'Registro exitoso. Inicia sesión para continuar.';

      setTimeout(() => {
        window.location.href = '/login/login.html';
      }, 1500);
    }

  } catch (error) {
    console.error('Error en el registro:', error);

    mensaje.style.color = '#e11d48';
    mensaje.textContent =
      'No se pudo conectar con el servidor. Intenta nuevamente.';

  } finally {
    btn.textContent = 'Registrarme';

    // No habilitar el botón si los datos siguen siendo inválidos
    validarFormulario();
  }
});

// Estado inicial del formulario
validarFormulario();