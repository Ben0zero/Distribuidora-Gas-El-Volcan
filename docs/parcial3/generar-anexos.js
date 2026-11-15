const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, ImageRun
} = require('docx');

const outDir = path.join(__dirname);
const capturasDir = path.join(__dirname, 'capturas');
const VER = '3.0';
const FECHA = '12-11-2026';
// El Anexo 2 se actualizó tras la auditoría OWASP (docs/AUDITORIA_EP3.md)
const VER_ANEXO2 = '3.1';
const FECHA_ANEXO2 = '14-11-2026';

// ---------- helpers ----------
function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: !!opts.bold, italics: !!opts.italics })],
    spacing: { after: 100 },
    alignment: opts.center ? AlignmentType.CENTER : undefined,
  });
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } });
}
function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Consolas', size: 18 })],
    spacing: { after: 80 },
    indent: { left: 360 },
  });
}

// Captura de pantalla + leyenda. Las imagenes estan en docs/parcial3/capturas.
function captura(archivo, leyenda) {
  const ruta = path.join(capturasDir, archivo);
  const data = fs.readFileSync(ruta);
  return [
    new Paragraph({
      children: [
        new ImageRun({
          data,
          type: 'jpg',
          transformation: { width: 600, height: 375 },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: leyenda, italics: true, size: 18, color: '555555' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
    }),
  ];
}

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 20, type: WidthType.PERCENTAGE },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: 'D9E2F3' } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: !!opts.header, size: 18 })],
        spacing: { after: 0 },
      }),
    ],
  });
}

function table(headers, rows, widths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, { header: true, width: widths ? widths[i] : 20 })),
  });
  const bodyRows = rows.map((r) => new TableRow({
    children: r.map((v, i) => cell(String(v), { width: widths ? widths[i] : 20 })),
  }));
  return new Table({
    rows: [headerRow, ...bodyRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'D9D9D9' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'D9D9D9' },
    },
  });
}

