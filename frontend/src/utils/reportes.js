// Cálculos de las páginas "Clientes" y "Reportes" del administrador a partir de
// los datos reales de ms-auth (/usuarios), ms-ventas (/ventas) y el catálogo.
// Son funciones puras: reciben los datos y devuelven los indicadores (fáciles de probar).

const pagadas = (ventas) => ventas.filter((v) => v.estado === 'PAGADA')
const porcentaje = (parte, total) => (total ? Math.round((parte / total) * 100) : 0)

// ---------------------------------------------------------------- Clientes

export function resumenClientes(usuarios, ventas) {
  const clientes = usuarios
    .filter((u) => String(u.nombreRol).toUpperCase() === 'CLIENTE')
    .map((u) => {
      const suyas = ventas.filter((v) => v.usuario === u.username)
      const fechas = suyas.map((v) => v.fechaVenta).filter(Boolean).sort()
      return {
        ...u,
        compras: suyas.length,
        totalGastado: pagadas(suyas).reduce((s, v) => s + Number(v.total || 0), 0),
        ultimaCompra: fechas.length ? fechas[fechas.length - 1] : null,
      }
    })
    .sort((a, b) => b.compras - a.compras || a.nombre.localeCompare(b.nombre))

  const conteoComuna = {}
  clientes.forEach((c) => {
    const comuna = c.comuna || 'Sin comuna'
    conteoComuna[comuna] = (conteoComuna[comuna] || 0) + 1
  })

  return {
    clientes,
    total: clientes.length,
    conCompras: clientes.filter((c) => c.compras > 0).length,
    residenciales: clientes.filter((c) => (c.tipoCliente || 'Residencial') === 'Residencial').length,
    comerciales: clientes.filter((c) => c.tipoCliente === 'Comercial').length,
    mejores: clientes.filter((c) => c.totalGastado > 0).sort((a, b) => b.totalGastado - a.totalGastado).slice(0, 3),
    porComuna: Object.entries(conteoComuna)
      .map(([comuna, cantidad]) => ({ comuna, cantidad, porcentaje: porcentaje(cantidad, clientes.length) }))
      .sort((a, b) => b.cantidad - a.cantidad),
  }
}

// ---------------------------------------------------------------- Reportes

function nombreMes(fecha) {
  const texto = fecha.toLocaleDateString('es-CL', { month: 'long' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Ingresos (ventas pagadas) de los últimos `meses` meses, terminando en el mes de `hoy`
export function ventasMensuales(ventas, hoy = new Date(), meses = 5) {
  const resultado = []
  for (let i = meses - 1; i >= 0; i -= 1) {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const monto = pagadas(ventas)
      .filter((v) => {
        const f = new Date(v.fechaVenta)
        return f.getFullYear() === inicio.getFullYear() && f.getMonth() === inicio.getMonth()
      })
      .reduce((s, v) => s + Number(v.total || 0), 0)
    resultado.push({ mes: nombreMes(inicio), monto })
  }
  const maximo = Math.max(...resultado.map((r) => r.monto), 0)
  // altura mínima de 2% solo para meses con ventas (para que una venta pequeña se vea)
  return resultado.map((r) => ({ ...r, altura: r.monto > 0 ? Math.max(2, Math.round((r.monto / maximo) * 100)) : 0 }))
}

export function reporteVentas(ventas, productos, usuarios) {
  const pagas = pagadas(ventas)
  const ingresos = pagas.reduce((s, v) => s + Number(v.total || 0), 0)
  const productoPorId = new Map(productos.map((p) => [p.id, p]))

  // Unidades e ingresos por producto y por categoría (líneas de ventas pagadas)
  const porProducto = new Map()
  const porCategoria = {}
  pagas.forEach((v) =>
    (v.detalles || []).forEach((d) => {
      const producto = productoPorId.get(d.productoId)
      const nombre = producto?.nombre || `Producto #${d.productoId}`
      const categoria = producto?.categoria || 'Sin categoría'
      const subtotal = Number(d.subtotal ?? (d.precioUnitario || 0) * (d.cantidad || 0))
      const actual = porProducto.get(nombre) || { producto: nombre, categoria, unidades: 0, ingresos: 0 }
      actual.unidades += Number(d.cantidad || 0)
      actual.ingresos += subtotal
      porProducto.set(nombre, actual)
      porCategoria[categoria] = (porCategoria[categoria] || 0) + subtotal
    }),
  )
  const totalLineas = Object.values(porCategoria).reduce((s, x) => s + x, 0)

  // Tipo de cliente de cada venta pagada (el tipo está en el usuario de ms-auth)
  const tipoPorUsuario = new Map(usuarios.map((u) => [u.username, u.tipoCliente || 'Residencial']))
  const comerciales = pagas.filter((v) => tipoPorUsuario.get(v.usuario) === 'Comercial').length

  return {
    ingresos,
    ordenesPagadas: pagas.length,
    ticketPromedio: pagas.length ? Math.round(ingresos / pagas.length) : 0,
    cilindrosVendidos: [...porProducto.values()]
      .filter((p) => p.categoria === 'Cilindros de Gas')
      .reduce((s, p) => s + p.unidades, 0),
    porCategoria: Object.entries(porCategoria)
      .map(([categoria, monto]) => ({ categoria, monto, porcentaje: porcentaje(monto, totalLineas) }))
      .sort((a, b) => b.monto - a.monto),
    tipoCliente: [
      { tipo: 'Residencial', porcentaje: pagas.length ? 100 - porcentaje(comerciales, pagas.length) : 0 },
      { tipo: 'Comercial', porcentaje: porcentaje(comerciales, pagas.length) },
    ],
    masVendidos: [...porProducto.values()]
      .sort((a, b) => b.unidades - a.unidades || b.ingresos - a.ingresos)
      .slice(0, 6)
      .map((p) => ({ ...p, participacion: porcentaje(p.ingresos, totalLineas) })),
  }
}

// ---------------------------------------------------------------- Exportar CSV

// Convierte filas a CSV (separador ";" para que Excel en español lo abra en columnas)
export function aCsv(filas, columnas) {
  const celda = (valor) => {
    const texto = valor === null || valor === undefined ? '' : String(valor)
    return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  const encabezado = columnas.map((c) => celda(c.titulo)).join(';')
  const cuerpo = filas.map((f) => columnas.map((c) => celda(f[c.campo])).join(';'))
  return [encabezado, ...cuerpo].join('\n')
}

// Descarga un texto CSV en el navegador
export function descargarCsv(nombreArchivo, contenido) {
  const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8' }) // BOM: tildes correctas en Excel
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}
