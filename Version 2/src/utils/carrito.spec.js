// Pruebas unitarias de la lógica del carrito.
// Son funciones puras: reciben el carrito actual y devuelven uno nuevo.
import {
  agregarItem,
  incrementarItem,
  decrementarItem,
  eliminarItem,
  contarItems,
  obtenerItemsCompletos,
  calcularTotal,
} from './carrito'
import { PRODUCTOS } from '../datos/productos'

describe('carrito (lógica pura)', () => {
  it('agregarItem e incrementarItem agregan y acumulan cantidad sin mutar el original', () => {
    const inicial = []
    const conUno = agregarItem(inicial, 'p1')

    expect(inicial.length).toBe(0) // no muta el arreglo original
    expect(conUno).toEqual([{ id: 'p1', cantidad: 1 }])

    const conDos = agregarItem(conUno, 'p1')
    expect(conDos).toEqual([{ id: 'p1', cantidad: 2 }])

    expect(agregarItem(conDos, 'p2')).toEqual([
      { id: 'p1', cantidad: 2 },
      { id: 'p2', cantidad: 1 },
    ])

    // incrementarItem hace lo mismo que agregar sobre uno existente
    expect(incrementarItem(conDos, 'p1')).toEqual([{ id: 'p1', cantidad: 3 }])
  })

  it('decrementarItem y eliminarItem quitan unidades y productos; contarItems cuenta el total', () => {
    const carrito = [
      { id: 'p1', cantidad: 2 },
      { id: 'p2', cantidad: 3 },
    ]

    // Descuenta una unidad
    expect(decrementarItem(carrito, 'p1')).toEqual([
      { id: 'p1', cantidad: 1 },
      { id: 'p2', cantidad: 3 },
    ])

    // Al llegar a 0 se elimina el producto
    expect(decrementarItem([{ id: 'p1', cantidad: 1 }], 'p1')).toEqual([])

    // eliminarItem quita sin importar la cantidad
    expect(eliminarItem(carrito, 'p2')).toEqual([{ id: 'p1', cantidad: 2 }])

    // contarItems suma las cantidades
    expect(contarItems(carrito)).toBe(5)
    expect(contarItems([])).toBe(0)
  })

  it('obtenerItemsCompletos une con el catálogo y calcularTotal suma según el tipo', () => {
    const carrito = [
      { id: 'p1', cantidad: 2 },
      { id: 'p2', cantidad: 1 },
      { id: 'no-existe', cantidad: 5 },
    ]

    // Une con el producto completo y descarta ids inexistentes
    const completos = obtenerItemsCompletos(carrito, PRODUCTOS)
    expect(completos.length).toBe(2)
    expect(completos[0].producto.nombre).toBe('Cilindro GLP 5 kg')

    // p1 = 6.500 y p2 = 12.000 en residencial
    expect(calcularTotal(carrito, PRODUCTOS, 'residencial')).toBe(6500 * 2 + 12000)
    // p1 = 6.000 y p2 = 11.000 en comercial
    expect(calcularTotal(carrito, PRODUCTOS, 'comercial')).toBe(6000 * 2 + 11000)
    // Carrito vacío suma 0
    expect(calcularTotal([], PRODUCTOS)).toBe(0)
  })
})
