const KPI = [
    { icono: 'bi-cash-stack', color: 'bg-primary text-white', titulo: 'Ingresos del Mes', valor: '$4.820.000' },
    { icono: 'bi-cart-check', color: 'bg-success text-white', titulo: 'Ticket Promedio', valor: '$18.450' },
    { icono: 'bi-fire', color: 'bg-warning text-dark', titulo: 'Cilindros Vendidos', valor: '312' },
    { icono: 'bi-graph-up-arrow', color: 'bg-info text-dark', titulo: 'Crecimiento', valor: '+12,4%' },
]

// ventas de los ltimos 5 meses (altura de la barra en %, respecto al mes mas alto)
const VENTAS_MENSUALES = [
    { mes: 'Mayo', monto: '$3.143.523', altura: 64 },
    { mes: 'Junio', monto: '$3.124.647', altura: 81 },
    { mes: 'Julio', monto: '$4.634.124', altura: 95 },
    { mes: 'Agosto', monto: '$4.875.307', altura: 91 },
    { mes: 'Septiembre', monto: '$4.063.164', altura: 89 }
]

const MAS_VENDIDOS = [
    { producto: 'Cilindro GLP 11 kg', unidades: 168, ingresos: '$2.016.000', participacion: 42 },
    { producto: 'Cilindro GLP 15 kg', unidades: 74, ingresos: '$1.184.000', participacion: 25 },
    { producto: 'Cilindro GLP 45 kg', unidades: 21, ingresos: '$945.000', participacion: 20 },
    { producto: 'Cilindro GLP 5 kg', unidades: 49, ingresos: '$318.500', participacion: 7 },
    { producto: 'Regulador doméstico estándar', unidades: 23, ingresos: '$206.770', participacion: 4 },
    { producto: 'Kit conexión completo', unidades: 12, ingresos: '$155.880', participacion: 2 },
]

const POR_CATEGORIA = [
    { categoria: 'Cilindros de Gas', porcentaje: 78, color: 'bg-primary' },
    { categoria: 'Reguladores', porcentaje: 10, color: 'bg-success' },
    { categoria: 'Mangueras y Conexiones', porcentaje: 7, color: 'bg-warning' },
    { categoria: 'Accesorios', porcentaje: 5, color: 'bg-secondary' },
]

const TIPO_CLIENTE = [
    { tipo: 'Residencial', icono: 'bi-house-door', porcentaje: 68, color: 'text-primary' },
    { tipo: 'Comercial', icono: 'bi-shop', porcentaje: 32, color: 'text-success' },
]

const REPORTES_GENERADOS = [
    { nombre: 'Ventas mensuales — Septiembre 2026', fecha: '2026-10-01', formato: 'PDF', icono: 'bi-file-earmark-pdf', color: 'text-danger' },
    { nombre: 'Inventario y stock crítico', fecha: '2026-10-05', formato: 'Excel', icono: 'bi-file-earmark-excel', color: 'text-success' },
    { nombre: 'Órdenes por comuna — Tercer trimestre', fecha: '2026-10-02', formato: 'PDF', icono: 'bi-file-earmark-pdf', color: 'text-danger' },
    { nombre: 'Clientes nuevos del mes', fecha: '2026-10-08', formato: 'Excel', icono: 'bi-file-earmark-excel', color: 'text-success' },
]

