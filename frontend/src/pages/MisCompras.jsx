import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap'
import { CLAVES, leerObjeto, formatearPrecio } from '../utils/validaciones'
import { misCompras, confirmarPago, ApiError } from '../utils/api'
import { useCatalogo } from '../utils/useCatalogo'
import { estadoVenta, formatearFecha, numeroOrden, nombreProducto } from '../utils/ventas'

// Historial de compras del usuario autenticado: GET /api/v1/ventas/mis-compras
function MisCompras() {
  const sesion = leerObjeto(CLAVES.sesion)
  const { productos } = useCatalogo()
  const [compras, setCompras] = useState(null) // null = cargando
  const [error, setError] = useState('')

  const cargar = useCallback(() => {
    misCompras()
      .then((data) => {
        setCompras(data)
        setError('')
      })
      .catch((e) => {
        setCompras([])
        setError(e instanceof ApiError && e.status === 401
          ? 'Tu sesión expiró. Inicia sesión nuevamente.'
          : 'No se pudieron cargar tus compras. Intenta nuevamente en unos minutos.')
      })
  }, [])

  useEffect(() => {
    if (sesion?.token) cargar()
  }, [sesion?.token, cargar])

  const pagar = async (id) => {
    try {
      await confirmarPago(id)
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor.')
    }
  }

  if (!sesion?.token) {
    return (
      <main className="fondo">
        <Container className="py-5 text-center">
          <h2>Inicia sesión para ver tus compras</h2>
          <Button as={Link} to="/login" className="btn-login mt-3">Ir a Login</Button>
        </Container>
      </main>
    )
  }

  return (
    <main className="fondo">
      <Container className="py-4">
        <h1 className="texto-2 mb-4">Mis compras</h1>
        {error && <Alert variant="danger">{error}</Alert>}

        {compras === null && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status" style={{ color: '#ff6600' }}>
              <span className="visually-hidden">Cargando compras…</span>
            </Spinner>
          </div>
        )}

        {compras?.length === 0 && !error && (
          <Alert variant="info">
            Aún no tienes compras. <Link to="/productos">Ir al catálogo</Link>
          </Alert>
        )}

        {compras?.length > 0 && (
          <Table responsive hover className="bg-white align-middle">
            <thead>
              <tr>
                <th>N° orden</th>
                <th>Fecha</th>
                <th>Productos</th>
                <th>Despacho</th>
                <th>Pago</th>
                <th className="text-end">Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((v) => {
                const estado = estadoVenta(v.estado)
                return (
                  <tr key={v.id}>
                    <td className="fw-bold">{numeroOrden(v.id)}</td>
                    <td>{formatearFecha(v.fechaVenta)}</td>
                    <td>
                      {(v.detalles || []).map((d) => (
                        <div key={d.id ?? d.productoId}>{d.cantidad} × {nombreProducto(productos, d.productoId)}</div>
                      ))}
                    </td>
                    <td>{v.direccion ? `${v.direccion}, ${v.comuna}` : '-'}</td>
                    <td>{v.metodoPago || '-'}</td>
                    <td className="text-end">{formatearPrecio(v.total)}</td>
                    <td>
                      <Badge bg={estado.color}>{estado.texto}</Badge>
                      {v.estado === 'PENDIENTE_PAGO' && (
                        <Button size="sm" variant="outline-success" className="ms-2" onClick={() => pagar(v.id)}>
                          Pagar ahora
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Container>
    </main>
  )
}

export default MisCompras
