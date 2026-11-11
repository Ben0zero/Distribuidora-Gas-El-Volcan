const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle
} = require('docx');

const outDir = path.join(__dirname);
const VER = '3.0';
const FECHA = '11-11-2026';

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

function portada(titulo, subtitulo) {
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
        ['Versión del documento', VER],
        ['Fecha', FECHA],
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
    ...portada('Documentación de APIs e Integración', 'Sistema de gestión de ventas, catálogo, inventario y usuarios'),

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
    bullet('ms-ventas consulta el catálogo (precio según tipo de cliente) y el inventario (stock disponible) vía Feign.'),
    bullet('Al confirmar el pago, ms-ventas descuenta el stock en ms-inventario y deja la venta en estado PAGADO.'),
    bullet('El cliente revisa el resultado en “Mis compras”, que consulta ms-ventas.'),

    h1('3. Seguridad y control de acceso'),
    p('La autenticación se basa en JWT firmado con una clave compartida (HS256). El login devuelve el token junto con los ' +
      'datos del usuario y su rol. Cada microservicio valida el token de forma independiente y aplica autorización por rol ' +
      'con @PreAuthorize y reglas en SecurityConfig.'),
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

    h1('4. Información general de las APIs'),
    table(
      ['Recurso', 'URL'],
      [
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
      '401 (sin token o token inválido), 403 (rol sin permiso), 404 (no encontrado), 409 (conflicto: RUT o correo duplicado), ' +
      '500 (error interno).'),

    h1('5. Versionado de la API'),
    p('Todos los recursos se exponen en dos versiones:'),
    table(
      ['Versión', 'Características'],
      [
        ['v1 (/api/v1/…)', 'API estable usada por el frontend. Respuestas con DTOs.'],
        ['v2 (/api/v2/…)', 'Misma funcionalidad, con enlaces HATEOAS (self, ventas, mis-compras) en las respuestas.'],
      ],
      [24, 76]
    ),

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
        ['DELETE', '/api/v1/usuarios/{id}', 'Sí', 'ADMIN', 'Elimina un usuario'],
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
    p('El catálogo incluye precio residencial y comercial; el precio aplicado se determina según el tipo de cliente de la venta.'),

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
    code('{ "tipoCliente": "Residencial", "direccion": "Av. Argentina 455", "comuna": "Chillán", ' +
      '"metodoPago": "Efectivo", "detalles": [ { "productoId": 1, "cantidad": 2 } ] }'),

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
    p('CORS está habilitado en los microservicios para los orígenes del frontend (localhost y 127.0.0.1 en los puertos 5173 y 5174). ' +
      'Si el backend no responde, la interfaz muestra un aviso de conexión en lugar de datos locales.'),

    h1('8. Base de datos y configuración'),
    p('Los microservicios usan Oracle Autonomous Database con Wallet. La conexión se configura con TNS_ADMIN apuntando a ' +
      'la carpeta del Wallet indicada en ORACLE_WALLET_DIR.'),
    bullet('ddl-auto=update: Hibernate crea y actualiza las tablas a partir de las entidades al iniciar cada servicio.'),
    bullet('Cada microservicio es dueño de sus tablas y no comparte entidades con otros; la comunicación es por API.'),
    bullet('Tablas principales: usuarios y roles (ms-auth), productos (ms-catalogoProductos), inventario (ms-inventario), ' +
      'ventas y detalle de venta (ms-ventas).'),
    bullet('El Wallet y el archivo de secretos están excluidos del repositorio mediante .gitignore.'),

    h1('9. Pruebas y verificación'),
    p('Se ejecutaron pruebas automatizadas en backend y frontend:'),
    table(
      ['Componente', 'Herramienta', 'Resultado'],
      [
        ['ms-auth, ms-catalogoProductos, ms-inventario, ms-ventas', 'JUnit + MockMvc + JaCoCo', 'Pruebas unitarias, de controlador y de seguridad aprobadas'],
        ['Frontend React', 'Vitest + Testing Library', '23 archivos de prueba y 71 pruebas aprobadas'],
        ['Integración end-to-end', 'Manual sobre el frontend', 'Login, catálogo, carrito, venta, confirmación, mis compras, paneles admin y vendedor'],
      ],
      [40, 26, 34]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p('Las pruebas de contexto completo (*ApplicationTests) requieren el archivo de secretos y la Wallet configurados, ' +
      'por lo que se ejecutan en el entorno local de cada integrante.'),
    p('Las capturas de pantalla de la integración se incorporan en la sección de verificación de la entrega.', { italics: true }),
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
        ['403 al operar', 'El rol no tiene permiso', 'Usar una cuenta con el rol adecuado'],
      ],
      [30, 32, 38]
    ),

    h1('10. Capturas sugeridas para la entrega'),
    bullet('Pantalla de login y de registro.'),
    bullet('Catálogo y detalle de producto.'),
    bullet('Carrito y formulario de checkout.'),
    bullet('Confirmación de pago y “Mis compras”.'),
    bullet('Panel de vendedor (productos y órdenes).'),
    bullet('Panel de administración: dashboard, productos, inventario, usuarios, órdenes, clientes y reportes.'),
    bullet('Eureka con los cinco servicios en estado UP.'),
  ];

  return new Document({ sections: [{ properties: {}, children }] });
}

async function main() {
  const docs = [
    ['Anexo 2 - Documentación APIs e Integración (El Volcán).docx', anexo2()],
    ['Anexo 4 - Manual de usuario (El Volcán).docx', anexo4()],
  ];
  for (const [name, doc] of docs) {
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(outDir, name), buf);
    console.log('OK:', name, buf.length, 'bytes');
  }
}

main().catch((e) => { console.error('ERR', e); process.exit(1); });
