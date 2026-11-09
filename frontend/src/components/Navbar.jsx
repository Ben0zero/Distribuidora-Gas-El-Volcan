import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Navbar as BootstrapNavbar, Nav, Container, Badge, Button } from 'react-bootstrap'
import { sesionActiva, cerrarSesion, ROLES } from '../utils/sesion'
import '../navbar.css'

function Navbar({ totalItems }) {
  // useLocation hace que la barra se vuelva a dibujar al navegar (ej. después del login)
  useLocation()
  const navigate = useNavigate()
  const sesion = sesionActiva()
  const esAdmin = sesion?.rol === ROLES.ADMIN

  const salir = () => {
    cerrarSesion()
    navigate('/')
  }

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
            {sesion ? (
              <>
                <Nav.Link as={NavLink} to="/mis-compras">
                  Mis compras
                </Nav.Link>
                {esAdmin && (
                  <Nav.Link as={NavLink} to="/admin">
                    Panel Admin
                  </Nav.Link>
                )}
                <span className="navbar-text ms-lg-2 small">Hola, {sesion.nombre}</span>
                <Button variant="outline-light" size="sm" className="ms-lg-2 my-1" onClick={salir}>
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={NavLink} to="/registro">
                  Registro
                </Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  )
}

export default Navbar
