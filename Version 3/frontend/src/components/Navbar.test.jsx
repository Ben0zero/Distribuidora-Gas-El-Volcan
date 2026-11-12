// Prueba de componente: la barra de navegación recibe el total por props y
// agrupa las acciones de la cuenta en un menú desplegable.
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach } from 'vitest'
import Navbar from './Navbar'
import { guardarSesion } from '../testUtils/jwt'

describe('Componente <Navbar />', () => {
  beforeEach(() => {
    localStorage.clear()
  })

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

  test('Cliente con sesión: el menú del usuario agrupa "Mis compras" y "Cerrar sesión"', () => {
    guardarSesion({ rol: 'Cliente', nombre: 'Ana' })
    renderNavbar()

    // El saludo abre el desplegable (el botón debe verse siempre, no solo al pasar el mouse)
    fireEvent.click(screen.getByRole('button', { name: /Hola, Ana/ }))

    expect(screen.getByRole('link', { name: /Mis compras/ })).toHaveAttribute('href', '/mis-compras')
    expect(screen.queryByRole('link', { name: /Panel Admin/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Login$/ })).not.toBeInTheDocument()

    // Cerrar sesión borra la sesión guardada
    fireEvent.click(screen.getByRole('button', { name: /Cerrar sesión/ }))
    expect(localStorage.getItem('sesion')).toBeNull()
  })

  test('Administrador ve el enlace al Panel Admin dentro de su menú', () => {
    guardarSesion({ rol: 'Administrador', nombre: 'Juan' })
    renderNavbar()

    fireEvent.click(screen.getByRole('button', { name: /Hola, Juan/ }))
    expect(screen.getByRole('link', { name: /Panel Admin/ })).toHaveAttribute('href', '/admin')
  })

  test('con el token expirado se muestra como visitante (Login/Registro)', () => {
    guardarSesion({ segundos: -5 })
    renderNavbar()
    expect(screen.getByRole('link', { name: /^Login$/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Mis compras/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Hola,/ })).not.toBeInTheDocument()
  })
})

function renderNavbar() {
  render(
    <MemoryRouter>
      <Navbar totalItems={0} />
    </MemoryRouter>,
  )
}
