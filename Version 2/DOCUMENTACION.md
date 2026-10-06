# Documentación — avance entrega (El Volcán en React)

Explica qué se construyó en `Evaluacion 2/avance entrega`, cómo funciona cada parte y la lógica detrás de cada decisión.
Sigue el patrón de la **Guía React Parte II (Tienda Fullstack)** de DSY1104 y el modelo de clases `mi-primer-react`.

---

## 1. Qué es y para qué

Aplicación SPA de la **Distribuidora de Gas El Volcán** construida con React. Es el avance de la evaluación que
reemplaza el sitio estático (HTML/CSS/JS) por una aplicación React moderna, incorporando todo lo visto hasta ahora:

- Componentes y props.
- Estado (`useState`) y persistencia (`localStorage`).
- React Router (SPA con varias rutas).
- Formularios controlados con validación.
- Diseño responsivo y componentes con React Bootstrap.

Datos de negocio reales: 14 productos de gas, precios residencial/comercial, y el login del administrador
(`admin@duoc.cl`).

---

## 2. Stack y por qué

| Tecnología | Versión | Rol |
|---|---|---|
| Vite | 8.3 | Herramienta de desarrollo/build. Uso en clases: `npm run dev`. |
| React / React DOM | 19.2 | Biblioteca de componentes (SPA). |
| react-router-dom | 7.18 | Rutas de la SPA (`BrowserRouter`, `Routes`, `Route`, `Link`, `useParams`, `useLocation`). |
| react-bootstrap | 2.10 | Componentes UI listos (`Navbar`, `Card`, `Button`, `Form`, `Alert`, `Badge`, `ListGroup`). |
| bootstrap | 5.3.8 | CSS base (grillas, estilos). Importado en `main.jsx`. |
| oxlint | 1.81 | Linter oficial del template de clases (`npm run lint`). |

**Por qué este stack**: es exactamente el mismo que la asignatura (Ver `Semana react/mi-primer-react`).
No se introduce nada nuevo que no se pueda explicar/nivel-del-curso.

---

## 3. Estructura

```
avance entrega/
├─ index.html                     → punto de montaje de la SPA (lang="es")
├─ src/
│  ├─ main.jsx                    → arranca React y carga Bootstrap CSS
│  ├─ index.css                   → estilos globales mínimos
│  ├─ App.jsx                     → rutas + estado global del carrito
│  ├─ datos/
│  │  └─ productos.js             → "base de datos" local: los 14 productos
│  ├─ components/
│  │  ├─ Navbar.jsx               → barra de navegación (repeat en todas las páginas)
│  │  └─ Producto.jsx             → tarjeta de producto (reutilizable)
│  └─ pages/
│     ├─ Inicio.jsx               → portada
│     ├─ Productos.jsx            → catálogo + filtro por categoría
│     ├─ DetalleProducto.jsx      → ficha de un producto (ruta /producto/:id)
│     ├─ Login.jsx                → formulario controlado de acceso
│     ├─ Registro.jsx             → creación de cuenta (validaciones + regiones/comunas)
│     └─ Carrito.jsx              → resumen del carrito (cantidades y total)
└─ public/
   └─ IMAGENES/                   → imágenes de los productos
```

---

## 4. Explicación componente por componente (con la lógica)

### 4.1 `src/main.jsx` — punto de entrada

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
```

**Lógica**: `createRoot(...).render(<App />)` es quién "monta" la aplicación en el `<div id="root">` del
`index.html`. El import `bootstrap/dist/css/bootstrap.min.css` carga los estilos de Bootstrap **antes**
de nuestro `index.css`, para que lo nuestro pueda sobrescribir. `StrictMode` es una herramienta de
desarrollo que detecta errores (en producción no agrega nada visible).

### 4.2 `src/datos/productos.js` — los datos

```jsx
export const PRODUCTOS = [
  { id: 'p1', codigo: 'CL001', nombre: 'Cilindro GLP 5 kg', ..., residencial: 6500, comercial: 6000,
    stock: 80, stockCritico: 5, categoria: 'Cilindros de Gas', imagen: '/IMAGENES/cilindro de 5 K.png' },
  ...
]
```

**Lógica detras de la decisión**:
- Son los **mismos 14 productos** del `java.js` del sitio anterior (mismos nombres, precios, stock y rutas de
  imagen). Defendible: los datos ya estaban validados y aprobados en la entrega anterior.
- Al hacer `export` el resto de la app los importa donde los necesite (`Productos`, `DetalleProducto`, `Carrito`).
- **Por qué array y no `<Producto nombre="..." precio="..." />` repetido 14 veces**:
  - No repetimos código (DRY). Si cambia un precio se edita una sola línea.
  - El componente `Producto` es genérico (una sola definición), igual que el "Atomic Design" de la guía
    (átomo/molecular/organismo/página).
  - Cuando existan los microservicios, solo reemplazamos este archivo por un `fetch()` a la API; las páginas
    no cambian (el "seam" o punto de cambio único).

### 4.3 `src/App.jsx` — rutas + estado del carrito

```jsx
<BrowserRouter>
  <Navbar totalItems={totalItems} />
  <Routes>
    <Route path="/" element={<Inicio />} />
    <Route path="/productos" element={<Productos onAgregar={agregar} />} />
    <Route path="/producto/:id" element={<DetalleProducto onAgregar={agregar} />} />
    <Route path="/login" element={<Login />} />
    <Route path="/carrito" element={<Carrito ... />} />
  </Routes>
