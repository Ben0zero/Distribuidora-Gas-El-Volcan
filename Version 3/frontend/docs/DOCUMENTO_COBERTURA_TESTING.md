# Documento de Cobertura y Análisis de Testing

**Proyecto:** Distribuidora de Gas El Volcán (frontend React + microservicios Spring Boot)
**Asignatura:** DSY1104 — Desarrollo Fullstack II
**Evaluación:** Evaluación Parcial N° 3
**Herramientas de testing:** Vitest + React Testing Library (frontend) · JUnit 5 + Mockito + Spring MockMvc (backend)
**Fecha:** Noviembre 2026

---

## 1. Objetivo

Este documento describe la estrategia de pruebas del sistema completo, los **resultados de ejecución**, la **cobertura** obtenida y un **análisis** de ellos.

En EP3 el frontend dejó de usar `localStorage` y consume los microservicios. Por eso las pruebas cubren tanto la lógica del frontend como la **integración con la API** (con la API simulada) y las **reglas de negocio y de seguridad del backend**:

- **Validaciones** de formularios (frontend) y de DTOs (`@Valid`, backend).
- **Formularios interactivos** (Login, Registro, Checkout, Nuevo usuario).
- **Compras**: carrito, creación y confirmación de la venta, reintento de pago, stock insuficiente.
- **CRUD**: productos e inventario (Admin), usuarios con rol (Admin).
- **Seguridad por rol**: rutas protegidas en el frontend y respuestas **401 / 403** del backend con su `SecurityConfig` real.
- Componentes con **props**, **estado** y **mocks** (`vi.fn`, `vi.stubGlobal('fetch')`, Mockito).

> **Sobre el límite de 10 pruebas:** el máximo de 10 pruebas fue una indicación para la **Evaluación Parcial 2**, que solo tenía frontend. En EP3 el alcance incluye el backend y la integración, así que se documentan **todas** las pruebas del proyecto.

---

## 2. Herramientas y versiones

### Frontend
| Herramienta | Rol | Versión |
|---|---|---|
| **Vitest** | Framework de pruebas (`describe` / `test` / `expect` / `vi`) integrado con Vite | 3.2.7 |
| **jsdom** | Navegador simulado (DOM, `localStorage`, eventos) | 26.1.0 |
| **@testing-library/react** · **user-event** · **jest-dom** | Render, interacción real del usuario y matchers de DOM | 16.3 · 14.6 · 6.6 |
| **@vitest/coverage-v8** | Cobertura con el motor V8 | 3.2.4 |

**Entorno:** Node.js v24.21 · Windows.

### Backend
| Herramienta | Rol |
|---|---|
| **JUnit 5** | Framework de pruebas (incluido en `spring-boot-starter-test`) |
| **Mockito** | Mocks de repositorios, clientes Feign y codificador de contraseñas |
| **Spring MockMvc** (`@WebMvcTest`) | Pruebas de la capa web con la configuración de seguridad **real** y sin base de datos |
| **spring-security-test** (`@WithMockUser`) | Simula un usuario autenticado con un rol |
| **Jakarta Validation** | Prueba directa de las anotaciones de los DTOs |
| **JaCoCo** 0.8.13 | Cobertura del backend (`target/site/jacoco/index.html`, se genera con `mvnw test`) |

**Entorno:** Java 21 · Spring Boot 4.0.6 · Maven Wrapper.

---

## 3. Estrategia y estructura

**Frontend.** Las pruebas viven junto a cada módulo (`*.test.js(x)`). Las llamadas a la API se simulan con `vi.stubGlobal('fetch', vi.fn(...))`, que responde según la URL y el método. Así se verifican la URL versionada (`/api/v1/...`), el body enviado, el header `Authorization` y la reacción ante 200, 201, 401, 403, 404, 409 o falta de conexión, **sin levantar el backend**. `src/testUtils/jwt.js` genera JWT con `exp` real para probar la expiración de la sesión.

**Backend.** Hay tres tipos de prueba por microservicio:
1. **Servicio** (Mockito): reglas de negocio aisladas, por ejemplo "solo el dueño confirma su venta", "el registro público siempre es CLIENTE" o "el SKU no se puede modificar".
2. **Seguridad / web** (`@WebMvcTest` + `@WithMockUser`): las reglas de rol y los códigos HTTP con el `SecurityConfig` real.
3. **Datos y DTOs**: la semilla de 14 productos y las validaciones de `VentaRequestDTO`.

