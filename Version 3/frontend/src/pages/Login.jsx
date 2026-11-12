import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { CLAVES } from '../utils/validaciones'
import { login, ApiError } from '../utils/api'
import { sesionDesdeLogin, rutaInicial, sesionActiva, ROLES } from '../utils/sesion'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [sesion, setSesion] = useState(() => sesionActiva())
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.includes('@')) {
      setError('El correo electrónico no es válido')
      return
    }
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres')
      return
    }

    // La autenticación la decide SIEMPRE ms-auth: no hay usuarios locales de respaldo.
    setCargando(true)
    try {
      const res = await login(email, password)
      const sesionGuardada = sesionDesdeLogin(res)
      setError('')
      localStorage.setItem(CLAVES.sesion, JSON.stringify(sesionGuardada))
      setSesion(sesionGuardada)
      // Si venía de una ruta protegida (ej. /ventas) vuelve a ella; si no, a la inicial de su rol
      navigate(location.state?.desde || rutaInicial(sesionGuardada.rol), { replace: true })
    } catch (e) {
      if (e instanceof ApiError) {
        // 401 -> credenciales incorrectas; otro código -> error del servidor
        setError(e.message)
      } else {
        // fetch rechazado: el microservicio no está levantado o no hay red
        setError('No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.')
      }
    } finally {
      setCargando(false)
    }
  }

  function cerrarSesion() {
    localStorage.removeItem(CLAVES.sesion)
    setSesion(null)
  }

  if (sesion) {
    return (
      <main className="fondo">
        <Container className="py-4">
          <Alert variant="success">
            Sesión iniciada: {sesion.nombre} ({sesion.rol})
          </Alert>
          <Button as={Link} to="/productos" variant="primary" className="me-2">
            Ver productos
          </Button>
          {sesion.rol === ROLES.ADMIN && (
            <Button as={Link} to="/admin" variant="dark" className="me-2">
              Panel Admin
            </Button>
          )}
          <Button variant="outline-danger" onClick={cerrarSesion}>
            Cerrar sesión
          </Button>
        </Container>
      </main>
    )
  }

  return (
    <main className="fondo">
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card>
              <Card.Body>
                <Card.Title>Iniciar Sesión</Card.Title>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Correo electrónico</Form.Label>
                    <Form.Control
                      type="text"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </Form.Group>
                  {error && <Alert variant="danger">{error}</Alert>}
                  <Button className="btn-login" type="submit" variant="primary" disabled={cargando}>
                    {cargando ? 'Ingresando…' : 'Ingresar'}
                  </Button>
                </Form>
                <p className="mt-3 mb-0">
                  ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  )
}

export default Login
