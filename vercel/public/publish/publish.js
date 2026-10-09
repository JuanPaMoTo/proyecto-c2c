
const API_BASE = window.API_BASE_URL || '/api';

const form = document.getElementById('formPublicar');
const btn = document.getElementById('btnPublicar');
const inputImagen = document.getElementById('imagen');
const previsualizacion = document.getElementById('previsualizacion');
const mensaje = document.getElementById('mensajeServidor');

const campos = [
  document.getElementById('titulo'),
  document.getElementById('descripcion'),
  document.getElementById('precio'),
  document.getElementById('categoria')
];

function validar() {
  const valido = campos.every(campo =>
    campo.value.trim() !== '' && campo.checkValidity()
  );

  btn.disabled = !valido;
  return valido;
}

campos.forEach(campo => {
  campo.addEventListener('input', validar);
  campo.addEventListener('change', validar);
});

function mostrarMensaje(texto, tipo = 'info') {
  mensaje.textContent = texto;

  mensaje.style.color =
    tipo === 'error' ? '#ff6b6b' :
    tipo === 'exito' ? '#a4d007' : '#66c0f4';
}

inputImagen.addEventListener('input', () => {
  previsualizacion.replaceChildren();

  const valor = inputImagen.value.trim();
  if (!valor) return;

  try {
    const url = new URL(valor);

    if (!['https:', 'http:'].includes(url.protocol)) return;

    const imagen = document.createElement('img');
    imagen.src = url.href;
    imagen.alt = 'Vista previa del producto';
    imagen.style.maxWidth = '200px';
    imagen.style.maxHeight = '200px';
    imagen.style.objectFit = 'contain';

    imagen.onerror = () => {
      imagen.alt = 'No se pudo cargar la vista previa.';
    };

    previsualizacion.appendChild(imagen);
  } catch {
    // El enlace todavía no está completo.
  }
});

form.addEventListener('submit', async evento => {
  evento.preventDefault();

  if (!validar()) {
    form.reportValidity();
    return;
  }

  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login/login.html';
    return;
  }

  const precio = Number(document.getElementById('precio').value);
  const imagen = inputImagen.value.trim();

  if (!Number.isFinite(precio) || precio <= 0) {
    mostrarMensaje('Ingresa un precio válido mayor que cero.', 'error');
    return;
  }

  if (imagen) {
    try {
      const url = new URL(imagen);

      if (!['https:', 'http:'].includes(url.protocol)) {
        throw new Error('URL no válida');
      }
    } catch {
      mostrarMensaje('Ingresa un enlace de imagen válido.', 'error');
      return;
    }
  }

  const producto = {
    titulo: document.getElementById('titulo').value.trim(),
    descripcion: document.getElementById('descripcion').value.trim(),
    precio,
    categoria: document.getElementById('categoria').value,
    imagen
  };

  btn.disabled = true;
  btn.textContent = 'Publicando...';
  mostrarMensaje('Enviando producto...');

  try {
    const respuesta = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(producto)
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      console.error('Error al publicar:', respuesta.status, datos);

      if (respuesta.status === 401 || respuesta.status === 403) {
        mostrarMensaje(
          'Tu sesión no es válida. Inicia sesión nuevamente.',
          'error'
        );
      } else {
        mostrarMensaje(
          datos.error || datos.message ||
          `No se pudo publicar. Error ${respuesta.status}.`,
          'error'
        );
      }

      return;
    }

    mostrarMensaje('¡Producto publicado exitosamente!', 'exito');
    form.reset();
    previsualizacion.replaceChildren();

    setTimeout(() => {
      window.location.href = '/search/search.html';
    }, 1200);
  } catch (error) {
    console.error('Error de conexión:', error);

    mostrarMensaje(
      'No se pudo conectar con el servidor. Revisa la consola y el estado de la API.',
      'error'
    );
  } finally {
    btn.textContent = 'Publicar producto';
    validar();
  }
});

validar();