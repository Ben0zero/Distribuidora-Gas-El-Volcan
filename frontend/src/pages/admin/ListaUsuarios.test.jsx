// Usuarios del admin: borrado con confirmación y protección de la propia cuenta.
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import ListaUsuarios from './ListaUsuarios'
import { jwtDePrueba } from '../../testUtils/jwt'

const USUARIOS = [
  { id: 1, nombre: 'Juan Perez', rut: '19011022', username: 'admin@duoc.cl', nombreRol: 'ADMIN' },
  { id: 2, nombre: 'Maria Soto', rut: '18765432', username: 'vendedor@elvolcan.cl', nombreRol: 'VENDEDOR', comuna: 'Chillán' },
]

function json(status, cuerpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(cuerpo) })
}

function sesionAdmin(id = 1) {
  localStorage.setItem(
    'sesion',
    JSON.stringify({ id, nombre: 'Juan Perez', rol: 'Administrador', token: jwtDePrueba() }),
  )
}

function renderLista() {
  render(
    <MemoryRouter>
      <ListaUsuarios />
    </MemoryRouter>,
  )
}

describe('Página admin <ListaUsuarios />', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    sesionAdmin(1)
    fetchMock = vi.fn((url, opciones = {}) => {
      if ((opciones.method || 'GET') === 'DELETE') return json(204, {})
      return json(200, USUARIOS)
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('no permite eliminar la propia cuenta y enlaza a la edición', async () => {
    renderLista()
    expect(await screen.findByText('Maria Soto')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Eliminar Juan Perez' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Eliminar Maria Soto' })).toBeEnabled()

    expect(screen.getByRole('button', { name: 'Editar Maria Soto' })).toHaveAttribute(
      'href',
      '/admin/usuarios/2/editar',
    )
  })

  test('elimina a otro usuario tras confirmar en el modal', async () => {
    renderLista()
    expect(await screen.findByText('Maria Soto')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Maria Soto' }))
    expect(screen.getByText(/¿Seguro que quieres eliminar a/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/v1\/usuarios\/2$/),
        expect.objectContaining({ method: 'DELETE' }),
      ),
    )
    expect(await screen.findByText(/Maria Soto eliminado correctamente/)).toBeInTheDocument()
    expect(screen.queryByText('Maria Soto')).not.toBeInTheDocument()
  })

  test('cancelar el modal no llama a la API', async () => {
    renderLista()
    expect(await screen.findByText('Maria Soto')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Maria Soto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(fetchMock).toHaveBeenCalledTimes(1) // solo el GET inicial
    expect(screen.getByText('Maria Soto')).toBeInTheDocument()
  })
})
