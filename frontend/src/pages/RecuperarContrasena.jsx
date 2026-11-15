import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { solicitarRecuperacion, ApiError } from '../utils/api'

// "¿Olvidaste tu contraseña?": pide un enlace de un solo uso. El backend responde SIEMPRE el
// mismo mensaje, exista o no la cuenta, para no revelar qué correos están registrados.
function RecuperarContrasena() {
  const [usuario, setUsuario] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (event) => {
    event.preventDefault()
    setError('')
    setMensaje('')
    if (!usuario.trim()) return setError('Ingresa tu correo electrónico')

    setEnviando(true)
    try {
      const respuesta = await solicitarRecuperacion(usuario.trim().toLowerCase())
      setMensaje(respuesta.mensaje)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="fondo">
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card>
              <Card.Body>
                <Card.Title>Recuperar contraseña</Card.Title>
                <p className="text-muted">
                  Escribe el correo con el que inicias sesión y te enviaremos un enlace para crear una contraseña nueva.
                </p>
                {mensaje ? (
                  <Alert variant="success">{mensaje}</Alert>
                ) : (
                  <Form onSubmit={enviar} noValidate>
                    <Form.Group className="mb-3" controlId="correo-recuperacion">
                      <Form.Label>Correo electrónico</Form.Label>
                      <Form.Control type="email" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
                    </Form.Group>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Button className="btn-login" type="submit" disabled={enviando}>
                      {enviando ? 'Enviando…' : 'Enviar enlace'}
                    </Button>
                  </Form>
                )}
                <p className="mt-3 mb-0">
                  <Link to="/login">Volver a iniciar sesión</Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  )
}

export default RecuperarContrasena
