import { Link } from 'react-router-dom'
import { Table, Spinner } from 'react-bootstrap'
import { useCatalogo } from '../../utils/useCatalogo'
import AvisoSinConexion from '../../components/AvisoSinConexion'
import { formatearPrecio } from '../../utils/validaciones'

// Lista de productos del catálogo (solo lectura)
function ProductosVendedor() {
  const { productos, cargando, sinConexion } = useCatalogo()

  return (
    <section>
      <h1 className="h3 mb-3">Productos</h1>
      {sinConexion && <AvisoSinConexion />}
      {cargando ? (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando productos…</span>
        </Spinner>
      ) : (
        <Table responsive hover className="bg-white align-middle">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th className="text-end">Precio residencial</th>
              <th className="text-end">Precio comercial</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id}>
                <td className="fw-bold">{p.codigo}</td>
                <td>{p.nombre}</td>
                <td>{p.categoria}</td>
                <td className="text-end">{formatearPrecio(p.residencial)}</td>
                <td className="text-end">{formatearPrecio(p.comercial)}</td>
                <td className="text-end">
                  <Link to={`/vendedor/productos/${p.id}`} className="btn btn-sm btn-outline-primary">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </section>
  )
}

export default ProductosVendedor
