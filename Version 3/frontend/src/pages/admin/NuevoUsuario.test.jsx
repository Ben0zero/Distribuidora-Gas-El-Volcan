// Alta de usuarios por el Admin contra ms-auth (fetch simulado).
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import NuevoUsuario from './NuevoUsuario'
import { validarNuevoUsuario } from '../../utils/validaciones'
import { guardarSesion } from '../../testUtils/jwt'

function json(status, cuerpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

async function completar(user, { rol = 'VENDEDOR', contrasena = 'Vende123' } = {}) {
  await user.type(screen.getByLabelText('Nombre Completo'), 'Carla Muñoz')
  await user.type(screen.getByLabelText('Correo (será su usuario)'), 'Carla@ElVolcan.cl')
  await user.type(screen.getByLabelText(/RUN/), '16543210')
  await user.type(screen.getByLabelText('Contraseña (6 a 10)'), contrasena)
  await user.type(screen.getByLabelText('Confirmar Contraseña'), contrasena)
  await user.selectOptions(screen.getByLabelText('Rol'), rol)
  await user.selectOptions(screen.getByLabelText('Región'), 'Región de Ñuble')
  await user.selectOptions(screen.getByLabelText('Comuna'), 'Chillán')
  await user.click(screen.getByRole('button', { name: 'Registrar' }))
}

describe('Página admin <NuevoUsuario /> (POST /api/v1/usuarios)', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    guardarSesion({ rol: 'Administrador' })
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter>
        <NuevoUsuario />
      </MemoryRouter>,
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('crea un Vendedor con correo de la empresa y envía el rol elegido', async () => {
    const user = userEvent.setup()
    fetchMock.mockReturnValueOnce(json(201, { id: 9, username: 'carla@elvolcan.cl', nombreRol: 'VENDEDOR' }))

    await completar(user)

    expect(await screen.findByText(/Usuario carla@elvolcan.cl registrado correctamente con rol VENDEDOR/)).toBeInTheDocument()
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/v1\/usuarios$/)
    expect(opciones.headers.Authorization).toMatch(/^Bearer /)
    expect(JSON.parse(opciones.body)).toMatchObject({
      nombre: 'Carla Muñoz', rut: '16543210', username: 'carla@elvolcan.cl', password: 'Vende123',
      nombreRol: 'VENDEDOR', region: 'Región de Ñuble', comuna: 'Chillán',
    })
    expect(JSON.parse(opciones.body)).not.toHaveProperty('tipoCliente') // solo aplica a clientes
    expect(localStorage.getItem('usuarios')).toBeNull()
  })

  test('si el correo o RUN ya existe (409) muestra el aviso', async () => {
    const user = userEvent.setup()
    fetchMock.mockReturnValueOnce(json(409, { mensaje: 'Error: El nombre de usuario ya está en uso' }))

    await completar(user)

    expect(await screen.findByText('Ya existe un usuario con ese correo o RUN.')).toBeInTheDocument()
  })

  test('valida antes de llamar a la API (contraseña mínima de 6)', async () => {
    const user = userEvent.setup()
    await completar(user, { contrasena: 'abc12' })

    expect(screen.getByText('La contraseña debe tener entre 6 y 10 caracteres')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('validarNuevoUsuario', () => {
  const valido = {
    nombre: 'Ana', correo: 'ana@elvolcan.cl', run: '17234567', contrasena: 'abc123', confirmar: 'abc123',
    telefono: '', rol: 'CLIENTE', region: 'Región de Ñuble', comuna: 'Chillán',
  }

  test('acepta correos de la empresa y exige rol, región y comuna', () => {
    expect(validarNuevoUsuario(valido)).toBe('')
    expect(validarNuevoUsuario({ ...valido, correo: 'sin-arroba' })).toBe('Ingresa un correo válido')
    expect(validarNuevoUsuario({ ...valido, confirmar: 'otra' })).toBe('Las contraseñas no coinciden')
    expect(validarNuevoUsuario({ ...valido, rol: '' })).toBe('Selecciona el rol del usuario')
    expect(validarNuevoUsuario({ ...valido, comuna: '' })).toBe('Selecciona la comuna')
  })
})
