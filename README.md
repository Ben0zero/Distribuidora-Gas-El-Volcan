# Distribuidora de Gas El Volcán

Sistema de microservicios para la gestión de ventas, catálogo, inventario y autenticación de la Distribuidora de Gas El Volcán. Proyecto adaptado desde un template MiniMarket a un sistema orientado a la distribución de cilindros de gas.

## Arquitectura

La solución está compuesta por **5 microservicios + Eureka Server** con comunicación REST y Feign Client, autenticación JWT y base de datos Oracle Cloud.

| Microservicio | Puerto | Descripción |
|---|---|---|
| **eureka-server** | 8761 | Service Discovery (Netflix Eureka) |
| **ms-auth** | 8081 | Autenticación, registro de usuarios y generación de tokens JWT |
| **ms-catalogoProductos** | 8082 | Catálogo de productos de gas con doble precio (Residencial / Comercial) |
| **ms-inventario** | 8084 | Control de stock con alertas de stock crítico |
| **ms-ventas** | 8086 | Gestión de ventas, carrito, confirmación de pago e historial de compras por usuario |

## Tecnologías

- **Backend:** Java 17, Spring Boot 3.5.x, Spring Cloud 2025
- **Seguridad:** Spring Security + JWT
- **Comunicación:** OpenFeign, Eureka Client/Server
- **Base de datos:** Oracle Cloud (Wallet)
- **Frontend:** React + Vite + Bootstrap
- **Documentación:** Swagger/OpenAPI

## Roles

| Rol | Permisos |
|---|---|
| **ADMIN** | Acceso total a todos los microservicios |
| **VENDEDOR** | Gestión de ventas e inventario |
| **CLIENTE** | Ver catálogo, crear sus propias compras, ver "Mis compras" |

## Credenciales de Prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin@duoc.cl` | `Admin123` | ADMIN |
| `vendedor@elvolcan.cl` | `Vendedor123` | VENDEDOR |
| `cliente@elvolcan.cl` | `Cliente123` | CLIENTE |

## URLs Importantes

| Servicio | URL |
|---|---|
| **Eureka Dashboard** | [http://localhost:8761](http://localhost:8761) |
| **Frontend React** | [http://127.0.0.1:5174](http://127.0.0.1:5174) |
| **Swagger ms-auth** | [http://localhost:8081/swagger-ui/index.html](http://localhost:8081/swagger-ui/index.html) |
| **Swagger ms-catalogoProductos** | [http://localhost:8082/swagger-ui/index.html](http://localhost:8082/swagger-ui/index.html) |
| **Swagger ms-inventario** | [http://localhost:8084/swagger-ui/index.html](http://localhost:8084/swagger-ui/index.html) |
| **Swagger ms-ventas** | [http://localhost:8086/swagger-ui/index.html](http://localhost:8086/swagger-ui/index.html) |

## Levantar el Proyecto

### 1) Microservicios
Desde la carpeta `microservicios/` puedes usar los scripts incluidos:

```bash
# Levantar todos los servicios
.\levantar-servicios.ps1

# Detener todos los servicios
.\detener-servicios.ps1
```

O levantar manualmente en orden: `eureka-server` → `ms-auth` → `ms-catalogoProductos` → `ms-inventario` → `ms-ventas`

### 2) Frontend
Desde la carpeta `frontend/`:

```bash
npm install
npm run dev
```

El frontend quedará disponible en `http://127.0.0.1:5174`

## Flujo de Prueba Completo

1. **Eureka** - Verificar que todos los servicios estén en estado `UP`
2. **Login** - Ingresar con `cliente@elvolcan.cl` / `Cliente123` desde el frontend o `POST /api/auth/login`
3. **Catálogo** - Ver productos de gas con precios residenciales/comerciales desde `ms-catalogoProductos`
4. **Comprar** - Agregar al carrito, finalizar compra → Se crea la venta en `ms-ventas`, valida stock en `ms-inventario` y consulta precios en `ms-catalogoProductos`
5. **Confirmar Pago** - Al confirmar se descuenta el stock automáticamente usando token interno
6. **Mis Compras** - Ver historial filtrado por usuario con `GET /api/ventas/mis-compras`

## Novedades Versión 3

- **Adaptación completa a El Volcán:** Paquetes renombrados a `cl.elvolcan.*`, roles unificados (ADMIN/VENDEDOR/CLIENTE), productos de gas con doble precio
- **ms-ventas mejorado:** Campo `usuario` en ventas, endpoint `GET /api/ventas/mis-compras`, seguridad por roles corregida
- **Comunicación entre microservicios:** Token interno para operaciones entre servicios, Feign configurado correctamente
- **Frontend integrado:** Login con `ms-auth`, catálogo desde `ms-catalogoProductos`, carrito conectado con `ms-ventas`, historial de compras desde API
- **Catálogo público:** `GET /api/productos` accesible sin autenticación para visualizar productos en la tienda
- **Inventario conectado:** Panel admin obtiene stock desde `ms-inventario`

## Estructura del Repositorio

```text
Distribuidora-Gas-El-Volcan/
├── microservicios/        # Todos los microservicios Spring Boot
├── frontend/              # Aplicación React + Vite
├── Version 1/             # Versiones anteriores
└── Version 2/
```
