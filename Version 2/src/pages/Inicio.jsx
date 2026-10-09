import { Link } from 'react-router-dom'
import { Container, Button } from 'react-bootstrap'

function Inicio() {
  return (
    <main className="fondo">
      <Container className="py-5 text-center">
        <h1 className="texto-2">Bienvenido a Distribuidora de Gas El Volcán</h1>
        <p className="lead texto-2">Venta y distribución de cilindros de gas GLP, reguladores, mangueras y accesorios.</p>
        <Button as={Link} to="/productos" variant="primary">
          Ver productos
        </Button>
      </Container>
    </main>
  )
}

export default Inicio