Las clases `*ApplicationTests` (`@SpringBootTest`) levantan el contexto completo y **necesitan la base Oracle Cloud activa**, así que se ejecutan aparte.

### Cómo ejecutar

```bash
# Frontend
cd frontend
npm test                 # 71 pruebas
npm run test:coverage    # + reporte en coverage/index.html y coverage/lcov.info

# Backend (en cada microservicio)
.\mvnw test "-Dtest=!*ApplicationTests"   # 72 pruebas sin base de datos + reporte JaCoCo
.\mvnw test                               # todo, con Oracle Cloud activo
# reporte de cobertura: target/site/jacoco/index.html
```

---

## 4. Inventario de pruebas

### 4.1 Frontend: 71 pruebas en 23 archivos

| Archivo | N.º | Qué verifica | Tipo |
|---|---|---|---|
| `utils/validaciones.test.js` | 2 | RUN, teléfono, correo, precio; primer error de los formularios de Registro y Contacto | Lógica (validación) |
| `utils/carrito.test.js` | 3 | Agregar, incrementar, decrementar y eliminar sin mutar; total residencial y comercial | Lógica (compras) |
| `utils/productos.test.js` | 2 | Catálogo de referencia; `desdeApi()` convierte el `ProductoResponseDTO` | Lógica + integración |
| `utils/inventario.test.js` | 4 | Unir catálogo y stock por SKU; ajuste de stock por diferencia; validación del producto | Lógica (CRUD) |
| `utils/ventas.test.js` | 3 | KPI (ingresos solo pagadas), comunas, orden por recientes, formatos | Lógica |
| `utils/reportes.test.js` | 5 | Clientes con compras, ventas mensuales, categorías, tipo de cliente, más vendidos, CSV | Lógica |
| `utils/sesion.test.js` | 4 | Rol de la API, ruta inicial por rol, sesión desde el login, **expiración del JWT** | Lógica (seguridad) |
| `utils/useCatalogo.test.js` | 2 | Catálogo de la API con ids numéricos; sin conexión usa el de referencia y avisa | Hook + API |
| `components/Producto.test.jsx` | 1 | Props en el DOM y callback `onAgregar` (mock) | Componente |
| `components/Navbar.test.jsx` | 4 | Enlaces, badge del carrito y menú por rol (visitante, cliente, admin, token expirado) | Componente (rol) |
| `components/RutaProtegida.test.jsx` | 5 | Sin sesión → login; cliente en `/admin` → tienda; admin y cliente permitidos; token expirado | Seguridad (rutas) |
| `pages/Nosotros.test.jsx` | 1 | Estado `useState` (expandir y contraer) | Componente (estado) |
| `pages/Login.test.jsx` | 3 | Validaciones; 401 y sin conexión **sin usuarios locales**; login de cliente y admin con datos de la API | Formulario + API |
| `pages/Registro.test.jsx` | 3 | `POST /register` sin rol; 409 duplicado; sin conexión | Formulario + API |
| `pages/DetalleProducto.test.jsx` | 3 | `GET /productos/id/{id}`, 404, id local | Página + API |
| `pages/Carrito.test.jsx` | 2 | Líneas con ids de la API y total; aviso y bloqueo sin conexión | Página + API |
| `pages/Ventas.test.jsx` | 3 | `POST` venta + `PUT` confirmar; 409 sin stock; **reintento sobre la misma venta** | Compras + API |
| `pages/MisCompras.test.jsx` | 2 | Sin sesión no consulta; historial y "Pagar ahora" | Página + API |
| `pages/vendedor/PanelVendedor.test.jsx` | 6 | Menú con solo Productos y Órdenes; lista y detalle de órdenes; detalle de producto con stock; redirección fuera de la tienda | Rol Vendedor |
| `pages/admin/Inventario.test.jsx` | 4 | Lista con stock crítico; crear (`POST` + aumentar); editar (`PUT` + disminuir por diferencia); eliminar | CRUD + API |
| `pages/admin/PanelAdmin.test.jsx` | 3 | Órdenes (KPI y comunas), Dashboard (stock crítico), Usuarios (filtro por rol) | Admin + API |
| `pages/admin/NuevoUsuario.test.jsx` | 4 | Alta de Vendedor con correo @elvolcan.cl; 409; validación previa | CRUD + API |
| `pages/admin/ClientesReportes.test.jsx` | 2 | Clientes reales y mejores clientes; reportes y exportación CSV | Admin + API |

