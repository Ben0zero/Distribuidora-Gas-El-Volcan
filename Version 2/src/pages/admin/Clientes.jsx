const KPI = [
    { icono: 'bi-people-fill', color: 'bg-primary text-white', titulo: 'Clientes Totales', valor: '846' },
    { icono: 'bi-person-plus', color: 'bg-success text-white', titulo: 'Nuevos este Mes', valor: '24' },
    { icono: 'bi-house-door', color: 'bg-info text-dark', titulo: 'Residenciales', valor: '575' },
    { icono: 'bi-shop', color: 'bg-warning text-dark', titulo: 'Comerciales', valor: '271' }
]

const CLIENTES = [
    { nombre: 'Pedro Soto', correo: 'pedro.soto@gmail.com', comuna: 'Bulnes', tipo: 'Residencial', compras: 6, ultimaCompra: '2026-10-09', estado: 'Nuevo', badge: 'bg-primary' },
    { nombre: 'Camila Rojas', correo: 'camila.rojas@duoc.cl', comuna: 'Pinto', tipo: 'Residencial', compras: 9, ultimaCompra: '2026-10-08', estado: 'Activo', badge: 'bg-success' },
    { nombre: 'Panadería La Espiga', correo: 'ventas@laespiga.cl', comuna: 'Chillán', tipo: 'Comercial', compras: 35, ultimaCompra: '2026-09-30', estado: 'Activo', badge: 'bg-success' },
    { nombre: 'Jorge Muñoz', correo: 'jorge.munoz@gmail.com', comuna: 'Quillón', tipo: 'Residencial', compras: 3, ultimaCompra: '2026-08-14', estado: 'Inactivo', badge: 'bg-secondary' }
]

const MEJORES_CLIENTES = [
    { nombre: 'Restaurante El Fogón', total: '$1.680.000', icono: 'bi-trophy-fill', color: 'text-warning' },
    { nombre: 'Panadería La Espiga', total: '$1.225.000', icono: 'bi-award-fill', color: 'text-secondary' },
    { nombre: 'Taller Mecánico Díaz', total: '$842.500', icono: 'bi-award-fill', color: 'text-danger' }
]

const POR_COMUNA = [
    { comuna: 'Chillán', porcentaje: 48, color: 'bg-primary' },
    { comuna: 'Chillán Viejo', porcentaje: 18, color: 'bg-info' },
    { comuna: 'Bulnes', porcentaje: 11, color: 'bg-success' },
    { comuna: 'San Ignacio', porcentaje: 9, color: 'bg-warning' }
]


function Clientes() {
    return (<>
      {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
        <h1 className="h2 fw-bold text-dark">CLIENTES</h1>
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

        <div className="row g-3">
          {/* Tabla de clientes */}
            <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-0 h-100">
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
                        {CLIENTES.map((c) => (
                        <tr key={c.correo}>
                            <td className="ps-4">
                            <div className="d-flex align-items-center">
                                <i className={`bi ${c.tipo === 'Comercial' ? 'bi-shop' : 'bi-person-circle'} fs-4 me-2 text-secondary`} />
                                <div>
                                <div className="fw-bold text-dark">{c.nombre}</div>
                                <span className="small text-muted">{c.correo}</span>
                                </div>
                            </div>
                            </td>
                            <td>{c.comuna}</td>
                            <td>{c.tipo}</td>
                            <td className="fw-bold">{c.compras}</td>
                            <td>{c.ultimaCompra}</td>
                            <td>
                            <span className={`badge ${c.badge} rounded-0 px-2 py-1`}>{c.estado}</span>
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
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Mejores Clientes del Año</h6>
                </div>
                <ul className="list-group list-group-flush">
                {MEJORES_CLIENTES.map((m) => (
                    <li className="list-group-item d-flex align-items-center py-3" key={m.nombre}>
                    <i className={`bi ${m.icono} fs-3 me-3 ${m.color}`} />
                    <div className="flex-grow-1 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                        {m.nombre}
                    </div>
                    <span className="fw-bold text-dark">{m.total}</span>
                    </li>
                ))}
                </ul>
            </div>

            <div className="card border-0 shadow-sm rounded-0 flex-grow-1">
                <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Clientes por Comuna</h6>
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
                </div>
            </div>
            </div>
        </div>
        </div>
    </>
)
}

export default Clientes