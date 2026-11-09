// Prueba de formulario (como en la guía): render, escritura, validaciones y
// flujo de inicio/cierre de sesión contra ms-auth. La API se simula con un
// mock de fetch, así la prueba no depende de que el backend esté levantado.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import Login from './Login'
import { CLAVES } from '../utils/validaciones'

// Respuesta simulada de fetch
function respuesta(status, cuerpo = {}) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

function renderLogin() {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
  return {
    inputEmail: screen.getByLabelText('Correo electrónico'),
    inputPassword: screen.getByLabelText('Contraseña'),
    ingresar: () => screen.getByRole('button', { name: 'Ingresar' }),
  }
}

describe('Página <Login /> (formulario controlado + ms-auth)', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('valida correo y contraseña antes de llamar a la API', async () => {
    const user = userEvent.setup()
    const { inputEmail, inputPassword, ingresar } = renderLogin()

    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()

    // El usuario escribe y el estado del formulario se actualiza
    await user.type(inputEmail, 'hernan')
    await user.type(inputPassword, '12345')
    expect(inputEmail).toHaveValue('hernan')
    expect(inputPassword).toHaveValue('12345')

    // 1) Correo inválido -> error
    await user.click(ingresar())
    expect(screen.getByText('El correo electrónico no es válido')).toBeInTheDocument()

    // 2) Correo válido pero contraseña muy corta -> error
    await user.clear(inputEmail)
    await user.type(inputEmail, 'ana@duoc.cl')
    await user.clear(inputPassword)
    await user.type(inputPassword, '123')
    await user.click(ingresar())
    expect(screen.getByText('La contraseña debe tener al menos 4 caracteres')).toBeInTheDocument()

    // Ninguna validación fallida llega al backend
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('muestra error con 401 o sin conexión y NO usa usuarios locales', async () => {
    const user = userEvent.setup()
    // Aunque exista un usuario en localStorage, el login local ya no es válido
    localStorage.setItem(CLAVES.usuarios, JSON.stringify([{ email: 'ana@duoc.cl', password: 'abc123' }]))
    const { inputEmail, inputPassword, ingresar } = renderLogin()
    await user.type(inputEmail, 'ana@duoc.cl')
    await user.type(inputPassword, 'abc123')

    // 3) La API responde 401 -> credenciales incorrectas
    fetchMock.mockReturnValueOnce(respuesta(401, { mensaje: 'Usuario o contraseña incorrectos' }))
    await user.click(ingresar())
    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument()

    // 4) El servicio no responde (fetch rechaza) -> aviso de conexión
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await user.click(ingresar())
    expect(await screen.findByText(/No se pudo conectar con el servidor/)).toBeInTheDocument()

    expect(localStorage.getItem(CLAVES.sesion)).toBeNull()
  })

  test('inicia sesión como cliente y como administrador con los datos de la API', async () => {
    const user = userEvent.setup()
    const { inputEmail, inputPassword, ingresar } = renderLogin()

    // 5) Cliente: sesión con token y sin botón de Panel Admin
    fetchMock.mockReturnValueOnce(
      respuesta(200, { nombre: 'Ana Pérez', username: 'ana@duoc.cl', nombreRol: 'CLIENTE', tipoCliente: 'Comercial', token: 'tok-cliente' }),
    )
    await user.type(inputEmail, 'ana@duoc.cl')
    await user.type(inputPassword, 'abc123')
    await user.click(ingresar())

    expect(await screen.findByText(/Sesión iniciada: Ana Pérez \(Cliente\)/)).toBeInTheDocument()
    expect(screen.queryByText('Panel Admin')).not.toBeInTheDocument()

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/v1\/auth\/login$/)
    expect(JSON.parse(opciones.body)).toEqual({ username: 'ana@duoc.cl', password: 'abc123' })
    const sesion = JSON.parse(localStorage.getItem(CLAVES.sesion))
    expect(sesion).toMatchObject({ rol: 'Cliente', token: 'tok-cliente', tipoCliente: 'Comercial' })

    // 6) Cerrar sesión vuelve a mostrar el formulario
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()

    // 7) Administrador: el rol viene de la API (nombreRol = ADMIN) -> Panel Admin
    fetchMock.mockReturnValueOnce(
      respuesta(200, { nombre: 'Juan Pérez', username: 'admin@duoc.cl', nombreRol: 'ADMIN', token: 'tok-admin' }),
    )
    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@duoc.cl')
    await user.type(screen.getByLabelText('Contraseña'), 'Admin123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText(/Sesión iniciada: Juan Pérez \(Administrador\)/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Panel Admin' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver productos' })).toBeInTheDocument()
  })
})