</BrowserRouter>
```

**Lógica**:
- `BrowserRouter` habilita la navegación de la SPA **sin recargar la página**.
- `Navbar` está **fuera de `Routes`** → aparece en todas las páginas (igual que en la guía).
- `Routes`/`Route` hacen el "enrutado": según la URL mostraremos un componente u otro.
- La ruta `/producto/:id` es dinámica; los dos puntos hacen que `:id` sea una parte variable de la URL.

**Estado del carrito (lógica clave)**:
```jsx
const [carrito, setCarrito] = useState(() => { ... JSON.parse(localStorage.getItem('carrito')) ... })
useEffect(() => { localStorage.setItem('carrito', JSON.stringify(carrito)) }, [carrito])
```
- El carrito vive en `App` (**"lifting state up"**): es información compartida entre `Productos`,
  `DetalleProducto` y `Carrito`, así que se centraliza en el padre.
- **Persistencia**: el valor inicial se lee desde `localStorage` (función inicializadora del `useState`), y cada
  vez que el carrito cambia, `useEffect` lo guarda. Así `F5` no lo pierde (misma técnica que el stock de la guía).
- Funciones que lo modifican:
  - `agregar(id)`: si el producto ya está, suma 1 a su `cantidad`; si no, lo agrega con `{ id, cantidad: 1 }`.
  - `incrementar(id)` / `decrementar(id)`: suman/restan 1; `decrementar` además filtra los que quedaron en 0
    (para que la cantidad nunca sea negativa — igual que el stock que "no puede bajar de 0" de la guía).
  - `eliminar(id)`: quita el producto del carrito.

### 4.4 `src/components/Navbar.jsx` — navegación

```jsx
<BootstrapNavbar bg="dark" data-bs-theme="dark" expand="lg">
  ...
  <Nav.Link as={Link} to="/productos">Productos</Nav.Link>
  <Nav.Link as={Link} to="/carrito">Carrito <Badge ...>{totalItems}</Badge></Nav.Link>
