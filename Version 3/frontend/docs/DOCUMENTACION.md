# Documentación — Versión 3 (El Volcán en React, conectado a microservicios)

Este documento explica qué se construyó en `frontend/`, cómo funciona cada parte y por qué se decidió así. Complementa al `README.md` del frontend, al `ERS_ACTUALIZADO.md` (requisitos) y al `DOCUMENTO_COBERTURA_TESTING.md` (pruebas). La guía de la API está en `microservicios/README.md`.

> **Cambios de la V2 a la V3:**
> - Los datos dejan de vivir en `localStorage`: autenticación, catálogo, inventario, ventas y usuarios vienen de los microservicios Spring Boot por REST (`fetch` + JWT).
> - Se agregan rutas protegidas por rol, el panel del Vendedor (solo lectura) y el checkout real.
> - El panel de administración trabaja con datos reales.

---

## 1. Qué es y para qué

Es una aplicación **SPA** de la **Distribuidora de Gas El Volcán** hecha con React. Es el cliente web de la arquitectura de microservicios e incorpora lo visto en la asignatura:

- Componentes y **props**.
- **Estado** (`useState`), efectos (`useEffect`) y un **hook propio** (`useCatalogo`).
- **React Router**: rutas anidadas, rutas protegidas y redirecciones (`Navigate`).
- **Formularios controlados** con validación.
- **Consumo de APIs REST** con `fetch`, JWT en el header `Authorization` y manejo de errores por código HTTP.
- **Diseño responsivo** con Bootstrap / React Bootstrap.
- **Pruebas** con Vitest + React Testing Library, simulando la API.

Datos de negocio: los 14 productos de gas (CL001…AC003) con precio residencial y comercial, y tres roles (Administrador, Vendedor y Cliente).

---

## 2. Stack y por qué

| Tecnología | Versión | Rol |
|---|---|---|
| Vite | 8.3 | Desarrollo y build (`npm run dev`, `npm run build`). |
| React / React DOM | 19.2 | Biblioteca de componentes (SPA). |
| react-router-dom | 7.18 | Rutas (`Routes`, `Route`, `Outlet`, `Navigate`, `Link`, `NavLink`, `useParams`, `useLocation`, `useNavigate`). |
| react-bootstrap / bootstrap | 2.10 / 5.3.8 | Componentes UI y grillas. |
| bootstrap-icons | 1.13 | Íconos (`bi-*`). |
| `fetch` (nativo) | — | Llamadas REST. No se usa Axios: `fetch` basta y no agrega dependencias. |
| oxlint | 1.81 | Linter (`npm run lint`). |
| Vitest + Testing Library + jsdom | 3.2 / 16.3 / 26.1 | Pruebas unitarias y de componentes, con `fetch` simulado. |
| @vitest/coverage-v8 | 3.2 | Cobertura (`npm run test:coverage`). |

**Por qué este stack:** es el mismo de la asignatura. Vitest reutiliza la configuración de Vite, corre sobre **jsdom** (sin abrir un navegador) y mide cobertura con el provider `v8`.

---

## 3. Estructura

```
frontend/
├─ index.html · vite.config.js (incluye el bloque `test`) · .oxlintrc.json · nginx.conf
├─ src/
│  ├─ main.jsx                      → arranca React y carga Bootstrap, íconos y CSS
│  ├─ App.jsx                       → rutas (públicas, protegidas, /admin, /vendedor) + estado del carrito
│  ├─ setupTests.js · testUtils/jwt.js → configuración de pruebas y JWT de prueba
│  ├─ datos/productos.js            → catálogo de REFERENCIA (solo si la API no responde)
│  ├─ utils/
│  │  ├─ api.js                     → fetch a los microservicios, ApiError y lanzarError
│  │  ├─ sesion.js                  → roles, sesión desde el login, exp del JWT, sesionActiva()
│  │  ├─ useCatalogo.js             → hook del catálogo (API o referencia + "sin conexión")
│  │  ├─ productos.js               → desdeApi() y catálogo de referencia
│  │  ├─ carrito.js                 → lógica pura del carrito
│  │  ├─ inventario.js              → catálogo + stock, ajuste de stock, validación de producto
│  │  ├─ ventas.js                  → estados, número de orden, resumen de ventas
│  │  ├─ reportes.js                → clientes, ventas mensuales, por categoría, más vendidos, CSV
│  │  └─ validaciones.js            → validaciones de formularios, REGIONES, CATEGORIAS, CLAVES
│  ├─ components/                   → LayoutPublico, Navbar, RutaProtegida, AvisoSinConexion,
│  │                                  Producto, Footer, BotonTienda
│  ├─ pages/                        → Inicio, Productos, DetalleProducto, Carrito, Ventas, MisCompras,
│  │  │                               Login, Registro, Nosotros, Consejos, Tiendas, Contacto
│  │  ├─ admin/                     → AdminLayout, Dashboard, Inventario, Ordenes, ListaUsuarios,
│  │  │                               NuevoUsuario, Clientes, Reportes
│  │  └─ vendedor/                  → VendedorLayout, ProductosVendedor, DetalleProductoVendedor,
│  │                                  OrdenesVendedor, DetalleOrdenVendedor
│  └─ (las pruebas *.test.js(x) viven junto a cada módulo)
└─ public/IMAGENES/                 → imágenes; la ruta de cada producto viene de la API (campo `imagen`)
```

