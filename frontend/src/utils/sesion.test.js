import { describe, test, expect } from 'vitest'
import { rolDesdeApi, rutaInicial, sesionDesdeLogin, ROLES } from './sesion'

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