```

**Lógica**:
- Usamos el componente `Navbar` de react-bootstrap (por eso el import lleva alias `as BootstrapNavbar`
  para no chocar con el nombre de nuestro propio componente).
- `as={Link}` + `to="/..."` hace que los links naveguen **dentro de la SPA** usando React Router, sin recargar.
- Recibe `totalItems` por **props** desde `App` para mostrar el contador del carrito en el badge.
- `expand="lg"` hace el menú colapsable en pantallas chicas (responsivo).

### 4.5 `src/components/Producto.jsx` — tarjeta de producto

Recibe **props**: `id`, `nombre`, `descripcion`, `residencial`, `imagen` y `onAgregar`.

```jsx
<Button onClick={() => props.onAgregar(props.id)}>Agregar</Button>
<Button as={Link} to={`/producto/${props.id}`}>Ver detalle</Button>
```

**Lógica**:
- Es el **componente reutilizable** (el "organismo" del Atomic Design). No sabe nada de los datos; solo muestra lo
  que le pasan y avisa con `onAgregar(id)` cuando se presiona Agregar.
- **Comunicación hijo → padre**: el clic en "Agregar" llama a `onAgregar`, una función que `App` le pasó;
  es el patrón estándar para que los hijos "avisen" al padre.
- "Ver detalle" genera la URL con template literal: `` `/producto/${props.id}` ``.

### 4.6 `src/pages/Inicio.jsx` — portada

**Lógica**: componente simple de presentación. Solo renderiza el nombre de la empresa y un botón que navega a
`/productos` con `as={Link}`.

### 4.7 `src/pages/Productos.jsx` — catálogo + filtro

```jsx
const location = useLocation()
const parametros = new URLSearchParams(location.search)
const categoria = parametros.get('categoria')
const productos = categoria ? PRODUCTOS.filter((p) => p.categoria === categoria) : PRODUCTOS
```

**Lógica** (es la funcionalidad de la guía "Parámetros de búsqueda"):
- `useLocation()` nos da la URL actual; `URLSearchParams` parsea la parte de la query string.
- Si la URL es `/productos?categoria=Reguladores`, `categoria` vale "Reguladores" y filtramos el array con
  `.filter()`.
- Los botones de categoría navegan con `Link to={/productos?categoria=...}` (con `encodeURIComponent`
  para los espacios).
- Las tarjetas se generan en bucle con `.map()` y se le pasan al componente `Producto`. La prop `key={p.id}`
  le dice a React cuál es cada elemento (necesaria en listas).
- Grilla responsiva con `Row`/`Col`: `xs={1} sm={2} md={3} lg={4}` = 1 producto celular, 4 en pantalla grande.

### 4.8 `src/pages/DetalleProducto.jsx` — ficha del producto

```jsx
const { id } = useParams()
const producto = PRODUCTOS.find((p) => p.id === id)
```

**Lógica** (guía "Rutas con parámetros"):
- `useParams()` extrae el valor de `:id` de la URL (ej. `/producto/p3` → `id = "p3"`).
- `.find()` busca el producto exacto en el array; si no existe, mostramos un `Alert` "Producto no encontrado"
  (caso de mundo real: URLs tecleadas a mano o inválidas).
- La ficha muestra los datos completos: imagen, descripción, categoría, código, precio residencial/comercial y
  stock, con el botón "Agregar al carrito" que usa `onAgregar(producto.id)`.

### 4.9 `src/pages/Login.jsx` — formulario controlado + sesión

**Formulario controlado**:
```jsx
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
...
<input value={email} onChange={(e) => setEmail(e.target.value)} />
```
Los valores de los campos **viven en React** (estado), no en el DOM. Por eso es "controlado": `value` vincula el
input al estado y `onChange` lo actualiza en cada tecla.

**Validación** (lógica del negocio):
1. El email debe contener `@` → si no, error "El correo electrónico no es válido".
2. La contraseña debe tener al menos 4 caracteres → si no, error.
3. Se busca el usuario en `localStorage.usuarios` + el `ADMIN_DEFAULT` (admin@duoc.cl). Si no coincide
   → "Credenciales incorrectas".
4. Si todo ok → se guarda la **sesión** (sin el password) en `localStorage.sesion` y se navega a `/` con
   `useNavigate()`.

**Lógica de sesión**: al recargar, el `useState` inicial lee `localStorage.sesion`; si hay sesión, en vez del
formulario se muestra un `Alert` con el usuario y botón "Cerrar sesión" (que hace `removeItem`).
Así replicamos el comportamiento del frontend viejo sin backend.

### 4.10 `src/pages/Carrito.jsx` — resumen y totales

```jsx
const items = carrito.map((item) => ({ ...item, producto: PRODUCTOS.find((p) => p.id === item.id) }))
const total = items.reduce((suma, item) => suma + item.producto.residencial * item.cantidad, 0)
```

**Lógica**:
- Al carrito (que solo guarda `{ id, cantidad }`) le "juntoamos" (`.find`) el producto completo para poder
  mostrar nombre, imagen y precio. Con `.filter` descartamos ids que ya no existan (seguridad).
- `total` con `reduce()` suma `precio × cantidad` de cada línea = el **subtotal** y el **total**.
- Los botones `+`/`-` llaman a `incrementar`/`decrementar` (definidas en `App`), y "Quitar" a `eliminar`.
- `toLocaleString('es-CL')` formatea los precios a moneda chilena (`6.500`, `12.000`).
- Caso vacío → `Alert` "Aún no hay productos en el carrito" + botón a Productos (mismo mensaje del
  `ShoppingCart` de la guía AWS).

### 4.11 `src/pages/Registro.jsx` — creación de cuenta

Formulario controlado con `useState` para **cada campo** (igual que Login), más las reglas de negocio del
frontend original (`java.js`):

**Validaciones (replicadas del sitio anterior):**
1. Nombre completo obligatorio (máx. 100 caracteres).
2. RUN: solo dígitos, sin puntos ni guion, entre 7 y 9 (`/^\d{7,9}$/`).
3. Correo con dominio permitido: `@duoc.cl`, `@profesor.duoc.cl` o `@gmail.com`.
4. Teléfono válido (9 a 12 dígitos, permite `+56`).
5. Dirección, región y comuna obligatorias.
6. Contraseña de 4 a 10 caracteres y que coincida con "confirmar".
7. Checkbox de términos y condiciones obligatorio.
8. El correo no debe estar ya registrado (se verifica recorriendo `localStorage.usuarios`).

**Regiones/comunas (lógica de selectores dependientes):**
- `REGIONES` es un array `{ nombre, comunas: [...] }` (aquí: Región de Ñuble con sus comunas).
- Al elegir una región se **limpia** la comuna y se habilitan solo las comunas de esa región
  (`comunasRegion = REGIONES.find(...)`). Es el patrón "carga condicional de opciones".

**Guardado y flujo:**
- Se agrega el usuario con `{ fecha, run, nombre, correo, telefono, tipoCliente, direccion, region, comuna,
  contrasena, rol: 'Cliente', estado: 'Pendiente' }` y se guarda el array completo en `localStorage.usuarios`
  (misma clave y formato del frontend anterior).
- Al éxito muestra un `Alert` verde y navega a `/login` con `setTimeout` + `useNavigate`.
- El **Login** lee `correo`/`contrasena` (usuarios registrados) o `email`/`password` (admin), por eso ambos
  funcionan sin cambios extra.

---

## 5. Decisiones de diseño y lógica de negocio

| Decisión | Por qué |
|---|---|
| Carrito en `App` y no en cada página | Estado compartido se centraliza en el padre ("lifting state up"). |
| Persistencia con `localStorage` | No hay backend todavía; igual que el sitio anterior, no se pierde al `F5`. Claves usadas: `carrito`, `usuarios`, `sesion`. |
| Datos en `datos/productos.js` | Mismos 14 productos validados del frontend anterior; un solo punto de cambio para la futura API. |
| `BrowserRouter` + `Navbar` fuera de `Routes` | Patrón de la guía: SPA sin recarga y menú visible en todas las páginas. |
| Login contra `localStorage` con admin precargado | Replica la seguridad del frontend viejo (`ADMIN_DEFAULT` admin@duoc.cl / Admin123) hasta que existan los microservicios. |
| Precios con `toLocaleString('es-CL')` | Formato de moneda chilena, consistente con la entrega anterior. |
| Botón – que elimina el item en 0 | La cantidad nunca puede quedar negativa (regla de la guía: stock no baja de 0). |

---

## 6. Conceptos del curso que se ven aquí

- Componentes y **props** (padre → hijo).
- **Eventos y callbacks** (hijo → padre con `onAgregar`).
- **Estado** con `useState` y persistencia con `useEffect` + `localStorage`.
- **React Router**: `BrowserRouter`, `Routes`, `Route`, `Link`, `useParams`, `useLocation`, `useNavigate`.
- **Formularios controlados** y validación (`preventDefault`).
- **Renderizado condicional** (`{error && <Alert/>}`) y **listas** con `.map()` + `key`.
- **Atomic Design** (componentes reutilizables pequeños → páginas).
- **Diseño responsivo** con grillas de Bootstrap.

---

## 7. Cómo correrlo

```
cd "C:\Users\ben95\OneDrive\Documentos\Duoc\Full Stack 2\Evaluacion 2\avance entrega"
npm.cmd install     # la primera vez
npm.cmd run dev     # desarrollo → http://localhost:5173
npm run lint        # oxlint: 0 errores
npm run build       # producción → carpeta dist/
```

> En PowerShell usar `npm.cmd` (la política de ejecución puede bloquear `npm.ps1`).

Credenciales de prueba: **admin@duoc.cl / Admin123**.

---

## 8. Próximos pasos

- **React Hook Form** (`react-hook-form`) con `{...register(...)}` + `formState.errors` (guía 2.2.2).
- **Checkout** (asignación de venta) y roles (Cliente vs Administrador).
- **Publicación en AWS EC2** (guía 2.1.2): `npm run build` + Nginx en el puerto 80, o `npm run dev -- --host 0.0.0.0` en el 5173.
- Cuando existan los microservicios: reemplazar `datos/productos.js` por llamadas `fetch()`.