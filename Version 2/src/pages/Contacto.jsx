import { useState } from 'react'
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { CLAVES, leerLista, validarFormularioContacto } from '../utils/validaciones'

const ASUNTOS = ['Seleccione una opción', 'Consulta sobre productos', 'Pedido', 'Reclamo']

function Contacto() {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [asunto, setAsunto] = useState('Seleccione una opción')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    const datos = { nombre, correo, telefono, asunto, mensaje }
    const mensajeError = validarFormularioContacto(datos)
    if (mensajeError) {
      setError(mensajeError)
      setOk('')
      return
    }

    // Guardamos la solicitud en localStorage (no hay backend todavía).
    const solicitudes = leerLista(CLAVES.solicitudes)
    solicitudes.push({
      fecha: new Date().toISOString().slice(0, 10),
      nombre,
      correo,
      telefono,
      asunto,
      mensaje,
    })
    localStorage.setItem(CLAVES.solicitudes, JSON.stringify(solicitudes))

    setError('')
    setOk('Mensaje enviado. Te contactaremos pronto.')
    setNombre('')
    setCorreo('')
    setTelefono('')
    setAsunto('Seleccione una opción')
    setMensaje('')
  }

  return (
    <main className="fondo">
      <section className="container py-5">
        <div className="titulo-tiendas text-start">
          <h1>Contáctanos</h1>
          <h3>Estamos aquí para ayudarte</h3>
          <h4 className="my-3">
            Si tienes dudas, necesitas hacer un pedido o quieres más información sobre nuestros productos y servicios,
            escríbenos o llámanos.
          </h4>
        </div>
      </section>

      <section className="container pb-5">
        <Row className="g-4">
          <Col xs={12} lg={7}>
            <Card>
              <Card.Body>
                <h2 className="texto-2 text-start">Envíanos un mensaje</h2>
                <Form onSubmit={handleSubmit} noValidate>
                  <Form.Group className="mb-3" controlId="contacto-nombre">
                    <Form.Label className="texto-2">Nombre completo</Form.Label>
                    <Form.Control
                      type="text"
                      maxLength={100}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="contacto-correo">
                    <Form.Label className="texto-2">Correo electrónico</Form.Label>
                    <Form.Control type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="contacto-telefono">
                    <Form.Label className="texto-2">Teléfono</Form.Label>
                    <Form.Control type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="contacto-asunto">
                    <Form.Label className="texto-2">Asunto</Form.Label>
                    <Form.Select value={asunto} onChange={(e) => setAsunto(e.target.value)}>
                      {ASUNTOS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="contacto-mensaje">
                    <Form.Label className="texto-2">Mensaje</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      maxLength={500}
                      style={{ resize: 'none' }}
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                    />
                  </Form.Group>

                  {error && <Alert variant="danger">{error}</Alert>}
                  {ok && <Alert variant="success">{ok}</Alert>}

                  <Button type="submit" className="btn-login border-0">
                    Enviar mensaje
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} lg={5} className="text-center">
            <img
              src="/IMAGENES/persona con cilindro 2.png"
              alt="persona con cilindro de gas"
              className="persona-contacto"
            />
          </Col>
        </Row>
      </section>
    </main>
  )
}

export default Contacto
