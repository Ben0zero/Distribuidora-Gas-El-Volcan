// Integración del carrito con la sesión en la app completa (fetch simulado).
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import App from './App'
import { guardarSesion } from './testUtils/jwt'
import { cerrarSesion } from './utils/sesion'

const CATALOGO = [
  { id: 1, sku: 'CL001', nombre: 'Cilindro GLP 5 kg', precioResidencial: 6500, precioComercial: 6000, activo: true },
]

const badgeCarrito = () => screen.getByRole('link', { name: /Carrito/ })

describe('App: el carrito y la sesión', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, '', '/carrito')
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(CATALOGO) })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.pushState({}, '', '/')
  })

  test('al cerrar sesión desde el navbar se vacía el carrito (no lo ve el siguiente usuario)', async () => {
    guardarSesion({ rol: 'Cliente', nombre: 'Ana' })
    localStorage.setItem('carrito', JSON.stringify([{ id: 1, cantidad: 3 }]))
    render(<App />)
    expect(await screen.findByText('Cilindro GLP 5 kg')).toBeInTheDocument()
    expect(badgeCarrito()).toHaveTextContent('3')

    fireEvent.click(screen.getByRole('button', { name: /Hola, Ana/ }))
    fireEvent.click(screen.getByRole('button', { name: /Cerrar sesión/ }))

    expect(badgeCarrito()).toHaveTextContent('0')
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([])
  })

  test('el cierre de sesión de cualquier panel (evento) también vacía el carrito en memoria', async () => {
    guardarSesion({ rol: 'Administrador', nombre: 'Juan' })
    localStorage.setItem('carrito', JSON.stringify([{ id: 1, cantidad: 2 }]))
    render(<App />)
    expect(await screen.findByText('Cilindro GLP 5 kg')).toBeInTheDocument()

    act(() => cerrarSesion())

    expect(badgeCarrito()).toHaveTextContent('0')
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([])
  })

  test('el carrito de un visitante se conserva al iniciar sesión', async () => {
    localStorage.setItem('carrito', JSON.stringify([{ id: 1, cantidad: 2 }]))
    render(<App />)
    expect(await screen.findByText('Cilindro GLP 5 kg')).toBeInTheDocument()

    // iniciar sesión guarda la sesión, pero no toca el carrito
    act(() => {
      guardarSesion({ rol: 'Cliente', nombre: 'Ana' })
      window.history.pushState({}, '', '/carrito')
    })

    expect(badgeCarrito()).toHaveTextContent('2')
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([{ id: 1, cantidad: 2 }])
  })
})
