// Prueba de componente: verifica props, render en el DOM y el callback (mock).
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import Producto from './Producto'
import { guardarSesion } from '../testUtils/jwt'

describe('Componente <Producto />', () => {
  beforeEach(() => localStorage.clear())

  const producto = {
    id: 'p1',
    nombre: 'Cilindro GLP 5 kg',
    descripcion: 'Para uso residencial',
    residencial: 6500,
    comercial: 6000,
    imagen: '/x.png',
  }

  test('renderiza los props del producto y avisa al agregar (mock)', () => {
    // Mock de la función que manejaría el carrito en el componente padre.
    const onAgregar = vi.fn()

    render(
      <MemoryRouter>
        <Producto {...producto} onAgregar={onAgregar} />
      </MemoryRouter>,
    )

    // Props visibles en el DOM
    expect(screen.getByText('Cilindro GLP 5 kg')).toBeInTheDocument()
    expect(screen.getByText('Para uso residencial')).toBeInTheDocument()

    // La tarjeta muestra los dos precios (residencial y comercial)
    const tarjeta = screen.getByText('Cilindro GLP 5 kg').closest('.card')
    expect(tarjeta).toHaveTextContent('Residencial: $6.500')
    expect(tarjeta).toHaveTextContent('Comercial: $6.000')

    // Comportamiento: al hacer click se llama al callback con el id correcto
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))
    expect(onAgregar).toHaveBeenCalledWith('p1')
    expect(onAgregar).toHaveBeenCalledTimes(1)
  })

  function renderTarjeta() {
    render(
      <MemoryRouter>
        <Producto {...producto} onAgregar={vi.fn()} />
      </MemoryRouter>,
    )
    const linea = (etiqueta) => screen.getByText(`${etiqueta}:`).closest('p')
    return { residencial: linea('Residencial'), comercial: linea('Comercial') }
  }

  test('sin sesión los dos precios se ven iguales y ninguno dice "Tu precio"', () => {
    const { residencial, comercial } = renderTarjeta()
    expect(screen.queryByText('Tu precio')).not.toBeInTheDocument()
    expect(residencial).not.toHaveClass('text-muted')
    expect(comercial).not.toHaveClass('text-muted')
  })

  test('cliente Comercial: destaca el precio comercial y atenúa el residencial', () => {
    const sesion = guardarSesion({ rol: 'Cliente', nombre: 'Ana' })
    localStorage.setItem('sesion', JSON.stringify({ ...sesion, tipoCliente: 'Comercial' }))
    const { residencial, comercial } = renderTarjeta()
    expect(comercial).toHaveTextContent('Tu precio')
    expect(residencial).toHaveClass('text-muted')
    expect(residencial).not.toHaveTextContent('Tu precio')
  })

  test('cliente Residencial: destaca el precio residencial', () => {
    const sesion = guardarSesion({ rol: 'Cliente', nombre: 'Pedro' })
    localStorage.setItem('sesion', JSON.stringify({ ...sesion, tipoCliente: 'Residencial' }))
    const { residencial, comercial } = renderTarjeta()
    expect(residencial).toHaveTextContent('Tu precio')
    expect(comercial).toHaveClass('text-muted')
  })
})