---

## 4. Rutas de la aplicación

Están definidas en `src/App.jsx` con **rutas anidadas**. Cada zona tiene su layout (`LayoutPublico`, `AdminLayout` o `VendedorLayout`), y las rutas privadas se envuelven en `<RutaProtegida roles={...}>`.

| Ruta | Componente | Acceso | Descripción |
|---|---|---|---|
| `/` · `/productos` · `/producto/:id` | `Inicio` · `Productos` · `DetalleProducto` | Público* | Portada, catálogo (`?categoria=`) y ficha |
| `/carrito` | `Carrito` | Público* | Carrito y botón "Ir a pagar" |
| `/ventas` | `Ventas` | **Cliente / Admin** | Checkout contra ms-ventas |
| `/mis-compras` | `MisCompras` | **Cliente / Admin** | Historial y "Pagar ahora" |
| `/login` · `/registro` | `Login` · `Registro` | Público* | Acceso y alta de clientes |
| `/nosotros` · `/consejos` · `/tiendas` · `/contacto` | Páginas informativas | Público* | — |
| `/admin` (+ `inventario`, `ordenes`, `usuarios`, `usuarios/nuevo`, `clientes`, `reportes`) | `AdminLayout` + páginas | **Admin** | Panel de administración |
| `/vendedor/productos[/:id]` · `/vendedor/ordenes[/:id]` | `VendedorLayout` + páginas | **Vendedor / Admin** | Panel de solo lectura |

\* Un **Vendedor** con sesión que entra a cualquier ruta pública es redirigido a `/vendedor`: según el requisito, solo debe ver productos y órdenes. Esto lo hace `LayoutPublico`.

---

## 5. Estado global, sesión y persistencia

- **Carrito:** vive en `App` (*lifting state up*) y se persiste con `useEffect` en `localStorage.carrito`. Guarda `[{ id, cantidad }]`, donde **`id` es el id numérico del producto en ms-catalogoProductos**.
- **Sesión:** `Login` guarda en `localStorage.sesion` lo que devuelve `POST /api/v1/auth/login`, ya traducido por `sesionDesdeLogin()`: `{ id, nombre, correo, rol, tipoCliente, direccion, comuna, token }`. `api.js` lee de ahí el token para el header `Authorization: Bearer …`.
- **`sesionActiva()`** (`utils/sesion.js`): devuelve la sesión solo si el token no expiró, leyendo el `exp` del payload del JWT. Si expiró, la borra. La usan `RutaProtegida`, `Navbar`, `LayoutPublico` y los paneles.

**Claves de `localStorage`** (constante `CLAVES`):

| Clave | Uso en la V3 |
|---|---|
| `carrito` | Carrito de compras (ids de la API) |
| `sesion` | Sesión con token JWT (no guarda la contraseña) |
| `solicitudes` | Mensajes del formulario de contacto (no hay microservicio de contacto) |
| `productos`, `edicionesProductos` | Solo afectan al catálogo de **referencia** que se usa sin conexión |

Las claves `usuarios` y `ordenes` de la V2 (y el `ADMIN_DEFAULT` con la contraseña del admin escrita en el código) se eliminaron: los usuarios y las órdenes viven en ms-auth y ms-ventas.

---

## 6. Utilidades (lógica pura y testable)

Están en `src/utils/` para reutilizarlas y probarlas de forma aislada.

