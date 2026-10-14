import { Link } from 'react-router-dom'
import { Container, Button, Row, Col } from 'react-bootstrap'

function Inicio() {
  return (
    <main className="fondo">
      <Container className="py-5 text-center">
        <h1 className="texto-2">Bienvenido a Distribuidora de Gas El Volcán</h1>
        <p className="lead texto-2">Venta y distribución de cilindros de gas GLP, reguladores, mangueras y accesorios.</p>
        <Button as={Link} to="/productos" variant="primary">
          Ver productos
        </Button>
        <img src="/IMAGENES/cilindros.png" alt="Cilindros El Volcán" className="d-block mx-auto mt-4"
          style={{width: '70%',maxWidth: '600px',height: 'auto',objectFit: 'contain'}}/>
      <Container className="py-4 mt-4 bg-white rounded-4 shadow">
      <Row className="g-4 text-center">

        <Col xs={12} sm={6} lg={3}>
          <i className="bi bi-truck fs-1"></i>
          <h5 className="texto-2 mt-3">
            Entrega a domicilio rápida y segura
          </h5>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <i className="bi bi-shield-check fs-1"></i>
          <h5 className="texto-2 mt-3">
            Cilindros certificados y en buen estado
          </h5>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <i className="bi bi-people fs-1"></i>
          <h5 className="texto-2 mt-3">
            Equipo local de confianza
          </h5>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <i className="bi bi-geo-alt fs-1"></i>
          <h5 className="texto-2 mt-3">
            Cobertura en Chillán y comunas aledañas
          </h5>
        </Col>

      </Row>
    </Container>

      </Container>
    </main>
  )
}

export default Inicio