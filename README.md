# Sistema C2C — Taller 1: Sistema complejo, construcción y desarrollo

Idea: *"Crear un sistema de software C2C donde cada cliente registrado pueda vender y comprar productos"*.

## Enlace de acceso a la arquitectura (Mermaid, publicada como página interactiva)
https://claude.ai/artifact/EffwbkKvFfkvtT1CX5g2HP

## Contenido del ZIP

```
proyecto-c2c/
├── docs/
│   └── Documento_Sistema_C2C_Arquitectura_Endpoints_Frontend_Vercel.docx  <- Documento final (todo el código + arquitectura)
├── architecture/           <- Los 4 niveles del modelo C4 en Mermaid (.mmd)
│   ├── 1-c4-context.mmd
│   ├── 2-c4-container.mmd
│   ├── 3-c4-component.mmd
│   └── 4-c4-code.mmd
├── architecture-viewer.html <- Página HTML que renderiza los 4 diagramas (misma que el link publicado)
├── backend/                <- API REST Node.js/Express (HU-01 a HU-04)
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js
│   └── routes/{auth,products,orders}.js
├── frontend/                <- HTML/CSS/JS por historia de usuario
│   ├── register/  (HU-01)
│   ├── publish/   (HU-02)
│   ├── search/    (HU-03)
│   └── checkout/  (HU-04)
├── proxy/
│   └── nginx.conf           <- Proxy inverso (arquitectura multicapa)
├── docker-compose.yml       <- Orquesta proxy + frontend + backend + BD + cache
└── vercel/                  <- Adaptación del backend a Serverless Functions + config de despliegue
    ├── vercel.json
    ├── api/{auth,products,orders}.js
    ├── public/               (copia del frontend)
    └── README-DEPLOY.md
```

## Cómo correr localmente (arquitectura multicapa completa)

```bash
docker compose up --build
```

Esto levanta: proxy inverso (Nginx, puerto 80/443) → frontend estático → API (Node/Express) → MongoDB → Redis.

## Cómo desplegar en Vercel

Ver `vercel/README-DEPLOY.md`.

## Historias de Usuario y endpoints

| HU | Descripción | Endpoint |
|---|---|---|
| HU-01 | Registro de Usuarios | `POST /api/auth/register` |
| HU-02 | Publicación de un Producto | `POST /api/products` |
| HU-03 | Búsqueda y Filtrado de Productos | `GET /api/products` |
| HU-04 | Proceso de Compra | `POST /api/orders` |
