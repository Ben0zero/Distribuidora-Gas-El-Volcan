import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Spinner } from 'react-bootstrap'
import { listarVentas, obtenerProductos, obtenerInventario } from '../../utils/api'
import { formatearPrecio } from '../../utils/validaciones'
import { desdeApi } from '../../utils/productos'
import { combinarInventario } from '../../utils/inventario'
import { estadoVenta, numeroOrden, resumenVentas, masRecientes } from '../../utils/ventas'
import { sesionActiva } from '../../utils/sesion'

// Tope de stock por producto en ms-inventario (nivel 100%)
const STOCK_MAXIMO = 500

// Trae ventas, catálogo y stock en paralelo; cada fuente puede fallar sin botar el panel
async function cargarDashboard() {
  const [ventas, productos, stock] = await Promise.allSettled([listarVentas(), obtenerProductos(), obtenerInventario()])
  const fallas = [ventas, productos, stock].filter((r) => r.status === 'rejected').length
  return {
    ventas: ventas.status === 'fulfilled' ? ventas.value : [],
    inventario: productos.status === 'fulfilled'
      ? combinarInventario(productos.value.map(desdeApi), stock.status === 'fulfilled' ? stock.value : [])
      : [],
    error: fallas ? 'Algunos datos no se pudieron cargar. Revisa que los microservicios estén levantados.' : '',
  }
}

function Dashboard() {
  const [datos, setDatos] = useState(null) // null = cargando
  const nombre = sesionActiva()?.nombre || 'Administrador'

  useEffect(() => {
    let activo = true
    cargarDashboard().then((d) => activo && setDatos(d))
    return () => {
      activo = false
    }
  }, [])

  if (!datos) {
    return (
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Cargando panel…</span>
      </Spinner>
    )
  }

  const resumen = resumenVentas(datos.ventas)
  const criticos = datos.inventario.filter((p) => p.bajoStock)
  const cilindros = datos.inventario.filter((p) => p.categoria === 'Cilindros de Gas')
  const kpi = [
    { icono: 'bi-currency-dollar', color: 'bg-primary text-white', titulo: 'Ingresos (pagadas)', valor: formatearPrecio(resumen.ingresos) },
    { icono: 'bi-receipt', color: 'bg-success text-white', titulo: 'Órdenes', valor: `${resumen.total} Órdenes` },
    { icono: 'bi-hourglass-split', color: 'bg-warning text-dark', titulo: 'Pendientes de Pago', valor: resumen.pendientes },
    { icono: 'bi-exclamation-triangle', color: 'bg-danger text-white', titulo: 'Stock Crítico', valor: `${criticos.length} Productos` },
  ]

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
        <h1 className="h2 fw-bold text-dark">¡HOLA {nombre}!</h1>
        <span className="text-dark fs-4" aria-label="Notificaciones">
          <i className="bi bi-bell-fill" />
        </span>
      </div>

      {datos.error && <Alert variant="warning">{datos.error}</Alert>}

      <div className="container-fluid px-0">
        <div className="row g-3 mb-4">
          {kpi.map((k) => (
            <div className="col-md-3" key={k.titulo}>
              <div className="card border-0 shadow-sm rounded-0">
                <div className="card-body d-flex align-items-center">
                  <div
                    className={`${k.color} p-3 me-3 fs-4 d-flex align-items-center justify-content-center`}
                    style={{ width: 50, height: 50 }}
                  >
                    <i className={`bi ${k.icono}`} />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      {k.titulo}
                    </h6>
                    <h4 className="mb-0 fw-bold">{k.valor}</h4>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-3">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm rounded-0 h-100">
              <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Últimas Órdenes Recibidas</h6>
                <Link to="/admin/ordenes" className="small">Ver todas</Link>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">N° Orden</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.ventas.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-secondary">Aún no hay órdenes.</td>
                        </tr>
                      )}
                      {masRecientes(datos.ventas, 5).map((o) => {
                        const estado = estadoVenta(o.estado)
                        return (
                          <tr key={o.id}>
                            <td className="ps-4 fw-bold">{numeroOrden(o.id)}</td>
                            <td>{o.usuario || '-'}</td>
                            <td>{formatearPrecio(o.total)}</td>
                            <td>
                              <span className={`badge bg-${estado.color} rounded-0 px-2 py-1`}>{estado.texto}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-0 h-100">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Nivel de Inventario (cilindros)</h6>
              </div>
              <div className="card-body">
                {cilindros.map((p) => {
                  // nivel = stock actual respecto del máximo permitido en ms-inventario
                  const nivel = Math.min(100, Math.round(((p.stock || 0) / STOCK_MAXIMO) * 100))
                  const color = p.bajoStock ? 'bg-danger' : nivel <= 30 ? 'bg-success' : 'bg-info'
                  return (
                    <div className="mb-3" key={p.id}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{p.nombre}</span>
                        <span className="small fw-bold text-muted">{p.stock ?? '-'} u.</span>
                      </div>
                      <div className="progress rounded-0 border" style={{ height: 10 }}>
                        <div className={`progress-bar ${color}`} role="progressbar" style={{ width: `${nivel}%` }} />
                      </div>
                    </div>
                  )
                })}
                {criticos.length > 0 && (
                  <p className="small text-danger fw-bold mb-0">
                    {criticos.length} producto(s) en stock crítico: {criticos.map((p) => p.codigo).join(', ')}.{' '}
                    <Link to="/admin/inventario">Revisar inventario</Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
