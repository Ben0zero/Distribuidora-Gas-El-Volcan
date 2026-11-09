# Distribuidora de Gas El Volcán — Backend (microservicios)

Backend del proyecto semestral **DSY1104 — Desarrollo Full Stack II**: 4 microservicios Spring Boot + Eureka Server, con JWT, OpenFeign y Oracle Cloud.

Este documento sirve como **guía de pruebas de la API**. Cada microservicio tiene un camino feliz y pruebas de error para la defensa.

## Servicios

| Servicio | Puerto | Eureka | Swagger |
|---|---|---|---|
| eureka-server | 8761 | — | http://localhost:8761 (dashboard) |
| ms-auth | 8081 | `MS-AUTH` | http://localhost:8081/swagger-ui/index.html |
| ms-catalogoProductos | 8082 | `MS-CATALOGOPRODUCTOS` | http://localhost:8082/swagger-ui/index.html |
| ms-inventario | 8084 | `MS-INVENTARIO` | http://localhost:8084/swagger-ui/index.html |
| ms-ventas | 8086 | `MS-VENTAS` | http://localhost:8086/swagger-ui/index.html |

`MiniMarket-Proyecto-ms-produccion` (8083) es un resto del template original y **no forma parte de la entrega**.

**Stack:** Java 21 · Spring Boot 4.0.6 · Spring Cloud 2025.1.1 · Spring Security + JWT (jjwt 0.11.5) · Spring Data JPA · Oracle Autonomous Database (Wallet) · springdoc-openapi 3.0.2.

## Configuración (secretos fuera del repositorio)

Cada `application.properties` importa `optional:file:${user.home}/.elvolcan/secrets.properties`. Para configurarlo:

1. Copia `secrets.example.properties` a `%USERPROFILE%\.elvolcan\secrets.properties`.
2. Completa:
   - `DB_USER`: por defecto `ADMIN`.
   - `DB_PASSWORD`: contraseña de la base.
   - `ORACLE_WALLET_DIR`: carpeta del Wallet descomprimido.
   - `JWT_SECRET`: al menos 32 caracteres, igual en todos los servicios.
   - `CORS_ORIGINS`: opcional; por defecto `localhost` y `127.0.0.1` en los puertos 5173 y 5174.
3. El Wallet y el archivo de secretos están en `.gitignore`: **nunca se suben al repositorio**.

## Levantar y detener

```powershell
powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1 -Verificar         # solo revisa requisitos
powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1                    # levanta y espera el registro en Eureka
powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1 -ReiniciarSemilla  # 1er arranque: recarga los 14 productos
powershell -ExecutionPolicy Bypass -File .\detener-servicios.ps1
```

Los logs quedan en `%USERPROFILE%\.elvolcan\logs\<servicio>.log`.

**Datos iniciales:**
- ms-auth crea los roles y 3 usuarios: `admin@duoc.cl`, `vendedor@elvolcan.cl` y `cliente@elvolcan.cl`.
- ms-catalogoProductos y ms-inventario cargan los 14 productos (CL001…AC003) con su stock.
- Si la BD ya tiene datos, no se tocan. Con `-ReiniciarSemilla` (propiedad `app.semilla.reiniciar=true`) se borran y se vuelven a cargar.

## Seguridad

- **JWT:** el login (`POST /api/v1/auth/login`) devuelve el token y los datos del usuario. El token lleva el rol (`ROLE_ADMIN`, `ROLE_VENDEDOR` o `ROLE_CLIENTE`) y dura 10 horas. Los demás servicios lo validan con la misma clave.
- **Roles:**
  - ADMIN: acceso total.
  - VENDEDOR: **solo lectura** de productos, inventario y órdenes.
  - CLIENTE: catálogo, compra y "mis compras". Solo ve y paga **sus** ventas, porque el servicio valida que sea el dueño.
- **CORS** habilitado solo para `/api/**` y los orígenes configurados.
- **Errores normalizados:**
  - 400: validación.
  - 401: sin token o credenciales malas.
  - 403: sin permiso o venta ajena.
  - 404: no existe.
  - 409: duplicado o stock insuficiente.

En Swagger se usa el botón **Authorize** y se pega el token **sin** la palabra `Bearer`.

---

## 🔐 1. ms-auth (8081)

### Camino feliz
**Login**: `POST /api/v1/auth/login`
```json
{ "username": "admin@duoc.cl", "password": "Admin123" }
```
Devuelve `token`, `nombre`, `nombreRol`, `tipoCliente`, `direccion`, etc.

**Registro público** (siempre queda CLIENTE): `POST /api/v1/auth/register`
```json
{ "nombre": "Ana Pérez", "rut": "17234567", "username": "ana@duoc.cl", "password": "abc123",
  "direccion": "Calle Nueva 789", "region": "Región de Ñuble", "comuna": "Chillán", "tipoCliente": "Residencial" }
```

**Crear un Vendedor (token ADMIN)**: `POST /api/v1/usuarios`
```json
{ "nombre": "Carla Muñoz", "rut": "16543210", "username": "carla@elvolcan.cl",
  "password": "Vende123", "nombreRol": "VENDEDOR", "comuna": "Chillán" }
```
Las respuestas usan `UsuarioResponseDTO` y nunca incluyen la contraseña. En `GET /api/v2/usuarios`, cada usuario trae enlaces HATEOAS (`self`, `actualizar`, `eliminar`).

