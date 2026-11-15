// Alta de usuarios por el Admin contra ms-auth (fetch simulado).
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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
  await user.type(screen.getByLabelText(/RUN/), '16.543.217')
  await user.type(screen.getByLabelText('Contraseña (8 a 64)'), contrasena)
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
      nombre: 'Carla Muñoz', rut: '16543217', username: 'carla@elvolcan.cl', password: 'Vende123',
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

  test('al crear rechaza un RUT con dígito verificador inválido sin llamar a la API', async () => {
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nombre Completo'), 'Carla Muñoz')
    await user.type(screen.getByLabelText('Correo (será su usuario)'), 'carla@elvolcan.cl')
    await user.type(screen.getByLabelText(/RUN/), '16543210')
    await user.type(screen.getByLabelText('Contraseña (8 a 64)'), 'Vende123')
    await user.type(screen.getByLabelText('Confirmar Contraseña'), 'Vende123')
    await user.selectOptions(screen.getByLabelText('Rol'), 'VENDEDOR')
    await user.selectOptions(screen.getByLabelText('Región'), 'Región de Ñuble')
    await user.selectOptions(screen.getByLabelText('Comuna'), 'Chillán')
    await user.click(screen.getByRole('button', { name: /Guardar|Crear|Registrar/ }))

    expect(screen.getByText('El dígito verificador del RUT no es válido')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('valida antes de llamar a la API (contraseña mínima de 8 con letra y número)', async () => {
    const user = userEvent.setup()
    await completar(user, { contrasena: 'abc12' })

    expect(screen.getByText('La contraseña debe tener entre 8 y 64 caracteres, con al menos una letra y un número')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('validarNuevoUsuario', () => {
  const valido = {
    nombre: 'Ana', correo: 'ana@elvolcan.cl', run: '17234560', contrasena: 'Clave123', confirmar: 'Clave123',
    telefono: '', rol: 'CLIENTE', region: 'Región de Ñuble', comuna: 'Chillán',
  }

  test('acepta correos de la empresa y exige rol, región y comuna', () => {
    expect(validarNuevoUsuario(valido)).toBe('')
    expect(validarNuevoUsuario({ ...valido, correo: 'sin-arroba' })).toBe('Ingresa un correo válido')
    expect(validarNuevoUsuario({ ...valido, confirmar: 'otra' })).toBe('Las contraseñas no coinciden')
    expect(validarNuevoUsuario({ ...valido, rol: '' })).toBe('Selecciona el rol del usuario')
    expect(validarNuevoUsuario({ ...valido, comuna: '' })).toBe('Selecciona la comuna')
    // al crear se exige el dígito verificador; al editar no (usuarios existentes con DV antiguo)
    expect(validarNuevoUsuario({ ...valido, run: '17234567' })).toBe('El dígito verificador del RUT no es válido')
    expect(validarNuevoUsuario({ ...valido, run: '17234567' }, { requerirContrasena: false })).toBe('')
  })

  test('al editar la contraseña es opcional, pero si se escribe debe ser válida', () => {
    const sinPassword = { ...valido, contrasena: '', confirmar: '' }
    expect(validarNuevoUsuario(sinPassword, { requerirContrasena: false })).toBe('')
    expect(validarNuevoUsuario({ ...sinPassword, contrasena: 'abc12' }, { requerirContrasena: false }))
      .toBe('La contraseña debe tener entre 8 y 64 caracteres, con al menos una letra y un número')
    expect(validarNuevoUsuario({ ...sinPassword, contrasena: 'Clave123' }, { requerirContrasena: false }))
      .toBe('Las contraseñas no coinciden')
  })
})

describe('Edición de usuario (PUT /api/v1/usuarios/:id)', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    guardarSesion({ rol: 'Administrador' })
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('precarga los datos y actualiza sin enviar la contraseña vacía', async () => {
    const user = userEvent.setup()
    fetchMock.mockReturnValueOnce(
      json(200, {
        id: 2,
        nombre: 'Maria Soto',
        rut: '18765432',
        username: 'vendedor@elvolcan.cl',
        nombreRol: 'VENDEDOR',
        telefono: '',
        direccion: '',
        region: 'Región de Ñuble',
        comuna: 'Chillán',
        tipoCliente: 'Residencial',
      }),
    )

    render(
      <MemoryRouter initialEntries={['/admin/usuarios/2/editar']}>
        <Routes>
          <Route path="/admin/usuarios/:id/editar" element={<NuevoUsuario />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByDisplayValue('Maria Soto')).toBeInTheDocument()
    expect(screen.getByDisplayValue('vendedor@elvolcan.cl')).toBeInTheDocument()
    expect(screen.getByLabelText('Nueva contraseña (opcional)')).toHaveValue('')
    // RUT existente con DV antiguo inválido: se muestra formateado y no bloquea la edición
    expect(screen.getByLabelText(/RUN/)).toHaveValue('1.876.543-2')

    const nombre = screen.getByLabelText('Nombre Completo')
    await user.clear(nombre)
    await user.type(nombre, 'María Soto Díaz')

    fetchMock.mockReturnValueOnce(json(200, { id: 2, username: 'vendedor@elvolcan.cl', nombreRol: 'VENDEDOR' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText(/actualizado correctamente con rol VENDEDOR/)).toBeInTheDocument()
    const [url, opciones] = fetchMock.mock.calls[1]
    expect(url).toMatch(/\/api\/v1\/usuarios\/2$/)
    expect(opciones.method).toBe('PUT')
    const cuerpo = JSON.parse(opciones.body)
    expect(cuerpo).toMatchObject({
      nombre: 'María Soto Díaz',
      rut: '18765432', // se envía normalizado, igual que estaba guardado
      username: 'vendedor@elvolcan.cl',
      nombreRol: 'VENDEDOR',
    })
    expect(cuerpo).not.toHaveProperty('password')
  })

  function renderEdicion(idUsuario) {
    render(
      <MemoryRouter initialEntries={[`/admin/usuarios/${idUsuario}/editar`]}>
        <Routes>
          <Route path="/admin/usuarios/:id/editar" element={<NuevoUsuario />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  const ADMIN = {
    id: 1, nombre: 'Juan Perez', rut: '190110222', username: 'admin@duoc.cl', nombreRol: 'ADMIN',
    telefono: '', direccion: '', region: 'Región de Ñuble', comuna: 'Chillán',
  }

  test('H-16: el admin que se edita a sí mismo no puede cambiar su rol (selector bloqueado)', async () => {
    const sesion = guardarSesion({ rol: 'Administrador' })
    localStorage.setItem('sesion', JSON.stringify({ ...sesion, correo: 'ADMIN@duoc.cl' }))
    fetchMock.mockReturnValueOnce(json(200, ADMIN))
    renderEdicion(1)

    expect(await screen.findByDisplayValue('Juan Perez')).toBeInTheDocument()
    expect(screen.getByLabelText('Rol')).toBeDisabled()
    expect(screen.getByText('No puedes cambiar tu propio rol de administrador.')).toBeInTheDocument()
  })

  test('H-16: al editar a otro usuario el selector de rol sigue habilitado', async () => {
    const sesion = guardarSesion({ rol: 'Administrador' })
    localStorage.setItem('sesion', JSON.stringify({ ...sesion, correo: 'otro.admin@duoc.cl' }))
    fetchMock.mockReturnValueOnce(json(200, ADMIN))
    renderEdicion(1)

    expect(await screen.findByDisplayValue('Juan Perez')).toBeInTheDocument()
    expect(screen.getByLabelText('Rol')).toBeEnabled()
  })

  test('H-16: si el backend rechaza quitar el rol al último ADMIN (400) muestra su mensaje', async () => {
    const user = userEvent.setup()
    const sesion = guardarSesion({ rol: 'Administrador' })
    localStorage.setItem('sesion', JSON.stringify({ ...sesion, correo: 'otro.admin@duoc.cl' }))
    fetchMock.mockReturnValueOnce(json(200, ADMIN))
    renderEdicion(1)
    await screen.findByDisplayValue('Juan Perez')

    await user.selectOptions(screen.getByLabelText('Rol'), 'VENDEDOR')
    fetchMock.mockReturnValueOnce(json(400, {
      error: 'Datos inválidos (400)',
      mensaje: 'Debe quedar al menos un administrador: no se puede quitar el rol al último ADMIN',
    }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Debe quedar al menos un administrador: no se puede quitar el rol al último ADMIN'))
      .toBeInTheDocument()
  })
})
