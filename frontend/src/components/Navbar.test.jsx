// Prueba de componente: la barra de navegación recibe el total por props.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect } from 'vitest'
import Navbar from './Navbar'

describe('Componente <Navbar />', () => {
  test('muestra los enlaces de navegación y el total de items del carrito (prop)', () => {
    render(
      <MemoryRouter>
        <Navbar totalItems={3} />
      </MemoryRouter>,
    )

    // Enlaces principales con sus rutas
    expect(screen.getByRole('link', { name: /Inicio/ })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /Productos/ })).toHaveAttribute('href', '/productos')
    expect(screen.getByRole('link', { name: /Carrito/ })).toHaveAttribute('href', '/carrito')

    // El badge del carrito muestra el prop totalItems
    expect(screen.getByText('3')).toBeInTheDocument()

    // Sin sesión no aparece "Mis compras"
    expect(screen.queryByRole('link', { name: /Mis compras/ })).not.toBeInTheDocument()
  })

  test('con sesión (token) muestra el enlace a "Mis compras"', () => {
    localStorage.setItem('sesion', JSON.stringify({ nombre: 'Ana', token: 'tok' }))
    render(
      <MemoryRouter>
        <Navbar totalItems={0} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Mis compras/ })).toHaveAttribute('href', '/mis-compras')
    localStorage.clear()
  })
})