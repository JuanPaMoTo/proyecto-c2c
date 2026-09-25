# Despliegue en Vercel

## ⚠️ Si te aparece "This page doesn't exist / 404 NOT_FOUND"

Casi siempre es una de estas dos causas:

1. **Root Directory mal configurado**: si subiste el ZIP completo `proyecto-c2c/` (con `backend/`,
   `frontend/`, `vercel/`, etc.), en el dashboard de Vercel ve a **Settings → General → Root
   Directory** y ponlo en `vercel` (la subcarpeta), no en la raíz del repo. Vercel necesita que
   `vercel.json`, `api/` y `public/` estén en la raíz del Root Directory que configures.
2. **No había `index.html`**: ya se agregó `public/index.html`, que redirige automáticamente a
   `/register/register.html`.

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