### 6.1 `utils/api.js`: cliente de la API
- Una función por endpoint: `login`, `register`, `obtenerProductos`, `obtenerProductoPorId`, `crearProducto`, `actualizarProducto`, `desactivarProducto`, `obtenerInventario`, `obtenerStockPorSku`, `ajustarStock`, `crearVenta`, `confirmarPago`, `misCompras`, `listarVentas`, `obtenerVenta`, `listarUsuarios` y `crearUsuario`.
- **`ApiError`** conserva el código HTTP. Con él cada página distingue "credenciales malas" (401), "sin permiso" (403), "duplicado" (409) y "el servicio no responde" (un `TypeError` de `fetch`, sin código).
- **`lanzarError`** toma el mensaje que envía el backend (`message`, `mensaje` o `validationErrors`) para mostrarlo tal cual.

### 6.2 `utils/sesion.js`
`ROLES`, `rolDesdeApi('ROLE_ADMIN') → 'Administrador'`, `rutaInicial(rol)` (`/admin`, `/vendedor` o `/`), `sesionDesdeLogin`, `leerPayloadJwt`, `tokenExpirado`, `sesionActiva` y `cerrarSesion`.

### 6.3 `utils/useCatalogo.js` y `utils/productos.js`
- `useCatalogo()` devuelve `{ productos, cargando, sinConexion }`. Si la API no responde, usa el catálogo de referencia y marca `sinConexion`, para que la página muestre `AvisoSinConexion` y deshabilite la compra.
- `desdeApi(p)` convierte el `ProductoResponseDTO` (`sku`, `precioResidencial`, `precioComercial`, `imagen`) al formato de los componentes (`codigo`, `residencial`, `comercial`, `imagen` por defecto).

### 6.4 `utils/carrito.js`
Funciones **puras**: `agregarItem`, `incrementarItem`, `decrementarItem` (elimina el ítem al llegar a 0), `eliminarItem`, `contarItems`, `obtenerItemsCompletos` (descarta ids que no estén en el catálogo) y `calcularTotal` (por tipo residencial o comercial).

### 6.5 `utils/inventario.js`, `utils/ventas.js` y `utils/reportes.js`
- `combinarInventario` une el catálogo y el stock por SKU. `ajusteDeStock(actual, deseado)` traduce el stock deseado en `aumentar` o `disminuir` con la **diferencia**. `productoDesdeFormulario` y `validarProducto` sirven al formulario del Admin.
- `estadoVenta`, `numeroOrden` (`ORD-n`), `resumenVentas` (KPI y comunas) y `masRecientes`.
- `resumenClientes`, `ventasMensuales`, `reporteVentas` (ingresos, ticket, categorías, tipo de cliente y más vendidos) y `aCsv` / `descargarCsv`.

### 6.6 `utils/validaciones.js`
- Validadores: `validarRun`, `validarTelefono`, `validarCorreo`, `correoDominioPermitido` y `formatearPrecio`.
- `validarFormularioRegistro`: contraseña de **6 a 10** caracteres, el mínimo que exige ms-auth.
- `validarNuevoUsuario`: acepta correos de la empresa, como @elvolcan.cl.
- `validarFormularioContacto`, `leerLista` y `leerObjeto`.

---

## 7. Componentes reutilizables

### 7.1 `components/LayoutPublico.jsx`
Renderiza `BotonTienda`, `Navbar`, el `<Outlet />` y `Footer`. Si la sesión es de un **Vendedor**, redirige a `/vendedor`.

### 7.2 `components/Navbar.jsx`
Barra responsiva (`expand="lg"`) que recibe `totalItems` por props (badge del carrito). Los enlaces dependen de la sesión:
- **Visitante:** Login y Registro.
- **Con sesión:** Mis compras, "Hola, nombre" y Cerrar sesión.
- **Admin:** además, Panel Admin.

Llama a `useLocation()` para volver a dibujarse al navegar, por ejemplo justo después del login.

### 7.3 `components/RutaProtegida.jsx`
Envuelve las rutas privadas:
- Sin sesión o con el token expirado → `<Navigate to="/login" state={{ desde }}>`. Después del login, se vuelve a la página pedida.
- Con un rol no incluido en `roles` → la `rutaInicial` de su rol.

### 7.4 `components/AvisoSinConexion.jsx`, `Producto.jsx`, `Footer.jsx` y `BotonTienda.jsx`
- `AvisoSinConexion`: alerta visible cuando el catálogo no se pudo cargar de la API.
- `Producto`: tarjeta de presentación (props más el callback `onAgregar`; comunicación hijo → padre).
- `Footer` y `BotonTienda`: sin cambios respecto de la V2.

---

## 8. Páginas públicas y de cliente

### 8.1 `Inicio.jsx`
Portada con botón al catálogo.

