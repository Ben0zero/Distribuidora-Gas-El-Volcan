import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { restablecerContrasena, ApiError } from '../utils/api'
import { validarContrasena } from '../utils/validaciones'

// /restablecer?token=...: página del enlace de recuperación. El token se lee una vez y se quita
// de la barra de direcciones (no queda en el historial ni se comparte al copiar la URL).
function RestablecerContrasena() {
  const [parametros] = useSearchParams()
  const [token] = useState(() => parametros.get('token') || '')
  const [form, setForm] = useState({ nueva: '', confirmar: '' })
  const [error, setError] = useState('')
  const [listo, setListo] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (window.location.search.includes('token=')) {
      window.history.replaceState(window.history.state, '', window.location.pathname)
    }
  }, [])

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const enviar = async (event) => {
    event.preventDefault()
    setError('')
    const errorNueva = validarContrasena(form.nueva)
    if (errorNueva) return setError(errorNueva)
    if (form.nueva !== form.confirmar) return setError('Las contraseñas no coinciden')

    setEnviando(true)
    try {
      const respuesta = await restablecerContrasena(token, form.nueva)
      setListo(respuesta.mensaje)
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
                <Card.Title>Crear contraseña nueva</Card.Title>
                {!token ? (
                  <Alert variant="warning">
                    El enlace no es válido. <Link to="/recuperar">Solicita uno nuevo</Link>.
                  </Alert>
                ) : listo ? (
                  <Alert variant="success">
                    {listo} <Link to="/login">Iniciar sesión</Link>
                  </Alert>
                ) : (
                  <Form onSubmit={enviar} noValidate>
                    <Form.Group className="mb-3" controlId="restablecer-nueva">
                      <Form.Label>Contraseña nueva</Form.Label>
                      <Form.Control
                        type="password"
                        autoComplete="new-password"
                        maxLength={64}
                        value={form.nueva}
                        onChange={cambiar('nueva')}
                        aria-describedby="ayuda-restablecer"
                      />
                      <Form.Text id="ayuda-restablecer">Entre 8 y 64 caracteres, con al menos una letra y un número.</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="restablecer-confirmar">
                      <Form.Label>Confirmar contraseña nueva</Form.Label>
                      <Form.Control type="password" autoComplete="new-password" maxLength={64} value={form.confirmar} onChange={cambiar('confirmar')} />
                    </Form.Group>
                    {error && (
                      <Alert variant="danger">
                        {error} {error.includes('Solicita uno nuevo') && <Link to="/recuperar">Pedir otro enlace</Link>}
                      </Alert>
                    )}
                    <Button className="btn-login" type="submit" disabled={enviando}>
                      {enviando ? 'Guardando…' : 'Guardar contraseña'}
                    </Button>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  )
}

export default RestablecerContrasena