### 4.2 Backend: 72 pruebas en 14 clases (sin base de datos)

| Microservicio | Clase | N.º | Qué verifica |
|---|---|---|---|
| ms-auth | `AuthServiceTest` | 6 | Login (token y `nombreRol`), contraseña incorrecta; registro **siempre CLIENTE**; RUT o usuario duplicado → `RegistroDuplicadoException` |
| ms-auth | `UsuarioServiceTest` | 7 | Alta de VENDEDOR con BCrypt; sin contraseña; duplicado; rol inexistente; edición que conserva la contraseña; 404 |
| ms-auth | `AuthControllerTest` | 3 | MockMvc: registro duplicado **409**, datos inválidos **400**, login incorrecto **401** |
| ms-auth | `UsuarioSeguridadTest` | 4 | `@WebMvcTest`: ADMIN crea (201, sin `password` ni `token`); 409; 400; 404; **VENDEDOR → 403** |
| ms-auth | `CorsConfigTest` | 3 | Orígenes permitidos, headers y métodos; CORS solo en `/api/**` |
| ms-catalogoProductos | `ProductoServiceImplTest` | 9 | Crear (y crear su inventario con crítico 5 y máximo 500); SKU duplicado; buscar; listar; desactivar; **editar** y bloqueo del SKU |
| ms-catalogoProductos | `DataInitializerTest` | 3 | Semilla = los 14 productos del frontend; no pisa datos; reinicio |
| ms-catalogoProductos | `ProductoSeguridadTest` | 4 | Catálogo público; VENDEDOR → 403 en POST, PUT y DELETE; ADMIN edita; sin token → 401 |
| ms-inventario | `InventarioServiceTest` | 9 | Crear y SKU duplicado; aumentar y sobrestock (`OverstockException`); disminuir y stock insuficiente; buscar por SKU (y 404); listar |
| ms-inventario | `DataInitializerTest` | 3 | Mismos 14 SKU que el catálogo; no pisa datos; reinicio |
| ms-inventario | `InventarioSeguridadTest` | 4 | VENDEDOR lee y recibe 403 al modificar; ADMIN modifica; sin token → 401 |
| ms-ventas | `VentaServiceTest` | 10 | Crear venta (con despacho); sin stock; confirmar pago; **venta ajena → 403** (cliente y vendedor); ADMIN confirma; detalle por rol; 404 |
| ms-ventas | `VentaRequestDTOTest` | 3 | Dirección, comuna y método de pago obligatorios; solo Efectivo o Tarjeta |
| ms-ventas | `VentaSeguridadTest` | 4 | VENDEDOR lee órdenes y recibe 403 al comprar, confirmar o usar mis-compras; CLIENTE compra y recibe 403 al listar todas; **sin token → 401** |

Además, cada microservicio tiene su `*ApplicationTests` (`@SpringBootTest`, carga del contexto completo), que se ejecuta con la BD activa.

---

## 5. Resultado de la ejecución

**Frontend** (`npm test`):
```
 Test Files  23 passed (23)
      Tests  71 passed (71)
```

**Backend** (`mvnw test "-Dtest=!*ApplicationTests"` en cada servicio):

| Microservicio | Pruebas | Fallidas |
|---|---|---|
| ms-auth | 23 | 0 |
| ms-catalogoProductos | 16 | 0 |
| ms-inventario | 16 | 0 |
| ms-ventas | 17 | 0 |
| **Total** | **72** | **0** |

| Indicador | Valor |
|---|---|
| Pruebas ejecutadas (front + back) | **143** |
| Pruebas exitosas | **143** |
| Pruebas fallidas | **0** |

> Los avisos `404: /IMAGENES/...` que pueden aparecer en el frontend **no son errores**: jsdom no sirve las imágenes de `public/`.

---

## 6. Reporte de cobertura

### 6.1 Frontend (Vitest + V8)

