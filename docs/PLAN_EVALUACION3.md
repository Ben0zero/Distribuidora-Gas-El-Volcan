# Plan Evaluación Parcial 3 — Distribuidora de Gas El Volcán (rama `version-3`)

## Contexto
La EP3 (40%) pide microservicios + frontend React integrados por REST, con JWT, roles (Admin / Vendedor / Cliente), rutas versionadas, Swagger, CRUD, ERS, manual con pantallazos, Excel de APIs, Word de APIs e Integración y los repos. El análisis muestra que **el flujo de compra no funciona contra la API** (CORS, ids, mapeo de campos) y que hay **fallas de seguridad**: cualquiera puede registrarse como ADMIN, hay secretos y el Wallet de Oracle en git, y un cliente puede confirmar el pago de una venta ajena. El plan corrige primero eso, después roles y vistas, y al final actualiza los documentos existentes sin rehacerlos.

**Decisiones del usuario:** (1) los documentos de referencia son los 3 anexos de `docs/parcial3/`; (2) secretos: rotar + dejar de versionar, sin reescribir la historia; (3) ms-produccion queda fuera del alcance; (4) versionado: renombrar las rutas sin versión a `/api/v1` y mantener `/api/v2`.

**Advertencia sobre las fuentes:** los 3 anexos ya traen contenido de El Volcán (no son la plantilla "Pokémon"). Según sus metadatos se generaron por script (autor "Un-named") y los subió Ben0zero en `679513b` (31-10). No hay un **Anexo 1 (instrucciones y criterios) ni la Figura 1 (modelo de BD)**, así que los requisitos salen del enunciado. Se toma la **estructura** de los anexos como plantilla y su **contenido** se corrige donde no coincide con el código.

**Paso 0 al aprobar:** copiar este plan a `docs/PLAN_EVALUACION3.md` → `docs: agrega plan de trabajo de la evaluación parcial 3`.

---

## 1. Inventario de documentos
| Documento | Tipo | Fecha git | De qué trata |
|---|---|---|---|
| docs/parcial3/Anexo 2 - Documentación APIs e Integración (El Volcán).docx | Referencia (A) | 2026-10-31 | 7 secciones: descripción, arquitectura, info general, roles, endpoints por ms, integración, verificación. 0 tablas, 0 imágenes |
| docs/parcial3/Anexo 3 - Documentación APIs (El Volcán).xlsx | Referencia (A) | 2026-10-31 | 5 hojas (auth, catálogo, inventario, ventas, info general); 22 endpoints, 10 columnas |
| docs/parcial3/Anexo 4 - Manual de usuario (El Volcán).docx | Referencia (A) | 2026-10-31 | Objetivo, requisitos, acceso, funciones por rol, flujo de compra, credenciales, recomendaciones. 0 imágenes |
| frontend/docs/ERS_ACTUALIZADO.md/.pdf | Equipo (B) | 2026-10-30 | ERS **v2.1 (EP2)** |
| frontend/docs/DOCUMENTACION.md/.pdf | B | 2026-10-30 | Documentación técnica "Versión 2" (React + localStorage) |
| frontend/docs/DOCUMENTO_COBERTURA_TESTING.md/.pdf | B | 2026-10-30 | 10 pruebas Vitest de frontend |
| frontend/docs/DEPLOY.md/.pdf, BITACORA_DEPLOY_AWS.md/.pdf | B | 2026-10-30 | Despliegue de la V2 en EC2 + Nginx |
| frontend/docs/GUIA_CONCEPTOS_CODIGO.md/.pdf | B | 2026-10-30 | Guía didáctica de JS/React (no es entregable) |
| frontend/docs/README.pdf | B | 2026-10-30 | README de la V2 |
| README.md, microservicios/README.md, microservicios/PLAN_ADAPTACION_EL_VOLCAN.md | B | — | Guías de arranque (desactualizadas) |

**Duplicados:** `frontend/docs/*` son **idénticos byte a byte** a `Version 2/docs/*` (2026-10-16). Git marca como más reciente a `frontend/docs` (30-10), pero el contenido de ambos es de EP2. Ninguno está al día para EP3.

