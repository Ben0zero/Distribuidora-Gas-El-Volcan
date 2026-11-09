import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Badge, Alert, Spinner } from 'react-bootstrap'
import { listarVentas } from '../../utils/api'
import { formatearPrecio } from '../../utils/validaciones'
import { estadoVenta, formatearFecha, numeroOrden } from '../../utils/ventas'

// Lista de todas las órdenes (GET /api/v1/ventas), solo lectura
function OrdenesVendedor() {
  const [ordenes, setOrdenes] = useState(null) // null = cargando
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    listarVentas()
      .then((data) => activo && setOrdenes([...data].sort((a, b) => b.id - a.id)))
      .catch((e) => {
        if (!activo) return
        setOrdenes([])
        setError(e.message || 'No se pudieron cargar las órdenes.')
      })
    return () => {
      activo = false
    }
  }, [])

  return (
    <section>
      <h1 className="h3 mb-3">Órdenes</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {ordenes === null && (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando órdenes…</span>
        </Spinner>
      )}
      {ordenes?.length === 0 && !error && <Alert variant="info">Aún no hay órdenes registradas.</Alert>}
      {ordenes?.length > 0 && (
        <Table responsive hover className="bg-white align-middle">
          <thead>
            <tr>
              <th>N° orden</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Comuna</th>
              <th className="text-end">Total</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ordenes.map((o) => {
              const estado = estadoVenta(o.estado)
              return (
                <tr key={o.id}>
                  <td className="fw-bold">{numeroOrden(o.id)}</td>
                  <td>{formatearFecha(o.fechaVenta)}</td>
                  <td>{o.usuario || '-'}</td>
                  <td>{o.comuna || '-'}</td>
                  <td className="text-end">{formatearPrecio(o.total)}</td>
                  <td><Badge bg={estado.color}>{estado.texto}</Badge></td>
                  <td className="text-end">
                    <Link to={`/vendedor/ordenes/${o.id}`} className="btn btn-sm btn-outline-primary">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </section>
  )
}

export default OrdenesVendedor
