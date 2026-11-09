// Ficha de producto: con id numérico se consulta ms-catalogoProductos (fetch simulado);
// con id local ('p1') se usa el catálogo de respaldo.
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import DetalleProducto from './DetalleProducto'

function renderEn(ruta, onAgregar = vi.fn()) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/producto/:id" element={<DetalleProducto onAgregar={onAgregar} />} />
      </Routes>
    </MemoryRouter>,
  )
  return onAgregar
}

describe('Página <DetalleProducto />', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('muestra el producto de la API (GET /api/v1/productos/id/{id}) y agrega su id numérico', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        id: 2, sku: 'CL002', nombre: 'Cilindro GLP 11 kg', descripcion: 'Estándar doméstico',
        precioResidencial: 12000, precioComercial: 11000, categoria: 'Cilindros de Gas', imagen: '/IMAGENES/cilindro de 11K.png',
      }),
    })
    const onAgregar = renderEn('/producto/2')

    expect(await screen.findByText('Cilindro GLP 11 kg')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/productos\/id\/2$/)
    expect(screen.getByText(/Precio residencial/)).toHaveTextContent('12.000')
    expect(screen.getByText(/Precio comercial/)).toHaveTextContent('11.000')
    expect(screen.getByText('Código: CL002')).toBeInTheDocument()
    expect(screen.queryByText(/Stock disponible/)).not.toBeInTheDocument() // el catálogo no informa stock

    screen.getByRole('button', { name: 'Agregar al carrito' }).click()
    expect(onAgregar).toHaveBeenCalledWith(2)
  })

  test('si la API responde 404 muestra "Producto no encontrado"', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({}) })
    renderEn('/producto/999')
    expect(await screen.findByText('Producto no encontrado.')).toBeInTheDocument()
  })

  test('con un id local usa el catálogo de respaldo sin llamar a la API', () => {
    renderEn('/producto/p1')
    expect(screen.getByText('Cilindro GLP 5 kg')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
