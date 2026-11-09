// Formato común de las ventas (órdenes) que entrega ms-ventas.
// Lo usan "Mis compras" (cliente) y el panel del Vendedor.

export const ESTADOS_VENTA = {
  PAGADA: { texto: 'Pagada', color: 'success' },
  PENDIENTE_PAGO: { texto: 'Pendiente de pago', color: 'warning' },
  CANCELADA: { texto: 'Cancelada', color: 'secondary' },
}

export function estadoVenta(estado) {
  return ESTADOS_VENTA[estado] || { texto: estado || '-', color: 'light' }
}

export function formatearFecha(valor) {
  return valor ? new Date(valor).toLocaleDateString('es-CL') : '-'
}

export function numeroOrden(id) {
  return `ORD-${id}`
}

// Nombre del producto de una línea de venta, buscándolo en el catálogo (ids numéricos de la API)
export function nombreProducto(productos, productoId) {
  return productos.find((p) => p.id === productoId)?.nombre || `Producto #${productoId}`
}
