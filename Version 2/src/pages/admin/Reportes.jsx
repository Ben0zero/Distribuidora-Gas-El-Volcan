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
        </div>
    </>
    )
}