const KPI = [
    { icono: 'bi-receipt', color: 'bg-primary text-white', titulo: 'Órdenes del Mes', valor: '128' },
    { icono: 'bi-hourglass-split', color: 'bg-secondary text-white', titulo: 'Pendientes', valor: '9' },
    { icono: 'bi-truck', color: 'bg-warning text-dark', titulo: 'En Reparto', valor: '12' },
    { icono: 'bi-check-circle', color: 'bg-success text-white', titulo: 'Entregadas', valor: '107' },
]

const ORDENES = [
    { id: '#V-1045', fecha: '2026-10-09', cliente: 'Juan Pérez', comuna: 'Chillán', detalle: '2x Cilindro 15kg', total: '$32.000', pago: 'Efectivo', estado: 'En Reparto', badge: 'bg-warning text-dark' },
    { id: '#V-1044', fecha: '2026-10-09', cliente: 'María González', comuna: 'Chillán Viejo', detalle: '1x Cilindro 45kg', total: '$45.000', pago: 'Tarjeta', estado: 'Entregado', badge: 'bg-success' },
    { id: '#V-1043', fecha: '2026-10-09', cliente: 'Pedro Soto', comuna: 'Bulnes', detalle: '1x Cilindro 11kg', total: '$12.000', pago: 'Efectivo', estado: 'Pendiente', badge: 'bg-secondary' },
]

const POR_COMUNA = [
    { comuna: 'Chillán', porcentaje: 45, color: 'bg-primary' },
    { comuna: 'Chillán Viejo', porcentaje: 20, color: 'bg-info' },
    { comuna: 'Bulnes', porcentaje: 12, color: 'bg-success' },
    { comuna: 'San Ignacio', porcentaje: 10, color: 'bg-warning' },
]

function Ordenes() {
    return (
    <>
      {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
            <h1 className="h2 fw-bold text-dark">ÓRDENES</h1>
            <span className="text-dark fs-4" aria-label="Notificaciones">
                <i className="bi bi-bell-fill" />
            </span>
        </div>

        <div className="container-fluid px-0">
            {/* Tarjetas de resumen */}
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
                        <th>Detalle</th>
                        <th>Total</th>
                        <th>Pago</th>
                        <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ORDENES.map((o) => (
                        <tr key={o.id}>
                            <td className="ps-4 fw-bold">{o.id}</td>
                            <td>{o.fecha}</td>
                            <td>{o.cliente}</td>
                            <td>{o.comuna}</td>
                            <td>{o.detalle}</td>
                            <td className="fw-bold">{o.total}</td>
                            <td>{o.pago}</td>
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

          {/* Órdenes por comuna */}
            <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-0 h-100">
                <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Órdenes por Comuna</h6>
                </div>
                <div className="card-body">
                {POR_COMUNA.map((c) => (
                    <div className="mb-3" key={c.comuna}>
                    <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                        {c.comuna}
                        </span>
                        <span className="small fw-bold text-muted">{c.porcentaje}%</span>
                    </div>
                    <div className="progress rounded-0 border" style={{ height: 10 }}>
                        <div className={`progress-bar ${c.color}`} role="progressbar" style={{ width: `${c.porcentaje}%` }} />
                    </div>
                    </div>
                ))}
                <p className="small text-muted mb-0 mt-2">Datos de muestra del mes actual.</p>
                </div>
            </div>
            </div>
        </div>
        </div>
    </>
    )
}

export default Ordenes