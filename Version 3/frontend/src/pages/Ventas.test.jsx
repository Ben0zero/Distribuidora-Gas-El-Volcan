// Checkout: crea la venta en ms-ventas (POST) y confirma el pago (PUT).
// Las respuestas de la API se simulan según URL y método.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import Ventas from './Ventas'
import { CLAVES } from '../utils/validaciones'

const CATALOGO_API = [{ id: 2, sku: 'CL002', nombre: 'Cilindro GLP 11 kg', precioResidencial: 12000, precioComercial: 11000 }]

function json(status, cuerpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

// respuestas: { post, put } -> funciones que devuelven la respuesta simulada
function simularApi({ post, put }) {
  return vi.fn((url, opciones = {}) => {
    const metodo = opciones.method || 'GET'
    if (metodo === 'GET' && url.endsWith('/api/v1/productos')) return json(200, CATALOGO_API)
    if (metodo === 'POST' && url.endsWith('/api/v1/ventas')) return post(opciones)
    if (metodo === 'PUT' && url.endsWith('/confirmar')) return put(opciones)
    return json(404, {})
  })
}

function renderVentas() {
  const vaciar = vi.fn()
  render(
    <MemoryRouter>
      <Ventas carrito={[{ id: 2, cantidad: 2 }]} incrementar={vi.fn()} decrementar={vi.fn()} vaciar={vaciar} />
    </MemoryRouter>,
  )
  return vaciar
}

async function completarYConfirmar(user) {
  await screen.findByText('Finalizar tu compra')
  await user.selectOptions(screen.getByLabelText('Comuna'), 'Chillán')
  await user.click(screen.getByLabelText('Efectivo'))
  await user.click(screen.getByRole('button', { name: /Confirmar pedido/ }))
}

describe('Página <Ventas /> (checkout contra ms-ventas)', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(CLAVES.sesion, JSON.stringify({
      nombre: 'Pedro Rojas', correo: 'cliente@elvolcan.cl', rol: 'Cliente',
      tipoCliente: 'Residencial', direccion: 'Calle Nueva 789', token: 'tok-cliente',
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('crea la venta con despacho y pago, confirma el pago y muestra el número de orden', async () => {
    const user = userEvent.setup()
    const fetchMock = simularApi({
      post: () => json(201, { id: 15, total: 24000, estado: 'PENDIENTE_PAGO' }),
      put: () => json(200, { id: 15, total: 24000, estado: 'PAGADA' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const vaciar = renderVentas()

    await completarYConfirmar(user)

    expect(await screen.findByText('¡Pedido confirmado!')).toBeInTheDocument()
    expect(screen.getByText('ORD-15')).toBeInTheDocument()
    expect(vaciar).toHaveBeenCalled()

    const post = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST')
    expect(post[1].headers.Authorization).toBe('Bearer tok-cliente')
    expect(JSON.parse(post[1].body)).toEqual({
      tipoCliente: 'Residencial', direccion: 'Calle Nueva 789', comuna: 'Chillán', metodoPago: 'Efectivo',
      detalles: [{ productoId: 2, cantidad: 2 }],
    })
    expect(fetchMock.mock.calls.some(([url, o]) => o?.method === 'PUT' && url.endsWith('/api/v1/ventas/15/confirmar'))).toBe(true)
  })

  test('si ms-ventas rechaza la venta (409 sin stock) muestra el motivo y no vacía el carrito', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', simularApi({
      post: () => json(409, { status: 409, message: 'Stock insuficiente para: Cilindro GLP 11 kg' }),
      put: () => json(500, {}),
    }))
    const vaciar = renderVentas()

    await completarYConfirmar(user)

    expect(await screen.findByText('Stock insuficiente para: Cilindro GLP 11 kg')).toBeInTheDocument()
    expect(vaciar).not.toHaveBeenCalled()
  })

  test('si el pago falla la venta queda pendiente y se puede reintentar sobre la misma venta', async () => {
    const user = userEvent.setup()
    const put = vi.fn()
      .mockReturnValueOnce(json(500, { message: 'Fallo al consultar un servicio externo' }))
      .mockReturnValueOnce(json(200, { id: 15, total: 24000, estado: 'PAGADA' }))
    const fetchMock = simularApi({ post: () => json(201, { id: 15, total: 24000 }), put })
    vi.stubGlobal('fetch', fetchMock)
    renderVentas()

    await completarYConfirmar(user)

    expect(await screen.findByText('No se pudo realizar el pago')).toBeInTheDocument()
    expect(screen.getByText('ORD-15')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Reintentar pago/ }))
    expect(await screen.findByText('¡Pedido confirmado!')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([, o]) => o?.method === 'POST')).toHaveLength(1) // no se duplica la venta
    expect(put).toHaveBeenCalledTimes(2)
  })
})