Desde EP3 la cobertura se mide sobre **todo el código fuente de `src/`**, no solo sobre los módulos que tienen pruebas como en EP2. Se excluyen solo los tests, `setupTests.js`, `testUtils/` y `main.jsx`. Así el porcentaje muestra también el código que **no** está probado.

| Carpeta | % Sentencias | % Ramas | % Funciones | % Líneas |
|---|---|---|---|---|
| **Total** | **79,13** | **80,73** | **83,62** | **79,13** |
| `src/utils` | 99,15 | 88,98 | 100 | 99,15 |
| `src/datos` | 100 | 100 | 100 | 100 |
| `src/components` | 78,06 | 88,23 | 77,77 | 78,06 |
| `src/pages` (tienda) | 63,08 | 79,50 | 74,46 | 63,08 |
| `src/pages/admin` | 89,72 | 69,06 | 72,22 | 89,72 |
| `src/pages/vendedor` | 84,00 | 67,34 | 62,50 | 84,00 |
| `src/App.jsx` | 0 | 0 | 0 | 0 |

**Archivos con 100 % de sentencias:** `carrito.js`, `inventario.js`, `productos.js`, `reportes.js`, `useCatalogo.js`, `validaciones.js`, `ventas.js`, `Navbar.jsx`, `RutaProtegida.jsx`, `AvisoSinConexion.jsx`, `Producto.jsx`, `Login.jsx`, `DetalleProducto.jsx`, `Nosotros.jsx` y `DetalleOrdenVendedor.jsx`.

**Archivos sin pruebas (0 %):** `App.jsx` (definición de rutas), `AdminLayout.jsx`, `ProductosVendedor.jsx` y las páginas informativas sin lógica (`Inicio`, `Productos`, `Consejos`, `Tiendas`, `Contacto`).

### 6.2 Backend (JaCoCo)

Se midió con **JaCoCo 0.8.13** con las 72 pruebas **sin base de datos** (`mvnw test "-Dtest=!*ApplicationTests"`). Se excluye solo la clase `*Application` (el `main` que arranca Spring).

| Microservicio | % Líneas | % Ramas | % Instrucciones |
|---|---|---|---|
| ms-auth | 53,2 (194/365) | 38,7 | 51,4 |
| ms-catalogoProductos | 55,6 (150/270) | 34,8 | 56,7 |
| ms-inventario | 57,0 (151/265) | 46,4 | 54,4 |
| ms-ventas | 46,2 (135/292) | 34,5 | 49,2 |
| **Total backend** | **52,9 (630/1192)** | **37,1 (89/240)** | — |

**Por capa** (sumando los 4 servicios):

| Capa | % Líneas | Comentario |
|---|---|---|
| `service` (lógica de negocio) | **86,4** | Reglas de venta, dueño de la venta, registro CLIENTE, CRUD de usuarios y productos, stock |
| `dto` | 100 | Validaciones de los DTOs |
| `config` | 50,2 | `CorsConfig` y semillas probadas; `SwaggerConfig`, la semilla de auth y `ResetAuthDataConfig` no |
| `security` | 43,0 | Reglas de rol probadas con `@WebMvcTest`; filtros JWT con token real e interceptores Feign no |
| `exception` | 35,8 | Se prueban 400 / 401 / 403 / 404 / 409; otros handlers (Feign, JSON mal formado) no |
| `controller` | 15,5 | Los **V1** se recorren en los `@WebMvcTest`; los **V2 (HATEOAS)** no tienen pruebas propias |
| `assembler(s)` | 0 | Enlaces HATEOAS: solo se ejecutan en la V2 |

**Clases sin cobertura (0 %):** los 4 `*ControllerV2` y sus assemblers, los 4 `SwaggerConfig`, `DataInitializer` y `ResetAuthDataConfig` de ms-auth, los interceptores Feign (`FeignConfig` / `FeignInterceptor`) y `ErrorResponse`.

> El porcentaje es menor que en el frontend porque las pruebas del backend se concentraron en la **lógica de negocio y la seguridad**, que es donde se arreglaron los problemas de EP3. La infraestructura (Swagger, Feign, arranque) y la V2 se ejecutan en los `@SpringBootTest` y en las pruebas manuales con la base activa.

---

## 7. Análisis de resultados

