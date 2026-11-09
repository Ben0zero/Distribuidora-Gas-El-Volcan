import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { sesionActiva, cerrarSesion } from '../../utils/sesion'

// Panel del Vendedor: SOLO lista y detalle de productos y de órdenes (requisito de roles).
const MENU = [
  { to: '/vendedor/productos', icono: 'bi-box-seam', label: 'Productos' },
  { to: '/vendedor/ordenes', icono: 'bi-receipt', label: 'Órdenes' },
]

function classNav({ isActive }) {
  return 'nav-link ' + (isActive ? 'active' : 'link-dark')
}

function VendedorLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const navigate = useNavigate()
  const sesion = sesionActiva()

  const salir = () => {
    cerrarSesion()
    navigate('/login')
  }

  return (
    <>
      {/* Barra superior solo en móvil */}
      <nav className="d-lg-none d-flex align-items-center justify-content-between bg-white border-bottom px-3 py-2 sticky-top">
        <Link to="/vendedor" className="d-flex align-items-center text-decoration-none link-dark">
          <img src="/IMAGENES/Logo Gas.png" alt="Logo El Volcán" width="40" className="me-2" />
          <span className="fs-5 fw-bold">El Volcán · Ventas</span>
        </Link>
        <button
          className="btn btn-outline-dark rounded-0"
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-expanded={menuAbierto}
          aria-controls="sidebarVendedor"
          aria-label="Abrir menú"
        >
          <i className="bi bi-list fs-4" />
        </button>
      </nav>

      <div className="d-flex vh-100">
        <aside
          id="sidebarVendedor"
          className={`collapse d-lg-flex flex-column flex-shrink-0 p-3 bg-white border-end ${menuAbierto ? 'show' : ''}`}
          style={{ width: 250 }}
        >
          <Link to="/vendedor" className="d-flex align-items-center mb-3 link-dark text-decoration-none border-bottom pb-3 w-100">
            <img src="/IMAGENES/Logo Gas.png" alt="Logo El Volcán" width="40" className="me-2" />
            <span className="fs-5 fw-bold">El Volcán</span>
          </Link>
          <span className="badge text-bg-secondary align-self-start mb-2">Vendedor · solo lectura</span>

          <nav className="nav nav-pills flex-column mb-auto mt-2" aria-label="Menú del vendedor">
            {MENU.map((l) => (
              <div className="nav-item mb-1" key={l.to}>
                <NavLink to={l.to} className={classNav}>
                  <i className={`bi ${l.icono} me-2`} /> {l.label}
                </NavLink>
              </div>
            ))}
          </nav>

          <hr />
          <span className="d-flex align-items-center link-dark">
            <i className="bi bi-person-circle fs-4 me-2" />
            <strong>{sesion?.nombre || 'Vendedor'}</strong>
          </span>
          <button className="btn btn-sm btn-outline-dark rounded-0 mt-2" type="button" onClick={salir}>
            Cerrar sesión
          </button>
        </aside>

        <main className="flex-grow-1 p-4 overflow-auto fondo-admin bg-transparent">
          <Outlet />
        </main>
      </div>
    </>
  )
}

export default VendedorLayout