## 2. Requisitos verificables
- **R1 Calidad del backend:** capas controller/service/repository, DTOs, validaciones, manejo global de errores, tests.
- **R2 Integración REST:** el frontend consume la API real en login, registro, catálogo, carrito/compra, mis compras y paneles.
- **R3 Seguridad:** JWT, autorización por rol en el backend (y guardias en el frontend), sin secretos en el repo.
- **R4 Roles:** el Admin tiene acceso total. El **Vendedor solo ve lista y detalle de productos y de órdenes, y nada más le aparece**. El Cliente solo accede a la tienda.
- **R5 Versionado:** `/api/v1/...` y `/api/v2/...`. **R6 Swagger** en cada servicio. **R7 CRUD** completo (productos y usuarios).
- **R8 Colaboración:** commits, ramas y push en GitHub. **R9 Entregables:** ERS terminado, manual con pantallazos, Excel de APIs, Word de APIs e Integración, repos de front y back.
- **Estructura que se toma de los anexos:**
  - *Excel:* una hoja por microservicio con las columnas `Microservicio | Endpoint | Método HTTP | Descripción | Requiere Autenticación | Rol(es) Requeridos | Parámetros/Path | Body Request | Respuesta Exitosa | Códigos de Error`, más la hoja "Información General" (`Campo | Valor`).
  - *Word APIs:* 1 Descripción general · 2 Arquitectura · 3 Información general · 4 Roles y permisos · 5 Endpoints por microservicio · 6 Integración con el frontend · 7 Verificación.
  - *Manual:* 1 Objetivo · 2 Requisitos · 3 Acceso (inicio de sesión / registro) · 4 Funciones por rol · 5 Flujo de compra · 6 Credenciales de prueba · 7 Recomendaciones.
- **Figura 1 / modelo de BD:** no está disponible. Las entidades JPA actuales son `usuarios`, `roles` (auth), `productos` (catálogo), `inventarios`, `ventas` y `detalles_venta` (`lotes_produccion` queda fuera del alcance).

## 3. Documentos vs código
- **Anexo 2:**
  - Dice "Axios", pero `api.js` usa `fetch` y `package.json` no tiene axios.
  - Dice "se realizaron pruebas end-to-end", lo que no es posible hoy: sin CORS el navegador bloquea las llamadas (a) y el carrito envía `'p1'` (c).
  - Le asigna al VENDEDOR "ventas e inventario", lo que contradice R4.
  - Marca `GET /api/productos/{sku}` como autenticado, pero es público (`catalogo SecurityConfig.java:38`).
  - Falta: versionado, CORS, diagrama, modelo de BD, pantallazos (Swagger, Eureka, pestaña Network) y resultados de pruebas.
- **Anexo 3:**
  - Falta lo que aún no existe en el código: rutas `/api/v1`, V2 de ventas, `PUT productos` y `GET ventas/{id}`.
  - El rol "SUPERVISOR" no existe en el sistema.
  - Hay que corregir los permisos del VENDEDOR en inventario.
- **Anexo 4:**
  - No tiene ningún pantallazo y dejó escrito "Adjuntar capturas…".
  - Dice que el registro "queda CLIENTE", lo que es falso (ver e y k).
  - Describe un Vendedor con funciones que R4 prohíbe.
  - Faltan una sección por rol con capturas y un acceso denegado.
- **ERS v2.1:**
  - Pone backend, JWT y RBAC "fuera de alcance".
  - Usa los roles Operadora/Repartidor y no Vendedor.
  - Trae APIs "planificadas" y un modelo de datos "preliminar". Necesita una v3.0.
- **README / DOCUMENTACION / COBERTURA:**
  - Dicen Java 17 y Spring Boot 3.5.x; lo real es **Java 21 y Spring Boot 4.0.6**.
  - Hablan de la V2 con localStorage, no documentan tests de backend y nombran "Pesaje 8085" (resto de la plantilla MiniMarket).

