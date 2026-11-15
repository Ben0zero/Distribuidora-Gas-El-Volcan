import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Button, Spinner, Form, Alert } from 'react-bootstrap'
import Producto from '../components/Producto'
import AvisoSinConexion from '../components/AvisoSinConexion'
import { CATEGORIAS } from '../utils/validaciones'
import { filtrarProductos, productosSugeridos } from '../utils/busqueda'
import { useCatalogo } from '../utils/useCatalogo'

function Productos({ onAgregar }) {
  const location = useLocation()
  const navigate = useNavigate()
  const parametros = new URLSearchParams(location.search)
  const categoria = parametros.get('categoria')
  const { productos: todos, cargando, sinConexion } = useCatalogo()

  const [texto, setTexto] = useState('')
  const [abierta, setAbierta] = useState(false) // lista de sugerencias visible
  const [activa, setActiva] = useState(-1) // sugerencia marcada con el teclado

  const productos = filtrarProductos(todos, { categoria, texto })
  const sugerencias = productosSugeridos(todos, texto)
  const mostrarLista = abierta && sugerencias.length > 0

  const escribir = (valor) => {
    setTexto(valor)
    setAbierta(true)
    setActiva(-1)
  }

  const irAlDetalle = (producto) => {
    setAbierta(false)
    navigate(`/producto/${producto.id}`)
  }

  // Teclado: flechas recorren la lista, Enter abre el detalle marcado y Esc cierra la lista
  const teclaBuscador = (e) => {
    if (!mostrarLista) {
      // Con la lista cerrada (por ejemplo tras Esc), la flecha abajo la vuelve a abrir
      if (e.key === 'ArrowDown' && sugerencias.length > 0) {
        e.preventDefault()
        setAbierta(true)
        setActiva(0)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiva((i) => (i + 1) % sugerencias.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiva((i) => (i <= 0 ? sugerencias.length - 1 : i - 1))
    } else if (e.key === 'Enter' && activa >= 0) {
      e.preventDefault()
      irAlDetalle(sugerencias[activa])
    } else if (e.key === 'Escape') {
      setAbierta(false)
      setActiva(-1)
    }
  }

  return (
    <main className="fondo py-5">
      <Container>
        <h1 className="text-center mb-4 texto-2">Nuestros Productos</h1>
        {sinConexion && <AvisoSinConexion />}
        {cargando && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status" style={{ color: '#ff6600' }}>
              <span className="visually-hidden">Cargando productos…</span>
            </Spinner>
          </div>
        )}

        {/* Buscador: filtra mientras se escribe y sugiere productos que llevan a su detalle */}
        <div className="buscador-productos mx-auto mb-4 position-relative">
          <Form.Label htmlFor="buscar-producto" className="visually-hidden">
            Buscar productos
          </Form.Label>
          <div className="input-group input-group-lg shadow-sm">
            <span className="input-group-text bg-white">
              <i className="bi bi-search" aria-hidden="true" />
            </span>
            <Form.Control
              id="buscar-producto"
              type="search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={mostrarLista}
              aria-controls="sugerencias-productos"
              aria-activedescendant={mostrarLista && activa >= 0 ? `sugerencia-${sugerencias[activa].id}` : undefined}
              value={texto}
              onChange={(e) => escribir(e.target.value)}
              onKeyDown={teclaBuscador}
              onFocus={() => setAbierta(true)}
              onBlur={() => setAbierta(false)}
              placeholder="Buscar por nombre, categoría o código…"
              autoComplete="off"
            />
            {texto && (
              <Button variant="outline-secondary" onClick={() => escribir('')} aria-label="Borrar texto de búsqueda">
                <i className="bi bi-x-lg" aria-hidden="true" />
              </Button>
            )}
          </div>
          {mostrarLista && (
            <ul id="sugerencias-productos" role="listbox" aria-label="Productos sugeridos" className="list-group sugerencias-productos shadow">
              {sugerencias.map((p, i) => (
                <li
                  key={p.id}
                  id={`sugerencia-${p.id}`}
                  role="option"
                  aria-selected={i === activa}
                  className={`list-group-item list-group-item-action d-flex align-items-center gap-3 ${i === activa ? 'active' : ''}`}
                  // onMouseDown (no onClick): se dispara antes del blur del campo, que cerraría la lista
                  onMouseDown={(e) => {
                    e.preventDefault()
                    irAlDetalle(p)
                  }}
                  onMouseEnter={() => setActiva(i)}
                >
                  <img src={p.imagen} alt="" width="40" height="40" className="object-fit-contain" />
                  <span className="flex-grow-1 text-start">
                    <span className="d-block fw-semibold">{p.nombre}</span>
                    <small className={i === activa ? '' : 'text-muted'}>
                      {p.categoria} · {p.codigo}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-center mb-3">
          <Button as={Link} to="/productos" variant={categoria ? 'outline-primary' : 'primary'} className="btn-login me-2 mb-1">
            Todos
          </Button>
          {CATEGORIAS.map((c) => (
            <Button
              key={c}
              as={Link}
              to={`/productos?categoria=${encodeURIComponent(c)}`}
              variant={categoria === c ? 'primary' : 'outline-primary'}
              className="btn-login me-2 mb-1"
            >
              {c}
            </Button>
          ))}
        </div>

        {categoria && <h3 className="text-center texto-2 fw-bold">Categoría seleccionada: {categoria}</h3>}

        {!cargando && (
          <p className="text-center text-muted mb-3" aria-live="polite">
            {productos.length === 1 ? '1 producto encontrado' : `${productos.length} productos encontrados`}
            {texto && (
              <>
                {' '}para <strong>“{texto}”</strong>
              </>
            )}
          </p>
        )}

        {!cargando && productos.length === 0 && (
          <Alert variant="warning" className="text-center mx-auto" style={{ maxWidth: 620 }}>
            <i className="bi bi-search me-2" aria-hidden="true" />
            No se encontraron productos
            {texto && (
              <>
                {' '}para <strong>“{texto}”</strong>
              </>
            )}
            {categoria && <> en la categoría <strong>{categoria}</strong></>}.
            <div className="mt-3">
              {texto && (
                <Button size="sm" variant="outline-dark" className="me-2" onClick={() => setTexto('')}>
                  Limpiar búsqueda
                </Button>
              )}
              {categoria && (
                <Button as={Link} to="/productos" size="sm" variant="outline-dark">
                  Ver todas las categorías
                </Button>
              )}
            </div>
          </Alert>
        )}

        <div className="catalogo p-3 p-md-4">
          <Row xs={1} sm={1} md={2} lg={3} xl={3} xxl={4} className="g-4">
            {productos.map((p) => (
              <Col key={p.id}>
                <Producto {...p} onAgregar={onAgregar} />
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </main>
  )
}

export default Productos
