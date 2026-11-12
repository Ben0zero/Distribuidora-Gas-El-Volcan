import { describe, test, expect } from 'vitest'
import { resumenVentas, masRecientes, estadoVenta, numeroOrden, nombreProducto } from './ventas'

const VENTAS = [
  { id: 1, estado: 'PAGADA', total: 12000, comuna: 'Chillán' },
  { id: 3, estado: 'PENDIENTE_PAGO', total: 6500, comuna: 'Bulnes' },
  { id: 2, estado: 'PAGADA', total: 24000, comuna: 'Chillán' },
  { id: 4, estado: 'PAGADA', total: 1000 }, // venta antigua sin comuna
]

describe('utils/ventas', () => {
  test('resumenVentas calcula totales, ingresos (solo pagadas) y distribución por comuna', () => {
    const r = resumenVentas(VENTAS)
    expect(r).toMatchObject({ total: 4, pagadas: 3, pendientes: 1, ingresos: 37000 })
    expect(r.porComuna[0]).toEqual({ comuna: 'Chillán', cantidad: 2, porcentaje: 50 })
    expect(r.porComuna.map((c) => c.comuna)).toEqual(['Chillán', 'Bulnes', 'Sin comuna'])
    expect(resumenVentas([])).toMatchObject({ total: 0, ingresos: 0, porComuna: [] })
  })

  test('masRecientes ordena por id descendente sin mutar el original', () => {
    expect(masRecientes(VENTAS, 2).map((v) => v.id)).toEqual([4, 3])
    expect(VENTAS[0].id).toBe(1)
  })

  test('formatos de estado, número de orden y nombre de producto', () => {
    expect(estadoVenta('PAGADA')).toEqual({ texto: 'Pagada', color: 'success' })
    expect(estadoVenta('OTRO').texto).toBe('OTRO')
    expect(numeroOrden(15)).toBe('ORD-15')
    expect(nombreProducto([{ id: 2, nombre: 'Cilindro GLP 11 kg' }], 2)).toBe('Cilindro GLP 11 kg')
    expect(nombreProducto([], 9)).toBe('Producto #9')
  })
})
