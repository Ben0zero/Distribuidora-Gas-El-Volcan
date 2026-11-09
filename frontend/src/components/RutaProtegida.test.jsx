// Rutas protegidas por rol: sin sesión -> /login; rol no permitido -> su ruta inicial.
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { describe, test, expect, beforeEach } from 'vitest'
import RutaProtegida from './RutaProtegida'
import { ROLES } from '../utils/sesion'
import { guardarSesion } from '../testUtils/jwt'

function PaginaLogin() {
  const location = useLocation()
  return <p>Página de login (desde: {location.state?.desde})</p>
}

function renderEn(ruta) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/" element={<p>Tienda</p>} />
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/admin" element={<RutaProtegida roles={[ROLES.ADMIN]}><p>Panel de administración</p></RutaProtegida>} />
        <Route path="/ventas" element={<RutaProtegida roles={[ROLES.CLIENTE, ROLES.ADMIN]}><p>Checkout</p></RutaProtegida>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Componente <RutaProtegida />', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('sin sesión redirige a /login recordando la ruta pedida', () => {
    renderEn('/admin')
    expect(screen.getByText('Página de login (desde: /admin)')).toBeInTheDocument()
  })

  test('un Cliente que intenta entrar a /admin vuelve a la tienda', () => {
    guardarSesion({ rol: ROLES.CLIENTE })
    renderEn('/admin')
    expect(screen.getByText('Tienda')).toBeInTheDocument()
    expect(screen.queryByText('Panel de administración')).not.toBeInTheDocument()
  })

  test('el Administrador entra a /admin y el Cliente al checkout', () => {
    guardarSesion({ rol: ROLES.ADMIN })
    renderEn('/admin')
    expect(screen.getByText('Panel de administración')).toBeInTheDocument()
  })

  test('el Cliente accede al checkout', () => {
    guardarSesion({ rol: ROLES.CLIENTE })
    renderEn('/ventas')
    expect(screen.getByText('Checkout')).toBeInTheDocument()
  })

  test('con el token expirado borra la sesión y envía a /login', () => {
    guardarSesion({ rol: ROLES.ADMIN, segundos: -60 })
    renderEn('/admin')
    expect(screen.getByText(/Página de login/)).toBeInTheDocument()
    expect(localStorage.getItem('sesion')).toBeNull()
  })
})
