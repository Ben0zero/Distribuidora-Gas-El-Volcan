import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, Table, Badge, Alert, Spinner } from 'react-bootstrap'
import { obtenerVenta } from '../../utils/api'
import { useCatalogo } from '../../utils/useCatalogo'
import { formatearPrecio } from '../../utils/validaciones'
import { estadoVenta, formatearFecha, numeroOrden, nombreProducto } from '../../utils/ventas'

// Detalle de una orden (GET /api/v1/ventas/{id}), solo lectura
function DetalleOrdenVendedor() {
  const { id } = useParams()
  const { productos } = useCatalogo()
  const [estado, setEstado] = useState({ id: null, orden: null, error: '' })

  useEffect(() => {
    let activo = true
    obtenerVenta(id)
      .then((orden) => activo && setEstado({ id, orden, error: '' }))
      .catch((e) => activo && setEstado({ id, orden: null, error: e.status === 404 ? 'Orden no encontrada.' : e.message }))
    return () => {
      activo = false
    }
  }, [id])

  const cargando = estado.id !== id
  const orden = estado.orden

  return (
    <section>
      <Link to="/vendedor/ordenes" className="d-inline-block mb-3">← Volver a órdenes</Link>
      {cargando && (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando orden…</span>
        </Spinner>
      )}
      {!cargando && estado.error && <Alert variant="warning">{estado.error}</Alert>}
      {!cargando && orden && (
        <Card className="bg-white">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <Card.Title as="h1" className="h4">Orden {numeroOrden(orden.id)}</Card.Title>
              <Badge bg={estadoVenta(orden.estado).color} className="fs-6">{estadoVenta(orden.estado).texto}</Badge>
            </div>
            <dl className="row">
              <dt className="col-sm-3">Cliente</dt>
              <dd className="col-sm-9">{orden.usuario || '-'}</dd>
              <dt className="col-sm-3">Fecha</dt>
              <dd className="col-sm-9">{formatearFecha(orden.fechaVenta)}</dd>
              <dt className="col-sm-3">Despacho</dt>
              <dd className="col-sm-9">{orden.direccion ? `${orden.direccion}, ${orden.comuna}` : '-'}</dd>
              <dt className="col-sm-3">Método de pago</dt>
              <dd className="col-sm-9">{orden.metodoPago || '-'}</dd>
            </dl>
            <Table responsive className="align-middle">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="text-end">Cantidad</th>
                  <th className="text-end">Precio unitario</th>
                  <th className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(orden.detalles || []).map((d) => (
                  <tr key={d.id ?? d.productoId}>
                    <td>{nombreProducto(productos, d.productoId)}</td>
                    <td className="text-end">{d.cantidad}</td>
                    <td className="text-end">{formatearPrecio(d.precioUnitario)}</td>
                    <td className="text-end">{formatearPrecio(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={3} className="text-end">Total</th>
                  <th className="text-end">{formatearPrecio(orden.total)}</th>
                </tr>
              </tfoot>
            </Table>
          </Card.Body>
        </Card>
      )}
    </section>
  )
}

export default DetalleOrdenVendedor
