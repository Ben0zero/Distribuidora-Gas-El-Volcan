// Base de la API. En desarrollo queda vacía: Vite redirige /api/v1/... al
// microservicio que corresponde (ver vite.config.js). Así el frontend funciona
// igual en localhost, en la red local (http://<IP>:5173) o detrás de un túnel,
// sin depender de CORS ni de URLs fijas. Para apuntar a otro backend se define
// VITE_API_BASE (ej. http://192.168.1.18:8080).
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

const API_AUTH = `${API_BASE}/api/v1/auth`
const API_CATALOGO = `${API_BASE}/api/v1/productos`
const API_INVENTARIO = `${API_BASE}/api/v1/inventario`
const API_VENTAS = `${API_BASE}/api/v1/ventas`
const API_USUARIOS = `${API_BASE}/api/v1/usuarios`

export function getToken() {
  try {
    const sesion = JSON.parse(localStorage.getItem('sesion'))
    return sesion?.token || null
  } catch {
    return null
  }
}

export function authHeaders() {
  const token = getToken()
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

// Error de la API con su código HTTP. Permite distinguir "credenciales malas" (401)
// de "el servicio no responde" (fetch lanza TypeError y no hay status).
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Lanza un ApiError con el mensaje que devuelve el backend (ms-ventas responde
// { status, error, message, validationErrors }; ms-auth responde { mensaje }).
async function lanzarError(res, porDefecto) {
  let mensaje = porDefecto
  try {
    const cuerpo = await res.json()
    const validaciones = cuerpo.validationErrors ? Object.values(cuerpo.validationErrors).join('. ') : ''
    mensaje = validaciones || cuerpo.message || cuerpo.mensaje || porDefecto
  } catch {
    // respuesta sin JSON: se usa el mensaje por defecto
  }
  throw new ApiError(mensaje, res.status)
}

// Devuelve { id, nombre, username, nombreRol, tipoCliente, direccion, comuna, region, telefono, token }
export async function login(username, password) {
  const res = await fetch(`${API_AUTH}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) {
    throw new ApiError(res.status === 401 ? 'Credenciales incorrectas' : 'Error al iniciar sesión', res.status)
  }
  return res.json()
}

export async function register(data) {
  const res = await fetch(`${API_AUTH}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  // 409 = RUT o correo ya registrado; 400 = datos inválidos (mensaje del backend)
  if (!res.ok) await lanzarError(res, 'No se pudo crear la cuenta')
  return res.json()
}

export async function obtenerProductos() {
  const res = await fetch(API_CATALOGO)
  if (!res.ok) throw new Error('Error al obtener productos')
  return res.json()
}

// GET /api/v1/productos/id/{id} es público (la ruta /{sku} busca por código, no por id)
export async function obtenerProductoPorId(id) {
  const res = await fetch(`${API_CATALOGO}/id/${id}`)
  if (!res.ok) throw new ApiError('Producto no encontrado', res.status)
  return res.json()
}

// ---------- Administración del catálogo (requiere token de ADMIN) ----------

export async function crearProducto(producto) {
  const res = await fetch(API_CATALOGO, { method: 'POST', headers: authHeaders(), body: JSON.stringify(producto) })
  if (!res.ok) await lanzarError(res, 'No se pudo crear el producto')
  return res.json()
}

export async function actualizarProducto(id, producto) {
  const res = await fetch(`${API_CATALOGO}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(producto) })
  if (!res.ok) await lanzarError(res, 'No se pudo actualizar el producto')
  return res.json()
}

// Borrado lógico: el producto deja de mostrarse en la tienda
export async function desactivarProducto(sku) {
  const res = await fetch(`${API_CATALOGO}/${encodeURIComponent(sku)}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) await lanzarError(res, 'No se pudo eliminar el producto')
}

// ---------- Inventario ----------

export async function obtenerInventario() {
  const res = await fetch(API_INVENTARIO, { headers: authHeaders() })
  if (!res.ok) await lanzarError(res, 'No se pudo obtener el inventario')
  return res.json()
}

// operacion: 'aumentar' | 'disminuir'; cantidad: unidades a sumar o restar (ADMIN)
export async function ajustarStock(operacion, sku, cantidad) {
  const res = await fetch(`${API_INVENTARIO}/${operacion}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ sku, stockActual: cantidad }),
  })
  if (!res.ok) await lanzarError(res, 'No se pudo ajustar el stock')
  return res.json()
}

// Stock de un producto por SKU (requiere token: ADMIN, VENDEDOR o CLIENTE)
export async function obtenerStockPorSku(sku) {
  const res = await fetch(`${API_INVENTARIO}/${encodeURIComponent(sku)}`, { headers: authHeaders() })
  if (!res.ok) await lanzarError(res, 'No se pudo obtener el stock')
  return res.json()
}

export async function crearVenta(venta) {
  const res = await fetch(API_VENTAS, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(venta)
  })
  if (!res.ok) await lanzarError(res, 'No se pudo crear la venta')
  return res.json()
}

export async function confirmarPago(ventaId) {
  const res = await fetch(`${API_VENTAS}/${ventaId}/confirmar`, {
    method: 'PUT',
    headers: authHeaders()
  })
  if (!res.ok) await lanzarError(res, 'No se pudo confirmar el pago')
  return res.json()
}

export async function misCompras() {
  const res = await fetch(`${API_VENTAS}/mis-compras`, { headers: authHeaders() })
  if (!res.ok) await lanzarError(res, 'No se pudieron obtener tus compras')
  return res.json()
}

// Todas las ventas (ADMIN y VENDEDOR)
export async function listarVentas() {
  const res = await fetch(API_VENTAS, { headers: authHeaders() })
  if (!res.ok) await lanzarError(res, 'No se pudieron obtener las órdenes')
  return res.json()
}

// Detalle de una venta: ADMIN y VENDEDOR ven cualquiera; un CLIENTE solo las suyas
export async function obtenerVenta(id) {
  const res = await fetch(`${API_VENTAS}/${id}`, { headers: authHeaders() })
  if (!res.ok) await lanzarError(res, 'No se pudo obtener la orden')
  return res.json()
}

// ---------- Usuarios (solo ADMIN) ----------

// Lista de usuarios de ms-auth (UsuarioResponseDTO): { id, nombre, rut, username, nombreRol, comuna, tipoCliente, ... }
export async function listarUsuarios() {
  const res = await fetch(API_USUARIOS, { headers: authHeaders() })
  if (!res.ok) await lanzarError(res, 'No se pudieron obtener los usuarios')
  return res.json()
}

// Alta de usuario por el ADMIN (UsuarioAdminRequestDTO: nombre, rut, username, password, nombreRol, ...)
// 409 = RUT o correo ya registrado; 400 = datos inválidos
export async function crearUsuario(usuario) {
  const res = await fetch(API_USUARIOS, { method: 'POST', headers: authHeaders(), body: JSON.stringify(usuario) })
  if (!res.ok) await lanzarError(res, 'No se pudo crear el usuario')
  return res.json()
}

// Detalle de un usuario (para precargar el formulario de edición)
export async function obtenerUsuario(id) {
  const res = await fetch(`${API_USUARIOS}/${id}`, { headers: authHeaders() })
  if (!res.ok) await lanzarError(res, 'No se pudo obtener el usuario')
  return res.json()
}

// Edición por el ADMIN (PUT): si password viene vacío, el backend conserva la actual
export async function actualizarUsuario(id, usuario) {
  const res = await fetch(`${API_USUARIOS}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(usuario) })
  if (!res.ok) await lanzarError(res, 'No se pudo actualizar el usuario')
  return res.json()
}

// Baja de usuario (DELETE). El backend rechaza que un ADMIN borre su propia cuenta
export async function eliminarUsuario(id) {
  const res = await fetch(`${API_USUARIOS}/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) await lanzarError(res, 'No se pudo eliminar el usuario')
}
