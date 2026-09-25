// HU-04: Proceso de compra - detalle del producto, checkout y confirmación
const API_BASE = window.API_BASE_URL || '/api';

const params = new URLSearchParams(window.location.search);
const productoId = params.get('id');
const detalleProducto = document.getElementById('detalleProducto');
const btnComprar = document.getElementById('btnComprar');
const mensaje = document.getElementById('mensajeServidor');

let productoActual = null;

async function cargarProducto() {
  try {
    const respuesta = await fetch(`${API_BASE}/products/${productoId}`);
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      detalleProducto.innerHTML = `<p>${datos.error || 'Producto no encontrado'}</p>`;
      return;
    }
    productoActual = datos.producto;
    detalleProducto.innerHTML = `
      <img src="${productoActual.imagenes?.[0] || 'https://via.placeholder.com/480x220?text=Sin+imagen'}" alt="${productoActual.titulo}" />
      <h1>${productoActual.titulo}</h1>
      <p>${productoActual.descripcion}</p>
      <p class="precio">$${Number(productoActual.precio).toFixed(2)}</p>
    `;
  } catch (err) {
    detalleProducto.innerHTML = '<p>No se pudo cargar el producto.</p>';
  }
}

// Botón "Comprar Ahora" -> dirige al checkout / confirma la compra vía POST /api/orders
btnComprar.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../register/register.html';
    return;
  }

  const direccion = document.getElementById('direccion').value.trim();
  const metodoPago = document.getElementById('metodoPago').value;
  const numeroTarjeta = document.getElementById('numeroTarjeta').value.trim();

  if (!direccion || !numeroTarjeta) {
    mensaje.style.color = '#e11d48';
    mensaje.textContent = 'Completa la dirección de entrega y los datos de pago';
    return;
  }

  btnComprar.disabled = true;
  btnComprar.textContent = 'Procesando...';

  try {
    const respuesta = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        productoId,
        direccionEntrega: direccion,
        metodoPago,
        tokenPago: 'pm_card_visa', // token simulado de la pasarela (Stripe)
      }),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.style.color = '#e11d48';
      mensaje.textContent = datos.error || 'No se pudo procesar la compra';
      return;
    }

    // Redirección a pantalla de confirmación/recibo tras la aprobación
    window.location.href = `../checkout/confirmacion.html?orden=${datos.orden._id}`;
  } catch (err) {
    mensaje.style.color = '#e11d48';
    mensaje.textContent = 'No se pudo conectar con el servidor';
  } finally {
    btnComprar.disabled = false;
    btnComprar.textContent = 'Comprar Ahora';
  }
});

cargarProducto();
