// "Mis compras": historial desde GET /api/v1/ventas/mis-compras (fetch simulado).
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import MisCompras from './MisCompras'
import { CLAVES } from '../utils/validaciones'

const CATALOGO_API = [{ id: 2, sku: 'CL002', nombre: 'Cilindro GLP 11 kg', precioResidencial: 12000 }]

function json(status, cuerpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

function renderMisCompras() {
  render(
    <MemoryRouter>
      <MisCompras />
    </MemoryRouter>,
  )
}

describe('Página <MisCompras />', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('sin sesión invita a iniciar sesión y no llama a la API', () => {
    const fetchMock = vi.fn(() => json(200, []))
    vi.stubGlobal('fetch', fetchMock)
    renderMisCompras()

    expect(screen.getByText('Inicia sesión para ver tus compras')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => url.includes('mis-compras'))).toBe(false)
  })

  test('lista las compras con nombres de producto y permite pagar las pendientes', async () => {
    const user = userEvent.setup()
    localStorage.setItem(CLAVES.sesion, JSON.stringify({ nombre: 'Pedro', token: 'tok' }))
    let pagada = false
    const fetchMock = vi.fn((url, opciones = {}) => {
      if (url.endsWith('/api/v1/productos')) return json(200, CATALOGO_API)
      if (opciones.method === 'PUT') {
        pagada = true
        return json(200, { id: 8, estado: 'PAGADA' })
      }
      if (url.endsWith('/mis-compras')) {
        return json(200, [
          { id: 7, total: 24000, estado: 'PAGADA', fechaVenta: '2026-11-08T10:00:00', direccion: 'Calle Nueva 789', comuna: 'Chillán', metodoPago: 'Efectivo', detalles: [{ id: 1, productoId: 2, cantidad: 2 }] },
          { id: 8, total: 12000, estado: pagada ? 'PAGADA' : 'PENDIENTE_PAGO', fechaVenta: '2026-11-08T11:00:00', detalles: [{ id: 2, productoId: 2, cantidad: 1 }] },
        ])
      }
      return json(404, {})
    })
    vi.stubGlobal('fetch', fetchMock)
    renderMisCompras()

    expect(await screen.findByText('ORD-7')).toBeInTheDocument()
    expect(await screen.findByText('2 × Cilindro GLP 11 kg')).toBeInTheDocument()
    expect(screen.getByText('Calle Nueva 789, Chillán')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de pago')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pagar ahora' }))
    expect(fetchMock.mock.calls.some(([url, o]) => o?.method === 'PUT' && url.endsWith('/api/v1/ventas/8/confirmar'))).toBe(true)
    // tras pagar se recarga el historial y ya no queda nada pendiente
    expect(await screen.findAllByText('Pagada')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Pagar ahora' })).not.toBeInTheDocument()
  })
})
