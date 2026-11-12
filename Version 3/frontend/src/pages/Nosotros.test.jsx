// Prueba de estado: el blog se expande/contrae con useState al presionar un botón.
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import Nosotros from './Nosotros'

describe('Página <Nosotros /> (estado con useState)', () => {
  test('expande y contrae el blog al presionar Ver Más / Ver Menos', () => {
    render(<Nosotros />)

    const parrafoOculto = /hemos crecido constantemente/

    // Al inicio los párrafos expandidos NO están en el DOM
    expect(screen.queryByText(parrafoOculto)).toBeNull()

    // Hay dos secciones (dos blogs), cada una con su botón "Ver Más"
    const botonesVerMas = screen.getAllByRole('button', { name: 'Ver Más' })
    expect(botonesVerMas.length).toBe(2)

    // Al hacer click en el primero, el estado cambia y aparece el contenido
    fireEvent.click(botonesVerMas[0])
    expect(screen.getByText(parrafoOculto)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver Menos' })).toBeInTheDocument()
    // El segundo blog sigue cerrado
    expect(screen.getAllByRole('button', { name: 'Ver Más' }).length).toBe(1)

    // Al volver a presionar, se contrae
    fireEvent.click(screen.getByRole('button', { name: 'Ver Menos' }))
    expect(screen.queryByText(parrafoOculto)).toBeNull()
  })
})