## 4. Código vs requisitos (hallazgos verificados)
| # | Estado | Evidencia |
|---|---|---|
| a | **Confirmado** | No hay `CorsConfiguration`, `@CrossOrigin` ni `.cors()` en ningún microservicio. Hay catch silenciosos en `Productos.jsx:27`, `Login.jsx:43-45`, `Ventas.jsx:46` y `admin/Inventario.jsx:24+` |
| b | **Confirmado** | `Productos.jsx:21` mapea a `precio` y `components/Producto.jsx:12` llama a `props.residencial.toLocaleString` → TypeError |
| c | **Confirmado (peor)** | `Carrito.jsx:10-11` y `carrito.js:35` usan el catálogo local, y `Carrito.jsx:77` envía `'p1'` a `DetalleVentaRequestDTO.java:12` (Long). Si el carrito tiene ids numéricos de la API, el carrito aparece **vacío**. `DetalleProducto.jsx:7` solo lee el catálogo local |
| d | **Confirmado** | `AuthController.java:54-57` devuelve solo `{token}`, así que `Login.jsx:30,33` deja a todos como "Cliente". `AuthService.login` (`AuthService.java:36`) ya arma el DTO completo y **no se usa** |
| e | **Confirmado** | `RegistroRequestDTO.java:32` y `AuthService.java:84`; `/api/auth/**` es permitAll (`auth SecurityConfig.java:39`) |
| f | **Confirmado (peor)** | Clave de Oracle literal en el `application.properties` de auth (:13, :24), catálogo (:13), inventario (:11), producción (:10) y ventas (:9). Clave JWT literal en `JwtUtil.java` de auth (:21) y catálogo/inventario/producción (:17), y en ventas en `JwtAuthenticationFilter.java:25` y `VentaService.java:44`. **El Wallet de Oracle (25 archivos) y 7 .zip están versionados.** `TNS_ADMIN` apunta a `C:/Users/ben95/...` |
| g | **Confirmado** | `VentaService.java:142-159` no verifica el dueño y `ventas SecurityConfig.java:51` permite al CLIENTE. Si falla el Feign a mitad de `:150-156`, el stock queda descontado a medias |
| h | **Confirmado** | Las rutas `/api/auth`, `/api/usuarios`, `/api/productos`, `/api/inventario` y `/api/ventas` no tienen versión; los `*ControllerV2` están en `/api/v2`. Ventas y auth/login no tienen V2 y no existe `/api/v1` |
| i | **Confirmado** | Ni `ProductoController` ni su V2 tienen PUT. La semilla de `catalogo DataInitializer.java:23-36` (GAS-*) no coincide con `datos/productos.js:2-15` (CL001…): cambian categorías y precios, y `Producto` no tiene `imagen`. La semilla del inventario también usa GAS-* |
| j | **Confirmado** | `App.jsx:93` no protege `/admin`, `AdminLayout.jsx` no valida la sesión y no existe una vista de Vendedor |
| k | **Confirmado** | `Registro.jsx:44-66` usa localStorage (`api.register`, en `api.js:30`, no se usa). `Ventas.jsx:166-219` simula la pasarela de pago |
| l | **Confirmado** | `microservicios/levantar-servicios.ps1:6-7` tiene rutas de ben95. En `:36` espera LOGINAUTH/CATALOGOPRODUCTOS/INVENTARIO-SERVICE/VENTAS-SERVICE, pero los nombres reales son ms-auth/ms-catalogoProductos/ms-inventario/ms-ventas. `README.md:19` tiene las versiones equivocadas |
| m | Nuevo | `catalogo client/InventarioClient.java:8` usa una URL fija `localhost:8084` (no pasa por Eureka) |
| n | Nuevo | `admin/Inventario.jsx:24-34` lee `id`, `precioUnitario` y `stockCritico`, que no existen en `StockResponseDTO` (sku, stockActual, bajoStock) |
| o | Nuevo | `Ventas.jsx:33-46` carga `comprasApi` y **nunca la muestra**: "Mis compras" no aparece en ninguna parte |
| p | Nuevo | `admin/Ordenes.jsx:1-14`, Dashboard y Reportes usan datos fijos; ListaUsuarios y NuevoUsuario usan localStorage |
| q | Nuevo | No existe `GET /api/ventas/{id}` (el detalle de orden que necesita el Vendedor) |
| r | Nuevo | El inventario deja escribir al VENDEDOR (`InventarioController.java:65,84,103`); el catálogo usa SUPERVISOR, un rol que no existe |
| s | Nuevo | `Venta` no guarda dirección, comuna ni método de pago. Hay dos checkouts (`Carrito.jsx:70-87` y `Ventas.jsx`) |
| t | Nuevo | `api.js:47` `obtenerProductoPorId` llama a `/{sku}` con un id. El Swagger de inventario se titula "MiniMarket" (`SwaggerConfig.java:22`). `UsuarioController` recibe la entidad sin DTO |

