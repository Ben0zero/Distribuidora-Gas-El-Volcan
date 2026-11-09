import { describe, test, expect } from 'vitest'
import { resumenClientes, ventasMensuales, reporteVentas, aCsv } from './reportes'

const USUARIOS = [
  { id: 1, nombre: 'Juan Perez', username: 'admin@duoc.cl', nombreRol: 'ADMIN' },
  { id: 3, nombre: 'Pedro Rojas', username: 'pedro@elvolcan.cl', nombreRol: 'CLIENTE', comuna: 'Chillán', tipoCliente: 'Residencial' },
  { id: 4, nombre: 'Restaurante El Fogón', username: 'fogon@gmail.com', nombreRol: 'CLIENTE', comuna: 'Bulnes', tipoCliente: 'Comercial' },
  { id: 5, nombre: 'Ana Sin Compras', username: 'ana@duoc.cl', nombreRol: 'CLIENTE', comuna: 'Chillán' },
]
const PRODUCTOS = [
  { id: 1, nombre: 'Cilindro GLP 5 kg', categoria: 'Cilindros de Gas' },
  { id: 2, nombre: 'Cilindro GLP 11 kg', categoria: 'Cilindros de Gas' },
  { id: 5, nombre: 'Regulador doméstico estándar', categoria: 'Reguladores' },
]
const VENTAS = [
  { id: 1, usuario: 'pedro@elvolcan.cl', estado: 'PAGADA', total: 24000, fechaVenta: '2026-10-15T10:00:00', detalles: [{ productoId: 2, cantidad: 2, subtotal: 24000 }] },
  { id: 2, usuario: 'fogon@gmail.com', estado: 'PAGADA', total: 76000, fechaVenta: '2026-11-03T10:00:00', detalles: [{ productoId: 2, cantidad: 6, subtotal: 66000 }, { productoId: 5, cantidad: 1, subtotal: 10000 }] },
  { id: 3, usuario: 'pedro@elvolcan.cl', estado: 'PENDIENTE_PAGO', total: 6500, fechaVenta: '2026-11-05T10:00:00', detalles: [{ productoId: 1, cantidad: 1, subtotal: 6500 }] },
]

describe('utils/reportes: clientes', () => {
  test('resumenClientes cruza clientes de ms-auth con sus ventas', () => {
    const r = resumenClientes(USUARIOS, VENTAS)

    expect(r.total).toBe(3) // el ADMIN no cuenta como cliente
    expect(r.conCompras).toBe(2)
    expect(r.comerciales).toBe(1)
    expect(r.residenciales).toBe(2) // sin tipo = Residencial
    const pedro = r.clientes.find((c) => c.username === 'pedro@elvolcan.cl')
    expect(pedro).toMatchObject({ compras: 2, totalGastado: 24000, ultimaCompra: '2026-11-05T10:00:00' }) // solo suma las pagadas
    expect(r.mejores.map((m) => m.nombre)).toEqual(['Restaurante El Fogón', 'Pedro Rojas'])
    expect(r.porComuna[0]).toEqual({ comuna: 'Chillán', cantidad: 2, porcentaje: 67 })
  })
})

describe('utils/reportes: ventas', () => {
  test('ventasMensuales suma solo pagadas por mes y escala las barras al máximo', () => {
    const meses = ventasMensuales(VENTAS, new Date(2026, 10, 9)) // 9 de noviembre de 2026
    expect(meses).toHaveLength(5)
    expect(meses.map((m) => m.mes)).toEqual(['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'])
    expect(meses[3]).toMatchObject({ monto: 24000, altura: 32 })
    expect(meses[4]).toMatchObject({ monto: 76000, altura: 100 }) // la pendiente de noviembre no suma
    expect(meses[0].altura).toBe(0)
  })

  test('reporteVentas calcula ingresos, ticket, categorías, tipo de cliente y más vendidos', () => {
    const r = reporteVentas(VENTAS, PRODUCTOS, USUARIOS)

    expect(r).toMatchObject({ ingresos: 100000, ordenesPagadas: 2, ticketPromedio: 50000, cilindrosVendidos: 8 })
    expect(r.porCategoria).toEqual([
      { categoria: 'Cilindros de Gas', monto: 90000, porcentaje: 90 },
      { categoria: 'Reguladores', monto: 10000, porcentaje: 10 },
    ])
    expect(r.tipoCliente).toEqual([{ tipo: 'Residencial', porcentaje: 50 }, { tipo: 'Comercial', porcentaje: 50 }])
    expect(r.masVendidos[0]).toMatchObject({ producto: 'Cilindro GLP 11 kg', unidades: 8, ingresos: 90000, participacion: 90 })
  })

  test('sin ventas devuelve indicadores en cero', () => {
    const r = reporteVentas([], PRODUCTOS, USUARIOS)
    expect(r).toMatchObject({ ingresos: 0, ticketPromedio: 0, cilindrosVendidos: 0, porCategoria: [], masVendidos: [] })
  })
})

describe('utils/reportes: CSV', () => {
  test('aCsv usa ";" y escapa comillas, separadores y saltos de línea', () => {
    const csv = aCsv(
      [{ a: 'ORD-1', b: 'Calle "Nueva"; 789' }, { a: 'ORD-2', b: null }],
      [{ titulo: 'Orden', campo: 'a' }, { titulo: 'Dirección', campo: 'b' }],
    )
    expect(csv).toBe('Orden;Dirección\nORD-1;"Calle ""Nueva""; 789"\nORD-2;')
  })
})
