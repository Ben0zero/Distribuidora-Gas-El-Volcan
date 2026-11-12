# Plan de Adaptación — MiniMarket → Distribuidora de Gas El Volcán

Reutilizar el template de microservicios "MiniMarket" (Spring Boot) para el dominio de la distribuidora de gas.
**No partir de cero**: heredar los 6 servicios + Eureka y adaptar entidades, datos semilla y reglas.

---

## 1. Arquitectura objetivo

| # | Servicio | Puerto | Papel en "El Volcán" |
|---|---|---|---|
| 1 | **Eureka** | 8761 | Discovery: los 6 servicios se registran en UP |
| 2 | **ms-auth** (LoginAuth) | 8081 | Autenticación + usuarios + roles (JWT) |
| 3 | **ms-catalogo** | 8082 | Catálogo de productos de gas (cilindros, reguladores, mangueras, accesorios) |
| 4 | **ms-produccion** | 8083 | **Recepción de mercadería** (lote de cilindros que entra y sube stock) |
| 5 | **ms-inventario** | 8084 | Stock por SKU + alerta stock crítico + descontar (evita negativo) |
| 6 | ~~Pesaje~~ | ~~8085~~ | **SE ELIMINA**: el gas se vende por unidad, no por kilo suelto |
| 7 | **ms-ventas** | 8086 | Órdenes: `PENDIENTE_PAGO` → confirmar pago → descuenta inventario |

**Nuevo deployable objetivo:** 5 servicios + Eureka (se descarta Pesaje).

---

## 2. Mapa de mapeo por servicio

### 2.1 ms-auth (LoginAuth)
- **Renombrar rol** `PANADERO` → `VENDEDOR`; mantener `ADMIN`; agregar `CLIENTE`.
- **Registro** (`RegistroRequestDTO`): agregar campos del frontend → `direccion`, `region`, `comuna`, `tipoCliente` (residencial/comercial), `telefono` (opcional).
- **Usuario base** (DataInitializer): `admin@duoc.cl / Admin123`, RUN `19011022`, nombre "Juan Pérez", rol **Administrador** (igual que `ADMIN_DEFAULT` del frontend, `java.js:28`).
- **Endpoints**: `POST /api/auth/login`, `GET /api/v2/usuarios` (HATEOAS) — se mantienen.

### 2.2 ms-catalogo (productos de gas)
- Sustituir semilla de panadería por los **14 productos reales** que ya están en `java.js:4-18` (PRODUCTOS):
  - Cilindros: CL001 (5kg), CL002 (11kg), CL003 (15kg), CL004 (45kg).
  - Reguladores: RG001 (estándar), RG002 (alta presión), RG003 (dual).
  - Mangueras y conexiones: MG001 (1.5m), MG002 (3m), MG003 (abrazadera), MG004 (kit).
  - Accesorios: AC001 (carro), AC002 (tapa válvula), AC003 (detector de gas).
- **DTO `ProductoRequestDTO`**: hoy tiene un solo `precio` → **agregar `precioResidencial` y `precioComercial`** (el frontend cobra según tipo de cliente).
- Al crear producto por admin → Feign avisa a Inventario (se mantiene el flujo actual).

### 2.3 ms-inventario
- **No cambia de lógica**: stock por SKU, `stockCritico`, `disminuir` (rechaza stock negativo con `OverstockException`/`InsufficientStockException`).
- Semilla: stock inicial de cada producto según `java.js:4-18` (ej: CL003 → 90, stockCrítico 5).

### 2.4 ms-produccion → Recepción de mercadería
- Renombrar concepto: "Lote de fabricación de pan" → **"Lote de cilindros recibidos"**.
- `ProduccionRequestDTO`: `productoSku` + `cantidad` (mismo shape; el comentario cambia a "cilindros recibidos").
- Efecto secundario: Feign suma stock en Inventario (igual que hoy).

### 2.5 ms-ventas
- Mantener flujo: **crear venta (PENDIENTE_PAGO)** → **confirmar pago** → descuenta stock vía Inventario.
- Quitar dependencia de `PesajeClient` (ya no existe pesaje); el carrito completo es por unidad (`DetalleVentaRequestDTO { productoId, cantidad }`).
- `VentaRequestDTO`: considerar enviar `tipoCliente` para usar el precio correcto del catálogo.

### 2.6 ~~Pesaje~~ → descartar
No se descarga/compila. No se integra en `ms-ventas`.

---

## 3. Renombrados de código

| Servicio | Paquete actual | Paquete objetivo |
|---|---|---|
| auth | `com.example.LoginAuth` | `cl.elvolcan.auth` |
| catálogo | `com.example.catalogoproductos` | `cl.elvolcan.catalogo` |
| producción | `minimarket.produccion` | `cl.elvolcan.recepcion` |
| inventario | `inventario.inventario_service` | `cl.elvolcan.inventario` |
| ventas | `Minimarket.ventas` | `cl.elvolcan.ventas` |