## 5. Conclusiones
| Requisito | Estado | Evidencia | Qué falta |
|---|---|---|---|
| R1 Calidad backend | Parcial | capas, DTOs y tests de servicio en 4 ms | DTO de usuarios, 403 en el GlobalExceptionHandler, títulos Swagger, tests de las reglas nuevas |
| R2 Integración REST | No cumple | a, b, c, d, k, n, o, p | CORS, mapeos, ids, checkout, registro y paneles con datos reales |
| R3 Seguridad | Parcial | JWT funciona; e, f, g, j, r | registro solo CLIENTE, dueño de la venta, secretos en variables de entorno, guardias |
| R4 Roles | No cumple | j, q, r | vista de solo lectura para el Vendedor, rutas por rol, backend de solo lectura para el Vendedor |
| R5 Versionado | Parcial | h | `/api/v1` + V2 en ventas y auth |
| R6 Swagger | Cumple (parcial) | 4 SwaggerConfig | grupos v1/v2 y títulos |
| R7 CRUD | Parcial | i, p | PUT de productos y CRUD del admin contra la API |
| R8 Colaboración | Cumple | historial de git | commits atómicos y push por bloque |
| R9 Entregables | Parcial | sección 3 | pantallazos, ERS v3 y corrección de los anexos |

| Documento | Referencia | Estado | Qué corregir/completar |
|---|---|---|---|
| Anexo 2 Word | estructura propia (7 secc.) | Parcial | Axios→fetch, roles, versionado, CORS, diagrama, BD, pantallazos y resultados reales en §7 |
| Anexo 3 Excel | 10 columnas + info general | Parcial | filas v1/v2, endpoints nuevos, roles reales, sin SUPERVISOR ni producción |
| Anexo 4 Manual | 7 secciones | No cumple | pantallazos por paso y por rol, Vendedor de solo lectura, quitar "Confirmar pago" manual |
| ERS | — | No cumple | v3.0: alcance EP3, roles, arquitectura, modelo de BD, APIs reales, trazabilidad |
| README / DOCUMENTACION / COBERTURA | — | Desactualizado | Java 21 / SB 4.0.6, arranque real, tests de back y front |

---

## 6. Forma de trabajar (obligatoria)
- Implementar **un commit planificado a la vez**, en el orden de la sección 8.
- **Claude nunca ejecuta** `git add`, `git commit`, `git push` ni ningún comando que modifique el historial (incluido `git rm --cached`). Los commits los hace el usuario a mano.
- **Al terminar cada "Grupo" (2–3 commits planificados), detenerse y entregar:**
  1. Un resumen de lo que cambió y por qué.
  2. Los archivos modificados o creados.
  3. Cómo probarlo y el resultado de los tests que se pudieron correr.
  4. Los comandos `git add …` / `git commit -m "…"` de cada commit.
  5. Si toca hacer push.

  Luego **esperar a que el usuario responda "listo"**.
- Si algo no se puede hacer o requiere una decisión del usuario, preguntar antes de seguir. No mostrar contraseñas ni secretos.

## 7. Requisitos de las plantillas oficiales del docente (no están en el repo; los indicó el usuario)
- **Anexo 3 Excel:**
  - Encabezado con versión, fecha, URL de la API y URL de Swagger.
  - Columnas nuevas **"API Pública/Privada"** y **"Observaciones"**.
  - Endpoints v1 y v2.
- **Anexo 2 Word:**
  - Endpoints agrupados por versión (v1/v2). Cada endpoint con descripción, método, datos de entrada, respuestas (códigos), autenticación y observaciones.
  - Una sección de integración con el pantallazo de una petición exitosa y otro de una con error.
  - Explicación del modelo de base de datos.
  - Pruebas realizadas y sus resultados.
- **Anexo 4 Manual:**
  - Introducción: propósito, descripción del sistema y cómo usar el manual.
  - Requisitos de hardware y software.
  - Instalación y configuración paso a paso.
  - Comenzando: registro/login e interfaz inicial.
  - Uso del software por función y por rol.
  - Cada imagen con número, título y nota, y con borde negro de 1 px.
- **Entrega:** ERS terminado, repos públicos de GitHub del frontend y del backend, y ambos proyectos comprimidos.
- Los anexos de `docs/parcial3/` se **actualizan y corrigen**, no se rehacen. Donde vaya una captura se deja el marcador `[PANTALLAZO n: Título – descripción]` y al final se entrega la lista de pantallazos que hay que tomar.

## 8. Plan de acción AJUSTADO
**Paso 0:** guardar este plan en `docs/PLAN_EVALUACION3.md` → `docs: agrega plan de trabajo de la evaluación parcial 3`.

