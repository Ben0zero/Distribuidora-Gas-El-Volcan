import { catalogoActual } from '../../utils/productos'
import { formatearPrecio } from '../../utils/validaciones'

const ORDENES = [
  { id: '#V-1045', cliente: 'Juan Pérez', detalle: '2x Cilindro 15kg', estado: 'En Reparto', badge: 'bg-warning text-dark' },
  { id: '#V-1044', cliente: 'María González', detalle: '1x Cilindro 45kg', estado: 'Entregado', badge: 'bg-success' },
  { id: '#V-1043', cliente: 'Pedro Soto', detalle: '1x Cilindro 11kg', estado: 'Pendiente', badge: 'bg-secondary' },
  { id: '#V-1042', cliente: 'Luisa Martínez', detalle: '1x Cilindro 5kg', estado: 'Entregado', badge: 'bg-success' },
]

const KPI = [
  { icono: 'bi-currency-dollar', color: 'bg-primary text-white', titulo: 'Ventas del Día', valor: '$450.000' },
  { icono: 'bi-truck', color: 'bg-warning text-dark', titulo: 'En Ruta', valor: '12 Órdenes' },
  { icono: 'bi-people', color: 'bg-success text-white', titulo: 'Clientes Nuevos', valor: '24' },
]

function Dashboard() {
  const productos = catalogoActual()
  const criticos = productos.filter((p) => p.stock <= p.stockCritico)
  const cilindros = productos.filter((p) => p.categoria === 'Cilindros de Gas')

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
        <h1 className="h2 fw-bold text-dark">¡HOLA Administrador!</h1>
        <span className="text-dark fs-4" aria-label="Notificaciones">
          <i className="bi bi-bell-fill" />
        </span>
      </div>

      <div className="container-fluid px-0">
        <div className="row g-3 mb-4">
          {KPI.map((k) => (
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
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-0">
              <div className="card-body d-flex align-items-center">
                <div
                  className="bg-danger text-white p-3 me-3 fs-4 d-flex align-items-center justify-content-center"
                  style={{ width: 50, height: 50 }}
                >
                  <i className="bi bi-exclamation-triangle" />
                </div>
                <div>
                  <h6 className="text-muted mb-0" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Stock Crítico
                  </h6>
                  <h4 className="mb-0 fw-bold">{criticos.length} Productos</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm rounded-0 h-100">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Últimas Órdenes Recibidas</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">ID Pedido</th>
                        <th>Cliente</th>
                        <th>Detalle</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ORDENES.map((o) => (
                        <tr key={o.id}>
                          <td className="ps-4 fw-bold">{o.id}</td>
                          <td>{o.cliente}</td>
                          <td>{o.detalle}</td>
                          <td>
                            <span className={`badge ${o.badge} rounded-0 px-2 py-1`}>{o.estado}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-0 h-100">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Nivel de Inventario</h6>
              </div>
              <div className="card-body">
                {cilindros.map((p) => {
                  // El "nivel" es stock vs. un máximo de referencia (200 unidades).
                  const nivel = Math.min(100, Math.round((p.stock / 200) * 100))
                  const color = nivel <= 15 ? 'bg-danger' : nivel <= 45 ? 'bg-success' : 'bg-info'
                  return (
                    <div className="mb-3" key={p.id}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                          {p.nombre}
                        </span>
                        <span className={`small fw-bold text-muted`}>{nivel}%</span>
                      </div>
                      <div className="progress rounded-0 border" style={{ height: 10 }}>
                        <div className={`progress-bar ${color}`} role="progressbar" style={{ width: `${nivel}%` }} />
                      </div>
                    </div>
                  )
                })}
                {criticos.length > 0 && (
                  <p className="small text-danger fw-bold mb-0">
                    {criticos.length} producto(s) en stock crítico. Revisa el inventario.
                  </p>
                )}
                <p className="small text-muted mb-0 mt-2">
                  Valor total del catálogo: {formatearPrecio(productos.reduce((s, p) => s + p.residencial * p.stock, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
