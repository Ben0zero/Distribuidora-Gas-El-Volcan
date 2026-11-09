// Registro contra ms-auth (fetch simulado): éxito, duplicado (409) y sin conexión.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import Registro from './Registro'
import { CLAVES } from '../utils/validaciones'

function json(status, cuerpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

async function completarFormulario(user) {
  await user.type(screen.getByLabelText('Nombre completo'), 'Ana Pérez')
  await user.type(screen.getByLabelText('RUN'), '17234567')
  await user.type(screen.getByLabelText('Correo electrónico'), 'Ana@Duoc.cl')
  await user.type(screen.getByLabelText('Teléfono'), '+56912345678')
  await user.type(screen.getByLabelText('Dirección de despacho'), 'Calle Nueva 789')
  await user.selectOptions(screen.getByLabelText('Región'), 'Región de Ñuble')
  await user.selectOptions(screen.getByLabelText('Comuna'), 'Chillán')
  await user.type(screen.getByLabelText('Contraseña'), 'abc123')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'abc123')
  await user.click(screen.getByLabelText('Acepto los términos y condiciones'))
  await user.click(screen.getByRole('button', { name: 'Registrarse' }))
}

describe('Página <Registro /> (ms-auth)', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter>
        <Registro />
      </MemoryRouter>,
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('envía los datos a POST /api/v1/auth/register y no guarda usuarios en localStorage', async () => {
    const user = userEvent.setup()
    fetchMock.mockReturnValueOnce(json(201, { id: 10, username: 'ana@duoc.cl', nombreRol: 'CLIENTE' }))

    await completarFormulario(user)

    expect(await screen.findByText(/Cuenta creada correctamente/)).toBeInTheDocument()
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/v1\/auth\/register$/)
    expect(JSON.parse(opciones.body)).toEqual({
      nombre: 'Ana Pérez', rut: '17234567', username: 'ana@duoc.cl', password: 'abc123',
      direccion: 'Calle Nueva 789', region: 'Región de Ñuble', comuna: 'Chillán',
      tipoCliente: 'Residencial', telefono: '+56912345678',
    })
    expect(JSON.parse(opciones.body)).not.toHaveProperty('nombreRol') // el rol lo decide el backend
    expect(localStorage.getItem(CLAVES.usuarios)).toBeNull()
  })

  test('si el correo o RUN ya existe (409) muestra un mensaje claro', async () => {
    const user = userEvent.setup()
    fetchMock.mockReturnValueOnce(json(409, { error: 'Conflicto (409)', mensaje: 'Error: El nombre de usuario ya está en uso' }))

    await completarFormulario(user)

    expect(await screen.findByText(/Ya existe una cuenta con ese correo o RUN/)).toBeInTheDocument()
  })

  test('sin conexión avisa que no se pudo contactar al servidor', async () => {
    const user = userEvent.setup()
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await completarFormulario(user)

    expect(await screen.findByText(/No se pudo conectar con el servidor/)).toBeInTheDocument()
  })
})
