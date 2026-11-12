# Distribuidora de Gas El Volcán — Versión 3

**Entrega 3 (Evaluación Parcial 3)** del proyecto semestral de **DSY1104 — Desarrollo Full Stack II (Duoc UC)**.

Esta carpeta es un **snapshot congelado** de la entrega: contiene exactamente lo que se presentó en la EP3.
El código que sigue en desarrollo está en la raíz del repositorio (`microservicios/`, `frontend/`, `docs/`).

## Qué incluye

| Carpeta / archivo | Contenido |
|---|---|
| `microservicios/` | Backend: Eureka Server + 4 microservicios Spring Boot, scripts de arranque y parada |
| `frontend/` | Aplicación React + Vite conectada a los microservicios |
| `docs/PLAN_EVALUACION3.md` | Plan de trabajo de la evaluación |
| `docs/parcial3/` | Anexo 2 (Word), Anexo 3 (Excel), Anexo 4 (Word), capturas y generador |
| `package.json` | Script `npm run anexos` para regenerar los Anexo 2 y 4 |

## Arquitectura

| Microservicio | Puerto | Nombre en Eureka | Responsabilidad |
|---|---|---|---|
| **eureka-server** | 8761 | — | Service Discovery (Netflix Eureka) |
| **ms-auth** | 8081 | `MS-AUTH` | Login (JWT), registro de clientes y CRUD de usuarios (ADMIN) |
| **ms-catalogoProductos** | 8082 | `MS-CATALOGOPRODUCTOS` | Catálogo con precio residencial y comercial, más imagen; lectura pública |
| **ms-inventario** | 8084 | `MS-INVENTARIO` | Stock por SKU y alerta de stock crítico |
| **ms-ventas** | 8086 | `MS-VENTAS` | Ventas con despacho y método de pago, confirmación de pago, historial por usuario |

**Integración (Feign + Eureka):**
- `ms-ventas` consulta `ms-catalogoProductos` (precio) y `ms-inventario` (stock) al crear una venta, y descuenta el stock al confirmar el pago.
- `ms-catalogoProductos` crea el registro de inventario de cada producto nuevo.

**Versionado de la API:** `/api/v1/...` es REST con DTOs y `/api/v2/...` devuelve las mismas operaciones con HATEOAS.
En cada Swagger se elige el grupo **"API v1 (REST)"** o **"API v2 (HATEOAS)"**.

> `ms-produccion` (puerto 8083) es un resto del template "MiniMarket": **queda fuera del alcance** y no lo levantan los scripts.

## Roles

| Rol | Qué puede hacer |
|---|---|
| **ADMIN** | Acceso total: CRUD de productos e inventario, CRUD de usuarios, todas las órdenes, dashboard, clientes y reportes. |
| **VENDEDOR** | **Solo lectura:** productos y órdenes en el panel `/vendedor`. No compra ni modifica nada. |
| **CLIENTE** | Tienda: catálogo, carrito, compra y "Mis compras". Solo ve y paga **sus** órdenes. |

El registro público (`POST /api/v1/auth/register`) **siempre** crea usuarios CLIENTE.

## Credenciales de prueba (semilla de ms-auth)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin@duoc.cl` | `Admin123` | ADMIN |
| `vendedor@elvolcan.cl` | `Vendedor123` | VENDEDOR |
| `cliente@elvolcan.cl` | `Cliente123` | CLIENTE |

## Cómo levantar esta versión

### 1) Secretos (una sola vez)

Las credenciales no están en el repositorio. Cada microservicio las lee de un archivo externo:

1. Copia `microservicios/secrets.example.properties` a `%USERPROFILE%\.elvolcan\secrets.properties`.
2. Completa `DB_PASSWORD`, `ORACLE_WALLET_DIR` (carpeta donde se descomprimió el Wallet) y `JWT_SECRET`.
   Este último debe tener al menos 32 caracteres y ser **el mismo en todos los servicios**.

### 2) Microservicios

Desde esta carpeta (`Version 3/microservicios/`), en Windows PowerShell:

```powershell
# Revisa requisitos (Java, secretos, Wallet, puertos) sin levantar nada
powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1 -Verificar

# Levanta Eureka + los 4 microservicios y espera su registro en Eureka
powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1

# Detener todo
powershell -ExecutionPolicy Bypass -File .\detener-servicios.ps1
```

> **Ojo:** `-ReiniciarSemilla` recarga los 14 productos de El Volcán y **borra los productos existentes**.
> La base de datos es compartida, así que se ejecuta **una sola vez** por el equipo.

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

En Swagger: `POST /api/v1/auth/login`, luego **Authorize** y pegar el token (sin la palabra `Bearer`).

## Documentación de la entrega

| Documento | Ubicación |
|---|---|
| Plan de trabajo de la EP3 | `docs/PLAN_EVALUACION3.md` |
| Anexo 2 — Documentación APIs e Integración (Word) | `docs/parcial3/` |
| Anexo 3 — Documentación APIs (Excel) | `docs/parcial3/` |
| Anexo 4 — Manual de usuario (Word) | `docs/parcial3/` |
| Capturas del sistema | `docs/parcial3/capturas/` |

Para regenerar los Anexo 2 y 4 desde esta carpeta:

```bash
npm install        # instala docx (una sola vez)
npm run anexos     # equivale a: node docs/parcial3/generar-anexos.js
```

## Pruebas

```bash
# Backend: pruebas sin base de datos (servicio, DTOs, seguridad por rol con @WebMvcTest)
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
