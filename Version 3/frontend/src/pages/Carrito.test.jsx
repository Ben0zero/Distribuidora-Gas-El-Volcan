// Carrito: las líneas guardan el id numérico del producto de la API y se
// resuelven contra el catálogo de ms-catalogoProductos (fetch simulado).
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import Carrito from './Carrito'

const CATALOGO_API = [
  { id: 1, sku: 'CL001', nombre: 'Cilindro GLP 5 kg', precioResidencial: 6500, precioComercial: 6000 },
  { id: 2, sku: 'CL002', nombre: 'Cilindro GLP 11 kg', precioResidencial: 12000, precioComercial: 11000 },
]

function renderCarrito(carrito) {
  const props = { incrementar: vi.fn(), decrementar: vi.fn(), eliminar: vi.fn() }
  render(
    <MemoryRouter>
      <Carrito carrito={carrito} {...props} />
    </MemoryRouter>,
  )
  return props
}

describe('Página <Carrito />', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('muestra las líneas con ids numéricos de la API y calcula el total', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(CATALOGO_API) })
    const { incrementar } = renderCarrito([{ id: 2, cantidad: 2 }, { id: 1, cantidad: 1 }])

    expect(await screen.findByText('Cilindro GLP 11 kg')).toBeInTheDocument()
    expect(screen.getByText('Cilindro GLP 5 kg')).toBeInTheDocument()
    expect(screen.getByText('Subtotal: $24.000')).toBeInTheDocument()
    expect(screen.getByText('Total: $30.500')).toBeInTheDocument()
    expect(screen.queryByText(/No pudimos conectar/)).not.toBeInTheDocument()
    // Único checkout: el carrito solo lleva a /ventas
    // (react-bootstrap renderiza el <a> con role="button")
    expect(screen.getByRole('button', { name: 'Ir a pagar' })).toHaveAttribute('href', '/ventas')

    screen.getAllByRole('button', { name: '+' })[0].click()
    expect(incrementar).toHaveBeenCalledWith(2) // se opera con el id numérico
  })

  test('sin conexión avisa y no permite finalizar la compra', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    // en modo sin conexión el catálogo de referencia usa ids locales ('p1'...)
    renderCarrito([{ id: 'p1', cantidad: 1 }])

    expect(await screen.findByText(/No pudimos conectar con el servidor/)).toBeInTheDocument()
    expect(screen.getByText('Ir a pagar')).toHaveAttribute('aria-disabled', 'true')
  })
})
