import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, Row, Col, Badge, Alert, Spinner } from 'react-bootstrap'
import { obtenerProductoPorId, obtenerStockPorSku } from '../../utils/api'
import { desdeApi } from '../../utils/productos'
import { formatearPrecio } from '../../utils/validaciones'

// Detalle de un producto (catálogo + stock de ms-inventario), solo lectura
function DetalleProductoVendedor() {
  const { id } = useParams()
  const [estado, setEstado] = useState({ id: null, producto: undefined, stock: undefined, error: '' })

  useEffect(() => {
    let activo = true
    obtenerProductoPorId(id)
      .then(async (data) => {
        const producto = desdeApi(data)
        // el stock es un dato extra: si falla, se muestra el producto igual
        const stock = await obtenerStockPorSku(producto.codigo).catch(() => null)
        if (activo) setEstado({ id, producto, stock, error: '' })
      })
      .catch(() => activo && setEstado({ id, producto: null, stock: null, error: 'Producto no encontrado.' }))
    return () => {
      activo = false
    }
  }, [id])

  const cargando = estado.id !== id

  return (
    <section>
      <Link to="/vendedor/productos" className="d-inline-block mb-3">← Volver a productos</Link>
      {cargando && (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando producto…</span>
        </Spinner>
      )}
      {!cargando && estado.error && <Alert variant="warning">{estado.error}</Alert>}
      {!cargando && estado.producto && (
        <Card className="bg-white">
          <Row className="g-0">
            <Col md={4} className="p-3 text-center">
              <img src={estado.producto.imagen} alt={estado.producto.nombre} className="img-fluid" style={{ maxHeight: 220 }} />
            </Col>
            <Col md={8}>
              <Card.Body>
                <Card.Title as="h1" className="h4">{estado.producto.nombre}</Card.Title>
                <Card.Text className="text-muted">{estado.producto.descripcion}</Card.Text>
                <dl className="row mb-0">
                  <dt className="col-sm-4">Código</dt>
                  <dd className="col-sm-8">{estado.producto.codigo}</dd>
                  <dt className="col-sm-4">Categoría</dt>
                  <dd className="col-sm-8">{estado.producto.categoria}</dd>
                  <dt className="col-sm-4">Precio residencial</dt>
                  <dd className="col-sm-8">{formatearPrecio(estado.producto.residencial)}</dd>
                  <dt className="col-sm-4">Precio comercial</dt>
                  <dd className="col-sm-8">{formatearPrecio(estado.producto.comercial)}</dd>
                  <dt className="col-sm-4">Stock disponible</dt>
                  <dd className="col-sm-8">
                    {estado.stock ? (
                      <>
                        {estado.stock.stockActual}{' '}
                        {estado.stock.bajoStock && <Badge bg="danger">Stock crítico</Badge>}
                      </>
                    ) : (
                      'No disponible'
                    )}
                  </dd>
                </dl>
              </Card.Body>
            </Col>
          </Row>
        </Card>
      )}
    </section>
  )
}

export default DetalleProductoVendedor
