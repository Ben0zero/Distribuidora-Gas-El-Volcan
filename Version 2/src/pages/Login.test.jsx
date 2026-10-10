// Prueba de formulario (como en la guía): render, escritura, reacción de las
// validaciones ante datos incorrectos y flujo completo de inicio/cierre de sesión.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach } from 'vitest'
import Login from './Login'
import { CLAVES } from '../utils/validaciones'

describe('Página <Login /> (formulario controlado)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('valida correo, contraseña y credenciales; inicia sesión (cliente y admin) y cierra sesión', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    // El formulario y sus campos (asociados por label) están presentes
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
    const inputEmail = screen.getByLabelText('Correo electrónico')
    const inputPassword = screen.getByLabelText('Contraseña')
    expect(inputEmail).toBeInTheDocument()
    expect(inputPassword).toBeInTheDocument()

    // El usuario escribe y el estado del formulario se actualiza
    await user.type(inputEmail, 'hernan')
    await user.type(inputPassword, '12345')
    expect(inputEmail).toHaveValue('hernan')
    expect(inputPassword).toHaveValue('12345')

    // 1) Correo inválido -> error
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText('El correo electrónico no es válido')).toBeInTheDocument()

    // 2) Correo válido pero contraseña muy corta -> error
    await user.clear(inputEmail)
    await user.type(inputEmail, 'ana@duoc.cl')
    await user.clear(inputPassword)
    await user.type(inputPassword, '123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText('La contraseña debe tener al menos 4 caracteres')).toBeInTheDocument()

    // 3) Credenciales que no existen -> error
    await user.clear(inputPassword)
    await user.type(inputPassword, 'Admin123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument()

    // 4) Cliente registrado inicia sesión -> vista de sesión sin Panel Admin.
    // Se usa el formato "legacy" (email/password y sin rol) para cubrir ambos
    // campos de respaldo de la validación; el rol por defecto es "Cliente".
    localStorage.setItem(
      CLAVES.usuarios,
      JSON.stringify([{ email: 'ana@duoc.cl', password: 'abc123', nombre: 'Ana Pérez' }]),
    )
    await user.clear(inputPassword)
    await user.type(inputPassword, 'abc123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText(/Sesión iniciada: Ana Pérez \(Cliente\)/)).toBeInTheDocument()
    expect(screen.queryByText('Panel Admin')).not.toBeInTheDocument()

    // 5) Cerrar sesión vuelve a mostrar el formulario
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()

    // 6) Administrador inicia sesión -> vista de sesión con Panel Admin
    // (tras el cierre de sesión el formulario se reconstruyó: se vuelven a obtener los campos)
    const emailAdmin = screen.getByLabelText('Correo electrónico')
    const passwordAdmin = screen.getByLabelText('Contraseña')
    await user.clear(emailAdmin)
    await user.type(emailAdmin, 'admin@duoc.cl')
    await user.clear(passwordAdmin)
    await user.type(passwordAdmin, 'Admin123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText(/Sesión iniciada: Juan Pérez \(Administrador\)/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Panel Admin' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver productos' })).toBeInTheDocument()
  })
})