Cada commit de backend incluye su test unitario (patrón de `AuthServiceTest`, `VentaServiceTest` y `ProductoServiceImplTest`). Cada commit de frontend deja `npm test` en verde.

### Bloque 1 — Seguridad base
- **Grupo 1** (junto con el Paso 0)
  1. **`chore(seguridad): mueve credenciales Oracle y clave JWT a archivo de secretos externo`**
     - En los `application.properties` de **auth, catálogo, inventario, ventas y producción**:
       - `spring.config.import=optional:file:${user.home}/.elvolcan/secrets.properties`
       - Usar `${DB_USER:ADMIN}`, `${DB_PASSWORD}` y `${ORACLE_WALLET_DIR}` (en las URL de datasource y flyway), y `jwt.secret=${JWT_SECRET}`.
       - `app.cors.allowed-origins=${CORS_ORIGINS:http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174}`
     - Los `JwtUtil` (auth, catálogo, inventario, producción), `JwtAuthenticationFilter` y `VentaService` de ventas leen la clave con `@Value("${jwt.secret}")`.
     - Nuevo `microservicios/secrets.example.properties`.
     - Prueba: `mvnw -q compile` / `mvnw test` en cada servicio; después, login por Swagger con el archivo de secretos creado.
  2. **`chore(repo): deja de versionar Oracle Wallet y zips de microservicios`**
     - Claude edita `.gitignore`; el usuario ejecuta los `git rm -r --cached …` que se le entregan.
     - ⚠️ El dueño de la BD debe rotar la contraseña y regenerar el Wallet.
  3. **`fix(auth): el registro público asigna siempre el rol CLIENTE`**
     - Archivos: `AuthService.java:84`, `RegistroRequestDTO` y `AuthServiceTest`.
- **Grupo 2**
  4. **`fix(ventas): solo el dueño o ADMIN puede confirmar el pago de una venta`**
     - Archivos: `VentaService.confirmarPago`, 403 en `GlobalExceptionHandler` y `VentaServiceTest`.
  - → **PUSH**

### Bloque 2 — Versionado `/api/v1` (antes de integrar el frontend, para que el frontend y los pantallazos usen las rutas finales)
- **Grupo 2** (cont.)
  5. **`refactor(inventario): rutas a /api/v1/inventario`**
     - En el mismo commit: el Feign de ventas y el de catálogo, `SecurityConfig` y `frontend/src/utils/api.js`.
  6. **`refactor(catalogo): rutas a /api/v1/productos`**
     - En el mismo commit: `CatalogoClient` de ventas, `SecurityConfig` y `api.js`.
- **Grupo 3**
  7. **`refactor(auth,ventas): rutas a /api/v1 y agrega VentaControllerV2`**
     - Pasan a `/api/v1/auth`, `/api/v1/usuarios` y `/api/v1/ventas`, y se crea `/api/v2/ventas` (HATEOAS, como los V2 existentes). Se actualizan los matchers y `api.js`.
  8. **`docs(swagger): grupos v1/v2 y títulos El Volcán`**
     - `GroupedOpenApi` en los 4 `SwaggerConfig`.
  - → **PUSH**

### Bloque 3 — Integración backend + login
- **Grupo 4**
  9. **`feat(backend): configura CORS para el frontend en auth, catálogo, inventario y ventas`**
     - Usa `.cors()` y un bean `CorsConfigurationSource` que lee `app.cors.allowed-origins`.
  10. **`feat(auth): el login devuelve token, rol y datos del usuario`**
      - Backend: `AuthController.login` pasa a usar `AuthService.login`.
      - Frontend: `Login.jsx` usa `nombreRol`/`nombre` y **no cae al fallback local cuando la API responde 401**. Se actualiza `Login.test.jsx`.
- **Grupo 5**
  11. **`feat(catalogo): alinea la semilla con los 14 productos del frontend y agrega imagen`**
      - Cambia `Producto`, los DTOs, el service, el `DataInitializer` del catálogo y del inventario (CL001…AC003) y agrega el perfil `reset-catalogo`.
  12. **`fix(catalogo): Feign a inventario vía Eureka sin URL fija`**
  13. **`feat(ventas): guarda dirección, comuna y método de pago de la venta`** (hallazgo s)
      - Archivos: `Venta`, `VentaRequestDTO`, `VentaResponseDTO`, el assembler, el service y el test.
  - → **PUSH**

