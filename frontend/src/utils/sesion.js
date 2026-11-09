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

// Ruta inicial según el rol (el panel del Vendedor se agrega más adelante)
export function rutaInicial(rol) {
  return rol === ROLES.ADMIN ? '/admin' : '/'
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
