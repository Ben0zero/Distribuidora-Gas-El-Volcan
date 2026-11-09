import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Spinner } from 'react-bootstrap'
import { listarVentas } from '../../utils/api'
import { formatearPrecio } from '../../utils/validaciones'
import { estadoVenta, formatearFecha, numeroOrden, resumenVentas, masRecientes } from '../../utils/ventas'

const COLORES_COMUNA = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-secondary']

// Órdenes del administrador: GET /api/v1/ventas (ms-ventas)
function Ordenes() {
  const [ventas, setVentas] = useState(null) // null = cargando
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    listarVentas()
      .then((data) => activo && setVentas(masRecientes(data)))
      .catch((e) => {
        if (!activo) return
        setVentas([])
        setError(e.message || 'No se pudieron cargar las órdenes.')
      })
    return () => {
      activo = false
    }
  }, [])

  const resumen = resumenVentas(ventas || [])
  const kpi = [
    { icono: 'bi-receipt', color: 'bg-primary text-white', titulo: 'Órdenes Totales', valor: resumen.total },
    { icono: 'bi-hourglass-split', color: 'bg-secondary text-white', titulo: 'Pendientes de Pago', valor: resumen.pendientes },
    { icono: 'bi-check-circle', color: 'bg-success text-white', titulo: 'Pagadas', valor: resumen.pagadas },
    { icono: 'bi-cash-stack', color: 'bg-warning text-dark', titulo: 'Ingresos', valor: formatearPrecio(resumen.ingresos) },
  ]

  return (
    <>
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
        <h1 className="h2 fw-bold text-dark">ÓRDENES</h1>
        <span className="text-dark fs-4" aria-label="Notificaciones">
          <i className="bi bi-bell-fill" />
        </span>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {ventas === null ? (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando órdenes…</span>
        </Spinner>
      ) : (
        <div className="container-fluid px-0">
          {/* Tarjetas de resumen */}
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
            {/* Tabla de órdenes */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-0 h-100">
                <div className="card-header bg-white border-bottom py-3">
                  <h6 className="mb-0 fw-bold text-uppercase text-secondary">Listado de Órdenes</h6>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th className="ps-4">N° Orden</th>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Comuna</th>
                          <th>Productos</th>
                          <th>Total</th>
                          <th>Pago</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventas.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-4 text-secondary">Aún no hay órdenes registradas.</td>
                          </tr>
                        )}
                        {ventas.map((o) => {
                          const estado = estadoVenta(o.estado)
                          const unidades = (o.detalles || []).reduce((s, d) => s + Number(d.cantidad || 0), 0)
                          return (
                            <tr key={o.id}>
                              <td className="ps-4 fw-bold">
                                <Link to={`/vendedor/ordenes/${o.id}`}>{numeroOrden(o.id)}</Link>
                              </td>
                              <td>{formatearFecha(o.fechaVenta)}</td>
                              <td>{o.usuario || '-'}</td>
                              <td>{o.comuna || '-'}</td>
                              <td>{unidades} unidad(es)</td>
                              <td className="fw-bold">{formatearPrecio(o.total)}</td>
                              <td>{o.metodoPago || '-'}</td>
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

            {/* Órdenes por comuna */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-0 h-100">
                <div className="card-header bg-white border-bottom py-3">
                  <h6 className="mb-0 fw-bold text-uppercase text-secondary">Órdenes por Comuna</h6>
                </div>
                <div className="card-body">
                  {resumen.porComuna.map((c, i) => (
                    <div className="mb-3" key={c.comuna}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{c.comuna}</span>
                        <span className="small fw-bold text-muted">{c.porcentaje}%</span>
                      </div>
                      <div className="progress rounded-0 border" style={{ height: 10 }}>
                        <div
                          className={`progress-bar ${COLORES_COMUNA[i % COLORES_COMUNA.length]}`}
                          role="progressbar"
                          style={{ width: `${c.porcentaje}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {resumen.porComuna.length === 0 && <p className="small text-muted mb-0">Sin datos todavía.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Ordenes