- `artifactId` en `pom.xml`: `loginauth`, `catalogoproductos`, … → `elvolcan-auth`, `elvolcan-catalogo`, etc.
- Nombres de clases de negocio: `Producto`→se mantiene; `LoteProduccion`→`LoteRecepcion`; `Venta`/`DetalleVenta` se mantienen.

---

## 4. Datos semilla (DataInitializer de cada servicio)

- **auth**: admin + un vendedor de ejemplo (`vendedor@elvolcan.cl`) + 1 cliente.
- **catálogo**: los 14 productos del frontend (SKU, nombre, descripción, precios res/com, categoría, nombre de imagen para el frontend).
- **inventario**: SKU + stock actual + stock crítico por producto.
- **recepcion**: sin datos semilla (se generan lotes al operar).

---

## 5. Configuración (application.properties)

- Tabla puertos: 8761 / 8081 / 8082 / 8083 / 8084 / 8085(eliminado) / 8086.
- Cada servicio registra en Eureka (`eureka.client.serviceUrl.defaultZone=http://localhost:8761/eureka`).
- **Base de datos**: el template trae `OracleWallet/` (Oracle Cloud) + MySQL como alternativa. Decidir: **MySQL local** para simplificar las pruebas de defensa, y adaptar las URLs/credenciales en cada `application.properties`.
- Verificar que **Java 21 + Maven (wrapper `mvnw`) + Spring Boot 4.0.6** compilen en el equipo (hoy no se ha usado).

---

## 6. Seguridad (JWT)

- Un token emitido por **ms-auth** vale para los demás servicios (misma `JwtUtil`/secreto compartido — confirmar dónde se define la clave secreta).
- Niveles:
  - `ADMIN` → gestiona usuarios, productos, inventario.
  - `VENDEDOR` → registra recepciones y ventas.
  - `CLIENTE` → solo catálogo + su carrito/órdenes (acotar en `SecurityConfig`).
- `CustomAuthenticationEntryPoint` → 401 controlado si falta token (ya existe).

---

## 7. Integración con el frontend (futuro)

Cuando se migre el sitio web, se aplica el "seam" ya documentado en
`ERS_Plan_Microservicios.md`: cambiar `leer()`/`guardar()` de `java.js` (líneas 38/47)
por `fetch()` a los endpoints de arriba. Los **modelos JSON ya están iguales**
(PRODUCTOS en `java.js:4`, usuarios, órdenes).

---

## 8. Roadmap

