// Lógica del catálogo de productos.
// El catálogo "real" = los 14 productos base (datos/productos.js) más las
// ediciones que el administrador haya guardado en localStorage.
import { PRODUCTOS } from '../datos/productos'
import { CLAVES, leerLista } from './validaciones'

// Aplica las ediciones guardadas sobre los productos base.
export function aplicarEdiciones(base, ediciones) {
  return base.map((p) => {
    const ed = ediciones.find((e) => e.id === p.id)
    if (!ed) return p
    return {
      ...p,
      codigo: ed.codigo || p.codigo,
      nombre: ed.nombre || p.nombre,
      descripcion: ed.descripcion !== undefined ? ed.descripcion : p.descripcion,
      residencial: ed.residencial !== undefined ? ed.residencial : p.residencial,
      comercial: ed.comercial !== undefined ? ed.comercial : p.comercial,
      stock: ed.stock !== undefined ? ed.stock : p.stock,
      stockCritico: ed.stockCritico !== undefined ? ed.stockCritico : p.stockCritico,
      categoria: ed.categoria || p.categoria,
      imagen: ed.imagen || p.imagen,
    }
  })
}

// Convierte un producto de ms-catalogoProductos (ProductoResponseDTO) al formato
// que usan los componentes del frontend (el mismo de datos/productos.js).
// API: { id, sku, nombre, descripcion, precioResidencial, precioComercial, precio, categoria, imagen, activo }
export const IMAGEN_POR_DEFECTO = '/IMAGENES/Logo Gas.png'

export function desdeApi(p) {
  const residencial = Number(p.precioResidencial ?? p.precio ?? 0)
  return {
    id: p.id,
    codigo: p.sku,
    nombre: p.nombre,
    descripcion: p.descripcion || '',
    residencial,
    comercial: Number(p.precioComercial ?? residencial),
    categoria: p.categoria || 'Cilindros de Gas',
    imagen: p.imagen || IMAGEN_POR_DEFECTO,
    activo: p.activo !== false,
  }
}

// Catálogo con ediciones aplicadas (lo que ve el cliente).
export function catalogoActual() {
  return aplicarEdiciones(PRODUCTOS, leerLista(CLAVES.edicionesProductos))
}

// Catálogo + productos creados desde el admin (lo que ve el inventario).
export function productosConCreados() {
  const base = catalogoActual().map((p) => ({ ...p, base: true }))
  const creados = leerLista(CLAVES.productos).map((p) => ({
    id: p.codigo,
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.descripcion || '',
    residencial: Number(p.residencial) || 0,
    comercial: Number(p.comercial) || 0,
    stock: Number(p.stock) || 0,
    stockCritico: Number(p.stockCritico) || 0,
    categoria: p.categoria,
    imagen: p.imagen || '/IMAGENES/Logo Gas.png',
    base: false,
  }))
  return [...base, ...creados]
}
