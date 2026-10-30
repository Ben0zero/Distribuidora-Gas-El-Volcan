// Lógica pura del carrito. Todas las funciones reciben el carrito actual
// y devuelven uno NUEVO (sin mutar), lo que las hace fáciles de probar.
// El carrito es un arreglo de { id, cantidad }.

export function agregarItem(carrito, id) {
  const existente = carrito.find((item) => item.id === id)
  if (existente) {
    return carrito.map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item))
  }
  return [...carrito, { id, cantidad: 1 }]
}

export function incrementarItem(carrito, id) {
  return carrito.map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item))
}

export function decrementarItem(carrito, id) {
  return carrito
    .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item))
    .filter((item) => item.cantidad > 0)
}

export function eliminarItem(carrito, id) {
  return carrito.filter((item) => item.id !== id)
}

export function contarItems(carrito) {
  return carrito.reduce((suma, item) => suma + (Number(item.cantidad) || 0), 0)
}

// Une cada línea del carrito con el producto completo del catálogo.
// Descarta ids que ya no existan (defensa ante datos viejos en localStorage).
export function obtenerItemsCompletos(carrito, productos) {
  return carrito
    .map((item) => ({ ...item, producto: productos.find((p) => p.id === item.id) }))
    .filter((item) => item.producto)
}

export function calcularTotal(carrito, productos, tipo = 'residencial') {
  return obtenerItemsCompletos(carrito, productos).reduce(
    (suma, item) => suma + item.producto[tipo] * item.cantidad,
    0,
  )
}
