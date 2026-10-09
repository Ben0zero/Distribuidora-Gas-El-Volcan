import { Link } from 'react-router-dom'
import { Navbar as BootstrapNavbar, Nav, Container, Badge } from 'react-bootstrap'

function Navbar({ totalItems }) {
  return (
    <BootstrapNavbar bg="dark" data-bs-theme="dark" expand="lg" sticky="top">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <img src="/IMAGENES/Logo Gas.png" alt="Logo El Volcán" width="40" height="40" />
          Distribuidora de Gas El Volcán
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="menu-principal" />
        <BootstrapNavbar.Collapse id="menu-principal">
          <Nav className="ms-auto align-items-lg-center">
            <Nav.Link as={Link} to="/">
              Inicio
            </Nav.Link>
            <Nav.Link as={Link} to="/productos">
              Productos
            </Nav.Link>
            <Nav.Link as={Link} to="/nosotros">
              Nosotros
            </Nav.Link>
            <Nav.Link as={Link} to="/consejos">
              Consejos
            </Nav.Link>
            <Nav.Link as={Link} to="/tiendas">
              Tiendas
            </Nav.Link>
            <Nav.Link as={Link} to="/contacto">
              Contacto
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
