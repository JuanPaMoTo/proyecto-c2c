# Despliegue en Vercel

Esta carpeta (`vercel/`) es **autocontenida**: ya no depende de `../../backend`. Las rutas de
Express que antes vivían solo en `backend/routes/` están copiadas dentro de
`vercel/backend/routes/` y `vercel/backend/middleware/`, para que todo lo que las Serverless
Functions necesitan (código + `node_modules` de `vercel/package.json`) esté dentro del mismo
Root Directory. Si editas la lógica de negocio, recuerda mantener sincronizadas ambas copias
(`backend/routes/*.js` para Docker/Nginx, y `vercel/backend/routes/*.js` para Vercel).

## ⚠️ Checklist de errores ya solucionados

1. **404 NOT_FOUND en `/`**: causado por no tener `index.html` en `public/`. Ya se agregó
   `public/index.html`, que redirige a `/register/register.html`.
2. **Root Directory mal configurado**: en el dashboard de Vercel, **Settings → General → Root
   Directory**, debe apuntar a la carpeta `vercel` dentro de tu repo (no a la raíz).
3. **500 "Cannot find module 'express'"**: pasaba porque las funciones importaban
   `../../backend/routes/*.js`, un archivo *fuera* del Root Directory, así que sus
   `node_modules` no se instalaban. Ya está resuelto copiando esas rutas dentro de
   `vercel/backend/`. Con este cambio **no** necesitas activar "Include files outside of the
   Root Directory".

## Pasos

1. Instalar la CLI de Vercel:
   ```bash
   npm install -g vercel
   ```
2. Desde la carpeta `vercel/` (¡esta carpeta, no la raíz del proyecto!), iniciar sesión y enlazar
   el proyecto:
   ```bash
   cd vercel
   vercel login
   vercel link
   ```
3. Configurar las variables de entorno directamente (sin `@secret`, para evitar errores de
   "secret does not exist" en el build):
   ```bash
   vercel env add MONGO_URI production
   vercel env add JWT_SECRET production
   vercel env add CLOUDINARY_CLOUD_NAME production
   vercel env add CLOUDINARY_API_KEY production
   vercel env add CLOUDINARY_API_SECRET production
   vercel env add STRIPE_SECRET_KEY production
   ```
   (También puedes cargarlas desde **Settings → Environment Variables** en el dashboard.)
4. Desplegar a producción:
   ```bash
   vercel --prod
   ```
5. Prueba primero el healthcheck de una función antes que el frontend, por ejemplo
   `https://tu-proyecto.vercel.app/api/products` (debería responder JSON, no 404 HTML).

## Notas de adaptación

- El backend Express (capa API) se dividió en 3 **Serverless Functions** (`api/auth.js`,
  `api/products.js`, `api/orders.js`) porque Vercel no ejecuta un servidor persistente:
  cada archivo exporta una app Express envuelta con `serverless-http`.
- El **proxy inverso Nginx** de la arquitectura on-premise/Docker es reemplazado por el
  **Edge Network de Vercel**, que ya cumple el rol de enrutamiento (`routes` en
  `vercel.json`), SSL automático y CDN para los archivos estáticos del frontend
  (carpeta `public/`, copia de `frontend/`).
- La conexión a MongoDB se reutiliza entre invocaciones (`conectado` en memoria) para
  mitigar el costo de reconexión en cada *cold start*.
- Actualiza `API_BASE_URL` en el frontend (`window.API_BASE_URL`) si el dominio de
  producción difiere del dominio del propio despliegue.