### Fase A — Preparar el terreno
- [x] Extraer los 4 ZIPs pendientes (catálogo, producción, inventario, ventas) a carpetas limpias.
- [x] Verificar que **Eureka + cada módulo compilan** (Java 21.0.10 LTS, `./mvnw compile` → EXIT 0 en los 6).
- [x] Decidir BD: **se mantiene Oracle Cloud** (cuenta del curso, `clases_high`, TCPS 1522). Se descarta MySQL local.
- [x] Limpiar duplicados anidadas (2026-10-20): comparación por MD5 demostró que eran copias idénticas;
      auth/eureka/catálogo se subieron a la raíz de su carpeta, inventario/producción/main se borraron duplicados.
      Hoy cada carpeta = 1 proyecto Maven en su raíz (catálogo eureka queda en subcarpeta `eurekaserver\`).
- [x] Wallet de Oracle centralizada en `C:\Users\ben95\.elvolcan\OracleWallet` (ruta sin espacios) y
      `spring.datasource.url=jdbc:oracle:thin:@clases_high?TNS_ADMIN=C:/Users/ben95/.elvolcan/OracleWallet`
      en los 5 servicios con BD (antes usaban `/app/OracleWallet`, ruta de Linux/Docker).
- [x] Levantar los 6 servicios y validar que aparezcan UP en Eureka. **HECHO (2026-10-20):**
      los 5 servicios registrados con status UP en `http://localhost:8761` (`UP_5_`) — LOGINAUTH,
      CATALOGOPRODUCTOS, PRODUCCION, INVENTARIO-SERVICE, VENTAS-SERVICE. Eureka no se auto-registra
      (`register-with-eureka=false`), su presencia se valida por el puerto 8761.
- [x] Smoke test end-to-end básico (2026-10-20): `POST /api/auth/login` (admin/admin123) → JWT OK;
      `GET /api/v2/usuarios` con Bearer → 200; sin token → 401 controlado.

**Notas post-levantamiento (2026-10-20):**
- La wallet de Oracle debe ir como **parámetro de la URL JDBC** (`?TNS_ADMIN=...`); probar la conexión
  aislada con jshell requiere `oraclepki` + `osdt_core` + `osdt_cert` en el classpath si no, falla con
  `ORA-17957 (SSO KeyStore not available)` — en Spring Boot esos jars ya vienen.
- `auth` tenía `spring.flyway.url` con la ruta Docker antigua (`/app/OracleWallet`) además de
  `spring.datasource.url` → corregido a la wallet central.
- El primer intento falló con `ORA-17002` (socket) al conectar los 5 a la vez; subir la separación
  entre arranques (45 s) y el chequeo de Eureka parsea XML con `[xml]` + `SelectNodes('/applications/application')`.
- El schema Oracle es **compartido** con otros proyectos del curso (SOCIO, CREDITO, etc.) y ya contiene
  tablas MiniMarket (VENTAS, DETALLES_VENTA, INVENTARIOS, LOTES_PRODUCCION, ROLES, PESAJES, USUARIO_CLAVE).
  Ojo al adaptar: preferir prefijos de tabla propios en Fase B para no chocar.
- Seed actual de auth (template, Fase B lo cambiará): `admin/admin123` (ADMIN), `super1/super123`,
  `cajero1/cajero123`, `panadero1/panadero123` (roles SUPERVISOR/CAJERO/PANADERO).

**Notas de la Fase A (2026-09-15):**
- Java 21 instalado en el equipo; `mvnw` descargó Maven y todas las dependencias OK.
- Los 6 proyectos compilan: eureka, auth, catálogo, inventario, producción, ventas. EXIT=0.
- `ms-produccion` no traía `.mvn/wrapper` en ambas copias → se copió el wrapper desde `ms-ventas` y compiló.

### Fase B — Adaptar (un servicio por sesión)
- [x] **auth**: roles + registro con dirección/comuna/tipoCliente + semilla admin. **HECHO (2026-10-20):**
      - Paquete renombrado `com.example.loginauth` → `cl.elvolcan.auth` (24 archivos, carpeta `Security` → `security`).
      - `pom.xml`: `groupId=cl.elvolcan`, `artifactId/name=elvolcan-auth`.
      - Roles: `ADMIN`, `VENDEDOR`, `CLIENTE` (se eliminaron SUPERVISOR/CAJERO/PANADERO del seed y de los `@PreAuthorize`).
      - `Usuario` + `RegistroRequestDTO` + `UsuarioResponseDTO`: campos nuevos `direccion`, `region`, `comuna`,
        `tipoCliente` (valores del frontend: `Residencial`/`Comercial`), `telefono` (opcional).
      - `spring.application.name=ms-auth` (regla del negocio: "ms-<servicio>").
      - Semilla (`DataInitializer`): `admin@duoc.cl/Admin123` (ADMIN, Juan Pérez, RUN 19011022),
        `vendedor@elvolcan.cl/Vendedor123` (VENDEDOR), `cliente@elvolcan.cl/Cliente123` (CLIENTE).
      - Limpieza de BD heredada: `ResetAuthDataConfig` (perfil `reset-auth`) borra `ROLES`+`USUARIOS` del template.
        Nota: la BD Oracle compartida corta el socket en escrituras desde jshell → la limpieza se hace desde la app.
- [ ] **catálogo**: productos de gas con doble precio + semilla.
- [x] **inventario**: renombrado a `cl.elvolcan.inventario`, servicio `ms-inventario`, permisos ADMIN/VENDEDOR y semilla de 14 SKU de gas. Validado login JWT, listado, búsqueda, aumento/disminución y autorización CLIENTE (403).
- [ ] **recepcion** (ex-producción): renombrar concepto y paquetes.
- [x] **ventas**: renombrado a `cl.elvolcan.ventas`, servicio `ms-ventas`, eliminado Pesaje, ajustado DTO para tipo de cliente y doble precio, e integración validada con catálogo/inventario.
- [x] Renombrar paquetes a `cl.elvolcan.*` — hecho en auth; falta catálogo, recepción, inventario y ventas.

### Fase C — End-to-end + defensa
- [ ] Repetir la guía de pruebas del README MiniMarket adaptada a "El Volcán"
      (login → token → crear producto → recepción → venta → confirmar pago → stock baja).
- [ ] Caminos de error: 401 (token malo), 403 (rol sin privilegios), 400 (validación),
      409 (stock insuficiente al vender).
- [ ] Registrar el nuevo README de pruebas para la defensa.

---

## 9. Pendientes/riesgos

- Falta el módulo **Pesaje** descargado (no está en la carpeta): correcto, igual se elimina del flujo.
- ZIPs sin extraer: catálogo, producción, inventario, ventas.
- Config de Oracle API (`ojdbc.properties`) apunta a una cuenta Oracle Cloud personal → revisar o migrar a MySQL.
- Verificar la versión de Spring Boot 4.0.6 + Java 21 funcionando antes de empezar (es muy nueva).
