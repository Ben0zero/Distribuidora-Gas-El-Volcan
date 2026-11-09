const API_AUTH = 'http://localhost:8081/api/v1/auth'
const API_CATALOGO = 'http://localhost:8082/api/v1/productos'
const API_INVENTARIO = 'http://localhost:8084/api/v1/inventario'
const API_VENTAS = 'http://localhost:8086/api/v1/ventas'

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
  if (!res.ok) throw new Error('Error al registrar')
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

export async function obtenerInventario() {
  const res = await fetch(API_INVENTARIO, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error al obtener inventario')
  return res.json()
}

export async function obtenerStockPorSku(sku) {
  const res = await fetch(`${API_INVENTARIO}/${sku}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error al obtener stock')
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

export async function listarVentas() {
  const res = await fetch(API_VENTAS, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error al obtener ventas')
  return res.json()
}