function portada(titulo, subtitulo, ver = VER, fecha = FECHA) {
  return [
    new Paragraph({ text: '', spacing: { after: 600 } }),
    new Paragraph({ text: 'DISTRIBUIDORA DE GAS EL VOLCÁN', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: titulo, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: subtitulo, alignment: AlignmentType.CENTER, spacing: { after: 600 } }),
    new Paragraph({ text: '' }),
    table(
      ['Campo', 'Detalle'],
      [
        ['Proyecto', 'Distribuidora de Gas El Volcán'],
        ['Asignatura', 'DSY1104 — Desarrollo Full Stack II'],
        ['Evaluación', 'Evaluación Parcial 3 (EP3)'],
        ['Versión del documento', ver],
        ['Fecha', fecha],
        ['Arquitectura', 'Microservicios Spring Boot + Eureka + React'],
      ],
      [30, 70]
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
  ];
}

// ============================================================
// ANEXO 2 — Documentación APIs e Integración
// ============================================================
function anexo2() {
  const children = [
    ...portada('Documentación de APIs e Integración', 'Sistema de gestión de ventas, catálogo, inventario y usuarios',
      VER_ANEXO2, FECHA_ANEXO2),

    h1('1. Descripción general'),
    p('El presente documento describe las APIs REST expuestas por los microservicios de la Distribuidora de Gas El Volcán, ' +
      'la forma en que se autentican las peticiones y la integración entre el frontend React y el backend.'),
    p('La solución permite a un cliente consultar el catálogo de cilindros y accesorios de gas, agregar productos a un carrito, ' +
      'registrar una venta con dirección y comuna de despacho, confirmar el pago y consultar su historial de compras. ' +
      'El personal administrativo gestiona productos, inventario, usuarios, órdenes, clientes y reportes.'),
    p('El frontend consume las APIs mediante fetch, enviando el token JWT en el header Authorization. La comunicación entre ' +
      'microservicios se realiza con OpenFeign a través de Eureka, sin URLs fijas.'),

    h1('2. Arquitectura de la solución'),
    p('La arquitectura está compuesta por cinco microservicios y un servidor de descubrimiento:'),
    table(
      ['Microservicio', 'Puerto', 'Responsabilidad'],
      [
        ['eureka-server', '8761', 'Descubrimiento y registro de servicios'],
        ['ms-auth', '8081', 'Login, registro, emisión de JWT y administración de usuarios'],
        ['ms-catalogoProductos', '8082', 'Catálogo de productos de gas y precios por tipo de cliente'],
        ['ms-inventario', '8084', 'Stock por SKU, alertas de stock crítico y ajustes'],
        ['ms-ventas', '8086', 'Registro de ventas, confirmación de pago e historial de compras'],
      ],
      [24, 12, 64]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p('Flujo de una compra:'),
    bullet('El frontend obtiene el catálogo desde ms-catalogoProductos (consulta pública).'),
    bullet('Al confirmar el checkout, el frontend envía la venta a ms-ventas.'),
    bullet('ms-ventas consulta el catálogo (precio según el tipo de cliente que viene en el token) y el inventario (stock disponible) vía Feign.'),
    bullet('Al confirmar el pago, ms-ventas deja la venta en estado PAGADA y descuenta el stock en ms-inventario. ' +
      'Un bloqueo optimista (@Version) impide que dos confirmaciones simultáneas descuenten el stock dos veces.'),
    bullet('El cliente revisa el resultado en “Mis compras”, que consulta ms-ventas.'),

    h1('3. Seguridad y control de acceso'),
    p('La autenticación se basa en JWT firmado con una clave compartida (HS256). El login devuelve el token junto con los ' +
      'datos del usuario y su rol. Cada microservicio valida el token de forma independiente y aplica autorización por rol ' +
      'con @PreAuthorize y reglas en SecurityConfig.'),
    bullet('El token dura 2 horas e incluye el rol y el tipo de cliente (Residencial o Comercial). ms-ventas toma el tipo ' +
      'de cliente del token, nunca del cuerpo de la petición, para que un cliente no pueda elegir el precio comercial.'),
    bullet('Las contraseñas se guardan con BCrypt y deben tener al menos 8 caracteres, con al menos una letra y un número.'),
    bullet('Ante un error interno, la API responde 500 con un mensaje genérico; el detalle técnico queda solo en el log del servicio.'),
    p('Roles del sistema:'),
    table(
      ['Rol', 'Alcance'],
      [
        ['ADMIN', 'Acceso total: catálogo, inventario, usuarios, órdenes, clientes y reportes.'],
        ['VENDEDOR', 'Acceso de solo lectura: consulta de productos y órdenes. No modifica datos.'],
        ['CLIENTE', 'Consulta de catálogo, creación y confirmación de sus propias compras, y “Mis compras”.'],
      ],
      [20, 80]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p('Matriz de permisos por endpoint sensible:'),
    table(
      ['Operación', 'ADMIN', 'VENDEDOR', 'CLIENTE'],
      [
        ['Ver catálogo', 'Sí', 'Sí', 'Sí (público)'],
        ['Crear / editar / desactivar producto', 'Sí', 'No', 'No'],
        ['Ver inventario y stock crítico', 'Sí', 'Sí', 'Sí'],
        ['Crear / ajustar inventario', 'Sí', 'No', 'No'],
        ['Listar todas las ventas', 'Sí', 'Sí', 'No'],
        ['Crear venta', 'Sí', 'No', 'Sí'],
        ['Confirmar pago', 'Sí (cualquiera)', 'No', 'Sí (solo las propias)'],
        ['Ver detalle de venta', 'Sí (cualquiera)', 'Sí', 'Sí (solo las propias)'],
        ['Mis compras', 'Sí', 'No', 'Sí'],
        ['Gestión de usuarios', 'Sí', 'No', 'No'],
      ],
      [42, 18, 18, 22]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p('Las credenciales sensibles no se versionan. Se cargan desde %USERPROFILE%\\.elvolcan\\secrets.properties ' +
      '(plantilla en microservicios/secrets.example.properties) con las claves DB_USER, DB_PASSWORD, ORACLE_WALLET_DIR, ' +
      'JWT_SECRET y, opcionalmente, CORS_ORIGINS.'),
    p('La contraseña de la base de datos y la clave JWT que quedaron en el historial de git (commit 1bec55c) ya se cambiaron; el Oracle Wallet, que también quedó en ese historial (se retiró en el commit 21e47ba), está pendiente de rotar.'),

    h1('4. Información general de las APIs'),
    table(
      ['Recurso', 'URL'],
      [
        ['Repositorio GitHub (frontend)', 'https://github.com/Ben0zero/Distribuidora-Gas-El-Volcan/tree/main/Version%203/frontend'],
        ['Repositorio GitHub (backend)', 'https://github.com/Ben0zero/Distribuidora-Gas-El-Volcan/tree/main/Version%203/microservicios'],
        ['Eureka Dashboard', 'http://localhost:8761'],
        ['Frontend React', 'http://localhost:5173'],
        ['ms-auth — Swagger UI', 'http://localhost:8081/swagger-ui/index.html'],
        ['ms-catalogoProductos — Swagger UI', 'http://localhost:8082/swagger-ui/index.html'],
        ['ms-inventario — Swagger UI', 'http://localhost:8084/swagger-ui/index.html'],
        ['ms-ventas — Swagger UI', 'http://localhost:8086/swagger-ui/index.html'],
      ],
      [40, 60]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p('En Swagger, usar el botón “Authorize” y pegar únicamente el token, sin la palabra Bearer.'),
    p('Códigos de respuesta utilizados: 200 (OK), 201 (creado), 204 (sin contenido), 400 (datos inválidos), ' +
      '401 (sin token o token inválido), 403 (rol sin permiso), 404 (no encontrado), 409 (conflicto: RUT o correo duplicado, ' +
      'stock insuficiente o confirmación de pago simultánea), 500 (error interno, con mensaje genérico) y 502 ' +
      '(otro microservicio no respondió).'),

    h1('5. Versionado de la API'),
    p('Todos los recursos se exponen en dos versiones:'),
    table(
      ['Versión', 'Características'],
      [
        ['v1 (/api/v1/…)', 'API estable usada por el frontend. Respuestas con DTOs.'],
        ['v2 (/api/v2/…)', 'Mismas operaciones, con enlaces HATEOAS (self, ventas, mis-compras) en las respuestas.'],
      ],
      [24, 76]
    ),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    p('Diferencia conocida: en ms-catalogoProductos la v2 no expone GET /id/{id}; ese endpoint existe solo en v1. ' +
      'El proxy del frontend solo enruta /api/v1, porque la v2 se usa desde Swagger.'),

    h1('6. Documentación de endpoints'),

    h2('6.1 ms-auth (http://localhost:8081)'),
    table(
      ['Método', 'Endpoint', 'Auth', 'Roles', 'Descripción'],
      [
        ['POST', '/api/v1/auth/login', 'No', 'Público', 'Valida credenciales y devuelve token, rol y datos del usuario'],
        ['POST', '/api/v1/auth/register', 'No', 'Público', 'Registro público; asigna siempre el rol CLIENTE (409 si RUT o correo existe)'],
        ['GET', '/api/v1/usuarios', 'Sí', 'ADMIN', 'Lista todos los usuarios'],
        ['GET', '/api/v1/usuarios/{id}', 'Sí', 'ADMIN', 'Obtiene un usuario por ID'],
        ['POST', '/api/v1/usuarios', 'Sí', 'ADMIN', 'Crea un usuario con el rol indicado'],
        ['PUT', '/api/v1/usuarios/{id}', 'Sí', 'ADMIN', 'Actualiza datos del usuario'],
        ['DELETE', '/api/v1/usuarios/{id}', 'Sí', 'ADMIN', 'Elimina un usuario; un ADMIN no puede borrar su propia cuenta (400)'],
      ],
      [9, 27, 8, 10, 46]
    ),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    p('Cuerpo de login:', { bold: true }),
    code('{ "username": "cliente@elvolcan.cl", "password": "Cliente123" }'),
    p('Respuesta de login:', { bold: true }),
    code('{ "token": "eyJ...", "id": 3, "nombre": "...", "nombreRol": "CLIENTE", ... }'),

    h2('6.2 ms-catalogoProductos (http://localhost:8082)'),
    table(
      ['Método', 'Endpoint', 'Auth', 'Roles', 'Descripción'],
      [
        ['GET', '/api/v1/productos', 'No', 'Público', 'Lista los productos activos del catálogo'],
        ['GET', '/api/v1/productos/{sku}', 'No', 'Público', 'Busca un producto por su código SKU'],
        ['GET', '/api/v1/productos/id/{id}', 'No', 'Público', 'Busca un producto por su ID numérico'],
        ['POST', '/api/v1/productos', 'Sí', 'ADMIN', 'Crea un producto y lo sincroniza con inventario'],
        ['PUT', '/api/v1/productos/{id}', 'Sí', 'ADMIN', 'Actualiza un producto existente'],
        ['DELETE', '/api/v1/productos/{sku}', 'Sí', 'ADMIN', 'Desactiva el producto (borrado lógico)'],
      ],
      [9, 27, 8, 10, 46]
    ),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    p('El catálogo incluye precio residencial y comercial. ms-ventas aplica el precio según el tipo de cliente del token JWT ' +
      '(si el token no lo trae, usa el residencial). Un producto desactivado no se puede comprar (400).'),

    h2('6.3 ms-inventario (http://localhost:8084)'),
    table(
      ['Método', 'Endpoint', 'Auth', 'Roles', 'Descripción'],
      [
        ['GET', '/api/v1/inventario', 'Sí', 'Autenticado', 'Lista todos los registros de inventario'],
        ['GET', '/api/v1/inventario/critico', 'Sí', 'Autenticado', 'Lista productos con stock bajo el nivel crítico'],
        ['GET', '/api/v1/inventario/{sku}', 'Sí', 'Autenticado', 'Consulta el stock de un SKU'],
        ['POST', '/api/v1/inventario/crear', 'Sí', 'ADMIN', 'Crea el registro de inventario de un producto'],
        ['PUT', '/api/v1/inventario/aumentar', 'Sí', 'ADMIN', 'Aumenta el stock disponible'],
        ['PUT', '/api/v1/inventario/disminuir', 'Sí', 'ADMIN', 'Disminuye el stock disponible'],
        ['PUT', '/api/v1/inventario/sumar-stock/{sku}/{cantidad}', 'Sí', 'ADMIN', 'Suma stock (integración con producción)'],
      ],
      [9, 34, 8, 11, 38]
    ),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    p('Cuerpo de los ajustes:', { bold: true }),
    code('{ "sku": "GAS-15KG", "stockActual": 25 }'),
    p('En aumentar, disminuir y sumar-stock la cantidad debe estar entre 1 y 500 (si no, 400). En crear se acepta 0 como stock inicial.'),

    h2('6.4 ms-ventas (http://localhost:8086)'),
    table(
      ['Método', 'Endpoint', 'Auth', 'Roles', 'Descripción'],
      [
        ['GET', '/api/v1/ventas', 'Sí', 'ADMIN, VENDEDOR', 'Lista todas las ventas registradas'],
        ['GET', '/api/v1/ventas/mis-compras', 'Sí', 'ADMIN, CLIENTE', 'Historial de compras del usuario autenticado'],
        ['GET', '/api/v1/ventas/{id}', 'Sí', 'ADMIN, VENDEDOR, CLIENTE', 'Detalle de una venta (el cliente solo las propias)'],
        ['POST', '/api/v1/ventas', 'Sí', 'ADMIN, CLIENTE', 'Registra una venta; valida catálogo y stock'],
        ['PUT', '/api/v1/ventas/{id}/confirmar', 'Sí', 'ADMIN, CLIENTE', 'Confirma el pago y descuenta stock (solo el dueño o ADMIN)'],
      ],
      [9, 27, 8, 20, 36]
    ),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    p('Cuerpo de creación de venta:', { bold: true }),
    code('{ "direccion": "Av. Argentina 455", "comuna": "Chillán", ' +
      '"metodoPago": "Efectivo", "detalles": [ { "productoId": 1, "cantidad": 2 } ] }'),
    p('Reglas: máximo 50 ítems por venta y 100 unidades por producto (los ítems repetidos se suman); el tipo de cliente ' +
      'no se envía porque viene en el token. Si dos confirmaciones de la misma venta llegan a la vez, una responde 200 y la otra 409.'),

    h1('7. Integración con el frontend'),
    p('El frontend React (Vite) consume las APIs con fetch. El token se guarda en localStorage dentro del objeto “sesion” ' +
      'y se envía en el header Authorization: Bearer <token>. Las rutas están protegidas por rol en el cliente y, además, ' +
      'validadas en el backend.'),
    table(
      ['Pantalla / flujo', 'Endpoint consumido'],
      [
        ['Login', 'POST /api/v1/auth/login'],
        ['Registro', 'POST /api/v1/auth/register'],
        ['Catálogo y detalle de producto', 'GET /api/v1/productos · GET /api/v1/productos/id/{id}'],
        ['Carrito y checkout', 'POST /api/v1/ventas'],
        ['Confirmación de pago', 'PUT /api/v1/ventas/{id}/confirmar'],
        ['Mis compras', 'GET /api/v1/ventas/mis-compras'],
        ['Panel vendedor (productos y órdenes)', 'GET /api/v1/productos · GET /api/v1/ventas · GET /api/v1/ventas/{id}'],
        ['Admin — productos', 'GET/POST /api/v1/productos · PUT /api/v1/productos/{id} · DELETE /api/v1/productos/{sku}'],
        ['Admin — inventario', 'GET /api/v1/inventario · PUT /api/v1/inventario/{aumentar|disminuir}'],
        ['Admin — usuarios', 'GET/POST /api/v1/usuarios · PUT/DELETE /api/v1/usuarios/{id}'],
        ['Admin — órdenes, clientes y reportes', 'GET /api/v1/ventas · GET /api/v1/ventas/{id} · GET /api/v1/usuarios'],
      ],
      [38, 62]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p('En desarrollo, el frontend usa rutas relativas (/api/v1/…) y el proxy de Vite las reenvía a cada microservicio. ' +
      'El proxy quita el header Origin, así que estas llamadas no dependen de CORS y funcionan desde localhost, la red local o un túnel. ' +
      'CORS sigue configurado en los microservicios (CORS_ORIGINS) para clientes que llamen directo a los puertos. ' +
      'Si el backend no responde, la interfaz muestra un aviso de conexión en lugar de datos locales.'),

    h1('8. Base de datos y configuración'),
    p('Los microservicios usan Oracle Autonomous Database con Wallet. La conexión se configura con TNS_ADMIN apuntando a ' +
      'la carpeta del Wallet indicada en ORACLE_WALLET_DIR.'),
    bullet('ddl-auto=update: Hibernate crea y actualiza las tablas a partir de las entidades al iniciar cada servicio.'),
    bullet('Cada microservicio es dueño de sus tablas y no comparte entidades con otros; la comunicación es por API.'),
    bullet('Las columnas version de ventas e inventarios sostienen el bloqueo optimista. Al arrancar, ColumnaVersionInitializer ' +
      'rellena con 0 las filas antiguas y deja la columna como DEFAULT 0 NOT NULL.'),
    bullet('Hoy el Wallet y el archivo de secretos están excluidos del repositorio mediante .gitignore. ' + 'La contraseña de la base de datos y la clave JWT que quedaron en el historial de git (commit 1bec55c) ya se cambiaron; el Oracle Wallet, que también quedó en ese historial (se retiró en el commit 21e47ba), está pendiente de rotar.'),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    p('Modelo entidad-relación:', { bold: true }),
    table(
      ['Servicio', 'Tabla', 'Columnas principales', 'Relaciones'],
      [
        ['ms-auth', 'roles', 'id (PK), nombre_rol (único)', '1 rol → N usuarios'],
        ['ms-auth', 'usuarios', 'id (PK), nombre, rut (único), username (único), password (BCrypt), rol_id (FK), dirección, región, comuna, tipo_cliente, teléfono', 'N usuarios → 1 rol'],
        ['ms-catalogoProductos', 'productos', 'id (PK), sku (único), nombre, descripción, precio_residencial, precio_comercial, precio, categoría, imagen, activo', '1 producto ↔ 1 inventario (por sku, vía API)'],
        ['ms-inventario', 'inventarios', 'id (PK), sku (único), stock_actual, nivel_critico, nivel_maximo, ultima_actualizacion, version', 'por sku con productos'],
        ['ms-ventas', 'ventas', 'id (PK), usuario (username), total, estado, fecha_venta, dirección, comuna, metodo_pago, version', '1 venta → N detalles; usuario → usuarios.username (vía JWT)'],
        ['ms-ventas', 'detalles_venta', 'id (PK), venta_id (FK), producto_id, cantidad, precio_unitario, subtotal', 'N detalles → 1 venta; producto_id → productos.id (vía API)'],
      ],
      [18, 14, 44, 24]
    ),
    code('roles 1───N usuarios      ventas 1───N detalles_venta'),
    code('productos.sku ······ inventarios.sku      detalles_venta.producto_id ······ productos.id'),
    code('ventas.usuario ······ usuarios.username      (───: clave foránea · ······: relación por API)'),

    h1('9. Pruebas y verificación'),
    p('Pruebas automatizadas (ejecutadas el 14-11-2026, todas aprobadas):'),
    table(
      ['Componente', 'Herramienta', 'Pruebas', 'Qué cubren'],
      [
        ['ms-auth', 'JUnit + MockMvc', '34', 'Login, registro, JWT (claims y expiración), política de contraseñas, roles en usuarios, errores'],
        ['ms-catalogoProductos', 'JUnit + MockMvc', '18', 'CRUD, SKU no modificable, catálogo público, solo ADMIN escribe, 404/500'],
        ['ms-inventario', 'JUnit + MockMvc', '26', 'Ajustes de stock con tope 1–500, stock crítico, 409 por concurrencia, solo ADMIN escribe'],
        ['ms-ventas', 'JUnit + MockMvc', '37', 'Precio por tipo de cliente del token, ítems agrupados, topes, dueño de la venta, bloqueo optimista, 403 por rol'],
        ['Frontend React', 'Vitest + Testing Library', '92 (26 archivos)', 'Componentes, páginas, sesión, carrito, validaciones y llamadas a la API'],
      ],
      [22, 20, 14, 44]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p('Total backend: 115 pruebas JUnit. Pruebas manuales contra Oracle Cloud con el sistema completo en ejecución:', { bold: true }),
    table(
      ['Prueba', 'Resultado esperado', 'Resultado obtenido'],
      [
        ['Login de ADMIN, VENDEDOR y CLIENTE', '200, token de 2 h con rol y tipo de cliente', 'OK'],
        ['Login con clave incorrecta / campos vacíos', '401 / 400', 'OK'],
        ['Cliente Residencial envía "tipoCliente": "Comercial"', 'Se cobra el precio residencial', 'OK (6.500 en vez de 6.000)'],
        ['Dos confirmaciones simultáneas de la misma venta', 'Una 200 y otra 409; el stock baja una sola vez', 'OK (stock 80 → 79)'],
        ['Producto inexistente / id mal formado', '404 / 400', 'OK'],
        ['VENDEDOR intenta crear una venta, confirmar un pago o modificar inventario o catálogo', '403', 'OK'],
        ['CLIENTE intenta listar todas las ventas', '403', 'OK'],
        ['VENDEDOR lista las órdenes', '200', 'OK'],
        ['Flujo en el frontend', 'Catálogo, carrito, venta, confirmación, mis compras, paneles admin y vendedor', 'OK (capturas de la sección 10)'],
      ],
      [38, 36, 26]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p('Las pruebas de contexto completo (*ApplicationTests) requieren el archivo de secretos y la Wallet configurados, ' +
      'por lo que se ejecutan en el entorno local de cada integrante.'),

    h1('10. Capturas de la integración'),
    p('Las capturas fueron tomadas con el sistema completo en ejecución (Eureka, los cuatro microservicios y el frontend) ' +
      'y la semilla de 14 productos cargada.'),

    ...captura('02-catalogo.jpg', 'Catálogo: GET /api/v1/productos (consulta pública, sin token)'),
    ...captura('02b-catalogo-busqueda.jpg', 'Buscador del catálogo: filtra en vivo y sugiere palabras clave'),
    ...captura('03-detalle-producto.jpg', 'Detalle de producto con precios residencial y comercial'),
    ...captura('04-carrito.jpg', 'Carrito: el estado se mantiene en el frontend (localStorage)'),
    ...captura('07-checkout.jpg', 'Checkout: dirección, comuna y método de pago antes de crear la venta'),
    ...captura('08-mis-compras.jpg', 'Mis compras: GET /api/v1/ventas/mis-compras con el token del cliente'),
    ...captura('10-vendedor-ordenes.jpg', 'Panel de vendedor: listado de órdenes en modo solo lectura'),
    ...captura('11-admin-dashboard.jpg', 'Panel de administración: indicadores calculados con datos reales de las APIs'),
    ...captura('12-admin-inventario.jpg', 'Administración de inventario: stock por SKU y ajustes'),
    ...captura('17-eureka.jpg', 'Eureka con los cuatro microservicios registrados'),
    ...captura('18-swagger-catalogo.jpg', 'Documentación OpenAPI (Swagger UI) de ms-catalogoProductos'),
  ];

  return new Document({ sections: [{ properties: {}, children }] });
}

// ============================================================
// ANEXO 4 — Manual de usuario
// ============================================================
function anexo4() {
  const children = [
    ...portada('Manual de Usuario', 'Uso del sistema web por rol: Cliente, Vendedor y Administrador'),

    h1('1. Objetivo'),
    p('Este manual describe cómo usar el sistema web de la Distribuidora de Gas El Volcán: navegar el catálogo, ' +
      'realizar una compra, consultar el historial y operar los paneles de vendedor y administrador.'),

    h1('2. Alcance'),
    p('El sistema permite:'),
    bullet('Cliente: registrarse, iniciar sesión, ver catálogo y detalle de productos, agregar al carrito, finalizar la compra, ' +
      'confirmar el pago y revisar “Mis compras”.'),
    bullet('Vendedor: consultar productos y órdenes en modo solo lectura.'),
    bullet('Administrador: gestionar productos, inventario, usuarios, órdenes, clientes y reportes.'),

    h1('3. Requisitos previos'),
    p('Antes de usar el sistema, el equipo debe tener los servicios levantados:'),
    bullet('Eureka Server en http://localhost:8761 con los cinco servicios en estado UP.'),
    bullet('Archivo %USERPROFILE%\\.elvolcan\\secrets.properties con DB_PASSWORD, ORACLE_WALLET_DIR y JWT_SECRET.'),
    bullet('Wallet de Oracle descomprimido en la carpeta indicada por ORACLE_WALLET_DIR.'),
    bullet('Frontend disponible en http://localhost:5173 (Vite; si el puerto está ocupado puede usar 5174).'),
    p('Para levantar todo desde la carpeta microservicios:'),
    code('.\\levantar-servicios.ps1            # levanta Eureka y los microservicios'),
    code('.\\levantar-servicios.ps1 -Verificar  # solo revisa requisitos'),
    code('.\\detener-servicios.ps1             # detiene todo'),
    p('Para el frontend, desde la carpeta frontend:'),
    code('npm install'),
    code('npm run dev'),

    h1('4. Acceso al sistema'),
    h2('4.1 Iniciar sesión'),
    bullet('Ingresar a http://localhost:5173 y seleccionar “Iniciar sesión”.'),
    bullet('Escribir el correo (username) y la contraseña.'),
    bullet('Presionar “Ingresar”. El sistema valida las credenciales contra ms-auth y guarda la sesión.'),
    bullet('Según el rol, se muestra el menú de cliente, el panel de vendedor o el panel de administración.'),
    p('Si las credenciales son incorrectas se muestra “Credenciales incorrectas”. Si el backend no responde, ' +
      'se muestra un aviso de conexión.'),

    h2('4.2 Registrarse'),
    bullet('Desde el login, seleccionar “Registrarse”.'),
    bullet('Completar nombre, RUT, correo, contraseña, teléfono, dirección y comuna.'),
    bullet('Presionar “Registrar”. La cuenta se crea con rol CLIENTE.'),
    bullet('Si el RUT o el correo ya existen, el sistema informa el conflicto y no crea la cuenta.'),

    h1('5. Manual del Cliente'),
    h2('5.1 Explorar el catálogo'),
    bullet('En el menú superior, seleccionar “Productos”.'),
    bullet('Se listan los cilindros y accesorios con imagen, nombre y precio.'),
    bullet('Usar la búsqueda y los filtros para encontrar un producto.'),
    bullet('Seleccionar un producto para ver su detalle y disponibilidad.'),
    h2('5.2 Agregar productos al carrito'),
    bullet('En la tarjeta o en el detalle del producto, presionar “Agregar al carrito”.'),
    bullet('Ajustar la cantidad con los controles del carrito.'),
    bullet('El contador del carrito en el menú muestra el total de unidades.'),
    h2('5.3 Finalizar la compra'),
    bullet('Ir a “Carrito” y revisar los productos y cantidades.'),
    bullet('Presionar “Finalizar compra”.'),
    bullet('Completar tipo de cliente (Residencial o Comercial), dirección, comuna y método de pago (Efectivo o Tarjeta).'),
    bullet('Confirmar. El sistema crea la venta en ms-ventas, valida el stock en ms-inventario y consulta el precio en el catálogo.'),
    bullet('Si no hay stock suficiente, se muestra el mensaje de error correspondiente y la venta no se registra.'),
    h2('5.4 Confirmar el pago'),
    bullet('Al finalizar la compra, confirmar el pago de la venta generada.'),
    bullet('El sistema cambia el estado a PAGADO y descuenta el stock automáticamente.'),
    h2('5.5 Consultar “Mis compras”'),
    bullet('En el menú, seleccionar “Mis compras”.'),
    bullet('Se listan las compras del usuario con fecha, total y estado.'),
    bullet('Seleccionar una compra para ver su detalle.'),

    h1('6. Manual del Vendedor'),
    p('El rol VENDEDOR tiene acceso de solo lectura. No puede crear ni modificar productos, inventario ni ventas.'),
    h2('6.1 Panel de vendedor'),
    bullet('Al iniciar sesión, se abre el panel de vendedor.'),
    bullet('“Productos”: lista el catálogo con precio y stock disponible.'),
    bullet('Seleccionar un producto para ver su detalle.'),
    h2('6.2 Consultar órdenes'),
    bullet('Seleccionar “Órdenes” para ver todas las ventas registradas.'),
    bullet('Seleccionar una orden para ver su detalle: cliente, dirección, comuna, método de pago, productos y total.'),

    h1('7. Manual del Administrador'),
    h2('7.1 Dashboard'),
    bullet('Al iniciar sesión se muestra el panel de administración con indicadores del sistema.'),
    h2('7.2 Gestión de productos'),
    bullet('Ingresar a “Inventario” y usar la sección de productos.'),
    bullet('Crear un producto indicando nombre, SKU, descripción, precios y stock inicial.'),
    bullet('Editar un producto existente o desactivarlo (deja de mostrarse en la tienda).'),
    h2('7.3 Gestión de inventario'),
    bullet('En “Inventario”, revisar el stock por SKU y los productos en estado crítico.'),
    bullet('Usar “Aumentar” o “Disminuir” para ajustar el stock, indicando el SKU y la cantidad.'),
    h2('7.4 Gestión de usuarios'),
    bullet('Ingresar a “Usuarios” para ver el listado completo.'),
    bullet('Presionar “Nuevo usuario” y completar los datos, seleccionando el rol (ADMIN, VENDEDOR o CLIENTE).'),
    bullet('Editar o eliminar un usuario desde la lista.'),
    bullet('El sistema no permite eliminar la cuenta con la que se está conectado; el botón queda deshabilitado.'),
    h2('7.5 Órdenes'),
    bullet('Ingresar a “Órdenes” para ver todas las ventas.'),
    bullet('Abrir una orden para revisar el detalle completo.'),
    h2('7.6 Clientes y reportes'),
    bullet('“Clientes” muestra los clientes registrados con sus datos de contacto y compras.'),
    bullet('“Reportes” presenta los indicadores calculados con datos reales de la API (ventas, productos más vendidos, ' +
      'ingresos y stock crítico).'),

    h1('8. Credenciales de prueba'),
    table(
      ['Rol', 'Usuario', 'Contraseña'],
      [
        ['ADMIN', 'admin@duoc.cl', 'Admin123'],
        ['VENDEDOR', 'vendedor@elvolcan.cl', 'Vendedor123'],
        ['CLIENTE', 'cliente@elvolcan.cl', 'Cliente123'],
      ],
      [26, 42, 32]
    ),

    h1('9. Mensajes y solución de problemas'),
    table(
      ['Situación', 'Causa probable', 'Solución'],
      [
        ['“Credenciales incorrectas”', 'Usuario o contraseña inválidos', 'Verificar los datos e intentar nuevamente'],
        ['Aviso de conexión', 'Microservicio detenido o Eureka sin el servicio', 'Revisar Eureka y levantar el servicio faltante'],
        ['Error de stock insuficiente', 'Cantidad solicitada mayor al stock', 'Ajustar la cantidad o reponer stock'],
        ['Error al iniciar el backend', 'Falta secrets.properties o la Wallet', 'Crear el archivo de secretos y verificar ORACLE_WALLET_DIR'],
        ['“ORA-17957 / SSO not found”', 'El sqlnet.ora del Wallet apunta a ?/network/admin', 'Ejecutar levantar-servicios.ps1 (corrige la ruta del Wallet automáticamente)'],
        ['403 al operar', 'El rol no tiene permiso', 'Usar una cuenta con el rol adecuado'],
      ],
      [30, 32, 38]
    ),

    h1('10. Capturas del sistema'),
    p('Las siguientes capturas corresponden al sistema en funcionamiento, con los servicios levantados y el catálogo cargado.'),

    h2('10.1 Acceso'),
    ...captura('05-login.jpg', 'Pantalla de inicio de sesión'),
    ...captura('06-registro.jpg', 'Formulario de registro: la cuenta se crea con rol CLIENTE'),
    ...captura('07a-menu-usuario.jpg', 'Menú de cuenta: Mis compras, Panel Admin y Cerrar sesión'),

    h2('10.2 Cliente'),
    ...captura('02-catalogo.jpg', 'Catálogo de productos'),
    ...captura('02b-catalogo-busqueda.jpg', 'Buscador del catálogo con sugerencias y filtrado en vivo'),
    ...captura('03-detalle-producto.jpg', 'Detalle de un producto'),
    ...captura('04-carrito.jpg', 'Carrito con los productos agregados'),
    ...captura('07-checkout.jpg', 'Finalizar la compra: dirección, comuna y método de pago'),
    ...captura('08-mis-compras.jpg', 'Mis compras: historial del cliente autenticado'),

    h2('10.3 Vendedor'),
    ...captura('09-vendedor-productos.jpg', 'Panel de vendedor: catálogo en modo solo lectura'),
    ...captura('10-vendedor-ordenes.jpg', 'Panel de vendedor: listado de órdenes'),

    h2('10.4 Administrador'),
    ...captura('11-admin-dashboard.jpg', 'Dashboard con los indicadores del sistema'),
    ...captura('12-admin-inventario.jpg', 'Gestión de inventario y productos'),
    ...captura('13-admin-usuarios.jpg', 'Gestión de usuarios'),
    ...captura('13b-admin-usuarios-editar.jpg', 'Edición de un usuario existente (PUT /api/v1/usuarios/{id})'),
    ...captura('14-admin-ordenes.jpg', 'Listado de órdenes'),
    ...captura('15-admin-clientes.jpg', 'Listado de clientes'),
    ...captura('16-admin-reportes.jpg', 'Reportes calculados con datos reales de la API'),

    h2('10.5 Infraestructura'),
    ...captura('17-eureka.jpg', 'Eureka con los cuatro microservicios registrados en estado UP'),
  ];

  return new Document({ sections: [{ properties: {}, children }] });
}

// Uso: node generar-anexos.js            -> genera los Anexos 2 y 4
//      node generar-anexos.js anexo2     -> genera solo el Anexo 2 (o anexo4)
async function main() {
  const solo = process.argv[2];
  const docs = [
    ['anexo2', 'Anexo 2 - Documentación APIs e Integración (El Volcán).docx', anexo2],
    ['anexo4', 'Anexo 4 - Manual de usuario (El Volcán).docx', anexo4],
  ].filter(([clave]) => !solo || clave === solo).map(([, name, crear]) => [name, crear()]);
  for (const [name, doc] of docs) {
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(outDir, name), buf);
    console.log('OK:', name, buf.length, 'bytes');
  }
}

main().catch((e) => { console.error('ERR', e); process.exit(1); });
