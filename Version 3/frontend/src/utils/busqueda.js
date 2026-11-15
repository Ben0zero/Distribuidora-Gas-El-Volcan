// Búsqueda del catálogo: funciones puras (sin React) para poder probarlas aisladas.
// Reglas:
//  - No distingue mayúsculas ni tildes ("conexion" encuentra "Conexiones").
//  - Busca en nombre, categoría y código (no en la descripción: evita ruido).
//  - Se combina con el filtro por categoría.
//  - Sugiere productos ("cil" -> "Cilindro GLP 5 kg") para ir a su detalle.

const DIACRITICOS = /[\u0300-\u036f]/g

// Texto comparable: minúsculas, sin tildes, sin espacios repetidos.
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const CAMPOS_BUSQUEDA = ['nombre', 'categoria', 'codigo']

// true si el producto contiene el término en alguno de sus campos.
export function coincideProducto(producto, termino) {
  const buscado = normalizar(termino)
  if (!buscado) return true
  return CAMPOS_BUSQUEDA.some((campo) => normalizar(producto?.[campo]).includes(buscado))
}

// Filtra por categoría (exacta) y por texto libre. Sin filtros devuelve todo.
export function filtrarProductos(productos, { categoria = null, texto = '' } = {}) {
  return (productos || []).filter(
    (producto) => (!categoria || producto.categoria === categoria) && coincideProducto(producto, texto),
  )
}

// Productos sugeridos mientras se escribe (desde 2 caracteres), para ir directo a su detalle.
// Orden: primero los que tienen el texto al inicio del nombre, luego por posición
// de la coincidencia en el nombre y, al final, por nombre. Máximo `limite` productos.
export function productosSugeridos(productos, texto, limite = 6) {
  const buscado = normalizar(texto)
  if (buscado.length < 2) return []

  const posicion = (producto) => {
    const enNombre = normalizar(producto.nombre).indexOf(buscado)
    return enNombre === -1 ? Number.MAX_SAFE_INTEGER : enNombre
  }

  return (productos || [])
    .filter((producto) => coincideProducto(producto, texto))
    .sort((a, b) => posicion(a) - posicion(b) || String(a.nombre).localeCompare(String(b.nombre), 'es', { numeric: true }))
    .slice(0, limite)
}
