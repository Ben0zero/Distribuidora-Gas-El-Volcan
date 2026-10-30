import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Container, Row, Col, Button } from 'react-bootstrap'
import Producto from '../components/Producto'
import { CATEGORIAS } from '../utils/validaciones'
import { productosConCreados } from '../utils/productos'
import { obtenerProductos } from '../utils/api'

function Productos({ onAgregar }) {
  const location = useLocation()
  const parametros = new URLSearchParams(location.search)
  const categoria = parametros.get('categoria')
  const [productosApi, setProductosApi] = useState([])

  useEffect(() => {
    obtenerProductos().then((data) => {
      const mapped = data.map((p) => ({
        id: p.id,
        codigo: p.sku,
        nombre: p.nombre,
        precio: p.precioResidencial || p.precio,
        categoria: p.categoria || 'Cilindros de Gas',
        imagen: p.imagen || '',
        descripcion: p.descripcion || ''
      }))
      setProductosApi(mapped)
    }).catch(() => {})
  }, [])

  const todos = productosApi.length > 0 ? productosApi : productosConCreados()
  const productos = categoria ? todos.filter((p) => p.categoria === categoria) : todos

  return (
    <main className="fondo py-5">
      <Container>
        <h1 className="text-center mb-4 texto-2">Nuestros Productos</h1>

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