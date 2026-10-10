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
      { id: 'c', codigo: 'C1', nombre: 'Tres', residencial: 300, comercial: 270, stock: 6 },
    ]

    // aplicarEdiciones sobreescribe solo los campos editados del producto correcto
    const resultado = aplicarEdiciones(base, [
      { id: 'a', nombre: 'Uno editado', residencial: 150 },
      {
        id: 'b',
        codigo: 'B1x',
        descripcion: 'Descripción B',
        comercial: 170,
        stock: 4,
        stockCritico: 1,
        categoria: 'Accesorios',
        imagen: '/img.png',
      },
    ])
    expect(resultado[0].nombre).toBe('Uno editado')
    expect(resultado[0].residencial).toBe(150)
    expect(resultado[0].codigo).toBe('A1') // se conserva (campo no editado)
    expect(resultado[0].comercial).toBe(90) // se conserva
    expect(resultado[0].descripcion).toBe(base[0].descripcion) // se conserva
    expect(resultado[1].codigo).toBe('B1x')
    expect(resultado[1].descripcion).toBe('Descripción B')
    expect(resultado[1].comercial).toBe(170)
    expect(resultado[1].stock).toBe(4)
    expect(resultado[1].stockCritico).toBe(1)
    expect(resultado[1].categoria).toBe('Accesorios')
    expect(resultado[1].imagen).toBe('/img.png')
    expect(resultado[1].residencial).toBe(200) // residencial no editado: se conserva
    expect(resultado[2]).toEqual(base[2]) // sin edición queda intacto
    expect(base[0].nombre).toBe('Uno') // no muta el original

    // Sin ediciones guardadas, catalogoActual() es el catálogo base (14 productos)
    expect(catalogoActual().length).toBe(14)

    // Con una edición en localStorage, se refleja en el catálogo
    localStorage.setItem(CLAVES.edicionesProductos, JSON.stringify([{ id: 'p1', nombre: 'Cilindro editado' }]))
    expect(catalogoActual()[0].nombre).toBe('Cilindro editado')

    // productosConCreados agrega los productos creados desde el admin (base: false)
    localStorage.setItem(
      CLAVES.productos,
      JSON.stringify([
        { codigo: 'NU1', nombre: 'Producto nuevo', residencial: 5000, comercial: 4500, stock: 10 },
        { codigo: 'NU2', nombre: 'Producto básico' }, // sin precios/stock: usa valores por defecto
      ]),
    )
    const inventario = productosConCreados()
    expect(inventario.length).toBe(16)
    const creado = inventario.find((p) => p.codigo === 'NU1')
    expect(creado).toBeTruthy()
    expect(creado.base).toBe(false)
    expect(creado.nombre).toBe('Producto nuevo')

    const basico = inventario.find((p) => p.codigo === 'NU2')
    expect(basico).toBeTruthy()
    expect(basico.base).toBe(false)
    expect(basico.residencial).toBe(0)
    expect(basico.comercial).toBe(0)
    expect(basico.stock).toBe(0)
    expect(basico.stockCritico).toBe(0)
    expect(basico.imagen).toBe('/IMAGENES/Logo Gas.png') // imagen por defecto
  })
})