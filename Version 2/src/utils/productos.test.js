// Pruebas unitarias del catálogo: aplicación de ediciones y productos creados (CRUD).
import { aplicarEdiciones, catalogoActual, productosConCreados } from './productos'
import { CLAVES } from './validaciones'
import { describe, test, expect, beforeEach } from 'vitest'

describe('productos (catálogo)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('aplicarEdiciones, catalogoActual y productosConCreados construyen el catálogo real', () => {
    const base = [
      { id: 'a', codigo: 'A1', nombre: 'Uno', residencial: 100, comercial: 90, stock: 5 },
      { id: 'b', codigo: 'B1', nombre: 'Dos', residencial: 200, comercial: 180, stock: 8 },
    ]

    // aplicarEdiciones sobreescribe solo los campos editados del producto correcto
    const resultado = aplicarEdiciones(base, [{ id: 'a', nombre: 'Uno editado', residencial: 150 }])
    expect(resultado[0].nombre).toBe('Uno editado')
    expect(resultado[0].residencial).toBe(150)
    expect(resultado[0].codigo).toBe('A1') // se conserva
    expect(resultado[0].comercial).toBe(90) // se conserva
    expect(resultado[1]).toEqual(base[1]) // sin edición queda intacto
    expect(base[0].nombre).toBe('Uno') // no muta el original

    // Sin ediciones guardadas, catalogoActual() es el catálogo base (14 productos)
    expect(catalogoActual().length).toBe(14)

    // Con una edición en localStorage, se refleja en el catálogo
    localStorage.setItem(CLAVES.edicionesProductos, JSON.stringify([{ id: 'p1', nombre: 'Cilindro editado' }]))
    expect(catalogoActual()[0].nombre).toBe('Cilindro editado')

    // productosConCreados agrega los productos creados desde el admin (base: false)
    localStorage.setItem(
      CLAVES.productos,
      JSON.stringify([{ codigo: 'NU1', nombre: 'Producto nuevo', residencial: 5000, comercial: 4500, stock: 10 }]),
    )
    const inventario = productosConCreados()
    expect(inventario.length).toBe(15)
    const creado = inventario.find((p) => p.codigo === 'NU1')
    expect(creado).toBeTruthy()
    expect(creado.base).toBe(false)
    expect(creado.nombre).toBe('Producto nuevo')
  })
})