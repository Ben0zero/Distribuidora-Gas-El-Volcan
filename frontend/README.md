# Distribuidora de Gas El Volcán — Frontend (React)

Aplicación web **SPA** para vender y distribuir gas GLP y accesorios, hecha con **React + Vite + React Bootstrap + React Router**. Es la **Versión 3** del proyecto semestral de Desarrollo Full Stack II (DSY1104).

Consume la API REST de los microservicios Spring Boot (`ms-auth`, `ms-catalogoProductos`, `ms-inventario` y `ms-ventas`) con `fetch` y autenticación **JWT**.

> Versiones anteriores:
> - **V1:** HTML, CSS y JS.
> - **V2:** React con datos en `localStorage`.
>
> En la V3, la autenticación, el catálogo, el inventario, las compras y los usuarios vienen de la API. En `localStorage` solo quedan la **sesión** (token JWT y datos del usuario) y el **carrito**.

---

## Stack

| Tecnología | Versión | Para qué |
|---|---|---|
| Vite | 8.3 | Servidor de desarrollo y build |
| React / React DOM | 19.2 | Componentes y SPA |
| react-router-dom | 7.18 | Rutas, rutas protegidas por rol y redirecciones |
| react-bootstrap / Bootstrap | 2.10 / 5.3 | Componentes y estilos |
| bootstrap-icons | 1.13 | Íconos |
| `fetch` (nativo del navegador) | — | Llamadas REST a los microservicios (sin Axios) |
| oxlint | 1.81 | Linter (`npm run lint`) |
| Vitest + Testing Library + jsdom | 3.2 / 16.3 / 26.1 | Pruebas unitarias y de componentes |
| @vitest/coverage-v8 | 3.2 | Cobertura (`npm run test:coverage`) |

---

## Cómo correrlo

Primero hay que levantar los microservicios: ver `microservicios/README.md` o el script `levantar-servicios.ps1`.

```bash
npm install           # dependencias (la primera vez)
npm run dev           # http://localhost:5173
npm run lint          # oxlint
npm run build         # build de producción en dist/
npm test              # todas las pruebas (Vitest, una vez)
npm run test:watch    # pruebas en modo vigilancia
npm run test:coverage # pruebas + cobertura en coverage/
```

> En PowerShell usar `npm.cmd` si la política de ejecución bloquea `npm.ps1`.

**URLs de la API** (`src/utils/api.js`):
- `http://localhost:8081/api/v1/auth` y `/api/v1/usuarios`
- `http://localhost:8082/api/v1/productos`
- `http://localhost:8084/api/v1/inventario`
- `http://localhost:8086/api/v1/ventas`

El backend permite CORS desde `localhost` y `127.0.0.1` en los puertos 5173 y 5174.

**Credenciales de prueba:**

| Usuario | Contraseña | Rol | Llega a |
|---|---|---|---|
| `admin@duoc.cl` | `Admin123` | Administrador | `/admin` |
| `vendedor@elvolcan.cl` | `Vendedor123` | Vendedor | `/vendedor` |
| `cliente@elvolcan.cl` | `Cliente123` | Cliente | `/` (tienda) |

---

## Roles y vistas

| Rol | Vistas | Protección |
|---|---|---|
| **Visitante** | Tienda pública (inicio, catálogo, detalle, carrito, info), login y registro | — |
| **Cliente** | La tienda, más checkout (`/ventas`) y **Mis compras** (`/mis-compras`) | `RutaProtegida` |
| **Vendedor** | **Solo** `/vendedor`: lista y detalle de productos y de órdenes. Si abre la tienda se le redirige a su panel | `RutaProtegida` + `LayoutPublico` |
| **Administrador** | Todo: `/admin` (dashboard, inventario, órdenes, usuarios, clientes y reportes), la tienda y el panel del vendedor | `RutaProtegida` |

`RutaProtegida` revisa la sesión y la **expiración del JWT** (`exp`). Sin sesión envía a `/login` y recuerda la página pedida. Con un rol no permitido, vuelve a la ruta inicial de su rol. La seguridad real está en el backend: el frontend solo evita mostrar vistas que no corresponden.

---

## Estructura del proyecto

