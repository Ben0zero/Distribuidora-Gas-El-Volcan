import { useState } from 'react'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { cambiarContrasena, ApiError } from '../utils/api'
import { validarContrasena } from '../utils/validaciones'

const VACIO = { actual: '', nueva: '', confirmar: '' }

// Cambio de contraseña con sesión iniciada (cualquier rol). Se usa en la tienda y en los
// paneles de administración y de vendedor. El backend (PUT /api/v1/cuenta/contrasena) toma
// el usuario del token y exige la contraseña actual.
function CambiarContrasena() {
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const enviar = async (event) => {
    event.preventDefault()
    setError('')
    setOk('')
    if (!form.actual) return setError('Ingresa tu contraseña actual')
    const errorNueva = validarContrasena(form.nueva)
    if (errorNueva) return setError(errorNueva)
    if (form.nueva !== form.confirmar) return setError('Las contraseñas nuevas no coinciden')
    if (form.nueva === form.actual) return setError('La contraseña nueva debe ser distinta de la actual')

    setEnviando(true)
    try {
      await cambiarContrasena(form.actual, form.nueva)
      setOk('Tu contraseña se cambió correctamente.')
      setForm(VACIO)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setError('Tu sesión expiró. Vuelve a iniciar sesión.')
      else if (e instanceof ApiError) setError(e.message)
      else setError('No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="py-4 px-2">
      <Card className="mx-auto shadow-sm" style={{ maxWidth: 480 }}>
        <Card.Body className="p-4">
          <h1 className="h4 mb-3">
            <i className="bi bi-key me-2" aria-hidden="true" />
            Cambiar contraseña
          </h1>
          {error && <Alert variant="danger">{error}</Alert>}
          {ok && <Alert variant="success">{ok}</Alert>}
          <Form onSubmit={enviar} noValidate>
            <Form.Group className="mb-3" controlId="contrasena-actual">
              <Form.Label>Contraseña actual</Form.Label>
              <Form.Control type="password" autoComplete="current-password" value={form.actual} onChange={cambiar('actual')} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="contrasena-nueva">
              <Form.Label>Contraseña nueva</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                maxLength={64}
                value={form.nueva}
                onChange={cambiar('nueva')}
                aria-describedby="ayuda-contrasena"
              />
              <Form.Text id="ayuda-contrasena">Entre 8 y 64 caracteres, con al menos una letra y un número.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-4" controlId="contrasena-confirmar">
              <Form.Label>Confirmar contraseña nueva</Form.Label>
              <Form.Control type="password" autoComplete="new-password" maxLength={64} value={form.confirmar} onChange={cambiar('confirmar')} />
            </Form.Group>
            <Button type="submit" className="btn-login w-100" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </main>
  )
}

export default CambiarContrasena
