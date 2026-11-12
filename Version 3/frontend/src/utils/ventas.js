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

// Indicadores para el panel de administración a partir de la lista de ventas
export function resumenVentas(ventas) {
  const pagadas = ventas.filter((v) => v.estado === 'PAGADA')
  const conteoComuna = {}
  ventas.forEach((v) => {
    const comuna = v.comuna || 'Sin comuna'
    conteoComuna[comuna] = (conteoComuna[comuna] || 0) + 1
  })
  const porComuna = Object.entries(conteoComuna)
    .map(([comuna, cantidad]) => ({ comuna, cantidad, porcentaje: Math.round((cantidad / ventas.length) * 100) }))
    .sort((a, b) => b.cantidad - a.cantidad)

  return {
    total: ventas.length,
    pagadas: pagadas.length,
    pendientes: ventas.filter((v) => v.estado === 'PENDIENTE_PAGO').length,
    ingresos: pagadas.reduce((suma, v) => suma + Number(v.total || 0), 0),
    porComuna,
  }
}

// Ventas ordenadas de la más reciente a la más antigua
export function masRecientes(ventas, cantidad = ventas.length) {
  return [...ventas].sort((a, b) => b.id - a.id).slice(0, cantidad)
}
