// HU-03: Búsqueda y filtrado - consumo de GET /api/products
const API_BASE = window.API_BASE_URL || '/api';

const inputBusqueda = document.getElementById('inputBusqueda');
const btnBuscar = document.getElementById('btnBuscar');
const btnFiltros = document.getElementById('btnAplicarFiltros');
const contenedorResultados = document.getElementById('resultados');

async function buscarProductos() {
  const params = new URLSearchParams();
  if (inputBusqueda.value.trim()) params.set('search', inputBusqueda.value.trim());

  const categoria = document.getElementById('categoria').value;
  const minPrice = document.getElementById('minPrice').value;
  const maxPrice = document.getElementById('maxPrice').value;
  if (categoria) params.set('category', categoria);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);

  contenedorResultados.innerHTML = '<p>Cargando productos...</p>';

  try {
    const respuesta = await fetch(`${API_BASE}/products?${params.toString()}`);
    const datos = await respuesta.json();
    renderizarResultados(datos.productos || []);
  } catch (err) {
    contenedorResultados.innerHTML = '<p>No se pudieron cargar los productos.</p>';
  }
}

function renderizarResultados(productos) {
  contenedorResultados.innerHTML = '';
  if (productos.length === 0) {
    contenedorResultados.innerHTML = '<p>No se encontraron productos.</p>';
    return;
  }

  productos.forEach((p) => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta-producto';
    tarjeta.innerHTML = `
      <img src="${p.imagenes?.[0] || 'https://via.placeholder.com/220x140?text=Sin+imagen'}" alt="${p.titulo}" />
      <div class="info">
        <p class="titulo">${p.titulo}</p>
        <p class="precio">$${Number(p.precio).toFixed(2)}</p>
      </div>
    `;
    tarjeta.addEventListener('click', () => {
      window.location.href = `../checkout/checkout.html?id=${p._id}`;
    });
    contenedorResultados.appendChild(tarjeta);
  });
}

btnBuscar.addEventListener('click', buscarProductos);
btnFiltros.addEventListener('click', buscarProductos);
inputBusqueda.addEventListener('keyup', (e) => { if (e.key === 'Enter') buscarProductos(); });

// Carga inicial
buscarProductos();
