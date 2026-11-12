import { useEffect, useState } from 'react'
import { Alert, Spinner } from 'react-bootstrap'
import { listarUsuarios, listarVentas } from '../../utils/api'
import { formatearPrecio } from '../../utils/validaciones'
import { formatearFecha } from '../../utils/ventas'
import { resumenClientes } from '../../utils/reportes'

const COLORES_COMUNA = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-secondary']
const MEDALLAS = [
  { icono: 'bi-trophy-fill', color: 'text-warning' },
  { icono: 'bi-award-fill', color: 'text-secondary' },
  { icono: 'bi-award-fill', color: 'text-danger' },
]

async function cargarClientes() {
  const [usuarios, ventas] = await Promise.allSettled([listarUsuarios(), listarVentas()])
  if (usuarios.status === 'rejected') {
    return { resumen: resumenClientes([], []), error: 'No se pudieron cargar los clientes: ' + usuarios.reason.message }
  }
  return {
    resumen: resumenClientes(usuarios.value, ventas.status === 'fulfilled' ? ventas.value : []),
    error: ventas.status === 'rejected' ? 'No se pudieron cargar las compras de los clientes.' : '',
  }
}

// Clientes del administrador: usuarios CLIENTE de ms-auth cruzados con sus ventas de ms-ventas
function Clientes() {
  const [datos, setDatos] = useState(null) // null = cargando

  useEffect(() => {
    let activo = true
    cargarClientes().then((d) => activo && setDatos(d))
    return () => {
      activo = false
    }
  }, [])

  if (!datos) {
    return (
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Cargando clientes…</span>
      </Spinner>
    )
  }

  const r = datos.resumen
  const kpi = [
    { icono: 'bi-people-fill', color: 'bg-primary text-white', titulo: 'Clientes Totales', valor: r.total },
    { icono: 'bi-cart-check', color: 'bg-success text-white', titulo: 'Con Compras', valor: r.conCompras },
    { icono: 'bi-house-door', color: 'bg-info text-dark', titulo: 'Residenciales', valor: r.residenciales },
    { icono: 'bi-shop', color: 'bg-warning text-dark', titulo: 'Comerciales', valor: r.comerciales },
  ]

  return (
    <>
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
        <h1 className="h2 fw-bold text-dark">CLIENTES</h1>
        <span className="text-dark fs-4" aria-label="Notificaciones">
          <i className="bi bi-bell-fill" />
        </span>
      </div>

      {datos.error && <Alert variant="warning">{datos.error}</Alert>}

      <div className="container-fluid px-0">
        {/* Tarjetas de resumen */}
        <div className="row g-3 mb-4">
          {kpi.map((k) => (
            <div className="col-md-6 col-xl-3" key={k.titulo}>
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
          {/* Tabla de clientes */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-0">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Listado de Clientes</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">Cliente</th>
                        <th>Comuna</th>
                        <th>Tipo</th>
                        <th>Compras</th>
                        <th>Última compra</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.clientes.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-secondary">Aún no hay clientes registrados.</td>
                        </tr>
                      )}
                      {r.clientes.map((c) => (
                        <tr key={c.id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <i className={`bi ${c.tipoCliente === 'Comercial' ? 'bi-shop' : 'bi-person-circle'} fs-4 me-2 text-secondary`} />
                              <div>
                                <div className="fw-bold text-dark">{c.nombre}</div>
                                <span className="small text-muted">{c.username}</span>
                              </div>
                            </div>
                          </td>
                          <td>{c.comuna || '-'}</td>
                          <td>{c.tipoCliente || 'Residencial'}</td>
                          <td className="fw-bold">{c.compras}</td>
                          <td>{formatearFecha(c.ultimaCompra)}</td>
                          <td>
                            <span className={`badge ${c.compras > 0 ? 'bg-success' : 'bg-secondary'} rounded-0 px-2 py-1`}>
                              {c.compras > 0 ? 'Activo' : 'Sin compras'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: mejores clientes + por comuna */}
          <div className="col-lg-4 d-flex flex-column gap-3">
            <div className="card border-0 shadow-sm rounded-0">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Mejores Clientes</h6>
              </div>
              <ul className="list-group list-group-flush">
                {r.mejores.length === 0 && <li className="list-group-item small text-muted">Aún no hay compras pagadas.</li>}
                {r.mejores.map((m, i) => (
                  <li className="list-group-item d-flex align-items-center py-3" key={m.id}>
                    <i className={`bi ${MEDALLAS[i].icono} fs-3 me-3 ${MEDALLAS[i].color}`} />
                    <div className="flex-grow-1 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{m.nombre}</div>
                    <span className="fw-bold text-dark">{formatearPrecio(m.totalGastado)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card border-0 shadow-sm rounded-0 flex-grow-1">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Clientes por Comuna</h6>
              </div>
              <div className="card-body">
                {r.porComuna.map((c, i) => (
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Clientes
