import { Link } from 'react-router-dom'
import { Container, Button } from 'react-bootstrap'

function Inicio() {
  return (
    <Container className="mt-4 text-center">
      <h1>Bienvenido a Distribuidora de Gas El Volcán</h1>
      <p className="lead">Venta y distribución de cilindros de gas GLP, reguladores, mangueras y accesorios.</p>
      <Button as={Link} to="/productos" variant="primary">
        Ver productos
      </Button>
    </Container>
  )
}

export default Inicio