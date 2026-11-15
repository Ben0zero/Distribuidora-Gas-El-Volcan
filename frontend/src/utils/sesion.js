// Sesión del usuario: se arma a partir de la respuesta de POST /api/v1/auth/login.
// Lógica pura (sin React) para poder probarla fácilmente.

// Rol del backend (ms-auth) -> etiqueta que usa la interfaz
export const ROLES = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  CLIENTE: 'Cliente',
}

export function rolDesdeApi(nombreRol) {
  const clave = String(nombreRol || '').toUpperCase().replace(/^ROLE_/, '')
  return ROLES[clave] || ROLES.CLIENTE
}

// Ruta inicial según el rol
export function rutaInicial(rol) {
  if (rol === ROLES.ADMIN) return '/admin'
  if (rol === ROLES.VENDEDOR) return '/vendedor'
  return '/'
}

// Lee el payload de un JWT (sin verificar la firma: eso lo hace el backend en cada petición).
// Devuelve null si el token no tiene formato JWT.
export function leerPayloadJwt(token) {
  try {
    const parte = String(token).split('.')[1]
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

// true si el token falta, no es un JWT válido o ya pasó su fecha de expiración (exp en segundos)
export function tokenExpirado(token, ahoraMs = Date.now()) {
  const payload = leerPayloadJwt(token)
  if (!payload) return true
  return typeof payload.exp === 'number' && payload.exp * 1000 <= ahoraMs
}

// Evento que avisa a App (dueño del estado del carrito) que la sesión terminó.
export const EVENTO_SESION_CERRADA = 'elvolcan:sesion-cerrada'

// Borra la sesión y el carrito guardados: el carrito de un usuario no debe quedar
// a la vista del siguiente que use el mismo navegador (ni siquiera de un admin).
function borrarSesionYCarrito() {
  localStorage.removeItem('sesion')
  localStorage.removeItem('carrito')
}

// Sesión vigente (con token no expirado) o null. Si el token expiró, borra la sesión
// guardada y el carrito, igual que al cerrar sesión.
export function sesionActiva() {
  let sesion = null
  try {
    sesion = JSON.parse(localStorage.getItem('sesion'))
  } catch {
    sesion = null
  }
  if (!sesion?.token) return null
  if (tokenExpirado(sesion.token)) {
    borrarSesionYCarrito()
    // Diferido: sesionActiva() se llama mientras React dibuja, y App no puede
    // actualizar su estado en medio del render de otro componente.
    setTimeout(() => window.dispatchEvent(new Event(EVENTO_SESION_CERRADA)), 0)
    return null
  }
  return sesion
}

// Precio que corresponde a la sesión: 'comercial' o 'residencial' según el tipo de cliente
// (que también viene en el JWT y es el que usa ms-ventas al cobrar). Sin sesión: null.
export function tipoPrecioSesion(sesion = sesionActiva()) {
  if (!sesion) return null
  return String(sesion.tipoCliente || '').toLowerCase() === 'comercial' ? 'comercial' : 'residencial'
}

// Único cierre de sesión (tienda, Login, panel admin y panel vendedor): borra la sesión
// y el carrito, y avisa a App para que vacíe también el estado en memoria.
export function cerrarSesion() {
  borrarSesionYCarrito()
  window.dispatchEvent(new Event(EVENTO_SESION_CERRADA))
}

export function sesionDesdeLogin(res) {
  return {
    id: res.id,
    nombre: res.nombre || res.username,
    correo: res.username,
    email: res.username,
    rol: rolDesdeApi(res.nombreRol),
    tipoCliente: res.tipoCliente || 'Residencial',
    direccion: res.direccion || '',
    comuna: res.comuna || '',
    region: res.region || '',
    telefono: res.telefono || '',
    token: res.token,
  }
}
