// HU-04: Checkout de Nexora
// Consulta el producto y procesa el pedido mediante la API.

const API_BASE = window.API_BASE_URL || "/api";

const params = new URLSearchParams(window.location.search);
const productoId = params.get("id");

const detalleProducto = document.getElementById("detalleProducto");
const formCheckout = document.getElementById("formCheckout");
const btnComprar = document.getElementById("btnComprar");
const mensaje = document.getElementById("mensajeServidor");
const totalProducto = document.getElementById("totalProducto");

let productoActual = null;
let procesandoCompra = false;

// Formatea el precio en dólares, sin cambiar el valor guardado en MongoDB.
function formatearPrecio(precio) {
  const valor = Number(precio);

  if (!Number.isFinite(valor) || valor < 0) {
    return "Precio no disponible";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(valor);
}

// Evita interpretar los datos de la API como HTML.
function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caracter) => {
    const entidades = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entidades[caracter];
  });
}

// Permite leer respuestas JSON y también mensajes de error en texto.
async function leerRespuesta(respuesta) {
  const texto = await respuesta.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto);
  } catch {
    return { error: texto.slice(0, 300) };
  }
}

function mostrarErrorProducto(texto) {
  detalleProducto.innerHTML = `
    <h2>No pudimos cargar el producto</h2>
    <p class="descripcion-producto">${escaparHTML(texto)}</p>
    <a class="btn-volver" href="/search/search.html">
      Volver al catálogo
    </a>
  `;

  totalProducto.textContent = "No disponible";
  btnComprar.disabled = true;
}

function mostrarMensaje(texto, tipo = "error") {
  mensaje.textContent = texto;

  mensaje.style.color =
    tipo === "exito" ? "#a4d007" :
    tipo === "info" ? "#66c0f4" :
    "#ff7777";
}

// Carga el producto desde GET /api/products/:id.
async function cargarProducto() {
  if (!productoId || !/^[a-f\d]{24}$/i.test(productoId)) {
    mostrarErrorProducto("El enlace no contiene un identificador de producto válido.");
    return;
  }

  detalleProducto.innerHTML = `
    <p class="estado-carga">Consultando el catálogo de Nexora...</p>
  `;

  try {
    const respuesta = await fetch(
      `${API_BASE}/products/${encodeURIComponent(productoId)}`
    );

    const datos = await leerRespuesta(respuesta);

    if (!respuesta.ok) {
      console.error("Error al consultar el producto:", respuesta.status, datos);

      mostrarErrorProducto(
        respuesta.status === 404
          ? "El producto no existe o fue eliminado."
          : `La API respondió con el estado ${respuesta.status}. Inténtalo de nuevo más tarde.`
      );

      return;
    }

    if (!datos.producto || !datos.producto._id) {
      console.error("Respuesta inesperada al cargar el producto:", datos);
      mostrarErrorProducto("La API no devolvió los datos esperados del producto.");
      return;
    }

    productoActual = datos.producto;

    const titulo = escaparHTML(productoActual.titulo);
    const descripcion = escaparHTML(productoActual.descripcion);
    const categoria = escaparHTML(productoActual.categoria);
    const precio = formatearPrecio(productoActual.precio);

    // Solo se muestran imágenes alojadas mediante HTTPS.
    const imagenOriginal = productoActual.imagenes?.[0];
    const imagenSegura =
      typeof imagenOriginal === "string" &&
      /^https:\/\//i.test(imagenOriginal)
        ? imagenOriginal
        : "";

    detalleProducto.innerHTML = `
      ${
        imagenSegura
          ? `<img src="${escaparHTML(imagenSegura)}"
                  alt="${titulo}"
                  id="imagenProducto">`
          : `<div class="estado-carga">Este producto no tiene imagen disponible.</div>`
      }

      <p class="etiqueta">DETALLE DEL PRODUCTO</p>
      <h2>${titulo}</h2>
      <p class="descripcion-producto">${descripcion}</p>
      <span class="categoria-producto">${categoria}</span>
      <p class="precio">${precio}</p>
    `;

    totalProducto.textContent = precio;
    btnComprar.disabled = false;

    const imagen = document.getElementById("imagenProducto");

    if (imagen) {
      imagen.addEventListener("error", () => {
        imagen.remove();
      });
    }
  } catch (error) {
    console.error("No se pudo consultar GET /api/products/:id:", error);

    mostrarErrorProducto(
      "No fue posible comunicarse con la API. Comprueba la conexión y vuelve a intentarlo."
    );
  }
}

// Procesa la compra mediante POST /api/orders.
formCheckout.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (procesandoCompra) {
    return;
  }

  if (!productoActual) {
    mostrarMensaje("Primero debes cargar un producto válido.");
    return;
  }

  if (!formCheckout.reportValidity()) {
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    const volverA = window.location.pathname + window.location.search;

    window.location.href =
      `/login/login.html?returnTo=${encodeURIComponent(volverA)}`;

    return;
  }

  const direccion = document.getElementById("direccion").value.trim();
  const metodoPago = document.getElementById("metodoPago").value;
  const numeroTarjeta = document.getElementById("numeroTarjeta").value.trim();

  if (!direccion || !numeroTarjeta) {
    mostrarMensaje("Completa la dirección y los datos de pago.");
    return;
  }

  procesandoCompra = true;
  btnComprar.disabled = true;
  btnComprar.textContent = "Procesando compra...";
  mostrarMensaje("Enviando pedido al servidor...", "info");

  try {
    const respuesta = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        productoId: productoActual._id,
        direccionEntrega: direccion,
        metodoPago,
        tokenPago: "pm_card_visa"
      })
    });

    const datos = await leerRespuesta(respuesta);

    if (!respuesta.ok) {
      console.error("Error al crear el pedido:", respuesta.status, datos);

      if (respuesta.status === 401 || respuesta.status === 403) {
        mostrarMensaje(
          "Tu sesión no es válida o no tienes permiso para comprar. Inicia sesión nuevamente."
        );
      } else {
        mostrarMensaje(
          datos.error ||
          datos.message ||
          `No se pudo procesar la compra (HTTP ${respuesta.status}).`
        );
      }

      return;
    }

    const orden = datos.orden;
    const ordenId = orden?._id || orden?.id;

    if (!ordenId) {
      console.error("La API no devolvió el identificador de la orden:", datos);

      mostrarMensaje(
        "El servidor respondió, pero no devolvió el número del pedido. Comprueba el backend antes de volver a comprar."
      );

      return;
    }

    mostrarMensaje("Pedido creado correctamente. Abriendo el recibo...", "exito");

    window.location.href =
      `/checkout/confirmacion.html?orden=${encodeURIComponent(ordenId)}`;

  } catch (error) {
    console.error("Error de conexión al procesar el pedido:", error);

    mostrarMensaje(
      "No se pudo conectar con la API de compras. Revisa la conexión e inténtalo nuevamente."
    );
  } finally {
    procesandoCompra = false;
    btnComprar.textContent = "Comprar ahora";

    if (!productoActual || window.location.pathname.endsWith("confirmacion.html")) {
      btnComprar.disabled = true;
    } else {
      btnComprar.disabled = false;
    }
  }
});

// Carga inicial del producto.
cargarProducto();
