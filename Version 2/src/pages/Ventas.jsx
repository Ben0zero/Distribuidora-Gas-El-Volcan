import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Button, Alert, Form } from 'react-bootstrap'
import { CLAVES, leerLista, leerObjeto, REGIONES, formatearPrecio } from '../utils/validaciones'
import { calcularTotal, obtenerItemsCompletos } from '../utils/carrito'
import { catalogoActual } from '../utils/productos'

function generarNumeroOrden() {
  return 'ORD-' + String(Math.floor(100000 + Math.random() * 900000))
}

function fechaHoy() {
  return new Date().toISOString().slice(0, 10)
}

function Ventas({ carrito, incrementar, decrementar, vaciar }) {
  const navigate = useNavigate()
  const sesion = leerObjeto(CLAVES.sesion)

  const [direccion, setDireccion] = useState(sesion?.direccion || '')
  const [comuna, setComuna] = useState(sesion?.comuna || '')
  const [metodoPago, setMetodoPago] = useState('')
  const [error, setError] = useState('')
  const [orden, setOrden] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [pagoFallido, setPagoFallido] = useState(false)

  const tipo = sesion?.tipoCliente?.toLowerCase() === 'comercial' ? 'comercial' : 'residencial'
  const comunas = REGIONES[0].comunas
  const items = obtenerItemsCompletos(carrito, catalogoActual())
  const total = calcularTotal(carrito, catalogoActual(), tipo)

  // Sin sesión: invitamos a iniciar sesión para continuar la compra.
  if (!sesion) {
    return (
      <main className="fondo">
        <Container className="py-5 text-center">
          <div className="consejo-instalacion mx-auto" style={{ maxWidth: 560 }}>
            <i className="bi bi-person-lock fs-1" style={{ color: '#ff6600' }} />
            <h2 className="mt-3">Inicia sesión para comprar</h2>
            <p>Necesitas una cuenta para finalizar tu pedido.</p>
            <div className="d-flex gap-2 justify-content-center">
              <Button as={Link} to="/login" className="btn-login border-0">
                Ir a Login
              </Button>
              <Button as={Link} to="/registro" variant="outline-dark rounded-0">
                Crear cuenta
              </Button>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  // Pedido confirmado.
  if (orden) {
    return (
      <main className="fondo">
        <Container className="py-5 text-center">
          <div className="consejo-instalacion mx-auto" style={{ maxWidth: 560 }}>
            <i className="bi bi-check-circle-fill fs-1" style={{ color: '#198754' }} />
            <h2 className="mt-3" style={{ color: '#0d3b73' }}>
              ¡Pedido confirmado!
            </h2>
            <p className="mt-3 mb-1">
              Tu número de orden es <strong className="texto-2">{orden.numero}</strong>.
            </p>
            <p className="mb-1">
              Total a pagar: <strong className="texto-2">{formatearPrecio(orden.total)}</strong>
            </p>
            <p className="text-muted">Te contactaremos para coordinar el despacho.</p>
            <div className="d-grid gap-2 d-md-flex justify-content-center mt-4">
              <Button as={Link} to="/productos" className="btn-login border-0">
                Seguir comprando
              </Button>
              <Button as={Link} to="/" variant="outline-dark rounded-0">
                Volver al inicio
              </Button>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  // Carrito vacío.
  if (items.length === 0) {
    return (
      <main className="fondo">
        <Container className="py-5 text-center">
          <i className="bi bi-cart-x fs-1" />
          <p className="mt-3">Tu carrito está vacío. Agrega productos para continuar.</p>
          <Button as={Link} to="/productos" className="btn-login border-0">
            Ir al catálogo
          </Button>
        </Container>
      </main>
    )
  }

  // Procesando el pago (simulación de pasarela).
  if (procesando) {
    return (
      <main className="fondo">
        <Container className="py-5 text-center">
          <div className="consejo-instalacion mx-auto" style={{ maxWidth: 560 }}>
            <div className="spinner-border" role="status" style={{ color: '#ff6600' }}>
              <span className="visually-hidden">Procesando…</span>
            </div>
            <h2 className="mt-3" style={{ color: '#0d3b73' }}>
              Procesando tu pago…
            </h2>
            <p className="text-muted">No cierres esta ventana, estamos verificando tu pago.</p>
          </div>
        </Container>
      </main>
    )
  }

  // Pago rechazado por la pasarela (Figura 8 del Anexo 1).
  if (pagoFallido) {
    return (
      <main className="fondo">
        <Container className="py-5 text-center">
          <div className="consejo-instalacion mx-auto" style={{ maxWidth: 560 }}>
            <i className="bi bi-x-circle-fill fs-1" style={{ color: '#dc3545' }} />
            <h2 className="mt-3" style={{ color: '#dc3545' }}>
              No se pudo realizar el pago
            </h2>
            <p className="mt-3">
              Tu pago por <strong className="texto-2">{formatearPrecio(total)}</strong> fue rechazado.
            </p>
            <p className="text-muted">No se generó ningún pedido. Reintenta o elige otro método de pago.</p>
            <div className="d-grid gap-2 d-md-flex justify-content-center mt-4">
              <Button onClick={() => setPagoFallido(false)} className="btn-login border-0">
                <i className="bi bi-arrow-repeat" /> Reintentar pago
              </Button>
              <Button as={Link} to="/carrito" variant="outline-dark rounded-0">
                Volver al carrito
              </Button>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  const confirmar = (event) => {
    event.preventDefault()
    if (!direccion) {
      setError('Ingresa tu dirección de despacho')
      return
    }
    if (!comuna) {
      setError('Selecciona tu comuna')
      return
    }
    if (!metodoPago) {
      setError('Selecciona un método de pago')
      return
    }

    setError('')
    setProcesando(true)

    // Sin backend todavía: simulamos una pasarela de pago.
    // - Efectivo → se paga en la entrega: siempre se aprueba.
    // - Tarjeta  → la pasarela puede rechazar el pago (~20%): se muestra la
    //   vista "No se pudo realizar el pago" (Figura 8 del Anexo 1) y NO se
    //   guarda ninguna orden.
    const aprobar = () => {
      const nuevaOrden = {
        numero: generarNumeroOrden(),
        fecha: fechaHoy(),
        cliente: sesion.nombre,
        correo: sesion.correo || sesion.email,
        direccion,
        comuna,
        metodoPago,
        items: items.map((i) => ({ id: i.id, nombre: i.producto.nombre, cantidad: i.cantidad })),
        total,
      }
      const ordenes = leerLista(CLAVES.ordenes)
      ordenes.push(nuevaOrden)
      localStorage.setItem(CLAVES.ordenes, JSON.stringify(ordenes))

      setProcesando(false)
      setOrden(nuevaOrden)
      vaciar()
      navigate('/ventas', { replace: true })
    }

    setTimeout(() => {
      if (metodoPago === 'Tarjeta' && Math.random() < 0.2) {
        setProcesando(false)
        setPagoFallido(true)
        return
      }
      aprobar()
    }, 1300)
  }

  return (
    <main className="fondo">
      <section className="container py-5">
        <div className="titulo-consejos text-center mb-4">
          <h1>Finalizar tu compra</h1>
          <p>Revisa tu pedido y completa tus datos de despacho.</p>
        </div>

        <Row className="g-4">
          <Col xs={12} lg={7}>
            <div className="consejo-instalacion h-100">
              <h2 className="fs-4 mb-3">
                <i className="bi bi-receipt" /> Resumen de tu pedido
              </h2>
              <div className="row fw-bold border-bottom pb-2 mb-2 d-none d-md-flex texto-2">
                <div className="col-md-6">Producto</div>
                <div className="col-md-6 text-end">Subtotal</div>
              </div>

              {items.map((item) => (
                <div className="row border-bottom py-2 align-items-center" key={item.id}>
                  <div className="col-7 col-md-6">
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        variant="outline-dark"
                        size="sm"
                        className="rounded-0 px-2"
                        onClick={() => decrementar(item.id)}
                      >
                        −
                      </Button>
                      <span className="fw-bold">{item.cantidad}</span>
                      <Button
                        variant="outline-dark"
                        size="sm"
                        className="rounded-0 px-2"
                        onClick={() => incrementar(item.id)}
                      >
                        +
                      </Button>
                      <span className="texto-2 small ms-1 text-start">{item.producto.nombre}</span>
                    </div>
                  </div>
                  <div className="col-5 col-md-6 text-end texto-2">
                    {formatearPrecio(item.producto[tipo] * item.cantidad)}
                  </div>
                </div>
              ))}

              <div className="d-flex justify-content-between align-items-center mt-4 border-top pt-3">
                <span className="texto-2 fs-5">Total a pagar</span>
                <span className="texto-2 fs-3" style={{ color: '#ff6600' }}>
                  {formatearPrecio(total)}
                </span>
              </div>
              <small className="text-muted d-block mt-2">
                {tipo === 'comercial'
                  ? 'Precios a tarifa comercial aplicados.'
                  : 'Precios a tarifa residencial aplicados.'}
              </small>
            </div>
          </Col>

          <Col xs={12} lg={5}>
            <div className="consejo-instalacion h-100">
              <h2 className="fs-4 mb-3">
                <i className="bi bi-person" /> Datos del cliente
              </h2>
              <p className="mb-1">
                <strong>Nombre:</strong> <span className="texto-2">{sesion.nombre || '-'}</span>
              </p>
              <p className="mb-1">
                <strong>Correo:</strong> <span className="texto-2">{sesion.correo || sesion.email || '-'}</span>
              </p>
              <p className="mb-0">
                <strong>Tipo de cliente:</strong>{' '}
                <span className="texto-2">{tipo === 'comercial' ? 'Comercial' : 'Residencial'}</span>
              </p>

              <hr />
              <h2 className="fs-4 mb-3">
                <i className="bi bi-truck" /> Confirmar entrega
              </h2>

              <Form onSubmit={confirmar} noValidate>
                <Form.Group className="mb-3" controlId="direccion-pago">
                  <Form.Label className="texto-2 small text-uppercase">Dirección de despacho</Form.Label>
                  <Form.Control
                    type="text"
                    className="rounded-0 border-dark"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="comuna-pago">
                  <Form.Label className="texto-2 small text-uppercase">Comuna</Form.Label>
                  <Form.Select
                    className="rounded-0 border-dark"
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                  >
                    <option value="">Seleccione su comuna</option>
                    {comunas.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <div className="mb-4">
                  <span className="texto-2 small text-uppercase d-block">Método de pago</span>
                  <Form.Check
                    type="radio"
                    name="metodo-pago"
                    id="pago-efectivo"
                    label="Efectivo"
                    value="Efectivo"
                    checked={metodoPago === 'Efectivo'}
                    onChange={(e) => setMetodoPago(e.target.value)}
                  />
                  <Form.Check
                    type="radio"
                    name="metodo-pago"
                    id="pago-tarjeta"
                    label="Tarjeta de débito / crédito"
                    value="Tarjeta"
                    checked={metodoPago === 'Tarjeta'}
                    onChange={(e) => setMetodoPago(e.target.value)}
                  />
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <div className="d-grid">
                  <Button type="submit" className="btn-login py-2 fw-bold text-uppercase border-0">
                    <i className="bi bi-check-circle" /> Confirmar pedido
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </section>
    </main>
  )
}

export default Ventas