function Reportes() {
    return (
    <>
      {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
        <h1 className="h2 fw-bold text-dark">REPORTES</h1>
        <span className="text-dark fs-4" aria-label="Notificaciones">
            <i className="bi bi-bell-fill" />
        </span>
        </div>

        <div className="container-fluid px-0">
        {/* Tarjetas de resumen */}
        <div className="row g-3 mb-4">
            {KPI.map((k) => (
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

        {/* Fila 1: grafico de ventas + ventas por categoria */}
        <div className="row g-3 mb-4">
            <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-0 h-100">
                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Ventas Mensuales</h6>
                <span className="small text-muted">Últimos 5 meses</span>
                </div>
                <div className="card-body">
                {/* Gráfico de barras hecho solo con divs de Bootstrap */}
                <div className="d-flex align-items-end justify-content-around" style={{ height: 200 }}>
                    {VENTAS_MENSUALES.map((v) => (
                    <div key={v.mes} className="d-flex flex-column align-items-center h-100 justify-content-end" style={{ width: '8%' }}>
                        <span className="small fw-bold text-dark mb-1">{v.monto}</span>
                        <div className="bg-primary w-100" style={{ height: `${v.altura}%`, opacity: v.mes === 'Agosto' ? 1 : 0.6 }} />
                    </div>
                    ))}
                </div>
                <div className="d-flex justify-content-around border-top pt-2 mt-1">
                    {VENTAS_MENSUALES.map((v) => (
                    <span key={v.mes} className="small text-muted text-center" style={{ width: '12%' }}>
                        {v.mes}
                    </span>
                    ))}
                </div>
                </div>
            </div>
            </div>

            <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-0 h-100">
                <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Ventas por Categoría</h6>
                </div>
                <div className="card-body">
                {POR_CATEGORIA.map((c) => (
                    <div className="mb-3" key={c.categoria}>
                    <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                        {c.categoria}
                        </span>
                        <span className="small fw-bold text-muted">{c.porcentaje}%</span>
                    </div>
                    <div className="progress rounded-0 border" style={{ height: 10 }}>
                        <div className={`progress-bar ${c.color}`} role="progressbar" style={{ width: `${c.porcentaje}%` }} />
                    </div>
                    </div>
                ))}

                <hr />
                <h6 className="fw-bold text-uppercase text-secondary mb-3" style={{ fontSize: '0.8rem' }}>
                    Tipo de Cliente
                </h6>
                <div className="d-flex justify-content-around text-center">
                    {TIPO_CLIENTE.map((t) => (
                    <div key={t.tipo}>
                        <i className={`bi ${t.icono} fs-2 ${t.color}`} />
                        <h4 className="fw-bold mb-0">{t.porcentaje}%</h4>
                        <span className="small text-muted">{t.tipo}</span>
                    </div>
                    ))}
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* Fila 2: productos más vendidos + reportes generados */}
        <div className="row g-3">
            <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-0 h-100">
                <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Productos Más Vendidos</h6>
                </div>
                <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light">
                        <tr>
                        <th className="ps-4">#</th>
                        <th>Producto</th>
                        <th>Unidades</th>
                        <th>Ingresos</th>
                        <th style={{ width: '25%' }}>Participación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MAS_VENDIDOS.map((p, i) => (
                        <tr key={p.producto}>
                            <td className="ps-4 fw-bold">{i + 1}</td>
                            <td>{p.producto}</td>
                            <td>{p.unidades}</td>
                            <td className="fw-bold">{p.ingresos}</td>
                            <td>
                            <div className="d-flex align-items-center gap-2">
                                <div className="progress rounded-0 border flex-grow-1" style={{ height: 8 }}>
                                <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${p.participacion}%` }} />
                                </div>
                                <span className="small text-muted">{p.participacion}%</span>
                            </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            </div>
            </div>

            <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-0 h-100">
                <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Reportes Generados</h6>
                </div>
                <ul className="list-group list-group-flush">
                {REPORTES_GENERADOS.map((r) => (
                    <li className="list-group-item d-flex align-items-center py-3" key={r.nombre}>
                    <i className={`bi ${r.icono} fs-3 me-3 ${r.color}`} />
                    <div className="flex-grow-1">
                        <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                        {r.nombre}
                        </div>
                        <span className="small text-muted">Generado el {r.fecha}</span>
                    </div>
                    <span className="badge bg-light text-dark border rounded-0">{r.formato}</span>
                    </li>
                ))}
                </ul>
            </div>
            </div>
        </div>
        </div>
    </>
    )
}

export default Reportes