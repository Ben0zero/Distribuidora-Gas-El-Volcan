// Utilidades de validación y datos compartidos.
// Se extraen aquí (en vez de vivir dentro de cada página) para poder
// reutilizarlas en Login, Registro, Contacto y Admin, y para poder
// probarlas unitariamente de forma aislada (ver src/**/*.spec.jsx).

// Regiones y sus comunas (selectores dependientes Región -> Comuna).
export const REGIONES = [
  {
    nombre: 'Región de Ñuble',
    comunas: ['Chillán', 'Chillán Viejo', 'El Carmen', 'Pinto', 'San Ignacio', 'Bulnes', 'Quillón'],
  },
]

// Categorías del catálogo (usadas en Productos y en el admin).
export const CATEGORIAS = ['Cilindros de Gas', 'Reguladores', 'Mangueras y Conexiones', 'Accesorios']

// Administrador por defecto (sin backend todavía).
export const ADMIN_DEFAULT = {
  fecha: '2026-05-04',
  run: '19011022',
  nombre: 'Juan Pérez',
  correo: 'admin@duoc.cl',
  contrasena: 'Admin123',
  rol: 'Administrador',
  estado: 'Activo',
}

export const CLAVES = {
  carrito: 'carrito',
  usuarios: 'usuarios',
  sesion: 'sesion',
  productos: 'productos',
  edicionesProductos: 'edicionesProductos',
  ordenes: 'ordenes',
  solicitudes: 'solicitudes',
}

// --- Validaciones puras (sin DOM) ---

export function validarRun(valor) {
  return /^\d{7,9}$/.test(String(valor).replace(/\s/g, ''))
}

export function validarTelefono(valor) {
  const limpio = String(valor).replace(/[\s()-]/g, '')
  return /^\+?\d{9,12}$/.test(limpio)
}

export function validarCorreo(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor))
}

export function correoDominioPermitido(valor) {
  return /^[^\s@]+@(profesor\.duoc\.cl|duoc\.cl|gmail\.com)$/i.test(String(valor))
}

export function formatearPrecio(n) {
  return '$' + Number(n).toLocaleString('es-CL')
}

// Valida todo el formulario de Registro y devuelve el primer mensaje de error
// encontrado, o '' si todo está correcto.
export function validarFormularioRegistro(datos) {
  const { nombre, run, correo, telefono, direccion, region, comuna, password, confirmar, terminos } = datos

  if (!nombre) return 'Ingresa tu nombre completo'
  if (nombre.length > 100) return 'El nombre no puede superar los 100 caracteres'
  if (!validarRun(run)) return 'El RUN debe tener entre 7 y 9 dígitos, sin puntos y sin guion'
  if (!correoDominioPermitido(correo)) return 'El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com'
  if (!validarTelefono(telefono)) return 'Ingresa un teléfono válido (ej: +56 9 1234 5678)'
  if (!direccion) return 'Ingresa tu dirección de despacho'
  if (!region) return 'Selecciona tu región'
  if (!comuna) return 'Selecciona tu comuna de despacho'
  if (String(password).length < 4 || String(password).length > 10)
    return 'La contraseña debe tener entre 4 y 10 caracteres'
  if (password !== confirmar) return 'Las contraseñas no coinciden'
  if (!terminos) return 'Debes aceptar los términos y condiciones'

  return ''
}

// Valida los datos de contacto del formulario público.
export function validarFormularioContacto(datos) {
  const { nombre, correo, telefono, asunto, mensaje } = datos

  if (!nombre) return 'Ingresa tu nombre'
  if (nombre.length > 100) return 'El nombre no puede superar los 100 caracteres'
  if (!validarCorreo(correo)) return 'Ingresa un correo válido'
  if (telefono && !validarTelefono(telefono)) return 'Ingresa un teléfono válido'
  if (!asunto || asunto === 'Seleccione una opción') return 'Selecciona un asunto'
  if (!mensaje) return 'Escribe tu mensaje'
  if (mensaje.length > 500) return 'El mensaje no puede superar los 500 caracteres'

  return ''
}

// Helpers de lectura/escritura de localStorage (tolerantes a errores).
export function leerLista(clave) {
  try {
    const valor = JSON.parse(localStorage.getItem(clave))
    return Array.isArray(valor) ? valor : []
  } catch {
    return []
  }
}

export function leerObjeto(clave) {
  try {
    const valor = JSON.parse(localStorage.getItem(clave))
    return valor && typeof valor === 'object' ? valor : null
  } catch {
    return null
  }
}
