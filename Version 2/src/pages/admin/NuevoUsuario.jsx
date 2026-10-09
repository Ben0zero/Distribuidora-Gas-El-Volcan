import { useState } from 'react'
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import {
  CLAVES,
  REGIONES,
  correoDominioPermitido,
  leerLista,
  validarRun,
  validarTelefono,
} from '../../utils/validaciones'

const ROLES = ['Administrador', 'Cliente', 'Vendedor']

function NuevoUsuario() {
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    run: '',
    contrasena: '',
    confirmar: '',
    telefono: '',
    rol: '',
    region: '',
    comuna: '',
  })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const comunasRegion = REGIONES.find((r) => r.nombre === form.region)

  const guardar = (event) => {
    event.preventDefault()
    setOk('')

    if (!form.nombre) return setError('Ingresa el nombre completo')
    if (!correoDominioPermitido(form.correo))
      return setError('El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com')
    if (!validarRun(form.run)) return setError('El RUN debe tener entre 7 y 9 dígitos, sin puntos y sin guion')
    if (String(form.contrasena).length < 4 || String(form.contrasena).length > 10)
      return setError('La contraseña debe tener entre 4 y 10 caracteres')
    if (form.contrasena !== form.confirmar) return setError('Las contraseñas no coinciden')
    if (form.telefono && !validarTelefono(form.telefono)) return setError('Ingresa un teléfono válido')
    if (!form.region) return setError('Selecciona la región')
    if (!form.comuna) return setError('Selecciona la comuna')
    if (!form.rol) return setError('Selecciona el rol del usuario')

    const usuarios = leerLista(CLAVES.usuarios)
    if (usuarios.some((u) => (u.correo || '').toLowerCase() === form.correo.toLowerCase())) {
      return setError('Ese correo ya está registrado')
    }

    usuarios.push({
      fecha: new Date().toISOString().slice(0, 10),
      run: form.run,
      nombre: form.nombre,
      correo: form.correo,
      telefono: form.telefono,
      region: form.region,
      comuna: form.comuna,
      contrasena: form.contrasena,
      rol: form.rol,
      estado: 'Activo',
    })
    localStorage.setItem(CLAVES.usuarios, JSON.stringify(usuarios))

    setError('')
    setOk('Usuario registrado correctamente')
    setForm({
      nombre: '',
      correo: '',
      run: '',
      contrasena: '',
      confirmar: '',
      telefono: '',
      rol: '',
      region: '',
      comuna: '',
    })
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-4">
        <span className="text-dark fs-4" aria-label="Notificaciones">
          <i className="bi bi-bell-fill" />
        </span>
      </div>

      <h1 className="display-6 mb-4 text-dark fw-bold">NUEVO USUARIO</h1>

      <Card className="border border-2 shadow-sm rounded-0 mx-auto" style={{ maxWidth: 900 }}>
        <div
          className="card-header bg-secondary bg-opacity-25 py-2 border-bottom border-2 text-uppercase fw-bold text-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          Registro de usuario
        </div>
        <Card.Body className="p-4">
          <Form onSubmit={guardar} noValidate>
            <Form.Group className="mb-3">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                Nombre Completo
              </Form.Label>
              <Form.Control className="rounded-0 border-dark" value={form.nombre} onChange={cambiar('nombre')} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                Correo
              </Form.Label>
              <Form.Control
                type="email"
                className="rounded-0 border-dark"
                value={form.correo}
                onChange={cambiar('correo')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
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

            <Form.Group className="mb-3">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                Contraseña
              </Form.Label>
              <Form.Control
                type="password"
                minLength={4}
                maxLength={10}
                className="rounded-0 border-dark"
                value={form.contrasena}
                onChange={cambiar('contrasena')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                Confirmar Contraseña
              </Form.Label>
              <Form.Control
                type="password"
                className="rounded-0 border-dark"
                value={form.confirmar}
                onChange={cambiar('confirmar')}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                Teléfono (Opcional)
              </Form.Label>
              <Form.Control
                type="tel"
                className="rounded-0 border-dark"
                placeholder="+569..."
                value={form.telefono}
                onChange={cambiar('telefono')}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                -- Seleccione el rol --
              </Form.Label>
              <Form.Select className="rounded-0 border-dark" value={form.rol} onChange={cambiar('rol')}>
                <option value="">Elige un rol...</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="mb-4">
              <Col md={6} className="mb-3 mb-md-0">
                <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                  -- Seleccione la región --
                </Form.Label>
                <Form.Select
                  className="rounded-0 border-dark"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value, comuna: '' })}
                >
                  <option value="">Elige una región...</option>
                  {REGIONES.map((r) => (
                    <option key={r.nombre} value={r.nombre}>
                      {r.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                  -- Seleccione la comuna --
                </Form.Label>
                <Form.Select
                  className="rounded-0 border-dark"
                  value={form.comuna}
                  onChange={cambiar('comuna')}
                  disabled={!form.region}
                >
                  <option value="">Elige una comuna...</option>
                  {comunasRegion &&
                    comunasRegion.comunas.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </Form.Select>
              </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}
            {ok && <Alert variant="success">{ok}</Alert>}

            <div className="text-center mt-4">
              <Button
                type="submit"
                variant="dark"
                className="text-uppercase px-5 py-2 rounded-0 fw-bold"
                style={{ fontSize: '0.9rem' }}
              >
                Registrar
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  )
}

export default NuevoUsuario