### 7.1 Dónde se concentra la cobertura
La lógica de negocio del frontend (`src/utils`) tiene **99 % de sentencias**: allí están el cliente de la API, la sesión con el JWT, el carrito, el inventario, los reportes y las validaciones. Las páginas con flujos críticos superan el 85–95 %: checkout, login, registro, inventario y los paneles por rol.

### 7.2 Integración simulada en lugar de un backend real
Las pruebas de páginas no dependen de los microservicios: `fetch` se reemplaza por respuestas controladas. Así se prueban casos difíciles de reproducir a mano: 409 por falta de stock, una caída de ms-inventario justo al confirmar el pago, un token expirado o un usuario duplicado. La integración real con el backend se verifica con las pruebas manuales del Anexo 2.

### 7.3 Seguridad probada en ambas capas
- **Frontend:** `RutaProtegida`, Navbar por rol y la redirección del Vendedor fuera de la tienda.
- **Backend:** `@WebMvcTest` con el `SecurityConfig` real comprueba que un VENDEDOR recibe **403** al escribir en catálogo, inventario, ventas o usuarios; que sin token se recibe **401**; y que un cliente no puede confirmar ni ver la venta de otro.

Durante la implementación, estas pruebas detectaron un caso que pasaba por la razón equivocada. Sin `spring-boot-starter-security-test`, `@WithMockUser` no se aplicaba y los "403" ocurrían por falta de usuario, no por la regla de rol. Se corrigió la dependencia.

### 7.4 Ramas no cubiertas
La mayoría son caminos defensivos:
- mensajes alternativos cuando falla un microservicio secundario (`Promise.allSettled`);
- valores por defecto (`|| '-'`, `?? 0`);
- estados intermedios de carga.

Las ramas de `api.js` sin cubrir corresponden a errores sin cuerpo JSON.

### 7.5 Alcance del reporte
El 79 % global **incluye** archivos sin lógica que no se probaron a propósito, como las páginas informativas y la tabla de rutas de `App.jsx`. Con el criterio de EP2 (solo los módulos con pruebas), el porcentaje sería mayor. Se prefirió el criterio completo porque muestra con transparencia lo que queda sin cubrir.

---

## 8. Conclusiones

- Las **143 pruebas** (71 de frontend y 72 de backend) pasan sin fallos y no requieren la base de datos.
- La lógica de negocio del frontend está prácticamente cubierta por completo (**99 %** en `utils/`), y los flujos de compra, autenticación y administración tienen pruebas de éxito y de error.
- Las reglas críticas del enunciado están probadas en el backend con su configuración real: el **Vendedor de solo lectura**, el **Cliente que solo accede a sus compras**, el **registro que nunca otorga privilegios**, la **validación del despacho** y los **duplicados con 409**.
- En el backend, JaCoCo reporta **52,9 % de líneas** en total y **86,4 % en la capa de servicios**. La brecha está en la V2 (HATEOAS) y en la infraestructura, que se valida con los `@SpringBootTest` y las pruebas manuales.

---

## 9. Recomendaciones / trabajo futuro

1. Pruebas `@WebMvcTest` de los **controladores V2 (HATEOAS)**, que verifiquen `_links` y `_embedded`. Es la mayor brecha de cobertura del backend.
2. Pruebas de **render** de `App.jsx` (navegación completa por rol) y de las páginas informativas.
3. Pruebas **end-to-end** (por ejemplo, Playwright) contra los microservicios levantados, que automaticen el flujo de compra del manual de usuario.
4. Ejecutar los `@SpringBootTest` en un pipeline con una base de datos de pruebas (por ejemplo, Testcontainers con Oracle XE o un perfil con H2).

---

### Anexo — Comandos y salida resumida

```bash
$ npm test
 Test Files  23 passed (23)
      Tests  71 passed (71)

$ npm run test:coverage
Statements   : 79.13% ( 3308/4180 )
Branches     : 80.73% ( 616/763 )
Functions    : 83.62% ( 143/171 )
Lines        : 79.13% ( 3308/4180 )

$ .\mvnw test "-Dtest=!*ApplicationTests"   # en cada microservicio
ms-auth 23 · ms-catalogoProductos 16 · ms-inventario 16 · ms-ventas 17  →  72 pruebas, 0 fallos
JaCoCo (total backend): líneas 52,9 % (630/1192) · ramas 37,1 % (89/240) · capa service 86,4 %
```
