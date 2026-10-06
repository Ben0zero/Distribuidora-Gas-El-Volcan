import { Link } from 'react-router-dom'
import { Container, Row, Col, ListGroup, Button, Alert } from 'react-bootstrap'
import { PRODUCTOS } from '../datos/productos'

function Carrito({ carrito, incrementar, decrementar, eliminar }) {
  const items = carrito
    .map((item) => ({ ...item, producto: PRODUCTOS.find((p) => p.id === item.id) }))
    .filter((item) => item.producto)

  const total = items.reduce((suma, item) => suma + item.producto.residencial * item.cantidad, 0)

  if (items.length === 0) {
    return (
      <Container className="mt-4">
        <h1>Carrito</h1>
        <Alert variant="info">Aún no hay productos en el carrito.</Alert>
        <Button as={Link} to="/productos" variant="primary">
          Ir a Productos
        </Button>
      </Container>
    )
  }

  return (
    <Container className="mt-4">
      <h1>Carrito</h1>
      <ListGroup>
        {items.map((item) => (
          <ListGroup.Item key={item.id}>
            <Row className="align-items-center g-3">
              <Col xs={3} md={2}>
                <img src={item.producto.imagen} alt={item.producto.nombre} className="img-fluid" />
              </Col>
              <Col xs={9} md={4}>
                <h5 className="mb-1">{item.producto.nombre}</h5>
                <span className="text-muted">${item.producto.residencial.toLocaleString('es-CL')} c/u</span>
              </Col>
              <Col xs={6} md={3} className="d-flex align-items-center gap-2">
                <Button variant="outline-danger" size="sm" onClick={() => decrementar(item.id)}>
                  -
                </Button>
                <span>{item.cantidad}</span>
                <Button variant="outline-success" size="sm" onClick={() => incrementar(item.id)}>
                  +
                </Button>
              </Col>
              <Col xs={6} md={3} className="text-md-end">
                <strong>Subtotal: ${(item.producto.residencial * item.cantidad).toLocaleString('es-CL')}</strong>
                <br />
                <Button variant="link" size="sm" className="p-0" onClick={() => eliminar(item.id)}>
                  Quitar
                </Button>
              </Col>
            </Row>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <div className="mt-3 d-flex justify-content-end">
        <h4 className="mb-0">Total: ${total.toLocaleString('es-CL')}</h4>
      </div>
    </Container>
  )
}

export default Carrito