### 8.2 `Productos.jsx`: catálogo + filtro
Usa `useCatalogo()`, filtra por `?categoria=` con `useLocation` + `URLSearchParams` y muestra un spinner mientras carga y el aviso si no hay conexión.

### 8.3 `DetalleProducto.jsx`: ficha
- Con un **id numérico**, consulta `GET /api/v1/productos/id/{id}` (público).
- Con un id de referencia (`p1`), usa el catálogo local.
- Si el producto no existe (404), muestra "Producto no encontrado".
- El stock solo aparece si se conoce: el catálogo público no lo informa.

### 8.4 `Carrito.jsx`
Resuelve las líneas contra el catálogo de la API. Tiene `+`, `-` y Quitar, subtotales y total, y el botón **"Ir a pagar"**, que lleva al único checkout (`/ventas`). Sin conexión, el botón queda deshabilitado.

### 8.5 `Ventas.jsx`: checkout (Cliente / Admin)
1. Pide dirección, comuna y **método de pago** (Efectivo o Tarjeta).
2. `POST /api/v1/ventas` con `{ tipoCliente, direccion, comuna, metodoPago, detalles: [{ productoId, cantidad }] }`. ms-ventas valida el precio y el stock por Feign. Si falta stock, el backend responde 409 y se muestra su mensaje.
3. Si la venta se creó, el carrito se vacía y se llama a `PUT /api/v1/ventas/{id}/confirmar`, que marca la venta pagada y descuenta el stock.
4. Si la confirmación falla, aparece la vista **"No se pudo realizar el pago"** (Figura 8 del Anexo 1). La venta queda pendiente y **"Reintentar pago" confirma la misma venta**, sin duplicarla.
5. Al final se muestra la confirmación con `ORD-n`, el total y el despacho, más un enlace a Mis compras.

### 8.6 `MisCompras.jsx`
`GET /api/v1/ventas/mis-compras`. Muestra una tabla con número, fecha, productos (nombre tomado del catálogo), despacho, pago, total y estado. Las pendientes tienen el botón **"Pagar ahora"**.

### 8.7 `Login.jsx`
- Formulario controlado que llama a `POST /api/v1/auth/login`.
- Si responde 401, muestra "Credenciales incorrectas"; si el servicio no responde, "No se pudo conectar con el servidor".
- **No hay usuarios locales de respaldo:** solo autentica ms-auth.
- Al entrar, navega a la página pedida o a la ruta inicial del rol.

### 8.8 `Registro.jsx`
- Valida con `validarFormularioRegistro` y llama a `POST /api/v1/auth/register`.
- Envía el correo en minúsculas como `username` y **no envía el rol**: el backend siempre crea un Cliente.
- Si el correo o el RUN ya existen (409), muestra un aviso claro.

### 8.9 `Nosotros.jsx`, `Consejos.jsx`, `Tiendas.jsx` y `Contacto.jsx`
Páginas informativas, sin cambios. `Nosotros` usa `useState` para expandir los blogs. `Contacto` valida y guarda la solicitud en `localStorage.solicitudes`.

---

## 9. Paneles por rol

### 9.1 Panel de administración (`/admin`, solo Administrador)
- **`AdminLayout`:** menú lateral y cierre de sesión.
- **`Dashboard`:** saludo con el nombre real; KPI (ingresos de ventas pagadas, órdenes, pendientes, productos en stock crítico); últimas 5 órdenes; nivel de stock de los cilindros. Carga ventas, catálogo y stock en paralelo con `Promise.allSettled`, así que si un servicio cae, el resto sigue funcionando.
- **`Inventario`:** CRUD real.
  - **Crear:** `POST` del producto, más `aumentar` con el stock inicial.
  - **Editar:** `PUT` del producto, más `aumentar` o `disminuir` solo por la diferencia de stock. El SKU no se edita.
  - **Eliminar:** borrado lógico con confirmación. El stock crítico se marca en rojo.
- **`Ordenes`:** todas las ventas (`GET /api/v1/ventas`) con KPI y distribución por comuna; el número de orden enlaza al detalle.
- **`ListaUsuarios`** y **`NuevoUsuario`:** lista de ms-auth con filtro por rol, y **alta con rol** (Admin, Vendedor o Cliente) con `POST /api/v1/usuarios`.
- **`Clientes`** y **`Reportes`:** calculados con `/usuarios` y `/ventas` (ver 6.5). Exportan **CSV**.

