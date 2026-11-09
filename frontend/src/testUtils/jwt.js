// Solo para pruebas: arma un JWT con el formato real (header.payload.firma) y una
// expiración relativa en segundos (negativa = ya expirado). La firma es falsa:
// el frontend solo lee "exp"; la firma la valida el backend.
function base64url(objeto) {
  return btoa(JSON.stringify(objeto)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function jwtDePrueba({ sub = 'usuario@elvolcan.cl', rol = 'ROLE_CLIENTE', segundos = 3600 } = {}) {
  const exp = Math.floor(Date.now() / 1000) + segundos
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ sub, rol, exp })}.firma-de-prueba`
}

// Guarda una sesión como la que deja el Login
export function guardarSesion({ rol = 'Cliente', nombre = 'Usuario de prueba', segundos = 3600 } = {}) {
  const sesion = { nombre, rol, token: jwtDePrueba({ segundos }) }
  localStorage.setItem('sesion', JSON.stringify(sesion))
  return sesion
}
