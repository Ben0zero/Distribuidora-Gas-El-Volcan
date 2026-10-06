import { useLocation, Link } from 'react-router-dom'
import { Container, Row, Col, Button } from 'react-bootstrap'
import Producto from '../components/Producto'
import { PRODUCTOS } from '../datos/productos'

const CATEGORIAS = ['Cilindros de Gas', 'Reguladores', 'Mangueras y Conexiones', 'Accesorios']

function Productos({ onAgregar }) {
  const location = useLocation()
  const parametros = new URLSearchParams(location.search)
  const categoria = parametros.get('categoria')

  const productos = categoria ? PRODUCTOS.filter((p) => p.categoria === categoria) : PRODUCTOS

  return (
    <Container className="mt-4">
      <h1 className="text-center mb-4">Nuestros Productos</h1>

      <div className="text-center mb-3">
        <Button as={Link} to="/productos" variant={categoria ? 'outline-primary' : 'primary'} className="me-2 mb-1">
          Todos
        </Button>
        {CATEGORIAS.map((c) => (
          <Button
            key={c}
            as={Link}
            to={`/productos?categoria=${encodeURIComponent(c)}`}
            variant={categoria === c ? 'primary' : 'outline-primary'}
            className="me-2 mb-1"
          >
            {c}
          </Button>
        ))}
      </div>

      <p>Categoría seleccionada: {categoria}</p>

      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {productos.map((p) => (
          <Col key={p.id}>
            <Producto {...p} onAgregar={onAgregar} />
          </Col>
        ))}
      </Row>
    </Container>
  )
}

export default Productos