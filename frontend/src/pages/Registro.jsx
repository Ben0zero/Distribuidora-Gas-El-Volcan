import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { REGIONES, validarFormularioRegistro } from '../utils/validaciones'
import { register, ApiError } from '../utils/api'

function Registro() {
  const [nombre, setNombre] = useState('')
  const [run, setRun] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [tipoCliente, setTipoCliente] = useState('Residencial')
  const [direccion, setDireccion] = useState('')
  const [region, setRegion] = useState('')
  const [comuna, setComuna] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [terminos, setTerminos] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()

  const comunasRegion = REGIONES.find((r) => r.nombre === region)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const mensajeError = validarFormularioRegistro({
      nombre,
      run,
      correo,
      telefono,
      direccion,
      region,
      comuna,
      password,
      confirmar,
      terminos,
    })
    if (mensajeError) {
      setError(mensajeError)
      return
    }

    // POST /api/v1/auth/register: ms-auth crea el usuario con rol CLIENTE (contraseña con BCrypt)
    setError('')
    setEnviando(true)
    try {
      await register({
        nombre,
        rut: run,
        username: correo.trim().toLowerCase(),
        password,
        direccion,
        region,
        comuna,
        tipoCliente,
        telefono,
      })
      setOk('Cuenta creada correctamente. Ya puedes iniciar sesión.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('Ya existe una cuenta con ese correo o RUN. Inicia sesión o usa otros datos.')
      } else if (e instanceof ApiError) {
        setError(e.message.replace(/^Error:\s*/, ''))
      } else {
        setError('No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="fondo">
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card>
              <Card.Body>
                <Card.Title>Crear cuenta</Card.Title>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="nombre">
                    <Form.Label>Nombre completo</Form.Label>
                    <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="run">
                    <Form.Label>RUN</Form.Label>
                    <Form.Control type="text" value={run} onChange={(e) => setRun(e.target.value)} />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="correo">
                    <Form.Label>Correo electrónico</Form.Label>
                    <Form.Control type="text" value={correo} onChange={(e) => setCorreo(e.target.value)} />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="telefono">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="tipo-cliente">
                    <Form.Label>Tipo de cliente</Form.Label>
                    <Form.Select value={tipoCliente} onChange={(e) => setTipoCliente(e.target.value)}>
                      <option value="Residencial">Residencial</option>
                      <option value="Comercial">Comercial</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="direccion">
                    <Form.Label>Dirección de despacho</Form.Label>
                    <Form.Control type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="region">
                        <Form.Label>Región</Form.Label>
                        <Form.Select
                          value={region}
                          onChange={(e) => {
                            setRegion(e.target.value)
                            setComuna('')
                          }}
                        >
                          <option value="">Elige una región...</option>
                          {REGIONES.map((r) => (
                            <option key={r.nombre} value={r.nombre}>
                              {r.nombre}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="comuna">
                        <Form.Label>Comuna</Form.Label>
                        <Form.Select value={comuna} onChange={(e) => setComuna(e.target.value)} disabled={!region}>
                          <option value="">Elige una comuna...</option>
                          {comunasRegion &&
                            comunasRegion.comunas.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="confirmar-password">
                    <Form.Label>Confirmar contraseña</Form.Label>
                    <Form.Control type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
                  </Form.Group>

                  <Form.Check
                    type="checkbox"
                    id="terminos"
                    label="Acepto los términos y condiciones"
                    checked={terminos}
                    onChange={(e) => setTerminos(e.target.checked)}
                    className="mb-3"
                  />

                  {error && <Alert variant="danger">{error}</Alert>}
                  {ok && <Alert variant="success">{ok}</Alert>}

                  <Button className="btn-login" type="submit" variant="success" disabled={enviando || Boolean(ok)}>
                    {enviando ? 'Registrando…' : 'Registrarse'}
                  </Button>
                </Form>

                <p className="mt-3 mb-0">
                  ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  )
}

export default Registro
