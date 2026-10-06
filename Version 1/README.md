# Distribuidora Gas El Volcán

Plataforma Web para la **Distribuidora de Gas El Volcán**, empresa dedicada a la comercialización de cilindros de gas y accesorios en la Región de Ñuble, Chile.

**Entrega:** Evaluación parcial DSY1104 — Aplicaciones Frontend (primera entrega).

## Descripción

Sitio web frontend que permite a los clientes visualizar el catálogo de productos, gestionar un carrito de compras, registrarse y contactar a la empresa. Incluye un módulo administrativo para la gestión de usuarios y el mantenedor de inventario (crear, editar y eliminar productos).

## Tecnologías

- HTML5
- CSS3
- Bootstrap 5
- JavaScript (Vanilla JS)
- Persistencia local con `localStorage`

## Funcionalidades

- **Catálogo dinámico:** los productos se listan desde una estructura JavaScript (R.1).
- **Carrito de compras:** agregar, modificar y eliminar ítems con cálculo de subtotales y total, y persistencia en `localStorage` (R.2, R.2a, R.2b, R.2c).
- **Validación de formularios:** inicio de sesión (R.3), registro con RUN y correo permitido (R.4) y formulario de contacto (R.5).
- **Panel administrativo:**
  - Gestión de usuarios con roles **Administrador, Cliente y Vendedor** (R.6, R.6a, R.6b, R.6c).
  - Mantenedor de productos con validaciones y operaciones de crear/editar/eliminar (R.7).
- **Selección dinámica Región → Comuna** cargada desde JavaScript (R.8).
- **Diseño responsivo** para móvil, tablet y escritorio (R.9).

## Cobertura

La distribuidora opera en la **Región de Ñuble**, cubriendo las comunas de:

- Chillán
- Chillán Viejo
- El Carmen
- Pinto
- San Ignacio
- Bulnes
- Quillón

## Usuario administrador de prueba

| Correo | Contraseña |
|---|---|
| `admin@duoc.cl` | `Admin123` |

> Los correos permitidos para el registro son `@duoc.cl`, `@profesor.duoc.cl` y `@gmail.com`.

## Cómo ejecutar

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Ben0zero/Distribuidora-Gas-El-Volcan.git
   ```
2. Abrir `index.html` en un navegador web moderno (Chrome, Firefox, Edge o Safari).

También está desplegado en GitHub Pages:

<https://ben0zero.github.io/Distribuidora-Gas-El-Volcan/>

## Estructura del proyecto

```
.
├── index.html                    # Página principal
├── catalogo.html                 # Catálogo de productos
├── carrito.html                  # Carrito de compras
├── login.html                    # Inicio de sesión
├── registro.html                 # Registro de clientes
├── contacto.html                 # Formulario de contacto
├── tiendas.html                  # Puntos de venta
├── consejos.html                 # Consejos de seguridad
├── ventas.html                   # Checkout y confirmación de pedidos
├── admin.html                    # Panel de administración
├── admin_nuevo_producto.html     # Inventario y mantenedor de productos
├── admin_nuevo_usuario.html      # Registro de usuarios (admin)
├── admin_lista_usuarios.html     # Listado de usuarios
├── CSS/
│   ├── estilos.css
│   └── estilosLogin.css
├── JS/
│   └── java.js                   # Lógica principal del sitio
└── IMAGENES/                     # Recursos gráficos
```

## Autores

- Benjamin González
- Pablo Gómez
- Nicolás Arancibia