### 9.2 Panel del Vendedor (`/vendedor`, solo lectura)
- **`VendedorLayout`:** menú con **solo** "Productos" y "Órdenes", más la insignia "Vendedor · solo lectura".
- **`ProductosVendedor`** y **`DetalleProductoVendedor`:** catálogo y ficha con el **stock** de ms-inventario.
- **`OrdenesVendedor`** y **`DetalleOrdenVendedor`:** todas las órdenes y su detalle (`GET /api/v1/ventas/{id}`), con cliente, despacho, método de pago y líneas.
- No hay botones de crear, editar ni borrar. Aunque alguien llamara a la API directamente, el backend responde **403** a cualquier escritura del Vendedor.

---

## 10. Pruebas (Vitest)

**Configuración** (`vite.config.js`):
- Bloque `test`: `environment: 'jsdom'`, `setupFiles: './src/setupTests.js'`, `globals: true` y `css: false`.
- `esbuild: { jsx: 'automatic' }`.
- Cobertura con el provider `v8`.

**Cómo se prueba la integración:** `vi.stubGlobal('fetch', vi.fn(...))` simula las respuestas de cada microservicio, según la URL y el método. Así se prueban el éxito y los errores (401, 403, 404, 409 y sin conexión) sin levantar el backend. `testUtils/jwt.js` genera JWT con `exp` real para probar la expiración de la sesión.

**71 pruebas en 23 archivos.** El inventario completo y la cobertura están en `DOCUMENTO_COBERTURA_TESTING.md`.

---

## 11. Decisiones de diseño

| Decisión | Por qué |
|---|---|
| `fetch` + `ApiError` en un único `api.js` | Un solo punto para las URLs `/api/v1` y los headers; las páginas reaccionan por código HTTP. |
| Mensajes del backend (`lanzarError`) | El usuario ve el motivo real, por ejemplo "Stock insuficiente para: …". |
| Sin usuarios locales en el login | La autenticación la decide siempre ms-auth (JWT). Antes, un usuario en `localStorage` podía entrar sin backend. |
| `RutaProtegida` + expiración del JWT | Cada rol ve solo sus vistas y una sesión vencida no aparenta seguir activa. La seguridad real está en el backend. |
| Vendedor redirigido fuera de la tienda | Requisito: "Vendedor solo ve lista y detalle de productos y órdenes, y nada más le aparece". |
| Aviso "sin conexión" en vez de `catch(() => {})` | Antes la app caía en silencio a datos locales y parecía funcionar sin backend. |
| Un único checkout (`/ventas`) | Antes había dos flujos distintos (Carrito y Ventas). |
| Reintento de pago sobre la misma venta | Evita ventas duplicadas si falla solo la confirmación. |
| Ajuste de stock por diferencia | ms-inventario expone `aumentar` y `disminuir`, no "fijar stock". |
| Lógica en `utils/` (pura) | Se reutiliza y se prueba de forma aislada. |

---

## 12. Conceptos del curso que se ven aquí

- Componentes, **props** (padre → hijo) y **callbacks** (hijo → padre).
- **Estado** con `useState`, efectos con `useEffect` (con cancelación al desmontar) y un **hook personalizado** (`useCatalogo`).
- **React Router**: rutas anidadas, `Outlet`, `Navigate`, `useParams`, `useLocation`, `useNavigate` y estado de navegación.
- **Formularios controlados** y validación.
- **Consumo de APIs REST** con `fetch`, `async/await`, `Promise.all` / `allSettled` y JWT.
- **Renderizado condicional** (spinners, avisos, errores) y **listas** con `.map()` + `key`.
- **Pruebas** de funciones puras y componentes, con mocks (`vi.fn`, `vi.stubGlobal`).

---

## 13. Cómo correrlo

```bash
npm.cmd install        # la primera vez
npm.cmd run dev        # desarrollo → http://localhost:5173 (con los microservicios levantados)
npm run lint           # oxlint
npm run build          # producción → dist/
npm test               # 71 pruebas (una sola vez)
npm run test:coverage  # pruebas + cobertura en coverage/
```

**Credenciales de prueba:** `admin@duoc.cl` / `Admin123` · `vendedor@elvolcan.cl` / `Vendedor123` · `cliente@elvolcan.cl` / `Cliente123`.

---

## 14. Próximos pasos

- Pasar las URLs de la API a variables de entorno de Vite (`VITE_API_*`) para desplegar fuera de `localhost`.
- **API Gateway** (Spring Cloud Gateway) para exponer un solo origen y simplificar CORS.
- **Seguimiento de pedidos** con estados de despacho y mapas (Leaflet / Google Maps).
- Despliegue del frontend y del backend en **AWS con Docker**.
