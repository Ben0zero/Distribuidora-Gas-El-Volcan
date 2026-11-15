// Página de catálogo: carga desde la API simulada y prueba el buscador
// (filtrado en vivo, productos sugeridos que llevan al detalle y aviso de "sin resultados").
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom'
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

// Página de detalle simulada: solo muestra el id recibido en la ruta
function DetalleSimulado() {
  const { id } = useParams()
  return <h1>Detalle del producto {id}</h1>
}

function renderProductos(ruta = '/productos') {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/productos" element={<Productos onAgregar={vi.fn()} />} />
        <Route path="/producto/:id" element={<DetalleSimulado />} />
      </Routes>
    </MemoryRouter>,
  )
}

const buscador = () => screen.getByRole('combobox', { name: /Buscar productos/i })

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

  test('sugiere productos mientras se escribe y al elegir uno abre su detalle', async () => {
    renderProductos()
    await screen.findByText('Cilindro GLP 5 kg')

    fireEvent.change(buscador(), { target: { value: 'CILÍNDRO' } }) // sin distinguir mayúsculas ni tildes
    const lista = screen.getByRole('listbox', { name: 'Productos sugeridos' })
    expect(buscador()).toHaveAttribute('aria-expanded', 'true')
    const opcion = screen.getByRole('option', { name: /Cilindro GLP 5 kg/ })
    expect(lista).toContainElement(opcion)
    expect(screen.queryByRole('option', { name: /Regulador/ })).not.toBeInTheDocument()

    fireEvent.mouseDown(opcion)
    expect(await screen.findByRole('heading', { name: 'Detalle del producto 1' })).toBeInTheDocument()
  })

  test('el teclado recorre las sugerencias: flecha abajo + Enter abre el detalle; Esc cierra la lista', async () => {
    renderProductos()
    await screen.findByText('Cilindro GLP 5 kg')

    fireEvent.change(buscador(), { target: { value: 're001' } }) // también por código (SKU)
    fireEvent.keyDown(buscador(), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    // con la lista cerrada, flecha abajo la reabre y marca la primera sugerencia
    fireEvent.keyDown(buscador(), { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: /Regulador de presión/ })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(buscador(), { key: 'Enter' })

    expect(await screen.findByRole('heading', { name: 'Detalle del producto 2' })).toBeInTheDocument()
  })

  test('no sugiere nada con un solo carácter', async () => {
    renderProductos()
    await screen.findByText('Cilindro GLP 5 kg')

    fireEvent.change(buscador(), { target: { value: 'c' } })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
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