### Bloque 4 — Flujo de compra en el frontend
- **Grupo 6**
  14. **`fix(frontend): normaliza productos de la API al formato del catálogo`**
      - Archivos: `desdeApi()` en `utils/productos.js`, `Productos.jsx`, `DetalleProducto.jsx`, `api.js` y los tests.
  15. **`fix(frontend): el carrito usa los ids numéricos de la API y avisa si no hay conexión`**
      - Nuevo hook `useCatalogo`; cambian `Carrito.jsx`, `Ventas.jsx` y los tests.
- **Grupo 7**
  16. **`feat(frontend): el checkout crea y confirma la venta en ms-ventas y muestra Mis compras`**
      - Envía dirección, comuna y método de pago; queda un único checkout.
  17. **`feat(frontend): el registro crea el usuario en ms-auth`**
  - → **PUSH**

### Bloque 5 — Roles y vistas
- **Grupo 8**
  18. **`feat(ventas): agrega GET /api/v1/ventas/{id} para detalle de orden`** (ADMIN, VENDEDOR o el dueño)
  19. **`feat(catalogo): agrega PUT /api/v1/productos/{id} para editar producto`** (ADMIN)
  20. **`fix(seguridad): VENDEDOR con acceso de solo lectura y sin rol SUPERVISOR`**
  - → **PUSH**
- **Grupo 9**
  21. **`feat(frontend): rutas protegidas por rol`**
      - `RutaProtegida.jsx` con validación del `exp` del JWT; cambian `App.jsx` y `Navbar.jsx`, con su test.
  22. **`feat(frontend): panel Vendedor de solo lectura (productos y órdenes)`**
- **Grupo 10**
  23. **`feat(admin): inventario y CRUD de productos contra la API`**
  24. **`feat(admin): órdenes, usuarios y dashboard con datos de la API`**
  - → **PUSH**

### Bloque 6 — Scripts y documentación técnica
- **Grupo 11**
  25. **`chore(scripts): levantar-servicios con rutas relativas y nombres reales de Eureka`**
      - Usa `$PSScriptRoot`, quita producción, valida que exista `~/.elvolcan/secrets.properties` y ajusta `detener-servicios.ps1`.
  26. **`docs: actualiza README, DOCUMENTACION y cobertura de testing a la versión 3`**
  - → **PUSH**

### Bloque 7 — Anexos y ERS (cumpliendo la sección 7)
- **Grupo 12**
  27. **`docs(ers): actualiza ERS a v3.0 para EP3`**
  28. **`docs(anexo3): actualiza Excel de APIs`**
      - Agrega el encabezado, las columnas Pública/Privada y Observaciones, y los endpoints v1/v2. Se edita con openpyxl, instalado en un venv del scratchpad.
- **Grupo 13**
  29. **`docs(anexo2): endpoints por versión, modelo de BD, integración y pruebas`**
  30. **`docs(anexo4): manual con la estructura de la plantilla y marcadores de pantallazos`**
  - → **PUSH** y luego la **lista final de pantallazos**.

### Bloque 8 — Entrega (solo propuesta; se pregunta antes de ejecutar)
- **2 repos públicos desde el monorepo:**
  - `git subtree split --prefix=frontend -b entrega-frontend`
  - `git subtree split --prefix=microservicios -b entrega-backend`
  - Luego hacer push de cada rama al `main` de su repo nuevo.
  - **Antes de publicar el backend hay que confirmar que la clave ya fue rotada**, porque el historial la contiene. Si no, conviene publicar el backend con un historial nuevo (`git archive` + commit inicial).
- **Proyectos comprimidos:** `git archive` de cada rama → `frontend.zip` y `backend.zip`, sin `node_modules`, `target`, Wallet ni secretos.

## Verificación end-to-end
1. `mvnw test` en los 4 microservicios; `npm test` y `npm run lint` en el frontend.
2. `levantar-servicios.ps1` y comprobar que Eureka muestra 4 servicios UP.
3. **Cliente:** registrarse, iniciar sesión, comprar (el stock baja) y ver Mis compras; si entra a `/admin`, se le redirige.
4. **Vendedor:** solo ve listas y detalles de productos y de órdenes; en Swagger, una escritura devuelve 403.
5. **Admin:** CRUD de productos, usuarios y órdenes.
6. En Swagger, comprobar los grupos v1 y v2 en cada servicio.

