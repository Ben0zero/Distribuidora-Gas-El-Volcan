// Panel del Vendedor: solo lista y detalle de productos y de órdenes (fetch simulado).
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import VendedorLayout from './VendedorLayout'
import OrdenesVendedor from './OrdenesVendedor'
import DetalleOrdenVendedor from './DetalleOrdenVendedor'
import DetalleProductoVendedor from './DetalleProductoVendedor'
import LayoutPublico from '../../components/LayoutPublico'
import { guardarSesion } from '../../testUtils/jwt'

const CATALOGO = [{ id: 2, sku: 'CL002', nombre: 'Cilindro GLP 11 kg', precioResidencial: 12000, precioComercial: 11000 }]
const ORDEN_7 = {
  id: 7, usuario: 'cliente@elvolcan.cl', total: 24000, estado: 'PAGADA', fechaVenta: '2026-11-08T10:00:00',
  direccion: 'Calle Nueva 789', comuna: 'Chillán', metodoPago: 'Efectivo',
  detalles: [{ id: 1, productoId: 2, cantidad: 2, precioUnitario: 12000, subtotal: 24000 }],
}

function json(status, cuerpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

// API simulada según la URL pedida
function simularApi(respuestas) {
  return vi.fn((url) => {
    const clave = Object.keys(respuestas).find((sufijo) => url.endsWith(sufijo))
    return clave ? json(...respuestas[clave]) : json(404, {})
  })
}

function renderPanel(ruta) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/vendedor" element={<VendedorLayout />}>
          <Route path="ordenes" element={<OrdenesVendedor />} />
          <Route path="ordenes/:id" element={<DetalleOrdenVendedor />} />
          <Route path="productos/:id" element={<DetalleProductoVendedor />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Panel del Vendedor (solo lectura)', () => {
  beforeEach(() => {
    localStorage.clear()
    guardarSesion({ rol: 'Vendedor', nombre: 'María Soto' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('el menú solo ofrece Productos y Órdenes', async () => {
    vi.stubGlobal('fetch', simularApi({ '/api/v1/ventas': [200, []] }))
    renderPanel('/vendedor/ordenes')

    const menu = screen.getByRole('navigation', { name: 'Menú del vendedor' })
    const enlaces = within(menu).getAllByRole('link').map((a) => a.textContent.trim())
    expect(enlaces).toEqual(['Productos', 'Órdenes'])
    expect(screen.getByText('María Soto')).toBeInTheDocument()
    // espera a que termine la carga de órdenes (evita actualizaciones fuera de act)
    expect(await screen.findByText('Aún no hay órdenes registradas.')).toBeInTheDocument()
  })

  test('lista las órdenes con su cliente y enlace al detalle', async () => {
    vi.stubGlobal('fetch', simularApi({ '/api/v1/ventas': [200, [ORDEN_7]] }))
    renderPanel('/vendedor/ordenes')

    expect(await screen.findByText('ORD-7')).toBeInTheDocument()
    expect(screen.getByText('cliente@elvolcan.cl')).toBeInTheDocument()
    expect(screen.getByText('Pagada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver detalle' })).toHaveAttribute('href', '/vendedor/ordenes/7')
    // no hay acciones de modificación
    expect(screen.queryByRole('button', { name: /Eliminar|Editar|Confirmar|Pagar/ })).not.toBeInTheDocument()
  })

  test('muestra el detalle de una orden con nombres de producto y total', async () => {
    vi.stubGlobal('fetch', simularApi({ '/api/v1/ventas/7': [200, ORDEN_7], '/api/v1/productos': [200, CATALOGO] }))
    renderPanel('/vendedor/ordenes/7')

    expect(await screen.findByText('Orden ORD-7')).toBeInTheDocument()
    expect(await screen.findByText('Cilindro GLP 11 kg')).toBeInTheDocument()
    expect(screen.getByText('Calle Nueva 789, Chillán')).toBeInTheDocument()
    expect(screen.getAllByText('$24.000').length).toBeGreaterThan(0)
  })

  test('detalle de orden inexistente muestra un aviso', async () => {
    vi.stubGlobal('fetch', simularApi({ '/api/v1/productos': [200, CATALOGO] }))
    renderPanel('/vendedor/ordenes/999')
    expect(await screen.findByText('Orden no encontrada.')).toBeInTheDocument()
  })

  test('detalle de producto incluye el stock de ms-inventario', async () => {
    vi.stubGlobal('fetch', simularApi({
      '/api/v1/productos/id/2': [200, CATALOGO[0]],
      '/api/v1/inventario/CL002': [200, { sku: 'CL002', stockActual: 4, bajoStock: true }],
    }))
    renderPanel('/vendedor/productos/2')

    expect(await screen.findByText('Cilindro GLP 11 kg')).toBeInTheDocument()
    expect(screen.getByText('Stock crítico')).toBeInTheDocument()
  })

  test('si un Vendedor entra a la tienda, se le envía a su panel', () => {
    render(
      <MemoryRouter initialEntries={['/productos']}>
        <Routes>
          <Route element={<LayoutPublico totalItems={0} />}>
            <Route path="/productos" element={<p>Tienda</p>} />
          </Route>
          <Route path="/vendedor" element={<p>Panel del vendedor</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Panel del vendedor')).toBeInTheDocument()
    expect(screen.queryByText('Tienda')).not.toBeInTheDocument()
  })
})
