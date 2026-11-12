// Prueba de componente: verifica props, render en el DOM y el callback (mock).
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, vi } from 'vitest'
import Producto from './Producto'

describe('Componente <Producto />', () => {
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
})