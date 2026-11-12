// Página de catálogo: carga desde la API simulada y prueba el buscador
// (filtrado en vivo, sugerencias y aviso de "sin resultados").
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import Productos from './Productos'

const API = [
  {
    id: 1,
    sku: 'CL005',
    nombre: 'Cilindro GLP 5 kg',
    descripcion: 'Cilindro para uso doméstico',
    precioResidencial: 6500,
    precioComercial: 6000,
    categoria: 'Cilindros de Gas',
    imagen: '/IMAGENES/cilindro.png',
  },
  {
    id: 2,
    sku: 'RE001',
    nombre: 'Regulador de presión',
    descripcion: 'Regulador para cilindros de 5 y 11 kg',
    precioResidencial: 3500,
    precioComercial: 3000,
    categoria: 'Reguladores',
    imagen: '/IMAGENES/regulador.png',
  },
]

function renderProductos(ruta = '/productos') {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Productos onAgregar={vi.fn()} />
    </MemoryRouter>,
  )
}

const buscador = () => screen.getByRole('searchbox', { name: /Buscar productos/i })

describe('Página <Productos />', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(API),
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('muestra los productos y ambos precios', async () => {
    renderProductos()

    expect(await screen.findByText('Cilindro GLP 5 kg')).toBeInTheDocument()
    expect(screen.getByText('Regulador de presión')).toBeInTheDocument()
    expect(screen.getAllByText(/Residencial:/).length).toBe(2)
    expect(screen.getAllByText(/Comercial:/).length).toBe(2)
  })

  test('filtra mientras se escribe sin distinguir mayúsculas ni tildes', async () => {
    renderProductos()
    await screen.findByText('Cilindro GLP 5 kg')

    fireEvent.change(buscador(), { target: { value: 'PRESION' } })

    // La tarjeta sigue visible (además puede aparecer como sugerencia)
    expect(screen.getAllByText('Regulador de presión').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Cilindro GLP 5 kg')).toHaveLength(0)
    expect(screen.getByText(/1 producto encontrado/)).toBeInTheDocument()
  })

  test('sugiere palabras clave y permite usarlas con un clic', async () => {
    renderProductos()
    await screen.findByText('Cilindro GLP 5 kg')

    fireEvent.change(buscador(), { target: { value: 'cil' } })
    const sugerencia = screen.getByRole('button', { name: 'Cilindro' })
    fireEvent.click(sugerencia)

    expect(buscador()).toHaveValue('Cilindro')
    expect(screen.getAllByText('Cilindro GLP 5 kg').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Regulador de presión')).toHaveLength(0)
  })

  test('avisa cuando no hay resultados y combina con la categoría', async () => {
    renderProductos('/productos?categoria=Reguladores')
    await screen.findByText('Regulador de presión')

    // La categoría ya excluye el cilindro
    expect(screen.queryAllByText('Cilindro GLP 5 kg')).toHaveLength(0)

    fireEvent.change(buscador(), { target: { value: 'cilindro' } })

    expect(screen.getByRole('alert')).toHaveTextContent(/No se encontraron productos/)
    expect(screen.getByRole('button', { name: 'Limpiar búsqueda' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver todas las categorías' })).toBeInTheDocument()
  })
})
