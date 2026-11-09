// Clientes y Reportes del Admin calculados con /usuarios, /ventas y el catálogo (fetch simulado).
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import Clientes from './Clientes'
import Reportes from './Reportes'
import { guardarSesion } from '../../testUtils/jwt'

const USUARIOS = [
  { id: 1, nombre: 'Juan Perez', username: 'admin@duoc.cl', nombreRol: 'ADMIN' },
  { id: 3, nombre: 'Pedro Rojas', username: 'pedro@elvolcan.cl', nombreRol: 'CLIENTE', comuna: 'Chillán', tipoCliente: 'Residencial' },
  { id: 4, nombre: 'Restaurante El Fogón', username: 'fogon@gmail.com', nombreRol: 'CLIENTE', comuna: 'Bulnes', tipoCliente: 'Comercial' },
]
const CATALOGO = [{ id: 2, sku: 'CL002', nombre: 'Cilindro GLP 11 kg', precioResidencial: 12000, categoria: 'Cilindros de Gas' }]
const hoy = new Date()
const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 12).toISOString()
const VENTAS = [
  { id: 1, usuario: 'pedro@elvolcan.cl', estado: 'PAGADA', total: 24000, fechaVenta: fecha, comuna: 'Chillán', detalles: [{ productoId: 2, cantidad: 2, subtotal: 24000 }] },
  { id: 2, usuario: 'fogon@gmail.com', estado: 'PAGADA', total: 72000, fechaVenta: fecha, comuna: 'Bulnes', detalles: [{ productoId: 2, cantidad: 6, subtotal: 72000 }] },
]

function json(status, cuerpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

describe('Clientes y Reportes con datos reales', () => {
  beforeEach(() => {
    localStorage.clear()
    guardarSesion({ rol: 'Administrador' })
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.endsWith('/api/v1/usuarios')) return json(200, USUARIOS)
      if (url.endsWith('/api/v1/ventas')) return json(200, VENTAS)
      if (url.endsWith('/api/v1/productos')) return json(200, CATALOGO)
      return json(404, {})
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('Clientes: KPI, listado con compras y mejores clientes', async () => {
    render(<Clientes />)

    expect(await screen.findByText('Restaurante El Fogón', { selector: '.flex-grow-1' })).toBeInTheDocument()
    expect(screen.getByText('Clientes Totales').nextElementSibling).toHaveTextContent('2') // el ADMIN no cuenta
    expect(screen.getByText('Comerciales').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('$72.000')).toBeInTheDocument() // mejor cliente
    expect(screen.getAllByText('Activo')).toHaveLength(2)
  })

  test('Reportes: KPI de ventas pagadas, más vendidos y exportación CSV', async () => {
    const user = userEvent.setup()
    URL.createObjectURL = vi.fn(() => 'blob:reporte')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<Reportes />)

    expect(await screen.findByText('Ingresos Totales')).toBeInTheDocument()
    expect(screen.getByText('Ingresos Totales').nextElementSibling).toHaveTextContent('$96.000')
    expect(screen.getByText('Ticket Promedio').nextElementSibling).toHaveTextContent('$48.000')
    expect(screen.getByText('Cilindros Vendidos').nextElementSibling).toHaveTextContent('8')
    expect(screen.getByRole('cell', { name: 'Cilindro GLP 11 kg' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ventas \(todas las órdenes\)/ }))
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
  })
})
