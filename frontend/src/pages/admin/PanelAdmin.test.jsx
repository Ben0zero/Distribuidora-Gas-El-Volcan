// Órdenes, Dashboard y Usuarios del Admin con datos de la API (fetch simulado por URL).
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import Ordenes from './Ordenes'
import Dashboard from './Dashboard'
import ListaUsuarios from './ListaUsuarios'
import { guardarSesion } from '../../testUtils/jwt'

const VENTAS = [
  { id: 7, usuario: 'cliente@elvolcan.cl', total: 24000, estado: 'PAGADA', comuna: 'Chillán', metodoPago: 'Efectivo', fechaVenta: '2026-11-08T10:00:00', detalles: [{ productoId: 2, cantidad: 2 }] },
  { id: 8, usuario: 'ana@duoc.cl', total: 6500, estado: 'PENDIENTE_PAGO', comuna: 'Bulnes', metodoPago: 'Tarjeta', fechaVenta: '2026-11-08T11:00:00', detalles: [{ productoId: 1, cantidad: 1 }] },
]
const CATALOGO = [
  { id: 1, sku: 'CL001', nombre: 'Cilindro GLP 5 kg', precioResidencial: 6500, categoria: 'Cilindros de Gas' },
  { id: 2, sku: 'CL002', nombre: 'Cilindro GLP 11 kg', precioResidencial: 12000, categoria: 'Cilindros de Gas' },
]
const STOCK = [{ sku: 'CL001', stockActual: 80, bajoStock: false }, { sku: 'CL002', stockActual: 3, bajoStock: true }]
const USUARIOS = [
  { id: 1, nombre: 'Juan Perez', rut: '19011022', username: 'admin@duoc.cl', nombreRol: 'ADMIN' },
  { id: 2, nombre: 'Maria Soto', rut: '18765432', username: 'vendedor@elvolcan.cl', nombreRol: 'VENDEDOR', comuna: 'Chillán' },
  { id: 3, nombre: 'Pedro Rojas', rut: '17234567', username: 'cliente@elvolcan.cl', nombreRol: 'CLIENTE', comuna: 'Chillán' },
]

function json(status, cuerpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

function simularApi() {
  return vi.fn((url) => {
    if (url.endsWith('/api/v1/ventas')) return json(200, VENTAS)
    if (url.endsWith('/api/v1/productos')) return json(200, CATALOGO)
    if (url.endsWith('/api/v1/inventario')) return json(200, STOCK)
    if (url.endsWith('/api/v1/usuarios')) return json(200, USUARIOS)
    return json(404, {})
  })
}

function renderConRouter(componente) {
  render(<MemoryRouter>{componente}</MemoryRouter>)
}

describe('Panel de administración con datos reales', () => {
  beforeEach(() => {
    localStorage.clear()
    guardarSesion({ rol: 'Administrador', nombre: 'Juan Perez' })
    vi.stubGlobal('fetch', simularApi())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('Órdenes: KPI calculados, tabla de ventas y distribución por comuna', async () => {
    renderConRouter(<Ordenes />)

    expect(await screen.findByText('ORD-8')).toBeInTheDocument()
    expect(screen.getByText('cliente@elvolcan.cl')).toBeInTheDocument()
    // ingresos solo de ventas pagadas
    expect(screen.getByText('Ingresos').nextElementSibling).toHaveTextContent('$24.000')
    expect(screen.getByText('Pendientes de Pago').nextElementSibling).toHaveTextContent('1')
    expect(screen.getAllByText('50%')).toHaveLength(2) // Chillán y Bulnes
  })

  test('Dashboard: saludo, KPI y productos en stock crítico', async () => {
    renderConRouter(<Dashboard />)

    expect(await screen.findByText('¡HOLA Juan Perez!')).toBeInTheDocument()
    expect(screen.getByText('Órdenes').nextElementSibling).toHaveTextContent('2 Órdenes')
    expect(screen.getByText('Stock Crítico').nextElementSibling).toHaveTextContent('1 Productos')
    expect(screen.getByText(/producto\(s\) en stock crítico: CL002/)).toBeInTheDocument()
  })

  test('Usuarios: lista de ms-auth con filtro por rol', async () => {
    const user = userEvent.setup()
    renderConRouter(<ListaUsuarios />)

    expect(await screen.findByText('Maria Soto')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(4) // encabezado + 3 usuarios

    await user.selectOptions(screen.getByLabelText('Filtrar por rol'), 'Vendedores')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('vendedor@elvolcan.cl')).toBeInTheDocument()
    expect(screen.queryByText('Pedro Rojas')).not.toBeInTheDocument()
  })
})