```
frontend/
├── README.md · package.json · vite.config.js · .oxlintrc.json · nginx.conf · index.html
├── docs/                         → ERS, documentación técnica, cobertura, despliegue (.md y .pdf)
├── public/IMAGENES/              → imágenes de productos (las rutas vienen en la API: campo "imagen")
└── src/
    ├── main.jsx · App.jsx        → montaje y rutas (públicas, protegidas, /admin, /vendedor)
    ├── datos/productos.js        → catálogo de referencia (se usa solo si la API no responde)
    ├── utils/                    → lógica pura y llamadas a la API (todo con pruebas)
    │   ├── api.js                → fetch a los 4 microservicios + ApiError (código HTTP) + mensajes del backend
    │   ├── sesion.js             → sesión desde el login, roles, lectura de exp del JWT, sesionActiva()
    │   ├── useCatalogo.js        → hook: catálogo de la API o de referencia con aviso "sin conexión"
    │   ├── productos.js          → desdeApi(): ProductoResponseDTO → formato de los componentes
    │   ├── carrito.js            → operaciones del carrito (ids numéricos de la API)
    │   ├── inventario.js         → unir catálogo + stock por SKU, ajuste de stock por diferencia
    │   ├── ventas.js             → estados, ORD-n, resumen de ventas (KPI, comunas)
    │   ├── reportes.js           → clientes, ventas mensuales, por categoría, más vendidos, CSV
    │   └── validaciones.js       → validaciones de formularios y regiones/comunas
    ├── testUtils/jwt.js          → JWT de prueba para los tests
    ├── components/               → Navbar (según rol), LayoutPublico, RutaProtegida, AvisoSinConexion, Producto, Footer…
    └── pages/
        ├── Inicio, Productos, DetalleProducto, Carrito, Ventas (checkout), MisCompras,
        │   Login, Registro, Nosotros, Consejos, Tiendas, Contacto
        ├── admin/                → AdminLayout, Dashboard, Inventario, Ordenes, ListaUsuarios,
        │                           NuevoUsuario, Clientes, Reportes
        └── vendedor/             → VendedorLayout, ProductosVendedor, DetalleProductoVendedor,
                                    OrdenesVendedor, DetalleOrdenVendedor
```

---

## Funcionalidades e integración con la API

### Tienda (Visitante y Cliente)
- **Catálogo** (`GET /api/v1/productos`, público): 14 productos con precio residencial y comercial, imagen y filtro por categoría (`/productos?categoria=Reguladores`).
- **Detalle** (`GET /api/v1/productos/id/{id}`).
- **Carrito** persistente, con los ids numéricos del catálogo.
- **Checkout** (`/ventas`): dirección, comuna y método de pago.
  1. `POST /api/v1/ventas` crea la venta; ms-ventas valida el precio y el stock por Feign.
  2. `PUT /api/v1/ventas/{id}/confirmar` registra el pago y descuenta el stock.
  3. Si el pago falla, la venta queda pendiente y se puede **reintentar** sobre la misma.
- **Mis compras** (`GET /api/v1/ventas/mis-compras`): historial con productos, despacho, estado y "Pagar ahora" en las pendientes.
- **Registro** (`POST /api/v1/auth/register`): siempre crea un Cliente. Si el correo o el RUN ya existen, muestra el aviso (409).
- **Login** (`POST /api/v1/auth/login`): guarda el token y el rol, y redirige según el rol. Solo autentica ms-auth: no hay usuarios locales.
- **Sin conexión:** si un microservicio no responde, se muestra un aviso visible y se deshabilita la compra; ya no hay fallas silenciosas.

### Panel del Vendedor (`/vendedor`, solo lectura)
- Productos y su detalle con stock de `ms-inventario`.
- Órdenes (`GET /api/v1/ventas`) y su detalle (`GET /api/v1/ventas/{id}`), con cliente, despacho y líneas.

### Panel de Administración (`/admin`)
- **Dashboard:** ingresos, órdenes, pendientes y stock crítico reales, más las últimas órdenes.
- **Inventario:** CRUD de productos (`POST`, `PUT` y `DELETE` en el catálogo) y ajuste de stock (`aumentar` / `disminuir`).
- **Órdenes:** todas las ventas, con KPI y distribución por comuna.
- **Usuarios:** lista de ms-auth y **alta con rol** (Admin, Vendedor o Cliente), con `POST /api/v1/usuarios`.
- **Clientes** y **Reportes:** calculados con `/usuarios` y `/ventas`. Incluye exportación **CSV** de las ventas y de los productos más vendidos.

---

## Pruebas

**91 pruebas en 26 archivos** (Vitest + Testing Library). Las llamadas a la API se simulan con `vi.stubGlobal('fetch', …)`, así que las pruebas no necesitan los microservicios levantados.

| Área | Archivos de prueba |
|---|---|
| Lógica pura | `validaciones`, `carrito`, `productos`, `inventario`, `ventas`, `reportes`, `sesion`, `useCatalogo` |
| Componentes | `Producto`, `Navbar` (por rol), `RutaProtegida` |
| Tienda | `Login`, `Registro`, `DetalleProducto`, `Carrito`, `Ventas` (checkout), `MisCompras`, `Nosotros` |
| Vendedor | `PanelVendedor` |
| Administrador | `Inventario`, `PanelAdmin` (órdenes, dashboard, usuarios), `NuevoUsuario`, `ClientesReportes` |

El inventario de pruebas, los resultados y la cobertura están en `docs/DOCUMENTO_COBERTURA_TESTING.md`.

---

## Documentación relacionada

- `docs/ERS_ACTUALIZADO.md`: especificación de requerimientos.
- `docs/DOCUMENTACION.md`: explicación técnica de componentes, páginas y decisiones.
- `docs/DOCUMENTO_COBERTURA_TESTING.md`: pruebas y cobertura.
- `docs/GUIA_CONCEPTOS_CODIGO.md`: conceptos de JS y React usados en el código.
- `docs/DEPLOY.md` y `docs/BITACORA_DEPLOY_AWS.md`: despliegue en AWS EC2 + Nginx (de la V2).
- `../docs/parcial3/`: anexos de la Evaluación Parcial 3 (APIs, integración y manual de usuario).

---

**Duoc UC — Analista Programador | DSY1104 Desarrollo Full Stack II**
