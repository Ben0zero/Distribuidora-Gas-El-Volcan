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
const VER_ANEXO2 = '3.6';
const FECHA_ANEXO2 = '15-11-2026';
// El Anexo 4 se rehízo con capturas reales (PNG 1366x768) tomadas con Docker
const VER_ANEXO4 = '4.0';
const FECHA_ANEXO4 = '15-11-2026';

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

// Figura numerada del Anexo 4 (requisito de la plantilla: número, título, nota y borde negro de 1 px).
// La imagen va en una tabla de una celda con borde negro; si el archivo no existe, se deja un
// recuadro "Captura pendiente" del mismo tamaño para que el documento se genere igual.
let numeroFigura = 0;
const ANCHO_FIG = 600; // px; las capturas son de 1366x768
const ALTO_FIG = Math.round((ANCHO_FIG * 768) / 1366);
const BORDE_NEGRO = { style: BorderStyle.SINGLE, size: 6, color: '000000' }; // 6/8 pt = 1 px
const SIN_BORDE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

function figura(archivo, titulo, explicacion, pasos = []) {
  numeroFigura += 1;
  const ruta = path.join(capturasDir, archivo);
  const existe = fs.existsSync(ruta);
  let contenido;
  if (existe) {
    contenido = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new ImageRun({
        data: fs.readFileSync(ruta),
        type: path.extname(archivo).slice(1).toLowerCase() === 'png' ? 'png' : 'jpg',
        transformation: { width: ANCHO_FIG, height: ALTO_FIG },
      })],
    });
  } else {
    console.warn(`  Aviso: falta capturas/${archivo}; se inserta "Captura pendiente"`);
    contenido = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2200, after: 2200 },
      children: [new TextRun({ text: 'Captura pendiente', bold: true, size: 28, color: '7F7F7F' })],
    });
  }
  const marco = new Table({
    alignment: AlignmentType.CENTER,
    width: { size: ANCHO_FIG * 15, type: WidthType.DXA }, // 1 px = 15 twips
    borders: { top: BORDE_NEGRO, bottom: BORDE_NEGRO, left: BORDE_NEGRO, right: BORDE_NEGRO,
      insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        width: { size: ANCHO_FIG * 15, type: WidthType.DXA },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        children: [contenido],
      })],
    })],
  });
  return [
    new Paragraph({
      children: [new TextRun({ text: `Figura ${numeroFigura}. ${titulo}`, bold: true, size: 20 })],
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { before: 240, after: 80 },
    }),
    marco,
    new Paragraph({
      children: [
        new TextRun({ text: 'Nota: ', bold: true, italics: true, size: 18, color: '404040' }),
        new TextRun({ text: explicacion, italics: true, size: 18, color: '404040' }),
      ],
      spacing: { before: 80, after: pasos.length ? 60 : 220 },
    }),
    ...pasos.map((t, i) => new Paragraph({
      children: [new TextRun({ text: `${i + 1}. ${t}`, size: 20 })],
      indent: { left: 360 },
      spacing: { after: i === pasos.length - 1 ? 220 : 40 },
    })),
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

    h2('2.1 Arquitectura de contenedores (Docker)'),
    p('El sistema completo se levanta con Docker Compose (docker-compose.yml en la raíz), en local con Docker Desktop o en ' +
      'AWS EC2. Son seis contenedores en una red interna (172.28.0.0/16); solo el frontend publica un puerto. El paso a paso ' +
      'está en docs/DOCKER.md.'),
    table(
      ['Contenedor', 'Imagen de ejecución', 'Puerto', 'Publicado'],
      [
        ['eureka', 'eclipse-temurin:21-jre-alpine', '8761', 'Solo 127.0.0.1:8761'],
        ['ms-auth', 'eclipse-temurin:21-jre-alpine', '8081', 'No'],
        ['ms-catalogoproductos', 'eclipse-temurin:21-jre-alpine', '8082', 'No'],
        ['ms-inventario', 'eclipse-temurin:21-jre-alpine', '8084', 'No'],
        ['ms-ventas', 'eclipse-temurin:21-jre-alpine', '8086', 'No'],
        ['frontend (Nginx)', 'nginx:1.27-alpine', '80', '80'],
      ],
      [26, 36, 12, 26]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    bullet('Imágenes multi-etapa: los microservicios se compilan con Maven y Java 21 dentro de la imagen y se ejecutan con un JRE 21 ' +
      'liviano, con un usuario sin privilegios y memoria configurable (JAVA_OPTS, por defecto -Xmx384m). El frontend se compila con Node 22 y lo sirve Nginx.'),
    bullet('Nginx sirve la SPA (try_files para React Router) y reenvía /api/v1 y /api/v2 a cada microservicio por la red interna: ' +
      'auth, usuarios y cuenta a ms-auth; productos a ms-catalogoproductos; inventario a ms-inventario; ventas a ms-ventas. ' +
      'Envía X-Forwarded-For con la IP del navegador y quita Origin, igual que el proxy de Vite.'),
    bullet('Headers de seguridad (H-13): X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy ' +
      'strict-origin-when-cross-origin y una Content-Security-Policy que solo permite recursos del propio sitio y los iframes de ' +
      'Google Maps y YouTube. Las imágenes de productos deben ser rutas locales /IMAGENES/...'),
    bullet('Arranque ordenado con healthchecks y depends_on: Eureka, luego los cuatro microservicios y por último el frontend. ' +
      'Los servicios encuentran a Eureka por el nombre del contenedor (http://eureka:8761/eureka/).'),
    bullet('Secretos: DB_USER, DB_PASSWORD, JWT_SECRET, el correo (NOTIFICACION_MODO, SPRING_MAIL_*) y APP_FRONTEND_URL se leen ' +
      'de un archivo .env no versionado (plantilla .env.example). El Oracle Wallet no se copia a las imágenes: se monta como ' +
      'volumen de solo lectura en /wallet (WALLET_HOST_DIR).'),
    bullet('En AWS EC2 el grupo de seguridad abre solo los puertos 22 y 80; Eureka se revisa con un túnel SSH y la IP de la ' +
      'instancia debe estar permitida en la lista de acceso de la base Oracle.'),

    h1('3. Seguridad y control de acceso'),
    p('La autenticación se basa en JWT firmado con una clave compartida (HS256). El login devuelve el token junto con los ' +
      'datos del usuario y su rol. Cada microservicio valida el token de forma independiente y aplica autorización por rol ' +
      'con @PreAuthorize y reglas en SecurityConfig.'),
    bullet('El token dura 2 horas e incluye el rol y el tipo de cliente (Residencial o Comercial). ms-ventas toma el tipo ' +
      'de cliente del token, nunca del cuerpo de la petición, para que un cliente no pueda elegir el precio comercial.'),
    bullet('Las contraseñas se guardan con BCrypt y deben tener al menos 8 caracteres, con al menos una letra y un número.'),
    bullet('Límite de intentos de login: 5 fallos del mismo usuario desde la misma IP, o 20 desde una IP con cualquier usuario, ' +
      'en 15 minutos bloquean el login por 15 minutos. Durante el bloqueo se responde 429 con un mensaje genérico ' +
      '("Demasiados intentos. Intenta nuevamente en unos minutos.") que no revela si el usuario existe; los usuarios ' +
      'inexistentes se cuentan igual. Se cuenta por usuario + IP para que nadie pueda bloquear la cuenta de otro desde su IP. ' +
      'Un login correcto reinicia el contador y cada bloqueo queda en el log con el usuario y la IP (sin contraseñas). ' +
      'El contador está en memoria de ms-auth (ConcurrentHashMap con limpieza de entradas vencidas). Detrás de un proxy se usa la ' +
      'última IP de X-Forwarded-For solo si la petición viene de un proxy confiable (app.seguridad.proxies-confiables, IPs o CIDR): ' +
      'por defecto 127.0.0.1 y ::1 (proxy de Vite) y, en Docker, también la red interna 172.28.0.0/16 desde la que llega Nginx.'),
    bullet('Cambio de contraseña con sesión iniciada: exige el token y la contraseña actual; el usuario sale del token.'),
    bullet('Recuperación de contraseña: la solicitud responde siempre lo mismo (no revela si la cuenta existe). Se genera un token ' +
      'aleatorio de 32 bytes, se guarda solo su SHA-256, vence en 15 minutos, es de un solo uso e invalida los anteriores; máximo 3 ' +
      'solicitudes por usuario cada 15 minutos. El enlace se envía por NotificacionService y nunca viene en la respuesta. ' +
      'Con app.notificacion.modo=log (por defecto) se escribe solo en el log de ms-auth; con app.notificacion.modo=correo se ' +
      'envía un correo por SMTP (spring-boot-starter-mail) en segundo plano (@Async con un executor acotado de 1–2 hilos y cola de 50), ' +
      'así que la respuesta no espera al servidor de correo. Si el envío falla, solo se registra en el log y la respuesta no cambia.'),
    bullet('Un administrador no puede quitarse su propio rol ni quitárselo al último ADMIN (400 con el motivo). En el formulario ' +
      'de edición el selector de rol queda bloqueado cuando el admin se edita a sí mismo.'),
    bullet('Un token mal formado, con firma inválida o expirado (o de un usuario que ya no existe) no rompe la petición: el filtro ' +
      'JWT de cada servicio lo captura, la petición sigue sin autenticar y una ruta privada responde 401 en JSON.'),
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
        ['POST', '/api/v1/auth/login', 'No', 'Público', 'Valida credenciales y devuelve token, rol y datos del usuario (429 tras demasiados intentos fallidos)'],
        ['POST', '/api/v1/auth/register', 'No', 'Público', 'Registro público; asigna siempre el rol CLIENTE (409 si RUT o correo existe)'],
        ['GET', '/api/v1/usuarios', 'Sí', 'ADMIN', 'Lista todos los usuarios'],
        ['GET', '/api/v1/usuarios/{id}', 'Sí', 'ADMIN', 'Obtiene un usuario por ID'],
        ['POST', '/api/v1/usuarios', 'Sí', 'ADMIN', 'Crea un usuario con el rol indicado'],
        ['PUT', '/api/v1/usuarios/{id}', 'Sí', 'ADMIN', 'Actualiza datos del usuario; un ADMIN no puede quitarse su propio rol ni dejar el sistema sin ADMIN (400)'],
        ['DELETE', '/api/v1/usuarios/{id}', 'Sí', 'ADMIN', 'Elimina un usuario; un ADMIN no puede borrar su propia cuenta (400)'],
        ['PUT', '/api/v1/cuenta/contrasena', 'Sí', 'Autenticado', 'Cambia la contraseña del usuario del token (pide la actual)'],
        ['POST', '/api/v1/auth/recuperar', 'No', 'Público', 'Pide un enlace de recuperación; responde siempre el mismo mensaje'],
        ['POST', '/api/v1/auth/restablecer', 'No', 'Público', 'Nueva contraseña con el token del enlace (vence en 15 min, un solo uso)'],
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
        ['DELETE', '/api/v1/productos/{sku}', 'Sí', 'ADMIN', 'Elimina definitivamente un producto sin ventas y su inventario (409 con ventas; 502 si falla otro servicio)'],
        ['GET', '/api/v1/productos/todos', 'Sí', 'ADMIN', 'Lista todos los productos, incluidos los inactivos (panel admin)'],
        ['PATCH', '/api/v1/productos/{id}/estado', 'Sí', 'ADMIN', 'Activa o desactiva un producto: { "activo": true | false }'],
      ],
      [9, 27, 8, 10, 46]
    ),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    p('El catálogo incluye precio residencial y comercial. ms-ventas aplica el precio según el tipo de cliente del token JWT ' +
      '(si el token no lo trae, usa el residencial). Un producto desactivado no se puede comprar (400).'),
    p('Eliminar un producto (DELETE) es definitivo: ms-catalogoProductos consulta por Feign a ms-ventas ' +
      '(GET /api/v1/ventas/productos-vendidos) y, si el producto tiene ventas, responde 409 "El producto tiene ventas registradas; ' +
      'desactívalo en lugar de eliminarlo". Si no las tiene, lo borra y elimina su stock en ms-inventario (DELETE /api/v1/inventario/{sku}) ' +
      'dentro de una transacción: si ms-ventas o ms-inventario no responden, no se borra nada y se responde 502. Para ocultarlo de la ' +
      'tienda sin borrarlo se usa PATCH /{id}/estado. En el panel, el botón Eliminar queda deshabilitado (con el motivo) para los productos con ventas.'),

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
        ['DELETE', '/api/v1/inventario/{sku}', 'Sí', 'ADMIN', 'Elimina el registro de stock (lo llama catálogo al eliminar un producto; 404 si no existe)'],
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
        ['GET', '/api/v1/ventas/productos-vendidos', 'Sí', 'ADMIN', 'IDs de productos con al menos una venta (consulta DISTINCT); lo usan catálogo y el panel'],
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
        ['Recuperar y restablecer contraseña', 'POST /api/v1/auth/recuperar · POST /api/v1/auth/restablecer'],
        ['Cambiar contraseña (tienda y paneles)', 'PUT /api/v1/cuenta/contrasena'],
        ['Catálogo y detalle de producto', 'GET /api/v1/productos · GET /api/v1/productos/id/{id}'],
        ['Carrito y checkout', 'POST /api/v1/ventas'],
        ['Confirmación de pago', 'PUT /api/v1/ventas/{id}/confirmar'],
        ['Mis compras', 'GET /api/v1/ventas/mis-compras'],
        ['Panel vendedor (productos y órdenes)', 'GET /api/v1/productos · GET /api/v1/ventas · GET /api/v1/ventas/{id}'],
        ['Admin — productos', 'GET/POST /api/v1/productos · PUT /api/v1/productos/{id} · DELETE /api/v1/productos/{sku}'],
        ['Admin — inventario', 'GET /api/v1/productos/todos · PATCH /api/v1/productos/{id}/estado · GET /api/v1/inventario · PUT /api/v1/inventario/{aumentar|disminuir}'],
        ['Admin — usuarios', 'GET/POST /api/v1/usuarios · PUT/DELETE /api/v1/usuarios/{id}'],
        ['Admin — órdenes, clientes y reportes', 'GET /api/v1/ventas · GET /api/v1/ventas/{id} · GET /api/v1/usuarios'],
      ],
      [38, 62]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p('En desarrollo, el frontend usa rutas relativas (/api/v1/…) y el proxy de Vite las reenvía a cada microservicio. ' +
      'El proxy quita el header Origin, así que estas llamadas no dependen de CORS y funcionan desde localhost, la red local o un túnel. ' +
      'CORS sigue configurado en los microservicios (CORS_ORIGINS) para clientes que llamen directo a los puertos. ' +
      'Si el backend no responde, la interfaz muestra un aviso de conexión en lugar de datos locales. ' +
      'Con Docker, el mismo papel lo cumple Nginx en el contenedor frontend (sección 2.1), con las rutas v1 y v2.'),

    h1('8. Base de datos y configuración'),
    p('Los microservicios usan Oracle Autonomous Database con Wallet. La conexión se configura con TNS_ADMIN apuntando a ' +
      'la carpeta del Wallet indicada en ORACLE_WALLET_DIR.'),
    bullet('ddl-auto=update: Hibernate crea y actualiza las tablas a partir de las entidades al iniciar cada servicio.'),
    bullet('Cada microservicio es dueño de sus tablas y no comparte entidades con otros; la comunicación es por API.'),
    bullet('Las columnas version de ventas e inventarios sostienen el bloqueo optimista. Al arrancar, ColumnaVersionInitializer ' +
      'rellena con 0 las filas antiguas y deja la columna como DEFAULT 0 NOT NULL.'),
    bullet('Correo de recuperación (opcional): app.notificacion.modo=correo y las propiedades spring.mail.* (host, port, username, ' +
      'password, smtp.auth y starttls) se definen en el archivo de secretos; secrets.example.properties trae un ejemplo para Gmail ' +
      '(smtp.gmail.com, puerto 587, contraseña de aplicación). Sin esa configuración el enlace queda en el log, como en desarrollo.'),
    bullet('Con Docker, las mismas claves se leen de variables de entorno definidas en .env (que tienen prioridad sobre el archivo ' +
      'de secretos) y ORACLE_WALLET_DIR apunta a /wallet, donde se monta el Wallet en solo lectura.'),
    bullet('Hoy el Wallet y el archivo de secretos están excluidos del repositorio mediante .gitignore. ' + 'La contraseña de la base de datos y la clave JWT que quedaron en el historial de git (commit 1bec55c) ya se cambiaron; el Oracle Wallet, que también quedó en ese historial (se retiró en el commit 21e47ba), está pendiente de rotar.'),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    p('Modelo entidad-relación:', { bold: true }),
    table(
      ['Servicio', 'Tabla', 'Columnas principales', 'Relaciones'],
      [
        ['ms-auth', 'roles', 'id (PK), nombre_rol (único)', '1 rol → N usuarios'],
        ['ms-auth', 'tokens_recuperacion', 'id (PK), usuario_id (sin FK), token_hash (SHA-256, único), creado_en, expira_en, usado_en', 'N tokens → 1 usuario (solo uno vigente)'],
        ['ms-auth', 'usuarios', 'id (PK), nombre, rut (único, sin puntos ni guion), username (único), password (BCrypt), rol_id (FK), dirección, región, comuna, tipo_cliente, teléfono', 'N usuarios → 1 rol'],
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
    p('Pruebas automatizadas (ejecutadas el 15-11-2026, todas aprobadas):'),
    table(
      ['Componente', 'Herramienta', 'Pruebas', 'Qué cubren'],
      [
        ['ms-auth', 'JUnit + MockMvc', '102', 'Login, registro, JWT (incluidos tokens mal formados o expirados → 401), política de contraseñas, RUT (incluida la semilla), roles en usuarios (rol propio y último ADMIN), cambio y recuperación de contraseña, límite de intentos (429), correo de recuperación asíncrono con JavaMailSender simulado, errores'],
        ['ms-catalogoProductos', 'JUnit + MockMvc', '38', 'CRUD, SKU no modificable, catálogo público, activar/desactivar (solo ADMIN), eliminación definitiva (204, 409 con ventas, 404, 502 si falla Feign, 403/401), 404/500'],
        ['ms-inventario', 'JUnit + MockMvc', '32', 'Ajustes de stock con tope 1–500, stock crítico, 409 por concurrencia, solo ADMIN escribe y elimina registros'],
        ['ms-ventas', 'JUnit + MockMvc', '42', 'Precio por tipo de cliente del token, ítems agrupados, topes, dueño de la venta, bloqueo optimista, 403 por rol, productos vendidos solo ADMIN'],
        ['Frontend React', 'Vitest + Testing Library', '136 (30 archivos)', 'Componentes, páginas, sesión, carrito, buscador, RUT, contraseñas, mensaje 429 del login, rol propio bloqueado, botón Eliminar según ventas y llamadas a la API'],
      ],
      [22, 20, 14, 44]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p('Total backend: 214 pruebas JUnit. Pruebas manuales contra Oracle Cloud con el sistema completo en ejecución:', { bold: true }),
    table(
      ['Prueba', 'Resultado esperado', 'Resultado obtenido'],
      [
        ['Login de ADMIN, VENDEDOR y CLIENTE', '200, token de 2 h con rol y tipo de cliente', 'OK'],
        ['Login con clave incorrecta / campos vacíos', '401 / 400', 'OK'],
        ['Cinco logins fallidos del mismo usuario y luego la clave correcta', '401 ×5 y luego 429 con mensaje genérico; el bloqueo queda en el log', 'OK'],
        ['Login correcto antes del quinto fallo', '200 y el contador se reinicia', 'OK'],
        ['Mismo usuario bloqueado, desde otra IP', '200 (el bloqueo es por usuario + IP)', 'OK'],
        ['Cinco fallos con un usuario inexistente', '401 ×5 y luego 429 (se cuenta igual)', 'OK'],
        ['Login de los 3 usuarios semilla', '200; RUT con dígito verificador válido (19.011.022-2, 18.765.432-7, 17.234.567-0)', 'OK'],
        ['Cliente Residencial envía "tipoCliente": "Comercial"', 'Se cobra el precio residencial', 'OK (6.500 en vez de 6.000)'],
        ['Dos confirmaciones simultáneas de la misma venta', 'Una 200 y otra 409; el stock baja una sola vez', 'OK (stock 80 → 79)'],
        ['Producto inexistente / id mal formado', '404 / 400', 'OK'],
        ['VENDEDOR intenta crear una venta, confirmar un pago o modificar inventario o catálogo', '403', 'OK'],
        ['CLIENTE intenta listar todas las ventas', '403', 'OK'],
        ['VENDEDOR lista las órdenes', '200', 'OK'],
        ['ADMIN desactiva y reactiva un producto', 'Sale de la tienda y vuelve; VENDEDOR y CLIENTE reciben 403', 'OK'],
        ['Panel de inventario: producto nuevo sin ventas y CL001 con ventas', 'Eliminar habilitado (rojo) en el nuevo; deshabilitado (gris) en CL001 con "Tiene ventas registradas; puedes desactivarlo"', 'OK'],
        ['ADMIN elimina un producto sin ventas', '204; desaparece del panel, de la tienda y de ms-inventario (404); un segundo DELETE da 404', 'OK'],
        ['ADMIN fuerza DELETE de CL001 (con ventas) por API', '409 "El producto tiene ventas registradas; desactívalo en lugar de eliminarlo"; CL001 sigue existiendo', 'OK'],
        ['VENDEDOR pide productos vendidos o elimina un producto; DELETE sin token', '403 / 403 / 401', 'OK'],
        ['ADMIN intenta quitarse su propio rol (PUT /api/v1/usuarios/{id})', '400 "No puedes cambiar tu propio rol de administrador"; el rol no cambia', 'OK'],
        ['Petición a ms-auth con token mal formado o con la firma alterada', '401 en JSON', 'OK'],
        ['Crear usuario con RUT de dígito verificador inválido', '400; editar un usuario existente sigue funcionando', 'OK'],
        ['Cambiar contraseña con la actual incorrecta / correcta', '400 / 204; la anterior deja de servir', 'OK'],
        ['Recuperar contraseña de cuenta existente e inexistente', 'Misma respuesta 200; el token no viene en la respuesta', 'OK'],
        ['Recuperar contraseña con app.notificacion.modo=log (por defecto) y el starter de correo instalado', 'El enlace sigue solo en el log', 'OK'],
        ['Restablecer con el enlace del log; reusar el enlace', '200 y login con la nueva; reusar da 400', 'OK'],
        ['Cuarta solicitud de recuperación en 15 minutos', 'Misma respuesta, sin enlace nuevo', 'OK'],
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
  numeroFigura = 0;
  // Títulos que no quedan solos al pie de una página (solo en este anexo; el Anexo 2 no cambia)
  const h1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 320, after: 160 } });
  const h2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 240, after: 120 } });
  const children = [
    ...portada('Manual de Usuario', 'Uso del sistema web por rol: Cliente, Vendedor y Administrador', VER_ANEXO4, FECHA_ANEXO4),

    // ---------------------------------------------------------------- 1
    h1('1. Introducción'),
    h2('1.1 Propósito'),
    p('Este manual explica, paso a paso y con capturas reales, cómo usar el sistema web de la Distribuidora de Gas El Volcán: ' +
      'buscar productos, comprar, revisar las compras, administrar la cuenta y operar los paneles de vendedor y administrador.'),
    h2('1.2 Descripción del sistema'),
    p('El Volcán es una tienda en línea de cilindros de gas licuado y accesorios. El sistema está formado por un frontend web (React) ' +
      'y cuatro microservicios (autenticación, catálogo, inventario y ventas) registrados en Eureka. Todo se ejecuta en contenedores ' +
      'Docker y se usa desde el navegador en http://localhost.'),
    p('Hay tres roles:'),
    bullet('Cliente: se registra solo, compra y ve el precio que le corresponde según su tipo (Residencial o Comercial).'),
    bullet('Vendedor: consulta productos y órdenes en modo solo lectura.'),
    bullet('Administrador: gestiona productos, inventario, usuarios y órdenes, y revisa clientes y reportes.'),
    h2('1.3 Cómo usar este manual'),
    bullet('Las secciones 2 y 3 son para quien instala el sistema. Desde la sección 4 en adelante, el manual es para quien lo usa.'),
    bullet('Cada pantalla se muestra como una figura numerada con su título y una nota que explica para qué sirve. Debajo se detallan los pasos numerados.'),
    bullet('Los nombres de botones y menús se escriben entre comillas, tal como aparecen en pantalla (por ejemplo, “Ir a pagar”).'),
    bullet('Los datos que aparecen difuminados en algunas capturas corresponden a otras personas y se ocultaron a propósito. ' +
      'La cuenta “Cliente Demo” es ficticia y se creó solo para este manual.'),

    // ---------------------------------------------------------------- 2
    h1('2. Requisitos de hardware y software'),
    table(
      ['Elemento', 'Requisito'],
      [
        ['Procesador', 'x64 de 4 núcleos o más (recomendado)'],
        ['Memoria RAM', '8 GB en el equipo; los contenedores usan cerca de 2,5 a 3 GB'],
        ['Disco', '5 GB libres para las imágenes de Docker'],
        ['Sistema operativo', 'Windows 10/11 (con WSL 2), macOS o Linux'],
        ['Software', 'Docker Desktop (o Docker Engine con el plugin compose)'],
        ['Base de datos', 'Oracle Autonomous Database en la nube y su Wallet de conexión'],
        ['Navegador', 'Chrome, Edge o Firefox actualizados'],
        ['Red', 'Conexión a Internet (la base de datos está en Oracle Cloud). Puertos 80 y 8761 libres'],
      ],
      [30, 70]
    ),

    // ---------------------------------------------------------------- 3
    h1('3. Instalación y configuración'),
    p('El sistema completo se levanta con Docker Compose desde la raíz del repositorio. El detalle está en docs/DOCKER.md.'),
    h2('3.1 Configuración (una sola vez)'),
    bullet('Descomprimir el Wallet de Oracle en una carpeta del equipo, por ejemplo C:\\Users\\<usuario>\\.elvolcan\\OracleWallet.'),
    bullet('Copiar la plantilla de variables y completarla con los datos entregados por el equipo (no se versionan):'),
    code('Copy-Item .env.example .env'),
    code('notepad .env     # WALLET_HOST_DIR (con /), DB_PASSWORD, JWT_SECRET'),
    h2('3.2 Levantar el sistema'),
    code('docker compose up -d --build   # la primera vez tarda varios minutos'),
    code('docker compose ps              # esperar a que todos queden "healthy"'),
    bullet('Abrir http://localhost en el navegador. Eureka se puede revisar en http://127.0.0.1:8761 (cuatro servicios en estado UP).'),
    h2('3.3 Detener el sistema'),
    code('docker compose down            # detiene y borra los contenedores; las imágenes quedan'),

    // ---------------------------------------------------------------- 4
    h1('4. Comenzando'),
    p('Esta sección muestra la pantalla inicial y cómo crear una cuenta e iniciar sesión.'),
    h2('4.1 Pantalla de inicio'),
    ...figura('01-inicio.png', 'Pantalla de inicio',
      'Es la portada pública del sitio. En la barra superior están el catálogo, el carrito y los accesos a “Login” y “Registro”.',
      ['Abrir http://localhost en el navegador.',
        'Usar el menú superior para ir a “Productos”, “Carrito”, “Login” o “Registro”.',
        'Presionar “Ver productos” para ir directo al catálogo.']),
    h2('4.2 Crear una cuenta (registro)'),
    ...figura('06-registro.png', 'Formulario de registro',
      'Aquí la persona crea su propia cuenta. Siempre queda con el rol CLIENTE, y el tipo de cliente que elija define qué precio verá destacado.',
      ['Presionar “Registro” en el menú superior.',
        'Completar el nombre, el RUN (se formatea solo al salir del campo), el correo, el teléfono y el tipo de cliente.',
        'Indicar la dirección de despacho, la región y la comuna.',
        'Escribir la contraseña dos veces (8 a 64 caracteres, con al menos una letra y un número).',
        'Marcar “Acepto los términos y condiciones” y presionar “Registrarse”.']),
    ...figura('07-registro-error-validacion.png', 'Error de validación en el registro',
      'Si un dato no es válido, el formulario lo indica en un recuadro rojo y no crea la cuenta. En el ejemplo, el dígito verificador del RUT no corresponde.',
      ['Leer el mensaje que aparece sobre el botón “Registrarse”.',
        'Corregir el campo indicado (en el ejemplo, el RUN).',
        'Presionar “Registrarse” de nuevo. Si el correo o el RUN ya existen, el sistema avisa y pide iniciar sesión.']),
    h2('4.3 Iniciar sesión'),
    ...figura('08-login.png', 'Inicio de sesión',
      'Pantalla para entrar con correo y contraseña. Según el rol, el sistema lleva a la tienda (cliente), al panel de vendedor o al panel de administración.',
      ['Presionar “Login” en el menú superior.',
        'Escribir el correo y la contraseña.',
        'Presionar “Ingresar”.',
        'Si olvidó la contraseña, usar el enlace “¿Olvidaste tu contraseña?” (ver la sección 8.2).']),

    // ---------------------------------------------------------------- 5
    h1('5. Uso del sistema: Cliente'),
    h2('5.1 Explorar el catálogo'),
    ...figura('02-catalogo.png', 'Catálogo de productos',
      'Muestra los productos activos con su imagen y sus precios residencial y comercial. Los botones naranjos filtran por categoría.',
      ['Presionar “Productos” en el menú superior.',
        'Elegir una categoría (“Cilindros de Gas”, “Reguladores”, “Mangueras y Conexiones” o “Accesorios”), o “Todos”.',
        'Presionar “Agregar” para sumar el producto al carrito o “Ver detalles” para abrir su ficha.']),
    h2('5.2 Buscar un producto'),
    ...figura('03-buscador-sugerencias.png', 'Buscador con sugerencias',
      'El buscador filtra el catálogo mientras se escribe y muestra una lista de productos sugeridos con su categoría y código.',
      ['Escribir en “Buscar por nombre, categoría o código…” (por ejemplo, “cil”).',
        'Elegir una sugerencia con el mouse, o recorrer la lista con las flechas ↑/↓ y presionar Enter para abrir su detalle (Esc cierra la lista).',
        'Presionar la X para borrar el texto y volver a ver todo el catálogo.']),
    h2('5.3 Ver el detalle de un producto'),
    ...figura('04-detalle-producto.png', 'Detalle de producto',
      'Ficha con la descripción, la categoría, el código y los dos precios del producto.',
      ['En el catálogo, presionar “Ver detalles”.',
        'Revisar la información del producto.',
        'Presionar “Agregar al carrito”, o “Volver” para regresar al catálogo.']),
    h2('5.4 Precio según el tipo de cliente (“Tu precio”)'),
    ...figura('12-catalogo-tu-precio.png', 'Catálogo con “Tu precio” destacado',
      'Con la sesión iniciada, el catálogo destaca en negrita y con la etiqueta “Tu precio” el valor que corresponde al tipo de cliente. ' +
      'El otro precio queda en gris. En el ejemplo, el cliente es Comercial.',
      ['Iniciar sesión como cliente.',
        'Abrir “Productos”.',
        'Ubicar la etiqueta amarilla “Tu precio”: ese es el valor que se cobrará en la compra.']),
    h2('5.5 Revisar el carrito'),
    ...figura('05-carrito.png', 'Carrito de compras',
      'Lista los productos agregados con su precio unitario y subtotal. El contador del menú muestra el total de unidades.',
      ['Presionar “Carrito” en el menú superior.',
        'Usar “+” y “-” para cambiar la cantidad, o “Quitar” para sacar un producto.',
        'Presionar “Ir a pagar” (si no hay sesión iniciada, el sistema pide iniciarla).']),
    h2('5.6 Finalizar la compra'),
    ...figura('13-checkout.png', 'Finalizar la compra',
      'Resume el pedido con la tarifa del cliente y pide confirmar los datos de entrega y el método de pago.',
      ['Revisar los productos y el “Total a pagar”.',
        'Confirmar o corregir la dirección de despacho y la comuna.',
        'Elegir el método de pago: “Efectivo” o “Tarjeta de débito / crédito”.',
        'Presionar “Confirmar pedido”. El sistema valida el stock, registra la venta y confirma el pago.']),
    ...figura('14-compra-confirmada.png', 'Compra confirmada',
      'Aparece cuando el pedido quedó registrado y pagado. Muestra el número de orden, el total y la dirección de despacho.',
      ['Anotar el número de orden (por ejemplo, ORD-121).',
        'Presionar “Ver mis compras” para revisar el historial, o “Seguir comprando”.']),
    p('Si no hay stock suficiente, la compra no se registra y se muestra el aviso correspondiente. Si el pago no se confirma, ' +
      'la orden queda “Pendiente de pago” y se puede reintentar.'),
    h2('5.7 Mis compras'),
    ...figura('15-mis-compras.png', 'Mis compras',
      'Historial de compras del cliente que inició sesión, con los productos, el despacho, el método de pago, el total y el estado.',
      ['Abrir el menú de la cuenta (“Hola, <nombre>”) en la esquina superior derecha.',
        'Elegir “Mis compras”.',
        'Revisar el estado de cada orden (“Pagada” o “Pendiente de pago”).']),
    h2('5.8 Cambiar la contraseña'),
    ...figura('16-cambiar-contrasena.png', 'Cambiar contraseña',
      'Permite cambiar la contraseña con la sesión iniciada. Está disponible para los tres roles: los clientes la abren desde el menú de la cuenta, ' +
      'y el vendedor y el administrador desde el enlace de su panel.',
      ['Abrir el menú de la cuenta y elegir “Cambiar contraseña”.',
        'Escribir la contraseña actual.',
        'Escribir la nueva contraseña dos veces (8 a 64 caracteres, con al menos una letra y un número). El ícono del ojo permite verla.',
        'Presionar “Cambiar contraseña”. Desde ese momento la contraseña anterior deja de funcionar.']),

    // ---------------------------------------------------------------- 6
    h1('6. Uso del sistema: Vendedor'),
    p('El rol VENDEDOR es de solo lectura: puede consultar, pero no crear ni modificar productos, inventario, usuarios ni ventas.'),
    ...figura('17-vendedor-productos.png', 'Panel de vendedor: productos',
      'Al iniciar sesión, el vendedor entra a su panel. La etiqueta “Vendedor - solo lectura” recuerda que no puede editar.',
      ['Iniciar sesión con una cuenta de vendedor.',
        'Revisar el listado con el código, la categoría y los precios.',
        'Presionar “Ver detalle” para ver la ficha de un producto.']),
    ...figura('18-vendedor-ordenes.png', 'Panel de vendedor: órdenes',
      'Lista todas las órdenes con la fecha, el cliente, la comuna, el total y el estado.',
      ['Presionar “Órdenes” en el menú lateral.',
        'Ubicar la orden por su número o su fecha.',
        'Presionar “Ver detalle”.']),
    ...figura('19-vendedor-detalle-orden.png', 'Detalle de una orden (solo lectura)',
      'Muestra el cliente, la fecha, el despacho, el método de pago y los productos con sus subtotales. No tiene botones para modificar.',
      ['Revisar los datos de la orden.',
        'Presionar “← Volver a órdenes” para regresar al listado.']),

    // ---------------------------------------------------------------- 7
    h1('7. Uso del sistema: Administrador'),
    h2('7.1 Dashboard'),
    ...figura('20-admin-dashboard.png', 'Dashboard de administración',
      'Resume los ingresos de las órdenes pagadas, el total de órdenes, las pendientes de pago y el stock crítico. También muestra las últimas órdenes y el nivel de los cilindros.',
      ['Iniciar sesión con una cuenta de administrador.',
        'Revisar los indicadores de la parte superior.',
        'Presionar “Ver todas” para abrir el listado completo de órdenes.']),
    h2('7.2 Productos e inventario: editar, activar, desactivar y eliminar'),
    ...figura('21-admin-inventario.png', 'Inventario con las acciones por producto',
      'Cada producto tiene tres acciones. “Editar” abre el formulario de edición. “Desactivar” oculta el producto de la tienda sin borrarlo, y “Activar” lo vuelve a mostrar. ' +
      '“Eliminar” lo borra de forma definitiva y solo está disponible si el producto no tiene ventas: si las tiene, el botón queda gris ' +
      '(por ejemplo, CL001 o RG001), y al pasar el mouse se lee “Tiene ventas registradas; puedes desactivarlo”. ' +
      'Los productos inactivos se ven atenuados y con la etiqueta “Inactivo” (en el ejemplo, AC003).',
      ['Presionar “Inventario” en el menú lateral.',
        'Para ocultar un producto de la tienda, presionar “Desactivar” y confirmar. Para volver a mostrarlo, presionar “Activar”.',
        'Para borrar un producto sin ventas, presionar “Eliminar” y confirmar (esta acción no se puede deshacer).',
        'Para agregar un producto, completar el formulario “Nuevo producto” que está bajo la tabla.']),
    ...figura('22-admin-editar-producto.png', 'Edición de un producto',
      'Permite cambiar el nombre, los precios residencial y comercial, el stock, la categoría, la descripción y la imagen. El código no se puede editar.',
      ['En el inventario, presionar “Editar” en la fila del producto.',
        'Modificar los campos necesarios.',
        'Presionar “Guardar cambios”, o la X para cerrar sin guardar.']),
    h2('7.3 Usuarios'),
    ...figura('23-admin-usuarios.png', 'Gestión de usuarios',
      'Lista las cuentas con el RUN, el nombre, el correo, el rol y la comuna. El administrador no puede eliminar su propia cuenta ni quitarse el rol de administrador: ' +
      'el botón de eliminar de su fila queda deshabilitado.',
      ['Presionar “Usuarios” en el menú lateral.',
        'Usar el ícono del lápiz para editar un usuario, o el del basurero para eliminarlo (pide confirmación).',
        'Presionar “Nuevo usuario” para crear una cuenta.']),
    ...figura('24-admin-nuevo-usuario-rut.png', 'Nuevo usuario con el RUT formateado',
      'Formulario para crear cuentas de cualquier rol. El RUN se puede escribir con o sin puntos y guion: al salir del campo se formatea solo ' +
      '(por ejemplo, 333333333 queda como 33.333.333-3), y se valida su dígito verificador.',
      ['Presionar “Nuevo usuario”.',
        'Completar el nombre, el correo (que será su usuario) y el RUN.',
        'Escribir la contraseña dos veces y elegir el rol (ADMIN, VENDEDOR o CLIENTE).',
        'Completar los datos opcionales (teléfono, dirección, región y comuna) y guardar.']),
    h2('7.4 Órdenes'),
    ...figura('25-admin-ordenes.png', 'Listado de órdenes',
      'Muestra el total de órdenes, las pendientes de pago, las pagadas y los ingresos, junto con el listado completo y la distribución por comuna.',
      ['Presionar “Órdenes” en el menú lateral.',
        'Presionar el número de una orden para ver su detalle.']),
    p('En el menú lateral también están “Clientes” (los clientes registrados y sus compras) y “Reportes” (las ventas, los productos más vendidos, ' +
      'los ingresos y el stock crítico, calculados con los datos reales de las APIs).'),
    h2('7.5 Ver tienda'),
    ...figura('26-admin-ver-tienda.png', 'Ver tienda desde el panel',
      'El enlace “Ver tienda” abre el sitio público sin cerrar la sesión. Desde el menú de la cuenta se puede volver al “Panel Admin”.',
      ['Presionar “Ver tienda” en el menú lateral.',
        'Navegar por la tienda como lo haría un cliente.',
        'Abrir el menú “Hola, <nombre>” y elegir “Panel Admin” para volver.']),

    // ---------------------------------------------------------------- 8
    h1('8. Seguridad de la cuenta'),
    h2('8.1 Límite de intentos de inicio de sesión'),
    ...figura('09-login-demasiados-intentos.png', 'Aviso “Demasiados intentos”',
      'Para proteger las cuentas, después de 5 intentos fallidos con el mismo correo desde el mismo equipo (o 20 desde la misma red) en 15 minutos, ' +
      'el sistema bloquea nuevos intentos durante 15 minutos. El mensaje es igual aunque el correo no exista, para no revelar qué cuentas hay.',
      ['Esperar 15 minutos antes de volver a intentar.',
        'Verificar que el correo y la contraseña estén bien escritos.',
        'Si no recuerda la contraseña, usar “¿Olvidaste tu contraseña?”.']),
    h2('8.2 Recuperar la contraseña'),
    ...figura('10-recuperar-contrasena.png', '¿Olvidaste tu contraseña?',
      'Permite pedir un enlace para crear una nueva contraseña. La respuesta es la misma exista o no la cuenta, para no revelar qué correos están registrados.',
      ['En la pantalla de inicio de sesión, presionar “¿Olvidaste tu contraseña?”.',
        'Escribir el correo de la cuenta y presionar “Enviar enlace”.',
        'Revisar el correo: el enlace es de un solo uso y vence en 15 minutos. Se aceptan hasta 3 solicitudes cada 15 minutos.']),
    ...figura('11-restablecer-contrasena.png', 'Restablecer la contraseña',
      'Pantalla que se abre desde el enlace recibido. Si el enlace ya se usó o venció, el sistema lo indica y hay que pedir uno nuevo.',
      ['Abrir el enlace recibido por correo.',
        'Escribir la nueva contraseña dos veces (8 a 64 caracteres, con al menos una letra y un número).',
        'Confirmar e iniciar sesión con la nueva contraseña.']),

    // ---------------------------------------------------------------- 9
    h1('9. Credenciales de prueba'),
    p('Cuentas semilla para revisar cada rol en el entorno de evaluación:'),
    table(
      ['Rol', 'Usuario', 'Contraseña'],
      [
        ['ADMIN', 'admin@duoc.cl', 'Admin123'],
        ['VENDEDOR', 'vendedor@elvolcan.cl', 'Vendedor123'],
        ['CLIENTE', 'cliente@elvolcan.cl', 'Cliente123'],
      ],
      [26, 42, 32]
    ),

    // ---------------------------------------------------------------- 10
    h1('10. Mensajes y solución de problemas'),
    table(
      ['Situación', 'Causa probable', 'Solución'],
      [
        ['“Credenciales incorrectas”', 'Usuario o contraseña inválidos', 'Verificar los datos e intentar nuevamente'],
        ['“Demasiados intentos. Intenta nuevamente en unos minutos.”', '5 o más intentos fallidos en 15 minutos', 'Esperar 15 minutos o recuperar la contraseña'],
        ['Recuadro rojo en el registro (por ejemplo, “El dígito verificador del RUT no es válido”)', 'Un dato no cumple la validación', 'Corregir el campo indicado y volver a enviar'],
        ['“Ya existe una cuenta con ese correo o RUN”', 'La cuenta ya fue creada', 'Iniciar sesión o recuperar la contraseña'],
        ['El enlace de recuperación no funciona', 'Ya se usó o pasaron más de 15 minutos', 'Pedir un enlace nuevo'],
        ['Error de stock insuficiente', 'Cantidad mayor al stock disponible', 'Ajustar la cantidad o reponer stock'],
        ['“Eliminar” en gris en el inventario', 'El producto tiene ventas registradas', 'Usar “Desactivar” para ocultarlo de la tienda'],
        ['Aviso de conexión o página sin datos', 'Un contenedor no está “healthy”', 'Revisar docker compose ps y docker compose logs <servicio>'],
        ['El sitio no abre en http://localhost', 'El puerto 80 está ocupado o Docker está detenido', 'Iniciar Docker Desktop y liberar el puerto 80'],
        ['403 al operar', 'El rol no tiene permiso', 'Usar una cuenta con el rol adecuado'],
      ],
      [34, 30, 36]
    ),
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
