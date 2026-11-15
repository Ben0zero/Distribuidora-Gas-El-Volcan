import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  rolDesdeApi,
  rutaInicial,
  sesionDesdeLogin,
  ROLES,
  leerPayloadJwt,
  tokenExpirado,
  sesionActiva,
  cerrarSesion,
  tipoPrecioSesion,
  EVENTO_SESION_CERRADA,
} from './sesion'
import { jwtDePrueba, guardarSesion } from '../testUtils/jwt'

describe('utils/sesion: token y sesión activa', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('lee el payload del JWT y detecta tokens expirados o inválidos', () => {
    const vigente = jwtDePrueba({ sub: 'ana@duoc.cl', rol: 'ROLE_ADMIN', segundos: 600 })
    expect(leerPayloadJwt(vigente)).toMatchObject({ sub: 'ana@duoc.cl', rol: 'ROLE_ADMIN' })
    expect(tokenExpirado(vigente)).toBe(false)
    expect(tokenExpirado(jwtDePrueba({ segundos: -1 }))).toBe(true)
    expect(tokenExpirado('no-es-un-jwt')).toBe(true)
    expect(tokenExpirado(undefined)).toBe(true)
  })

  test('sesionActiva devuelve la sesión vigente y borra la expirada', () => {
    guardarSesion({ rol: 'Cliente', nombre: 'Ana' })
    expect(sesionActiva()).toMatchObject({ nombre: 'Ana', rol: 'Cliente' })

    guardarSesion({ segundos: -10 })
    expect(sesionActiva()).toBeNull()
    expect(localStorage.getItem('sesion')).toBeNull()
  })
})

describe('utils/sesion', () => {
  test('traduce el rol de ms-auth (con o sin prefijo ROLE_) y usa Cliente por defecto', () => {
    expect(rolDesdeApi('ADMIN')).toBe(ROLES.ADMIN)
    expect(rolDesdeApi('ROLE_VENDEDOR')).toBe(ROLES.VENDEDOR)
    expect(rolDesdeApi('cliente')).toBe(ROLES.CLIENTE)
    expect(rolDesdeApi(undefined)).toBe(ROLES.CLIENTE)
    expect(rutaInicial(ROLES.ADMIN)).toBe('/admin')
    expect(rutaInicial(ROLES.CLIENTE)).toBe('/')
    expect(rutaInicial(ROLES.VENDEDOR)).toBe('/vendedor')
  })

  test('arma la sesión con los datos devueltos por el login', () => {
    const sesion = sesionDesdeLogin({
      id: 3, nombre: 'Pedro Rojas', username: 'cliente@elvolcan.cl', nombreRol: 'CLIENTE',
      tipoCliente: 'Residencial', direccion: 'Calle Nueva 789', comuna: 'Chillán', token: 'abc',
    })
    expect(sesion).toMatchObject({
      id: 3, nombre: 'Pedro Rojas', correo: 'cliente@elvolcan.cl', rol: 'Cliente',
      direccion: 'Calle Nueva 789', comuna: 'Chillán', token: 'abc',
    })
  })
})

describe('utils/sesion: cerrar sesión vacía el carrito', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('cerrarSesion borra la sesión y el carrito guardados y avisa con un evento', () => {
    guardarSesion({ rol: 'Cliente', nombre: 'Ana' })
    localStorage.setItem('carrito', JSON.stringify([{ id: 2, cantidad: 3 }]))
    const escuchar = vi.fn()
    window.addEventListener(EVENTO_SESION_CERRADA, escuchar)

    cerrarSesion()

    expect(localStorage.getItem('sesion')).toBeNull()
    expect(localStorage.getItem('carrito')).toBeNull()
    expect(escuchar).toHaveBeenCalledTimes(1)
    window.removeEventListener(EVENTO_SESION_CERRADA, escuchar)
  })

  test('si el token venció, también borra el carrito y avisa (después del render)', () => {
    vi.useFakeTimers()
    guardarSesion({ segundos: -10 })
    localStorage.setItem('carrito', JSON.stringify([{ id: 1, cantidad: 1 }]))
    const escuchar = vi.fn()
    window.addEventListener(EVENTO_SESION_CERRADA, escuchar)

    expect(sesionActiva()).toBeNull()
    expect(localStorage.getItem('carrito')).toBeNull()
    // el aviso es diferido: no ocurre mientras React está dibujando
    expect(escuchar).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(escuchar).toHaveBeenCalledTimes(1)

    window.removeEventListener(EVENTO_SESION_CERRADA, escuchar)
    vi.useRealTimers()
  })

  test('tipoPrecioSesion: comercial, residencial o null sin sesión', () => {
    expect(tipoPrecioSesion(null)).toBeNull()
    expect(tipoPrecioSesion({ tipoCliente: 'Comercial' })).toBe('comercial')
    expect(tipoPrecioSesion({ tipoCliente: 'Residencial' })).toBe('residencial')
    expect(tipoPrecioSesion({})).toBe('residencial')
  })
})
