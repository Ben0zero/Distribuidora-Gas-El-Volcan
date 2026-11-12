# Distribuidora de Gas El Volcán

Sistema web de venta y distribución de cilindros de gas y accesorios en la Región de Ñuble. Es el proyecto semestral de **DSY1104 — Desarrollo Full Stack II (Duoc UC)**.

Está formado por **4 microservicios Spring Boot + Eureka Server**, que se comunican por REST y OpenFeign, usan JWT y guardan los datos en Oracle Cloud. El frontend es **React** y consume esos microservicios.

> El backend partió de un template "MiniMarket" y fue adaptado a El Volcán. `ms-produccion` (puerto 8083) es un resto de ese template: **queda fuera del alcance** de la Evaluación Parcial 3 y no lo levantan los scripts.

## Arquitectura

| Microservicio | Puerto | Nombre en Eureka | Responsabilidad |
|---|---|---|---|
| **eureka-server** | 8761 | — | Service Discovery (Netflix Eureka) |
| **ms-auth** | 8081 | `MS-AUTH` | Login (JWT), registro de clientes y CRUD de usuarios (ADMIN) |
| **ms-catalogoProductos** | 8082 | `MS-CATALOGOPRODUCTOS` | Catálogo con precio residencial y comercial, más imagen; lectura pública |
| **ms-inventario** | 8084 | `MS-INVENTARIO` | Stock por SKU y alerta de stock crítico |
| **ms-ventas** | 8086 | `MS-VENTAS` | Ventas con despacho y método de pago, confirmación de pago, historial por usuario |

**Integración entre servicios (Feign + Eureka):**
- `ms-ventas` consulta `ms-catalogoProductos` (precio) y `ms-inventario` (stock) al crear una venta, y descuenta el stock al confirmar el pago.
- `ms-catalogoProductos` crea el registro de inventario de cada producto nuevo.

**Versionado de la API:** todas las rutas están versionadas.
- `/api/v1/...` es REST con DTOs.
- `/api/v2/...` devuelve las mismas operaciones con hipermedia (HATEOAS).

En cada Swagger se elige el grupo **"API v1 (REST)"** o **"API v2 (HATEOAS)"**.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Java 21 · Spring Boot 4.0.6 · Spring Cloud 2025.1.1 (Eureka, OpenFeign) · Spring Data JPA |
| Seguridad | Spring Security · JWT (jjwt 0.11.5) · BCrypt · CORS configurable |
| Base de datos | Oracle Autonomous Database (Oracle Cloud) con Wallet |
| Documentación API | springdoc-openapi 3.0.2 (Swagger UI, grupos v1/v2) |
| Frontend | React 19.2 · Vite 8.3 · React Bootstrap 2.10 · React Router 7.18 · `fetch` nativo (sin Axios) |
| Pruebas | JUnit 5 + Mockito + `@WebMvcTest` (backend) · Vitest 3.2 + Testing Library (frontend) |

## Roles

La autorización se aplica **en el backend** (JWT + `@PreAuthorize` / reglas de `SecurityConfig`). El frontend además oculta las vistas que no corresponden a cada rol.

| Rol | Qué puede hacer |
|---|---|
| **ADMIN** | Acceso total: CRUD de productos e inventario, CRUD de usuarios (elige el rol), todas las órdenes, dashboard, clientes y reportes. |
| **VENDEDOR** | **Solo lectura:** lista y detalle de productos, y lista y detalle de órdenes (panel `/vendedor`). No compra ni modifica nada; la tienda no le aparece. |
| **CLIENTE** | Solo la tienda: catálogo, carrito, compra (`/ventas`) y "Mis compras". Solo puede ver y pagar **sus** órdenes. |

El registro público (`POST /api/v1/auth/register`) **siempre** crea usuarios CLIENTE. Los Vendedores y Administradores los crea un ADMIN desde el panel.

## Credenciales de prueba (semilla de ms-auth)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin@duoc.cl` | `Admin123` | ADMIN |
| `vendedor@elvolcan.cl` | `Vendedor123` | VENDEDOR |
| `cliente@elvolcan.cl` | `Cliente123` | CLIENTE |

## Cómo levantar el proyecto

### 1) Secretos (una sola vez)

Las credenciales **no están en el repositorio**. Cada microservicio las lee de un archivo externo:

1. Copia `microservicios/secrets.example.properties` a `%USERPROFILE%\.elvolcan\secrets.properties`.
2. Completa `DB_PASSWORD`, `ORACLE_WALLET_DIR` (la carpeta donde descomprimiste el Wallet) y `JWT_SECRET`. Este último debe tener al menos 32 caracteres y ser **el mismo en todos los servicios**.

### 2) Microservicios

Desde `microservicios/` (Windows PowerShell):

