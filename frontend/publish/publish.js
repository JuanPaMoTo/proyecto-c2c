// HU-02: Publicación de producto - previsualización de imágenes y consumo de POST /api/products
const API_BASE = window.API_BASE_URL || '/api';

const form = document.getElementById('formPublicar');
const btn = document.getElementById('btnPublicar');
const inputImagenes = document.getElementById('imagenes');
const previsualizacion = document.getElementById('previsualizacion');

const campos = ['titulo', 'descripcion', 'precio', 'categoria'].map((id) => document.getElementById(id));

function validar() {
  const valido = campos.every((c) => String(c.value).trim() !== '');
  btn.disabled = !valido;
  return valido;
}
campos.forEach((c) => c.addEventListener('input', validar));

// Previsualización de imágenes antes de confirmar la publicación
inputImagenes.addEventListener('change', () => {
  previsualizacion.innerHTML = '';
  Array.from(inputImagenes.files).forEach((file) => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    previsualizacion.appendChild(img);
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validar()) return;

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../register/register.html';
    return;
  }

  const mensaje = document.getElementById('mensajeServidor');
  btn.disabled = true;
  btn.textContent = 'Publicando...';

  const formData = new FormData();
  formData.append('titulo', document.getElementById('titulo').value);
  formData.append('descripcion', document.getElementById('descripcion').value);
  formData.append('precio', document.getElementById('precio').value);
  formData.append('categoria', document.getElementById('categoria').value);
  Array.from(inputImagenes.files).forEach((file) => formData.append('imagenes', file));

  try {
    const respuesta = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.style.color = '#e11d48';
      mensaje.textContent = datos.error || 'Error al publicar el producto';
      return;
    }

    mensaje.style.color = '#16a34a';
    mensaje.textContent = 'Producto publicado exitosamente';
    form.reset();
    previsualizacion.innerHTML = '';
    setTimeout(() => (window.location.href = '../search/search.html'), 1200);
  } catch (err) {
    mensaje.style.color = '#e11d48';
    mensaje.textContent = 'No se pudo conectar con el servidor';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publicar producto';
  }
});
