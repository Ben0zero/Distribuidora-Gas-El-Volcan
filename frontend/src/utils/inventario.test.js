import { describe, test, expect } from 'vitest'
import { combinarInventario, ajusteDeStock, productoDesdeFormulario, validarProducto } from './inventario'

describe('utils/inventario', () => {
  test('combinarInventario une catálogo y stock por SKU (sin distinguir mayúsculas)', () => {
    const productos = [{ id: 1, codigo: 'CL001', nombre: 'A' }, { id: 2, codigo: 'cl002', nombre: 'B' }, { id: 3, codigo: 'X9', nombre: 'C' }]
    const stock = [{ sku: 'CL001', stockActual: 80, bajoStock: false }, { sku: 'CL002', stockActual: 3, bajoStock: true }]

    const filas = combinarInventario(productos, stock)
    expect(filas[0]).toMatchObject({ id: 1, stock: 80, bajoStock: false })
    expect(filas[1]).toMatchObject({ id: 2, stock: 3, bajoStock: true })
    expect(filas[2]).toMatchObject({ id: 3, stock: null, bajoStock: false }) // sin registro en inventario
  })

  test('ajusteDeStock traduce el stock deseado en aumentar/disminuir con la diferencia', () => {
    expect(ajusteDeStock(10, 15)).toEqual({ operacion: 'aumentar', cantidad: 5 })
    expect(ajusteDeStock(10, '4')).toEqual({ operacion: 'disminuir', cantidad: 6 })
    expect(ajusteDeStock(10, 10)).toBeNull()
    expect(ajusteDeStock(null, 7)).toEqual({ operacion: 'aumentar', cantidad: 7 })
  })

  test('productoDesdeFormulario arma el ProductoRequestDTO', () => {
    expect(productoDesdeFormulario({
      codigo: ' cl005 ', nombre: ' Cilindro 25 kg ', descripcion: '', residencial: '20000.4', comercial: '18000',
      categoria: 'Cilindros de Gas', imagen: '',
    })).toEqual({
      sku: 'CL005', nombre: 'Cilindro 25 kg', descripcion: '', precioResidencial: 20000, precioComercial: 18000,
      categoria: 'Cilindros de Gas', imagen: undefined,
    })
  })

  test('validarProducto devuelve el primer error del formulario', () => {
    const valido = { codigo: 'CL005', nombre: 'X', residencial: '100', comercial: '90', stock: '5', categoria: 'Accesorios' }
    expect(validarProducto(valido)).toBe('')
    expect(validarProducto({ ...valido, codigo: 'C1' })).toMatch(/al menos 3/)
    expect(validarProducto({ ...valido, codigo: 'C1' }, { nuevo: false })).toBe('') // al editar el código no cambia
    expect(validarProducto({ ...valido, residencial: '' })).toMatch(/precios válidos/)
    expect(validarProducto({ ...valido, stock: '2.5' })).toMatch(/entero/)
    expect(validarProducto({ ...valido, categoria: '' })).toMatch(/categoría/)
  })
})
