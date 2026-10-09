// Prueba de componente: verifica props, render en el DOM y el callback (mock).
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

  it('renderiza los props del producto y avisa al agregar (mock)', () => {
    // Mock de la función que manejaría el carrito en el componente padre.
    const onAgregar = jasmine.createSpy('onAgregar')

    render(
      <MemoryRouter>
        <Producto {...producto} onAgregar={onAgregar} />
      </MemoryRouter>,
    )

    // Props visibles en el DOM
    expect(screen.getByText('Cilindro GLP 5 kg')).toBeInTheDocument()
    expect(screen.getByText('Para uso residencial')).toBeInTheDocument()
    expect(screen.getByText(/Precio residencial/)).toHaveTextContent('6.500')

    // Comportamiento: al hacer click se llama al callback con el id correcto
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))
    expect(onAgregar).toHaveBeenCalledWith('p1')
    expect(onAgregar).toHaveBeenCalledTimes(1)
  })
})
