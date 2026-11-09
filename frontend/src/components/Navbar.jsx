import { Link, NavLink, useLocation } from 'react-router-dom'
import { Navbar as BootstrapNavbar, Nav, Container, Badge } from 'react-bootstrap'
import { CLAVES, leerObjeto } from '../utils/validaciones'
import '../navbar.css'

function Navbar({ totalItems }) {
  // useLocation hace que la barra se vuelva a dibujar al navegar (ej. después del login)
  useLocation()
  const conSesion = Boolean(leerObjeto(CLAVES.sesion)?.token)

  return (
    <BootstrapNavbar expand="lg" sticky="top" className="navbar-gas">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <img src="/IMAGENES/Logo Gas.png" alt="Logo El Volcán" width="40" height="40" />
          Distribuidora de Gas El Volcán
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="menu-principal" />
        <BootstrapNavbar.Collapse id="menu-principal">
          <Nav className="ms-auto align-items-lg-center">
            <Nav.Link as={NavLink} to="/" end>
            Inicio
            </Nav.Link>
            <Nav.Link as={NavLink} to="/productos">
              Productos
            </Nav.Link>
            <Nav.Link as={NavLink} to="/nosotros">
              Nosotros
            </Nav.Link>
            <Nav.Link as={NavLink} to="/consejos">
              Consejos
            </Nav.Link>
            <Nav.Link as={NavLink} to="/tiendas">
              Tiendas
            </Nav.Link>
            <Nav.Link as={NavLink} to="/contacto">
              Contacto
            </Nav.Link>
            <Nav.Link as={NavLink} to="/carrito">
              Carrito <Badge bg="light" text="dark">{totalItems}</Badge>
            </Nav.Link>
            {conSesion && (
              <Nav.Link as={NavLink} to="/mis-compras">
                Mis compras
              </Nav.Link>
            )}
            <Nav.Link as={NavLink} to="/login">
              Login
            </Nav.Link>
            <Nav.Link as={NavLink} to="/registro">
              Registro
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  )
}

export default Navbar
