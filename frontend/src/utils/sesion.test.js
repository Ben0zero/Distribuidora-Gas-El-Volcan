import { describe, test, expect, beforeEach } from 'vitest'
import { rolDesdeApi, rutaInicial, sesionDesdeLogin, ROLES, leerPayloadJwt, tokenExpirado, sesionActiva } from './sesion'
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
