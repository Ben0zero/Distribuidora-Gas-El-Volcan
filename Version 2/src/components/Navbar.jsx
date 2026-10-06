import { Link } from 'react-router-dom'
import { Navbar as BootstrapNavbar, Nav, Container, Badge } from 'react-bootstrap'

function Navbar({ totalItems }) {
  return (
    <BootstrapNavbar bg="dark" data-bs-theme="dark" expand="lg">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          Distribuidora de Gas El Volcán
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="menu-principal" />
        <BootstrapNavbar.Collapse id="menu-principal">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Inicio
            </Nav.Link>
            <Nav.Link as={Link} to="/productos">
              Productos
            </Nav.Link>
            <Nav.Link as={Link} to="/carrito">
              Carrito <Badge bg="light" text="dark">{totalItems}</Badge>
            </Nav.Link>
            <Nav.Link as={Link} to="/login">
              Login
            </Nav.Link>
            <Nav.Link as={Link} to="/registro">
              Registro
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  )
}

export default Navbar