import { useEffect, useState } from 'react'
import { Alert, Button, Spinner } from 'react-bootstrap'
import { listarVentas, listarUsuarios, obtenerProductos } from '../../utils/api'
import { formatearPrecio } from '../../utils/validaciones'
import { desdeApi } from '../../utils/productos'
import { formatearFecha, numeroOrden, estadoVenta } from '../../utils/ventas'
import { reporteVentas, ventasMensuales, aCsv, descargarCsv } from '../../utils/reportes'

const COLORES_CATEGORIA = ['bg-primary', 'bg-success', 'bg-warning', 'bg-secondary', 'bg-info']
const ICONOS_TIPO = { Residencial: { icono: 'bi-house-door', color: 'text-primary' }, Comercial: { icono: 'bi-shop', color: 'text-success' } }

async function cargarReportes() {
  const [ventas, productos, usuarios] = await Promise.allSettled([listarVentas(), obtenerProductos(), listarUsuarios()])
  const valor = (r) => (r.status === 'fulfilled' ? r.value : [])
  return {
    ventas: valor(ventas),
    productos: valor(productos).map(desdeApi),
    usuarios: valor(usuarios),
    error: [ventas, productos, usuarios].some((r) => r.status === 'rejected')
      ? 'Algunos datos no se pudieron cargar. Revisa que los microservicios estén levantados.'
      : '',
  }
}

// Reportes del administrador calculados con las ventas pagadas de ms-ventas
function Reportes() {
  const [datos, setDatos] = useState(null) // null = cargando

  useEffect(() => {
    let activo = true
    cargarReportes().then((d) => activo && setDatos(d))
    return () => {
      activo = false
    }
  }, [])

  if (!datos) {
    return (
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Cargando reportes…</span>
      </Spinner>
    )
  }

  const r = reporteVentas(datos.ventas, datos.productos, datos.usuarios)
  const meses = ventasMensuales(datos.ventas)
  const kpi = [
    { icono: 'bi-cash-stack', color: 'bg-primary text-white', titulo: 'Ingresos Totales', valor: formatearPrecio(r.ingresos) },
    { icono: 'bi-cart-check', color: 'bg-success text-white', titulo: 'Ticket Promedio', valor: formatearPrecio(r.ticketPromedio) },
    { icono: 'bi-fire', color: 'bg-warning text-dark', titulo: 'Cilindros Vendidos', valor: r.cilindrosVendidos },
    { icono: 'bi-receipt', color: 'bg-info text-dark', titulo: 'Órdenes Pagadas', valor: r.ordenesPagadas },
  ]

  const exportarVentas = () =>
    descargarCsv(
      'ventas-el-volcan.csv',
      aCsv(
        datos.ventas.map((v) => ({
          orden: numeroOrden(v.id),
          fecha: formatearFecha(v.fechaVenta),
          cliente: v.usuario,
          comuna: v.comuna,
          pago: v.metodoPago,
          estado: estadoVenta(v.estado).texto,
          total: v.total,
        })),
        [
          { titulo: 'Orden', campo: 'orden' },
          { titulo: 'Fecha', campo: 'fecha' },
          { titulo: 'Cliente', campo: 'cliente' },
          { titulo: 'Comuna', campo: 'comuna' },
          { titulo: 'Pago', campo: 'pago' },
          { titulo: 'Estado', campo: 'estado' },
          { titulo: 'Total', campo: 'total' },
        ],
      ),
    )

  const exportarMasVendidos = () =>
    descargarCsv(
      'productos-mas-vendidos.csv',
      aCsv(r.masVendidos, [
        { titulo: 'Producto', campo: 'producto' },
        { titulo: 'Categoría', campo: 'categoria' },
        { titulo: 'Unidades', campo: 'unidades' },
        { titulo: 'Ingresos', campo: 'ingresos' },
        { titulo: 'Participación (%)', campo: 'participacion' },
      ]),
    )

  return (
    <>
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
        <h1 className="h2 fw-bold text-dark">REPORTES</h1>
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

        {/* Fila 1: gráfico de ventas + ventas por categoría */}
        <div className="row g-3 mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-0 h-100">
              <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Ventas Mensuales</h6>
                <span className="small text-muted">Últimos 5 meses (ventas pagadas)</span>
              </div>
              <div className="card-body">
                {/* Gráfico de barras hecho solo con divs de Bootstrap */}
                <div className="d-flex align-items-end justify-content-around" style={{ height: 200 }}>
                  {meses.map((m) => (
                    <div key={m.mes} className="d-flex flex-column align-items-center h-100 justify-content-end" style={{ width: '12%' }}>
                      <span className="small fw-bold text-dark mb-1">{formatearPrecio(m.monto)}</span>
                      <div className="bg-primary w-100" style={{ height: `${m.altura}%` }} title={`${m.mes}: ${formatearPrecio(m.monto)}`} />
                    </div>
                  ))}
                </div>
                <div className="d-flex justify-content-around border-top pt-2 mt-1">
                  {meses.map((m) => (
                    <span key={m.mes} className="small text-muted text-center" style={{ width: '12%' }}>{m.mes}</span>
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
                {r.porCategoria.length === 0 && <p className="small text-muted">Aún no hay ventas pagadas.</p>}
                {r.porCategoria.map((c, i) => (
                  <div className="mb-3" key={c.categoria}>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{c.categoria}</span>
                      <span className="small fw-bold text-muted">{c.porcentaje}%</span>
                    </div>
                    <div className="progress rounded-0 border" style={{ height: 10 }}>
                      <div
                        className={`progress-bar ${COLORES_CATEGORIA[i % COLORES_CATEGORIA.length]}`}
                        role="progressbar"
                        style={{ width: `${c.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))}

                <hr />
                <h6 className="fw-bold text-uppercase text-secondary mb-3" style={{ fontSize: '0.8rem' }}>Tipo de Cliente</h6>
                <div className="d-flex justify-content-around text-center">
                  {r.tipoCliente.map((t) => (
                    <div key={t.tipo}>
                      <i className={`bi ${ICONOS_TIPO[t.tipo].icono} fs-2 ${ICONOS_TIPO[t.tipo].color}`} />
                      <h4 className="fw-bold mb-0">{t.porcentaje}%</h4>
                      <span className="small text-muted">{t.tipo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fila 2: productos más vendidos + exportar */}
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
                      {r.masVendidos.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-secondary">Aún no hay ventas pagadas.</td>
                        </tr>
                      )}
                      {r.masVendidos.map((p, i) => (
                        <tr key={p.producto}>
                          <td className="ps-4 fw-bold">{i + 1}</td>
                          <td>{p.producto}</td>
                          <td>{p.unidades}</td>
                          <td className="fw-bold">{formatearPrecio(p.ingresos)}</td>
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
                <h6 className="mb-0 fw-bold text-uppercase text-secondary">Exportar Reportes</h6>
              </div>
              <div className="card-body d-grid gap-3">
                <p className="small text-muted mb-0">Descarga los datos actuales en CSV (se abre en Excel).</p>
                <Button variant="outline-success" className="rounded-0 text-start" onClick={exportarVentas} disabled={datos.ventas.length === 0}>
                  <i className="bi bi-file-earmark-excel me-2" /> Ventas (todas las órdenes)
                </Button>
                <Button variant="outline-success" className="rounded-0 text-start" onClick={exportarMasVendidos} disabled={r.masVendidos.length === 0}>
                  <i className="bi bi-file-earmark-excel me-2" /> Productos más vendidos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Reportes
