// Inventario del Admin contra la API (fetch simulado según URL y método).
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import Inventario from './Inventario'
import { guardarSesion } from '../../testUtils/jwt'

const CATALOGO = [
  { id: 1, sku: 'CL001', nombre: 'Cilindro GLP 5 kg', precioResidencial: 6500, precioComercial: 6000, categoria: 'Cilindros de Gas' },
  { id: 2, sku: 'CL002', nombre: 'Cilindro GLP 11 kg', precioResidencial: 12000, precioComercial: 11000, categoria: 'Cilindros de Gas' },
]
const STOCK = [{ sku: 'CL001', stockActual: 80, bajoStock: false }, { sku: 'CL002', stockActual: 3, bajoStock: true }]

function json(status, cuerpo = {}) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

function api() {
  return vi.fn((url, opciones = {}) => {
    const metodo = opciones.method || 'GET'
    if (metodo === 'GET' && url.endsWith('/api/v1/productos')) return json(200, CATALOGO)
    if (metodo === 'GET' && url.endsWith('/api/v1/inventario')) return json(200, STOCK)
    if (metodo === 'POST' && url.endsWith('/api/v1/productos')) return json(200, { id: 3 })
    if (metodo === 'PUT' && /\/api\/v1\/productos\/\d+$/.test(url)) return json(200, {})
    if (metodo === 'PUT' && /\/api\/v1\/inventario\/(aumentar|disminuir)$/.test(url)) return json(200, {})
    if (metodo === 'DELETE') return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) })
    return json(404)
  })
}

const llamadas = (fetchMock, metodo, patron) =>
  fetchMock.mock.calls.filter(([url, o = {}]) => (o.method || 'GET') === metodo && patron.test(url))

describe('Página admin <Inventario /> (ms-catalogoProductos + ms-inventario)', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    guardarSesion({ rol: 'Administrador' })
    fetchMock = api()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('lista los productos de la API con su stock y marca el stock crítico', async () => {
    render(<Inventario />)

    const fila = (await screen.findByText('Cilindro GLP 11 kg')).closest('tr')
    expect(within(fila).getByText('3')).toHaveClass('bg-danger')
    expect(within(screen.getByText('Cilindro GLP 5 kg').closest('tr')).getByText('80')).toHaveClass('bg-success')
  })

  test('crear producto: POST al catálogo y luego aumenta el stock inicial', async () => {
    const user = userEvent.setup()
    render(<Inventario />)
    await screen.findByText('Cilindro GLP 5 kg')

    await user.type(screen.getByLabelText(/Código del Producto/), 'cl005')
    await user.type(screen.getByLabelText(/Nombre del Producto/), 'Cilindro GLP 25 kg')
    await user.type(screen.getByLabelText('Precio Residencial ($)'), '25000')
    await user.type(screen.getByLabelText('Precio Comercial ($)'), '23000')
    await user.type(screen.getByLabelText(/Stock Inicial/), '40')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Cilindros de Gas')
    await user.click(screen.getByRole('button', { name: 'Guardar Producto' }))

    expect(await screen.findByText('Producto guardado correctamente en el inventario')).toBeInTheDocument()
    const [post] = llamadas(fetchMock, 'POST', /\/api\/v1\/productos$/)
    expect(JSON.parse(post[1].body)).toMatchObject({ sku: 'CL005', nombre: 'Cilindro GLP 25 kg', precioResidencial: 25000 })
    const [aumento] = llamadas(fetchMock, 'PUT', /\/inventario\/aumentar$/)
    expect(JSON.parse(aumento[1].body)).toEqual({ sku: 'CL005', stockActual: 40 })
  })

  test('editar: PUT del producto y ajuste de stock solo por la diferencia', async () => {
    const user = userEvent.setup()
    render(<Inventario />)
    const fila = (await screen.findByText('Cilindro GLP 5 kg')).closest('tr')

    await user.click(within(fila).getByRole('button', { name: 'Editar' }))
    const stock = screen.getByLabelText('Stock')
    await user.clear(stock)
    await user.type(stock, '70') // 80 -> 70: disminuir 10
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Producto actualizado correctamente')).toBeInTheDocument()
    expect(llamadas(fetchMock, 'PUT', /\/api\/v1\/productos\/1$/)).toHaveLength(1)
    const [disminucion] = llamadas(fetchMock, 'PUT', /\/inventario\/disminuir$/)
    expect(JSON.parse(disminucion[1].body)).toEqual({ sku: 'CL001', stockActual: 10 })
  })

  test('eliminar pide confirmación y desactiva el producto por SKU', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<Inventario />)
    const fila = (await screen.findByText('Cilindro GLP 11 kg')).closest('tr')

    await user.click(within(fila).getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByText('Producto eliminado del catálogo')).toBeInTheDocument()
    expect(llamadas(fetchMock, 'DELETE', /\/api\/v1\/productos\/CL002$/)).toHaveLength(1)
  })
})
