// Cambio de contraseña con sesión iniciada (PUT /api/v1/cuenta/contrasena, fetch simulado).
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import CambiarContrasena from './CambiarContrasena'
import { guardarSesion } from '../testUtils/jwt'

function json(status, cuerpo = {}) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

async function completar(user, { actual = 'Cliente123', nueva = 'NuevaClave2026', confirmar = nueva } = {}) {
  if (actual) await user.type(screen.getByLabelText('Contraseña actual'), actual)
  if (nueva) await user.type(screen.getByLabelText('Contraseña nueva'), nueva)
  if (confirmar) await user.type(screen.getByLabelText('Confirmar contraseña nueva'), confirmar)
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
}

describe('Página <CambiarContrasena />', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    guardarSesion({ rol: 'Cliente', nombre: 'Pedro' })
    fetchMock = vi.fn(() => json(204))
    vi.stubGlobal('fetch', fetchMock)
    render(<CambiarContrasena />)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('envía la contraseña actual y la nueva con el token, y limpia el formulario', async () => {
    const user = userEvent.setup()
    await completar(user)

    expect(await screen.findByText('Tu contraseña se cambió correctamente.')).toBeInTheDocument()
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/v1\/cuenta\/contrasena$/)
    expect(opciones.method).toBe('PUT')
    expect(opciones.headers.Authorization).toMatch(/^Bearer /)
    expect(JSON.parse(opciones.body)).toEqual({ contrasenaActual: 'Cliente123', contrasenaNueva: 'NuevaClave2026' })
    expect(screen.getByLabelText('Contraseña actual')).toHaveValue('')
  })

  test('valida la política y la confirmación antes de llamar a la API', async () => {
    const user = userEvent.setup()
    await completar(user, { nueva: 'abc123' })
    expect(screen.getByText(/entre 8 y 64 caracteres, con al menos una letra y un número/)).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Contraseña nueva'))
    await user.clear(screen.getByLabelText('Confirmar contraseña nueva'))
    await completar(user, { actual: '', nueva: 'NuevaClave2026', confirmar: 'OtraClave2026' })
    expect(screen.getByText('Las contraseñas nuevas no coinciden')).toBeInTheDocument()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('muestra el mensaje del backend si la contraseña actual es incorrecta', async () => {
    fetchMock.mockReturnValueOnce(json(400, { error: 'Datos inválidos (400)', mensaje: 'La contraseña actual no es correcta' }))
    const user = userEvent.setup()
    await completar(user, { actual: 'Mala1234' })

    expect(await screen.findByText('La contraseña actual no es correcta')).toBeInTheDocument()
    expect(screen.queryByText(/se cambió correctamente/)).not.toBeInTheDocument()
  })
})
