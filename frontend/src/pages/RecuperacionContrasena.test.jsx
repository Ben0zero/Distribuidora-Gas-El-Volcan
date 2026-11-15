// Recuperación de contraseña: solicitar el enlace y restablecer con el token (fetch simulado).
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import RecuperarContrasena from './RecuperarContrasena'
import RestablecerContrasena from './RestablecerContrasena'

const GENERICO = 'Si la cuenta existe, te enviamos un enlace para restablecer la contraseña. Vence en 15 minutos.'

function json(status, cuerpo = {}) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

function renderEn(ruta) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/recuperar" element={<RecuperarContrasena />} />
        <Route path="/restablecer" element={<RestablecerContrasena />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Recuperación de contraseña', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('solicitar: envía el correo normalizado y muestra el mensaje genérico del backend', async () => {
    fetchMock.mockReturnValueOnce(json(200, { mensaje: GENERICO }))
    const user = userEvent.setup()
    renderEn('/recuperar')

    await user.type(screen.getByLabelText('Correo electrónico'), ' Cliente@ElVolcan.cl ')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(await screen.findByText(GENERICO)).toBeInTheDocument()
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/v1\/auth\/recuperar$/)
    expect(JSON.parse(opciones.body)).toEqual({ usuario: 'cliente@elvolcan.cl' })
    expect(opciones.headers.Authorization).toBeUndefined() // es pública: no envía token
  })

  test('solicitar sin correo no llama a la API', async () => {
    const user = userEvent.setup()
    renderEn('/recuperar')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    expect(screen.getByText('Ingresa tu correo electrónico')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('restablecer: envía el token del enlace y la contraseña nueva', async () => {
    fetchMock.mockReturnValueOnce(json(200, { mensaje: 'Tu contraseña se restableció. Ya puedes iniciar sesión.' }))
    const user = userEvent.setup()
    renderEn('/restablecer?token=abc_TOKEN-123')

    await user.type(screen.getByLabelText('Contraseña nueva'), 'NuevaClave2026')
    await user.type(screen.getByLabelText('Confirmar contraseña nueva'), 'NuevaClave2026')
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(await screen.findByText(/Tu contraseña se restableció/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/v1\/auth\/restablecer$/)
    expect(JSON.parse(opciones.body)).toEqual({ token: 'abc_TOKEN-123', contrasenaNueva: 'NuevaClave2026' })
  })

  test('restablecer valida la política y la confirmación antes de llamar a la API', async () => {
    const user = userEvent.setup()
    renderEn('/restablecer?token=abc')

    await user.type(screen.getByLabelText('Contraseña nueva'), 'abc123')
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
    expect(screen.getByText(/entre 8 y 64 caracteres, con al menos una letra y un número/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('token vencido o usado: muestra el mensaje y ofrece pedir otro enlace', async () => {
    fetchMock.mockReturnValueOnce(
      json(400, { error: 'Datos inválidos (400)', mensaje: 'El enlace no es válido o ya venció. Solicita uno nuevo.' }),
    )
    const user = userEvent.setup()
    renderEn('/restablecer?token=vencido')

    await user.type(screen.getByLabelText('Contraseña nueva'), 'NuevaClave2026')
    await user.type(screen.getByLabelText('Confirmar contraseña nueva'), 'NuevaClave2026')
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(await screen.findByText(/El enlace no es válido o ya venció/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pedir otro enlace' })).toHaveAttribute('href', '/recuperar')
  })

  test('sin token en el enlace no muestra el formulario', () => {
    renderEn('/restablecer')
    expect(screen.getByText(/El enlace no es válido/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña nueva')).not.toBeInTheDocument()
  })
})
