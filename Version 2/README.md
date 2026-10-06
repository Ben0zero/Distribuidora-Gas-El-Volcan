# Distribuidora de Gas El Volcán - React

Aplicación web SPA (Single Page Application) de venta de gas GLP y accesorios, construida con **React + Vite +
React Bootstrap + React Router**. Es el avance de la Evaluación 2 de Desarrollo Full Stack II (DSY1104).

Reemplaza (progresivamente) el sitio estático HTML/CSS/JS por una aplicación React moderna. Los datos se guardan
en `localStorage` hasta que existan los microservicios (Spring Boot).

---

## Stack

| Tecnología | Versión | Para qué |
|---|---|---|
| Vite | 8.3 | Creación y build del proyecto |
| React / React DOM | 19.2 | Componentes y SPA |
| react-router-dom | 7.18 | Rutas de la aplicación |
| react-bootstrap | 2.10 | Componentes de interfaz |
| Bootstrap | 5.3.8 | Estilos CSS |
| oxlint | 1.81 | Linter (`npm run lint`) |

---

## Estructura y qué es cada cosa

```
avance entrega/
│
├── README.md             → este archivo (explicación del repo)
├── DOCUMENTACION.md      → explicación detallada de cada página y su lógica
├── index.html            → punto de montaje de la SPA (lang="es", título del sitio)
├── package.json          → dependencias y comandos del proyecto
├── package-lock.json     → versiones exactas de las dependencias (repetibles)
├── vite.config.js        → configuración de Vite (plugin de React)
├── .gitignore            → archivos que NO se suben (node_modules, dist)
├── .oxlintrc.json        → reglas del linter
│
├── public/               → archivos que Vite sirve tal cual (en la raíz del sitio)
│   ├── IMAGENES/         → imágenes de los productos y del sitio
│   ├── favicon.svg       → ícono de la pestaña del navegador
│   └── icons.svg         → íconos SVG del template
│
└── src/                  → todo el código de la aplicación
    ├── main.jsx          → punto de entrada: monta React y carga Bootstrap CSS
    ├── index.css         → estilos globales mínimos
    ├── App.jsx           → rutas de la SPA + estado y persistencia del carrito
    │
    ├── datos/
    │   └── productos.js  → "base de datos" local: los 14 productos de gas
    │
    ├── components/       → piezas reutilizables
    │   ├── Navbar.jsx    → barra de navegación (visible en todas las páginas)
    │   └── Producto.jsx  → tarjeta de producto (recibe props)
    │
    └── pages/            → una página por cada ruta
        ├── Inicio.jsx             → portada
        ├── Productos.jsx          → catálogo con filtro por categoría (?categoria=)
        ├── DetalleProducto.jsx    → ficha de un producto (/producto/:id)
        ├── Login.jsx              → acceso (formulario controlado + validación)
        ├── Registro.jsx           → creación de cuenta (reglas del sitio original)
        └── Carrito.jsx            → carrito con cantidades, subtotales y total
```

---

## Funcionalidades

- **Catálogo** con los 14 productos reales (cilindros 5/11/15/45 kg, reguladores, mangueras, accesorios) con
  precios residencial y comercial.
- **Filtro por categoría** con query string (`/productos?categoria=Reguladores`).
- **Detalle de producto** por ruta dinámica (`/producto/:id`).
- **Carrito** con `+ / -`, quitar ítems, subtotales y total; se guarda en `localStorage` (no se pierde al recargar).
- **Login** validando contra `localStorage.usuarios` (admin precargado: **admin@duoc.cl / Admin123**).
- **Registro** de clientes con las mismas validaciones del sitio anterior (RUN, correo institucional,
  teléfono, región/comuna, contraseña, términos) y guardado en `localStorage.usuarios`.

---

## Cómo correrlo

```bash
npm install     # instala dependencias (solo la primera vez)
npm run dev     # servidor de desarrollo → http://localhost:5173
npm run lint    # oxlint: 0 errores
npm run build   # build de producción → carpeta dist/
```

> En PowerShell usar `npm.cmd` (la política de ejecución puede bloquear `npm.ps1`).

Credenciales de prueba: **admin@duoc.cl / Admin123**

---

## Próximos pasos

- Checkout (asignación de venta) y roles (Cliente vs Administrador).
- React Hook Form (guía AWS 2.2.2).
- Publicación en AWS EC2 con Nginx (guía 2.1.2).
- Integración con microservicios Spring Boot (cuando estén listos).

---

**Duoc UC - Analista Programador | DSY1104 Desarrollo Full Stack II**