// Lógica pura del inventario del panel de administración (fácil de probar).

// Une el catálogo (ms-catalogoProductos, ya convertido con desdeApi) con el stock
// de ms-inventario ({ sku, stockActual, bajoStock }) usando el SKU como enlace.
export function combinarInventario(productos, stock) {
  const porSku = new Map(stock.map((s) => [String(s.sku).toUpperCase(), s]))
  return productos.map((p) => {
    const s = porSku.get(String(p.codigo).toUpperCase())
    return {
      ...p,
      stock: s ? Number(s.stockActual) : null, // null = sin registro en inventario
      bajoStock: s ? Boolean(s.bajoStock) : false,
    }
  })
}

// Convierte "stock deseado" en la operación que entiende ms-inventario
// (PUT /aumentar o /disminuir con la diferencia). null si no hay cambio.
export function ajusteDeStock(actual, deseado) {
  const diferencia = Number(deseado) - Number(actual || 0)
  if (!Number.isFinite(diferencia) || diferencia === 0) return null
  return diferencia > 0
    ? { operacion: 'aumentar', cantidad: diferencia }
    : { operacion: 'disminuir', cantidad: -diferencia }
}

// Body de ProductoRequestDTO a partir del formulario del admin
export function productoDesdeFormulario(form) {
  return {
    sku: form.codigo.trim().toUpperCase(),
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim(),
    precioResidencial: Math.round(Number(form.residencial)),
    precioComercial: Math.round(Number(form.comercial)),
    categoria: form.categoria,
    imagen: form.imagen?.trim() || undefined,
  }
}

const esEntero = (v) => /^\d+$/.test(String(v).trim())

// Valida el formulario de producto; devuelve el primer error o ''
export function validarProducto(form, { nuevo = true } = {}) {
  if (nuevo && form.codigo.trim().length < 3) return 'El código debe tener al menos 3 caracteres'
  if (!form.nombre.trim()) return 'Ingresa el nombre del producto'
  if (form.nombre.length > 100) return 'El nombre no puede superar los 100 caracteres'
  const res = Number(form.residencial)
  const com = Number(form.comercial)
  if (form.residencial === '' || form.comercial === '' || !(res >= 0) || !(com >= 0)) {
    return 'Ingresa precios válidos (residencial y comercial)'
  }
  if (form.stock !== '' && form.stock !== null && !esEntero(form.stock)) return 'El stock debe ser un entero mayor o igual a 0'
  if (!form.categoria) return 'Selecciona una categoría'
  return ''
}
