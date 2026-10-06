import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'

const CLAVE_USUARIOS = 'usuarios'

const REGIONES = [{ nombre: 'Región de Ñuble', comunas: ['Chillán', 'Chillán Viejo', 'El Carmen', 'Pinto', 'San Ignacio', 'Bulnes', 'Quillón'] }]

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
  const navigate = useNavigate()

  const comunasRegion = REGIONES.find((r) => r.nombre === region)

  function validarRun(valor) {
    return /^\d{7,9}$/.test(String(valor).replace(/\s/g, ''))
  }

  function validarTelefono(valor) {
    const limpio = String(valor).replace(/[\s()-]/g, '')
    return /^\+?\d{9,12}$/.test(limpio)
  }

  function correoDominioPermitido(valor) {
    return /^[^\s@]+@(profesor\.duoc\.cl|duoc\.cl|gmail\.com)$/i.test(valor)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!nombre) {
      setError('Ingresa tu nombre completo')
      return
    }
    if (nombre.length > 100) {
      setError('El nombre no puede superar los 100 caracteres')
      return
    }
    if (!validarRun(run)) {
      setError('El RUN debe tener entre 7 y 9 dígitos, sin puntos y sin guion')
      return
    }
    if (!correoDominioPermitido(correo)) {
      setError('El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com')
      return
    }
    if (!validarTelefono(telefono)) {
      setError('Ingresa un teléfono válido (ej: +56 9 1234 5678)')
      return
    }
    if (!direccion) {
      setError('Ingresa tu dirección de despacho')
      return
    }
    if (!region) {
      setError('Selecciona tu región')
      return
    }
    if (!comuna) {
      setError('Selecciona tu comuna de despacho')
      return
    }
    if (String(password).length < 4 || String(password).length > 10) {
      setError('La contraseña debe tener entre 4 y 10 caracteres')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (!terminos) {
      setError('Debes aceptar los términos y condiciones')
      return
    }

    const usuarios = JSON.parse(localStorage.getItem(CLAVE_USUARIOS)) || []

    if (usuarios.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
      setError('Ese correo ya está registrado')
      return
    }

    usuarios.push({
      fecha: new Date().toISOString().slice(0, 10),
      run,
      nombre,
      correo,
      telefono,
      tipoCliente,
      direccion,
      region,
      comuna,
      contrasena: password,
      rol: 'Cliente',
      estado: 'Pendiente',
    })

    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios))

    setError('')
    setOk('Cuenta creada correctamente. Ya puedes iniciar sesión.')
    setTimeout(() => navigate('/login'), 1200)
  }

  return (
    <Container className="mt-4">
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
                      <Form.Select value={region} onChange={(e) => { setRegion(e.target.value); setComuna('') }}>
                        <option value="">Elige una región...</option>
                        {REGIONES.map((r) => (
                          <option key={r.nombre} value={r.nombre}>{r.nombre}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="comuna">
                      <Form.Label>Comuna</Form.Label>
                      <Form.Select value={comuna} onChange={(e) => setComuna(e.target.value)} disabled={!region}>
                        <option value="">Elige una comuna...</option>
                        {comunasRegion && comunasRegion.comunas.map((c) => (
                          <option key={c} value={c}>{c}</option>
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

                <Button type="submit" variant="success">
                  Registrarse
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
  )
}

export default Registro