```powershell
# Revisa los requisitos (Java, secretos, Wallet, puertos) sin levantar nada
powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1 -Verificar

# Levanta Eureka + los 4 microservicios y espera su registro en Eureka
powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1

# Primer arranque con una BD que tenga datos antiguos: recarga los 14 productos de El Volcán
powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1 -ReiniciarSemilla

# Detener todo
powershell -ExecutionPolicy Bypass -File .\detener-servicios.ps1
```

Para levantarlos a mano, el orden es: `eureka-server` → `ms-auth` → `ms-inventario` → `ms-catalogoProductos` → `ms-ventas`. En cada carpeta se ejecuta `.\mvnw spring-boot:run`.

### 3) Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## URLs

| Servicio | URL |
|---|---|
| Eureka Dashboard | http://localhost:8761 |
| Frontend | http://localhost:5173 |
| Swagger ms-auth | http://localhost:8081/swagger-ui/index.html |
| Swagger ms-catalogoProductos | http://localhost:8082/swagger-ui/index.html |
| Swagger ms-inventario | http://localhost:8084/swagger-ui/index.html |
| Swagger ms-ventas | http://localhost:8086/swagger-ui/index.html |

En Swagger, primero se hace `POST /api/v1/auth/login`, luego se presiona **Authorize** y se pega el token (sin la palabra `Bearer`).

## Flujo de prueba completo

1. **Eureka:** los 4 servicios aparecen `UP`.
2. **Registro / login:** crear una cuenta en `/registro` (queda como CLIENTE) e iniciar sesión.
3. **Catálogo:** `/productos` muestra los 14 productos desde `ms-catalogoProductos`; el buscador filtra por nombre, categoría o código con sugerencias en vivo y cada tarjeta muestra precio residencial y comercial.
4. **Compra:** carrito → "Ir a pagar" → dirección, comuna y método de pago → `POST /api/v1/ventas` y `PUT /api/v1/ventas/{id}/confirmar`. El stock baja en `ms-inventario`.
5. **Mis compras:** `/mis-compras` lista la orden como "Pagada".
6. **Vendedor:** con `vendedor@elvolcan.cl`, el panel `/vendedor` muestra la orden y su detalle (solo lectura).
7. **Admin:** con `admin@duoc.cl`, Inventario (CRUD), Órdenes, Usuarios (crear, editar y eliminar; no permite borrar la propia cuenta), Clientes y Reportes con datos reales.

## Pruebas

```bash
# Backend: pruebas que no necesitan base de datos (servicio, DTOs, seguridad por rol con @WebMvcTest)
cd microservicios/MiniMarket-Proyecto-ms-ventas
.\mvnw test "-Dtest=!*ApplicationTests"

# Backend completo (incluye @SpringBootTest: requiere la BD de Oracle Cloud activa)
.\mvnw test

# Frontend
cd frontend
npm test                 # Vitest
npm run test:coverage    # reporte de cobertura en frontend/coverage/
npm run lint             # oxlint
```

## Documentación

| Documento | Ubicación |
|---|---|
| Plan de trabajo de la Evaluación Parcial 3 | `docs/PLAN_EVALUACION3.md` |
| Anexos EP3: Anexo 2 (Word), Anexo 3 (Excel), Anexo 4 (Word) y capturas | `docs/parcial3/` |
| Cómo regenerar los Anexos 2 y 4 (`npm run anexos`) | `docs/parcial3/README.md` |
| ERS, documentación técnica, cobertura y despliegue del frontend | `frontend/docs/` |
| Guía del backend (endpoints, seguridad, pruebas en Swagger) | `microservicios/README.md` |

## Estructura del repositorio

```text
Distribuidora-Gas-El-Volcan/
├── microservicios/                  # Backend (Spring Boot)
│   ├── MiniMarket-Proyecto-ms-eureka/
│   ├── MiniMarket-Proyecto-ms-auth/
│   ├── MiniMarket-Proyecto-ms-catalogoProductos/
│   ├── MiniMarket-Proyecto-ms-inventario/
│   ├── MiniMarket-Proyecto-ms-ventas/
│   ├── MiniMarket-Proyecto-ms-produccion/   # fuera del alcance (template)
│   ├── secrets.example.properties
│   ├── levantar-servicios.ps1 / detener-servicios.ps1
├── frontend/                        # React + Vite (versión actual, conectada a la API)
├── docs/
│   ├── PLAN_EVALUACION3.md          # Plan de trabajo de la EP3
│   └── parcial3/                    # Anexos 2, 3 y 4, capturas y generador
├── package.json                     # Script `npm run anexos` (genera los Anexos 2 y 4)
├── Version 1/                       # Entrega 1: HTML + CSS + JS
├── Version 2/                       # Entrega 2: React con localStorage
└── Version 3/                       # Entrega 3: snapshot de la EP3 (microservicios + React)
```
