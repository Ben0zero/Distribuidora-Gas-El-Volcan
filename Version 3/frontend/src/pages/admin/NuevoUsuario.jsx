import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { REGIONES, validarNuevoUsuario } from '../../utils/validaciones'
import { crearUsuario, ApiError } from '../../utils/api'
import { ROLES } from '../../utils/sesion'

// Etiqueta de la interfaz -> nombreRol de ms-auth
const OPCIONES_ROL = [
  { etiqueta: ROLES.ADMIN, valor: 'ADMIN' },
  { etiqueta: ROLES.VENDEDOR, valor: 'VENDEDOR' },
  { etiqueta: ROLES.CLIENTE, valor: 'CLIENTE' },
]

const FORM_VACIO = {
  nombre: '',
  correo: '',
  run: '',
  contrasena: '',
  confirmar: '',
  telefono: '',
  rol: '',
  tipoCliente: 'Residencial',
  direccion: '',
  region: '',
  comuna: '',
}

const etiqueta = { fontSize: '0.75rem' }

// Alta de usuarios por el ADMIN: POST /api/v1/usuarios (ms-auth); aquí sí se elige el rol
function NuevoUsuario() {
  const [form, setForm] = useState(FORM_VACIO)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })
  const comunasRegion = REGIONES.find((r) => r.nombre === form.region)

  const guardar = async (event) => {
    event.preventDefault()
    setOk('')
    const invalido = validarNuevoUsuario(form)
    if (invalido) return setError(invalido)

    setError('')
    setEnviando(true)
    try {
      const creado = await crearUsuario({
        nombre: form.nombre.trim(),
        rut: form.run,
        username: form.correo.trim().toLowerCase(),
        password: form.contrasena,
        nombreRol: form.rol,
        telefono: form.telefono || undefined,
        direccion: form.direccion.trim() || undefined,
        region: form.region,
        comuna: form.comuna,
        tipoCliente: form.rol === 'CLIENTE' ? form.tipoCliente : undefined,
      })
      setOk(`Usuario ${creado.username} registrado correctamente con rol ${creado.nombreRol}`)
      setForm(FORM_VACIO)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setError('Ya existe un usuario con ese correo o RUN.')
      else if (e instanceof ApiError && e.status === 403) setError('Tu sesión no tiene permisos de administrador.')
      else if (e instanceof ApiError) setError(e.message.replace(/^Error:\s*/, ''))
      else setError('No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-4">
        <span className="text-dark fs-4" aria-label="Notificaciones">
          <i className="bi bi-bell-fill" />
        </span>
      </div>

      <div className="d-flex align-items-center mb-4 gap-3">
        <h1 className="display-6 mb-0 text-dark fw-bold">NUEVO USUARIO</h1>
        <Link to="/admin/usuarios" className="small">← Volver a usuarios</Link>
      </div>

      <Card className="border border-2 shadow-sm rounded-0 mx-auto" style={{ maxWidth: 900 }}>
        <div
          className="card-header bg-secondary bg-opacity-25 py-2 border-bottom border-2 text-uppercase fw-bold text-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          Registro de usuario
        </div>
        <Card.Body className="p-4">
          <Form onSubmit={guardar} noValidate>
            <Form.Group className="mb-3" controlId="usuario-nombre">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Nombre Completo</Form.Label>
              <Form.Control className="rounded-0 border-dark" value={form.nombre} onChange={cambiar('nombre')} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="usuario-correo">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Correo (será su usuario)</Form.Label>
              <Form.Control type="email" className="rounded-0 border-dark" value={form.correo} onChange={cambiar('correo')} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="usuario-run">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>
                RUN (7 a 9 dígitos, sin puntos y sin guion)
              </Form.Label>
              <Form.Control
                className="rounded-0 border-dark"
                maxLength={9}
                placeholder="Ej: 12345678"
                value={form.run}
                onChange={cambiar('run')}
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6} className="mb-3 mb-md-0">
                <Form.Group controlId="usuario-contrasena">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Contraseña (6 a 10)</Form.Label>
                  <Form.Control
                    type="password"
                    maxLength={10}
                    className="rounded-0 border-dark"
                    value={form.contrasena}
                    onChange={cambiar('contrasena')}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="usuario-confirmar">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Confirmar Contraseña</Form.Label>
                  <Form.Control type="password" className="rounded-0 border-dark" value={form.confirmar} onChange={cambiar('confirmar')} />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6} className="mb-3 mb-md-0">
                <Form.Group controlId="usuario-rol">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Rol</Form.Label>
                  <Form.Select className="rounded-0 border-dark" value={form.rol} onChange={cambiar('rol')}>
                    <option value="">Elige un rol...</option>
                    {OPCIONES_ROL.map((r) => (
                      <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="usuario-telefono">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Teléfono (Opcional)</Form.Label>
                  <Form.Control type="tel" className="rounded-0 border-dark" placeholder="+569..." value={form.telefono} onChange={cambiar('telefono')} />
                </Form.Group>
              </Col>
            </Row>

            {form.rol === 'CLIENTE' && (
              <Form.Group className="mb-3" controlId="usuario-tipo">
                <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Tipo de cliente</Form.Label>
                <Form.Select className="rounded-0 border-dark" value={form.tipoCliente} onChange={cambiar('tipoCliente')}>
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                </Form.Select>
              </Form.Group>
            )}

            <Form.Group className="mb-3" controlId="usuario-direccion">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Dirección (Opcional)</Form.Label>
              <Form.Control className="rounded-0 border-dark" value={form.direccion} onChange={cambiar('direccion')} />
            </Form.Group>

            <Row className="mb-4">
              <Col md={6} className="mb-3 mb-md-0">
                <Form.Group controlId="usuario-region">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Región</Form.Label>
                  <Form.Select
                    className="rounded-0 border-dark"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value, comuna: '' })}
                  >
                    <option value="">Elige una región...</option>
                    {REGIONES.map((r) => (
                      <option key={r.nombre} value={r.nombre}>{r.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="usuario-comuna">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Comuna</Form.Label>
                  <Form.Select className="rounded-0 border-dark" value={form.comuna} onChange={cambiar('comuna')} disabled={!form.region}>
                    <option value="">Elige una comuna...</option>
                    {comunasRegion?.comunas.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}
            {ok && <Alert variant="success">{ok}</Alert>}

            <div className="text-center mt-4">
              <Button type="submit" variant="dark" className="text-uppercase px-5 py-2 rounded-0 fw-bold" style={{ fontSize: '0.9rem' }} disabled={enviando}>
                {enviando ? 'Registrando…' : 'Registrar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  )
}

export default NuevoUsuario
