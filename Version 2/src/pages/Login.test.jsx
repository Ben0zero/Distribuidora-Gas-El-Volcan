// Prueba de formulario (como en la guía): render, escritura del usuario y
// reacción de las validaciones ante datos incorrectos.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach } from 'vitest'
import Login from './Login'

describe('Página <Login /> (formulario controlado)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('muestra el formulario, permite escribir y valida un correo incorrecto', async () => {
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

    // Al enviar con correo inválido, aparece el mensaje de error
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText('El correo electrónico no es válido')).toBeInTheDocument()
  })
})