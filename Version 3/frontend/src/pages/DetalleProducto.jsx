import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap'
import { productosConCreados, desdeApi } from '../utils/productos'
import { obtenerProductoPorId } from '../utils/api'
import { formatearPrecio } from '../utils/validaciones'

// Los productos de la API tienen id numérico; los del catálogo local, ids como 'p1'
const esIdDeApi = (id) => /^\d+$/.test(String(id))

function DetalleProducto({ onAgregar }) {
  const { id } = useParams()
  // Resultado de la API asociado al id consultado (si cambia el id, el anterior se ignora)
  const [resultado, setResultado] = useState({ id: null, producto: undefined })

  useEffect(() => {
    if (!esIdDeApi(id)) return undefined
    let activo = true
    obtenerProductoPorId(id)
      .then((data) => activo && setResultado({ id, producto: desdeApi(data) }))
      .catch(() => activo && setResultado({ id, producto: null }))
    return () => {
      activo = false
    }
  }, [id])

  const producto = esIdDeApi(id)
    ? resultado.id === id ? resultado.producto : undefined
    : productosConCreados().find((p) => p.id === id) || null

  // undefined = cargando desde la API
  if (producto === undefined) {
    return (
      <main className="fondo">
        <Container className="py-5 text-center">
          <Spinner animation="border" role="status" style={{ color: '#ff6600' }}>
            <span className="visually-hidden">Cargando producto…</span>
          </Spinner>
        </Container>
      </main>
    )
  }

  if (!producto) {
    return (
      <main className="fondo">
        <Container className="py-4">
          <Alert variant="warning">Producto no encontrado.</Alert>
          <Button as={Link} to="/productos" variant="primary" className="btn-login">
            Volver a Productos
          </Button>
        </Container>
      </main>
    )
  }

  return (
    <main className="fondo">
      <Container className="py-4 text-center align-items-center" >
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="tarjeta-producto-detalle">
              <Card.Img className="imagen-producto-detalle px-3" variant="top" src={producto.imagen} alt={producto.nombre} />
              <Card.Body>
                <Card.Title>{producto.nombre}</Card.Title>
                <Card.Text className="text-muted">{producto.descripcion}</Card.Text>
                <Card.Text>Categoría: {producto.categoria}</Card.Text>
                <Card.Text>Código: {producto.codigo}</Card.Text>
                <Card.Text className="fw-bold">
                  Precio residencial: {formatearPrecio(producto.residencial)}
                </Card.Text>
                <Card.Text className="fw-bold">
                  Precio comercial: {formatearPrecio(producto.comercial)}
                </Card.Text>
                {producto.stock !== undefined && <Card.Text>Stock disponible: {producto.stock}</Card.Text>}
                <div className="d-flex gap-2 justify-content-center">
                  <Button className="btn-login" variant="primary" onClick={() => onAgregar(producto.id)}>
                    Agregar al carrito
                  </Button>
                  <Button className="btn-login" as={Link} to="/productos" variant="outline-secondary">
                    Volver
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  )
}

export default DetalleProducto
