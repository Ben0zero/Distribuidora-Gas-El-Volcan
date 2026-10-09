import { useParams, Link } from 'react-router-dom'
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap'
import { catalogoActual } from '../utils/productos'

function DetalleProducto({ onAgregar }) {
  const { id } = useParams()
  const producto = catalogoActual().find((p) => p.id === id)

  if (!producto) {
    return (
      <main className="fondo">
        <Container className="py-4">
          <Alert variant="warning">Producto no encontrado.</Alert>
          <Button as={Link} to="/productos" variant="primary">
            Volver a Productos
          </Button>
        </Container>
      </main>
    )
  }

  return (
    <main className="fondo">
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card>
              <Card.Img variant="top" src={producto.imagen} alt={producto.nombre} />
              <Card.Body>
                <Card.Title>{producto.nombre}</Card.Title>
                <Card.Text className="text-muted">{producto.descripcion}</Card.Text>
                <Card.Text>Categoría: {producto.categoria}</Card.Text>
                <Card.Text>Código: {producto.codigo}</Card.Text>
                <Card.Text className="fw-bold">
                  Precio residencial: ${producto.residencial.toLocaleString('es-CL')}
                </Card.Text>
                <Card.Text className="fw-bold">
                  Precio comercial: ${producto.comercial.toLocaleString('es-CL')}
                </Card.Text>
                <Card.Text>Stock disponible: {producto.stock}</Card.Text>
                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={() => onAgregar(producto.id)}>
                    Agregar al carrito
                  </Button>
                  <Button as={Link} to="/productos" variant="outline-secondary">
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
