import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Container, Row, Col, Button, Spinner, Form, Alert } from 'react-bootstrap'
import Producto from '../components/Producto'
import AvisoSinConexion from '../components/AvisoSinConexion'
import { CATEGORIAS } from '../utils/validaciones'
import { filtrarProductos, sugerenciasProductos } from '../utils/busqueda'
import { useCatalogo } from '../utils/useCatalogo'

function Productos({ onAgregar }) {
  const location = useLocation()
  const parametros = new URLSearchParams(location.search)
  const categoria = parametros.get('categoria')
  const { productos: todos, cargando, sinConexion } = useCatalogo()

  const [texto, setTexto] = useState('')

  const productos = filtrarProductos(todos, { categoria, texto })
  const sugerencias = sugerenciasProductos(todos, texto)

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

        {/* Buscador: filtra mientras se escribe y sugiere palabras clave */}
        <div className="buscador-productos mx-auto mb-4">
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
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar por nombre, categoría o código…"
              autoComplete="off"
            />
            {texto && (
              <Button variant="outline-secondary" onClick={() => setTexto('')} aria-label="Borrar texto de búsqueda">
                <i className="bi bi-x-lg" aria-hidden="true" />
              </Button>
            )}
          </div>
          {sugerencias.length > 0 && (
            <div className="mt-2" aria-live="polite">
              <span className="text-muted small me-2">Sugerencias:</span>
              {sugerencias.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="btn btn-sm btn-outline-primary me-2 mb-1"
                  onClick={() => setTexto(s)}
                >
                  {s}
                </button>
              ))}
            </div>
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
