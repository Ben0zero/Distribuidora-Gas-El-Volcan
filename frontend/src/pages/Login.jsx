import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { ADMIN_DEFAULT, CLAVES, leerLista, leerObjeto } from '../utils/validaciones'
import { login } from '../utils/api'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sesion, setSesion] = useState(() => leerObjeto(CLAVES.sesion))
  const navigate = useNavigate()

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

    try {
      const res = await login(email, password)
      setError('')
      const sesionGuardada = {
        nombre: res.nombre || email,
        correo: email,
        email,
        rol: res.rol === 'ADMIN' ? 'Administrador' : res.rol === 'VENDEDOR' ? 'Vendedor' : 'Cliente',
        tipoCliente: 'Residencial',
        direccion: '',
        comuna: '',
        token: res.token
      }
      localStorage.setItem(CLAVES.sesion, JSON.stringify(sesionGuardada))
      setSesion(sesionGuardada)
      navigate(sesionGuardada.rol === 'Administrador' ? '/admin' : '/')
      return
    } catch (e) {
      // fallback a local
    }

    const usuarios = [ADMIN_DEFAULT, ...leerLista(CLAVES.usuarios)]
    const usuario = usuarios.find((u) => {
      const correoUsuario = u.correo || u.email
      const contrasenaUsuario = u.contrasena || u.password
      return correoUsuario === email && contrasenaUsuario === password
    })

    if (!usuario) {
      setError('Credenciales incorrectas')
      return
    }

    setError('')
    const sesionGuardada = {
      nombre: usuario.nombre,
      correo: usuario.correo || usuario.email,
      email,
      rol: usuario.rol || 'Cliente',
      tipoCliente: usuario.tipoCliente || 'Residencial',
      direccion: usuario.direccion || '',
      comuna: usuario.comuna || '',
    }
    localStorage.setItem(CLAVES.sesion, JSON.stringify(sesionGuardada))
    setSesion(sesionGuardada)
    navigate(usuario.rol === 'Administrador' ? '/admin' : '/')
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
          {sesion.rol === 'Administrador' && (
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
                  <Button className="btn-login" type="submit" variant="primary">
                    Ingresar
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
