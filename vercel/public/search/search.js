
/* HU-03: Búsqueda y filtrado de productos
   Consumo de GET /api/products */

const API_BASE = window.API_BASE_URL || "/api";

const inputBusqueda = document.getElementById("inputBusqueda");
const btnBuscar = document.getElementById("btnBuscar");
const btnFiltros = document.getElementById("btnAplicarFiltros");
const btnLimpiar = document.getElementById("btnLimpiarFiltros");

const contenedorResultados = document.getElementById("resultados");
const contadorProductos = document.getElementById("contadorProductos");

const categoriaInput = document.getElementById("categoria");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");

// Leer el término de búsqueda recibido por la URL
const parametrosURL = new URLSearchParams(window.location.search);
inputBusqueda.value = parametrosURL.get("search") || "";

// Buscar productos en la API
async function buscarProductos() {
  const params = new URLSearchParams();

  const busqueda = inputBusqueda.value.trim();
  const categoria = categoriaInput.value;
  const minPrice = minPriceInput.value;
  const maxPrice = maxPriceInput.value;

  if (busqueda) {
    params.set("search", busqueda);
  }

  if (categoria) {
    params.set("category", categoria);
  }

  if (minPrice) {
    params.set("minPrice", minPrice);
  }

  if (maxPrice) {
    params.set("maxPrice", maxPrice);
  }

  contenedorResultados.innerHTML =
    '<p class="estado-resultados">Cargando productos...</p>';

  contadorProductos.textContent = "Consultando catálogo...";

  try {
    const respuesta = await fetch(
      `${API_BASE}/products?${params.toString()}`
    );

    if (!respuesta.ok) {
      throw new Error("Error al consultar los productos");
    }

    const datos = await respuesta.json();

    renderizarResultados(datos.productos || []);
  } catch (error) {
    console.error("Error al buscar productos:", error);

    contenedorResultados.innerHTML = `
      <div class="estado-vacio">
        <h3>No se pudieron cargar los productos</h3>
        <p>Comprueba tu conexión e inténtalo de nuevo.</p>
      </div>
    `;

    contadorProductos.textContent = "Error al cargar el catálogo";
  }
}

// Mostrar las tarjetas de productos
function renderizarResultados(productos) {
  contenedorResultados.innerHTML = "";

  contadorProductos.textContent =
    productos.length === 1
      ? "1 producto encontrado"
      : `${productos.length} productos encontrados`;

  if (productos.length === 0) {
    contenedorResultados.innerHTML = `
      <div class="estado-vacio">
        <h3>No encontramos productos</h3>
        <p>Prueba con otra búsqueda o cambia los filtros.</p>
      </div>
    `;

    return;
  }

  productos.forEach((producto) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-producto";

    const imagen = document.createElement("img");

    imagen.src =
      producto.imagenes?.[0] ||
      "https://placehold.co/400x300/213448/c7d5e0?text=Nexora";

    imagen.alt = producto.titulo || "Producto";
    imagen.loading = "lazy";

    imagen.onerror = () => {
      imagen.onerror = null;
      imagen.src =
        "https://placehold.co/400x300/213448/c7d5e0?text=Nexora";
    };

    const info = document.createElement("div");
    info.className = "info";

    const titulo = document.createElement("h3");
    titulo.className = "titulo";
    titulo.textContent = producto.titulo || "Producto sin título";

    const precio = document.createElement("p");
    precio.className = "precio";

    const valorPrecio = Number(producto.precio);

    precio.textContent = Number.isFinite(valorPrecio)
      ? valorPrecio.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0
        })
      : "Precio no disponible";

    const boton = document.createElement("button");
    boton.className = "btn-ver-producto";
    boton.type = "button";
    boton.textContent = "Ver producto";

    // Ir a la página de compra
    boton.addEventListener("click", () => {
      window.location.href =
        `/checkout/checkout.html?id=${encodeURIComponent(producto._id)}`;
    });

    info.appendChild(titulo);
    info.appendChild(precio);
    info.appendChild(boton);

    tarjeta.appendChild(imagen);
    tarjeta.appendChild(info);

    // Permitir abrir el producto al pulsar la tarjeta
    tarjeta.addEventListener("click", (evento) => {
      if (evento.target.closest("button")) {
        return;
      }

      window.location.href =
        `/checkout/checkout.html?id=${encodeURIComponent(producto._id)}`;
    });

    contenedorResultados.appendChild(tarjeta);
  });
}

// Botones de búsqueda y filtros
btnBuscar.addEventListener("click", buscarProductos);
btnFiltros.addEventListener("click", buscarProductos);

// Buscar al presionar Enter
inputBusqueda.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    buscarProductos();
  }
});

// Limpiar todos los filtros
btnLimpiar.addEventListener("click", () => {
  inputBusqueda.value = "";
  categoriaInput.value = "";
  minPriceInput.value = "";
  maxPriceInput.value = "";

  window.history.replaceState(
    {},
    "",
    window.location.pathname
  );

  buscarProductos();
});

// Cargar los productos al entrar a la página
buscarProductos();