### Pruebas de error
| Prueba | Petición | Resultado |
|---|---|---|
| Credenciales inválidas | login con contraseña equivocada | **401** |
| Registro duplicado | repetir el `username` o el `rut` | **409** |
| Escalar privilegios | registro con `"nombreRol":"ADMIN"` | se ignora: queda **CLIENTE** |
| Datos inválidos | registro sin `password` | **400** con `validationErrors.password` |
| Sin permisos | `GET /api/v1/usuarios` con token de CLIENTE o VENDEDOR | **403** |

## 📦 2. ms-catalogoProductos (8082)

### Camino feliz
- **Catálogo público** (sin token): `GET /api/v1/productos` · `GET /api/v1/productos/id/{id}` · `GET /api/v1/productos/{sku}`.
- **Crear producto (ADMIN)**: `POST /api/v1/productos`. Por Feign y Eureka crea su registro en ms-inventario (stock 0, crítico 5, máximo 500).
  ```json
  { "sku": "CL005", "nombre": "Cilindro GLP 25 kg", "precioResidencial": 25000, "precioComercial": 23000,
    "categoria": "Cilindros de Gas", "imagen": "/IMAGENES/Logo Gas.png" }
  ```
- **Editar (ADMIN)**: `PUT /api/v1/productos/{id}`. El SKU no se puede cambiar, porque enlaza con el inventario.
- **Desactivar (ADMIN)**: `DELETE /api/v1/productos/{sku}`. Es un borrado lógico y responde 204.
- **HATEOAS**: `GET /api/v2/productos`.

### Pruebas de error
| Prueba | Petición | Resultado |
|---|---|---|
| Sin token | `POST /api/v1/productos` | **401** |
| Rol sin permiso | `POST` / `PUT` / `DELETE` con token de VENDEDOR | **403** |
| Validación | `precioResidencial: -500` o `nombre` vacío | **400** |
| Cambiar SKU | `PUT /api/v1/productos/2` con `"sku":"OTRO"` | **400** "El SKU no se puede modificar" |

## 📋 3. ms-inventario (8084)

### Camino feliz (con token)
- `GET /api/v1/inventario` · `GET /api/v1/inventario/{sku}` · `GET /api/v1/inventario/critico`.
- **Ajuste de stock (ADMIN)**: `PUT /api/v1/inventario/aumentar` o `/disminuir`:
  ```json
  { "sku": "CL002", "stockActual": 5 }
  ```
- **HATEOAS**: `GET /api/v2/inventario/critico`.

### Pruebas de error
| Prueba | Petición | Resultado |
|---|---|---|
| Solo lectura | `PUT /api/v1/inventario/aumentar` con token de VENDEDOR | **403** |
| Stock insuficiente | disminuir más unidades de las que hay | error de negocio (sin stock negativo) |
| Sobrestock | aumentar por sobre el máximo (500) | error de negocio |

## 💳 4. ms-ventas (8086)

### Camino feliz (token CLIENTE)
1. **Crear venta**: `POST /api/v1/ventas`. Consulta el precio en el catálogo y el stock en el inventario por Feign.
   ```json
   { "tipoCliente": "Residencial", "direccion": "Calle Nueva 789", "comuna": "Chillán",
     "metodoPago": "Efectivo", "detalles": [ { "productoId": 2, "cantidad": 2 } ] }
   ```
   Queda `PENDIENTE_PAGO`. La respuesta trae el enlace HATEOAS `confirmar-pago`.
2. **Confirmar pago**: `PUT /api/v1/ventas/{id}/confirmar`. Pasa a `PAGADA` y descuenta el stock en ms-inventario con un token interno de servicio.
3. **Mis compras**: `GET /api/v1/ventas/mis-compras`.
4. **Vendedor o Admin**: `GET /api/v1/ventas` (todas) y `GET /api/v1/ventas/{id}` (detalle, con el `usuario` comprador).
5. **HATEOAS**: `GET /api/v2/ventas/mis-compras` (`_embedded` y `_links`).

### Pruebas de error
| Prueba | Petición | Resultado |
|---|---|---|
| Sin stock | pedir `cantidad: 900` de un producto | **409** "Stock insuficiente para: …" |
| Venta ajena | confirmar o ver la venta de otro cliente | **403** |
| Datos de despacho | sin `direccion`, sin `comuna` o con `metodoPago: "Bitcoin"` | **400** |
| Solo lectura | `POST /api/v1/ventas` con token de VENDEDOR | **403** |
| Venta inexistente | `GET /api/v1/ventas/999` | **404** |

---

## Pruebas automatizadas

```powershell
cd MiniMarket-Proyecto-ms-ventas
.\mvnw test "-Dtest=!*ApplicationTests"   # unitarias + seguridad por rol (@WebMvcTest), sin base de datos
.\mvnw test                               # todo, incluido @SpringBootTest (requiere Oracle Cloud activo)
```

Cada `mvnw test` genera además el reporte de cobertura **JaCoCo** en `target/site/jacoco/index.html`.

| Servicio | Qué cubren |
|---|---|
| ms-auth | Login y registro (rol CLIENTE forzado, 409); CRUD de usuarios con DTO; CORS; códigos HTTP del controlador; 403 para no-ADMIN |
| ms-catalogoProductos | CRUD del servicio (incluye `PUT` y bloqueo de SKU); semilla de 14 productos; reglas de rol con `@WebMvcTest` |
| ms-inventario | Servicio de stock; semilla alineada con el catálogo; VENDEDOR de solo lectura |
| ms-ventas | Crear y confirmar venta; dueño de la venta; detalle por rol; validación del despacho; reglas de rol |
