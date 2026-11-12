import { renderHook, waitFor } from '@testing-library/react'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { useCatalogo } from './useCatalogo'

describe('hook useCatalogo', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('carga los productos de la API con ids numéricos', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ id: 1, sku: 'CL001', nombre: 'Cilindro GLP 5 kg', precioResidencial: 6500, precioComercial: 6000 }]),
    })
    const { result } = renderHook(() => useCatalogo())

    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.sinConexion).toBe(false)
    expect(result.current.productos).toHaveLength(1)
    expect(result.current.productos[0]).toMatchObject({ id: 1, codigo: 'CL001', residencial: 6500 })
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/productos$/)
  })

  test('sin conexión usa el catálogo local de referencia y lo indica', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { result } = renderHook(() => useCatalogo())

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.sinConexion).toBe(true)
    expect(result.current.productos).toHaveLength(14) // datos/productos.js
  })
})
