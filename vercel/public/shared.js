
/* =========================================
   NEXORA MARKETPLACE
   Encabezado compartido y navegación
========================================= */

(function () {
  function leerUsuario() {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
      return null;
    }
  }

  function crearEnlace(texto, ruta, clase) {
    const enlace = document.createElement('a');
    enlace.textContent = texto;
    enlace.href = ruta;

    if (clase) {
      enlace.className = clase;
    }

    return enlace;
  }

  function crearBoton(texto, clase, accion) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = texto;
    boton.className = clase;
    boton.addEventListener('click', accion);
    return boton;
  }

  function construirHeader() {
    // Evitar duplicar el encabezado
    if (document.querySelector('.nexora-header')) return;

    const usuario = leerUsuario();
    const token = localStorage.getItem('token');

    const header = document.createElement('header');
    header.className = 'giate-header nexora-header';

    const superior = document.createElement('div');
    superior.className = 'giate-header-top';

    // Logo de Nexora
    const logo = document.createElement('a');
    logo.className = 'giate-logo';
    logo.href = '/';

    const nombreLogo = document.createElement('span');
    nombreLogo.textContent = 'NEXORA';

    logo.appendChild(nombreLogo);

    // Buscador compartido
    const busqueda = document.createElement('form');
    busqueda.className = 'giate-search';

    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = '¿Qué estás buscando?';
    input.setAttribute('aria-label', 'Buscar productos');

    const botonBuscar = document.createElement('button');
    botonBuscar.type = 'submit';
    botonBuscar.textContent = 'Buscar';

    busqueda.append(input, botonBuscar);

    busqueda.addEventListener('submit', function (e) {
      e.preventDefault();

      const consulta = input.value.trim();
      const destino = '/search/search.html';

      window.location.href = consulta
        ? destino + '?search=' + encodeURIComponent(consulta)
        : destino;
    });

    // Acciones según el estado de la sesión
    const enlaces = document.createElement('nav');
    enlaces.className = 'giate-nav-links';
    enlaces.setAttribute('aria-label', 'Navegación principal');

    if (token && usuario) {
      const nombre = document.createElement('span');
      nombre.style.color = '#c7d5e0';
      nombre.textContent =
        'Hola, ' + (usuario.nombre || usuario.name || 'Usuario');

      enlaces.appendChild(nombre);

      enlaces.appendChild(
        crearEnlace(
          'Publicar',
          '/publish/publish.html',
          'giate-btn'
        )
      );

      enlaces.appendChild(
        crearBoton(
          'Cerrar sesión',
          'giate-btn-secundario',
          function () {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/';
          }
        )
      );
    } else {
      enlaces.appendChild(
        crearEnlace(
          'Iniciar sesión',
          '/login/login.html',
          'giate-btn-secundario'
        )
      );

      enlaces.appendChild(
        crearEnlace(
          'Registrarse',
          '/register/register.html',
          'giate-btn'
        )
      );
    }

    superior.append(logo, busqueda, enlaces);

    // Navegación secundaria
    const subnav = document.createElement('div');
    subnav.className = 'giate-subnav';

    const subnavInterior = document.createElement('nav');
    subnavInterior.className = 'giate-subnav-inner';
    subnavInterior.setAttribute('aria-label', 'Secciones');

    subnavInterior.appendChild(
      crearEnlace('Inicio', '/')
    );

    subnavInterior.appendChild(
      crearEnlace('Explorar productos', '/search/search.html')
    );

    if (token && usuario) {
      subnavInterior.appendChild(
        crearEnlace(
          'Publicar producto',
          '/publish/publish.html'
        )
      );
    }

    subnav.appendChild(subnavInterior);
    header.append(superior, subnav);

    document.body.prepend(header);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', construirHeader);
  } else {
    construirHeader();
  }
})();