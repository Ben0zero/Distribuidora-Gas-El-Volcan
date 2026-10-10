import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { CLAVES } from '../../utils/validaciones'

const PRINCIPAL = [
  { to: '/admin', end: true, icono: 'bi-grid-fill', label: 'Dashboard' },
  { to: '/admin/inventario', icono: 'bi-box-seam', label: 'Inventario' },
  { to: '/admin/usuarios', icono: 'bi-person-badge', label: 'Empleados' },
  { to: '/admin/ordenes', icono: 'bi-receipt', label: 'Órdenes' },
  { to: '/admin/reportes', icono: 'bi-file-earmark-bar-graph', label: 'Reportes' },
]

const SECUNDARIA = [{ to: '/admin/usuarios/nuevo', icono: 'bi-person-plus', label: '+Profile' }]

const inactivos = [
  { icono: 'bi-people', label: 'Clientes' },
]

function classNav({ isActive }) {
  return 'nav-link ' + (isActive ? 'active' : 'link-dark')
}

function AdminLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const navigate = useNavigate()

  const cerrarSesion = () => {
    localStorage.removeItem(CLAVES.sesion)
    navigate('/login')
  }

  return (
    <>
      {/* Barra superior solo en móvil */}
      <nav className="d-lg-none d-flex align-items-center justify-content-between bg-white border-bottom px-3 py-2 sticky-top">
        <Link to="/admin" className="d-flex align-items-center text-decoration-none link-dark">
          <img src="/IMAGENES/Logo Gas.png" alt="Logo El Volcán" width="40" className="me-2" />
          <span className="fs-5 fw-bold">El Volcán</span>
        </Link>
        <button
          className="btn btn-outline-dark rounded-0"
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-expanded={menuAbierto}
          aria-controls="sidebarAdmin"
        >
          <i className="bi bi-list fs-4" />
        </button>
      </nav>

      <div className="d-flex vh-100">
        {/* Menú lateral */}
        <aside
          id="sidebarAdmin"
          className={`collapse d-lg-flex flex-column flex-shrink-0 p-3 bg-white border-end ${menuAbierto ? 'show' : ''}`}
          style={{ width: 250 }}
        >
          <Link
            to="/admin"
            className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none border-bottom pb-3 w-100"
          >
            <img src="/IMAGENES/Logo Gas.png" alt="Logo El Volcán" width="40" className="me-2" />
            <span className="fs-5 fw-bold">El Volcán</span>
          </Link>

          <div className="nav nav-pills flex-column mb-auto mt-3">
            {PRINCIPAL.map((l) => (
              <div className="nav-item mb-1" key={l.to}>
                <NavLink to={l.to} end={l.end} className={classNav}>
                  <i className={`bi ${l.icono} me-2`} /> {l.label}
                </NavLink>
              </div>
            ))}
            {inactivos.map((l) => (
              <div className="nav-item mb-1" key={l.label}>
                <span className="nav-link link-dark" style={{ cursor: 'not-allowed' }}>
                  <i className={`bi ${l.icono} me-2`} /> {l.label}
                </span>
              </div>
            ))}
          </div>

          <hr />
          <div className="nav nav-pills flex-column mb-3">
            {SECUNDARIA.map((l) => (
              <div className="nav-item mb-1" key={l.to}>
                <NavLink to={l.to} end className={classNav}>
                  <i className={`bi ${l.icono} me-2`} /> {l.label}
                </NavLink>
              </div>
            ))}
          </div>

          <hr />
          <div className="d-flex align-items-center justify-content-between">
            <span className="d-flex align-items-center link-dark text-decoration-none">
              <i className="bi bi-person-circle fs-4 me-2" />
              <strong>Perfil Admin</strong>
            </span>
          </div>
          <button className="btn btn-sm btn-outline-dark rounded-0 mt-2" type="button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </aside>

        {/* Contenido */}
        <main className="flex-grow-1 p-4 overflow-auto fondo-admin bg-transparent">
          <Outlet />
        </main>
      </div>
    </>
  )
}

export default AdminLayout
