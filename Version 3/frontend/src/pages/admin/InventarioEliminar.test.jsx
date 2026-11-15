// Botón Eliminar del inventario del Admin: se habilita solo si el producto no tiene ventas
// (GET /api/v1/ventas/productos-vendidos, pedido una sola vez) y el DELETE muestra el 409 del backend.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import Inventario from './Inventario'
import { guardarSesion } from '../../testUtils/jwt'

const CATALOGO = [
  { id: 1, sku: 'CL001', nombre: 'Cilindro GLP 5 kg', precioResidencial: 6500, precioComercial: 6000, categoria: 'Cilindros de Gas', activo: true },
  { id: 90, sku: 'TEST-01', nombre: 'Producto de prueba', precioResidencial: 1000, precioComercial: 900, categoria: 'Accesorios', activo: true },
]

function json(status, cuerpo = {}) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

// vendidos: lista de ids o un número de estado HTTP para simular un error
function api({ vendidos = [1], borrado = 204 } = {}) {
  let catalogo = [...CATALOGO]
  return vi.fn((url, opciones = {}) => {
    const metodo = opciones.method || 'GET'
    if (metodo === 'GET' && url.endsWith('/api/v1/productos/todos')) return json(200, catalogo)
    if (metodo === 'GET' && url.endsWith('/api/v1/inventario')) return json(200, [])
    if (metodo === 'GET' && url.endsWith('/api/v1/ventas/productos-vendidos')) {
      return typeof vendidos === 'number' ? json(vendidos, {}) : json(200, vendidos)
    }
    if (metodo === 'DELETE' && /\/api\/v1\/productos\/[^/]+$/.test(url)) {
      if (borrado === 204) {
        const sku = decodeURIComponent(url.split('/').pop())
        catalogo = catalogo.filter((p) => p.sku !== sku)
        return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) })
      }
      return json(borrado, { error: 'Conflicto (409)', mensaje: 'El producto tiene ventas registradas; desactívalo en lugar de eliminarlo' })
    }
    return json(404)
  })
}

const llamadas = (fetchMock, metodo, patron) =>
  fetchMock.mock.calls.filter(([url, o = {}]) => (o.method || 'GET') === metodo && patron.test(url))

async function filaDe(nombre) {
  return (await screen.findByText(nombre)).closest('tr')
}

describe('Botón Eliminar en <Inventario /> del Admin', () => {
  beforeEach(() => {
    localStorage.clear()
    guardarSesion({ rol: 'Administrador' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('cada fila tiene Editar, Desactivar y Eliminar; Eliminar habilitado si no tiene ventas', async () => {
    vi.stubGlobal('fetch', api({ vendidos: [1] }))
    render(<Inventario />)
    const fila = await filaDe('Producto de prueba')

    expect(within(fila).getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(within(fila).getByRole('button', { name: 'Desactivar' })).toBeInTheDocument()
    const eliminar = within(fila).getByRole('button', { name: 'Eliminar' })
    await vi.waitFor(() => expect(eliminar).toBeEnabled())
    expect(eliminar).toHaveClass('btn-danger')
  })

  test('con ventas, Eliminar queda deshabilitado (gris) con el motivo', async () => {
    vi.stubGlobal('fetch', api({ vendidos: [1] }))
    render(<Inventario />)
    const fila = await filaDe('Cilindro GLP 5 kg')

    const eliminar = within(fila).getByRole('button', { name: 'Eliminar' })
    expect(eliminar).toBeDisabled()
    expect(eliminar).toHaveClass('btn-secondary')
    expect(eliminar.parentElement).toHaveAttribute('title', 'Tiene ventas registradas; puedes desactivarlo')
  })

  test('si no se pudo cargar la lista de vendidos, todos los Eliminar quedan deshabilitados', async () => {
    vi.stubGlobal('fetch', api({ vendidos: 502 }))
    render(<Inventario />)
    await filaDe('Producto de prueba')

    const botones = screen.getAllByRole('button', { name: 'Eliminar' })
    expect(botones).toHaveLength(2)
    for (const boton of botones) {
      expect(boton).toBeDisabled()
      expect(boton.parentElement).toHaveAttribute('title', 'No se pudo verificar si tiene ventas')
    }
  })

  test('si se cancela la confirmación no se envía el DELETE', async () => {
    const user = userEvent.setup()
    const fetchMock = api({ vendidos: [1] })
    vi.stubGlobal('fetch', fetchMock)
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<Inventario />)
    const fila = await filaDe('Producto de prueba')
    const eliminar = within(fila).getByRole('button', { name: 'Eliminar' })
    await vi.waitFor(() => expect(eliminar).toBeEnabled())

    await user.click(eliminar)

    expect(confirmar).toHaveBeenCalledWith(expect.stringContaining('Esta acción no se puede deshacer'))
    expect(llamadas(fetchMock, 'DELETE', /\/api\/v1\/productos\//)).toHaveLength(0)
  })

  test('al confirmar envía DELETE por SKU y el producto desaparece; los vendidos se piden una sola vez', async () => {
    const user = userEvent.setup()
    const fetchMock = api({ vendidos: [1] })
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<Inventario />)
    const fila = await filaDe('Producto de prueba')
    const eliminar = within(fila).getByRole('button', { name: 'Eliminar' })
    await vi.waitFor(() => expect(eliminar).toBeEnabled())

    await user.click(eliminar)

    expect(await screen.findByText('"Producto de prueba" se eliminó del catálogo y del inventario')).toBeInTheDocument()
    expect(screen.queryByText('Producto de prueba')).not.toBeInTheDocument()
    const [borrado] = llamadas(fetchMock, 'DELETE', /\/api\/v1\/productos\//)
    expect(borrado[0]).toMatch(/\/api\/v1\/productos\/TEST-01$/)
    expect(llamadas(fetchMock, 'GET', /\/productos-vendidos$/)).toHaveLength(1)
  })

  test('si el backend responde 409 muestra su mensaje y el producto sigue en la lista', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', api({ vendidos: [], borrado: 409 }))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<Inventario />)
    const fila = await filaDe('Producto de prueba')
    const eliminar = within(fila).getByRole('button', { name: 'Eliminar' })
    await vi.waitFor(() => expect(eliminar).toBeEnabled())

    await user.click(eliminar)

    expect(await screen.findByText('El producto tiene ventas registradas; desactívalo en lugar de eliminarlo')).toBeInTheDocument()
    expect(screen.getByText('Producto de prueba')).toBeInTheDocument()
  })
})
