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

export async function login(username, password) {
  const res = await fetch(`${API_AUTH}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) throw new Error('Credenciales incorrectas')
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

export async function obtenerProductoPorId(id) {
  const res = await fetch(`${API_CATALOGO}/${id}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error al obtener producto')
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
  if (!res.ok) throw new Error('Error al crear venta')
  return res.json()
}

export async function confirmarPago(ventaId) {
  const res = await fetch(`${API_VENTAS}/${ventaId}/confirmar`, {
    method: 'PUT',
    headers: authHeaders()
  })
  if (!res.ok) throw new Error('Error al confirmar pago')
  return res.json()
}

export async function misCompras() {
  const res = await fetch(`${API_VENTAS}/mis-compras`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error al obtener mis compras')
  return res.json()
}

export async function listarVentas() {
  const res = await fetch(API_VENTAS, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error al obtener ventas')
  return res.json()
}
