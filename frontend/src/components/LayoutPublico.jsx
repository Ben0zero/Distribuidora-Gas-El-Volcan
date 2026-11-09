import { Outlet, Navigate } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import BotonTienda from './BotonTienda'
import { sesionActiva, ROLES } from '../utils/sesion'

// Layout de la parte pública: barra de navegación + contenido (Outlet) + footer.
// El Navbar y el Footer se muestran en todas las páginas públicas sin repetir código.
function LayoutPublico({ totalItems }) {
  // El Vendedor solo ve productos y órdenes en su panel: la tienda no le aparece
  if (sesionActiva()?.rol === ROLES.VENDEDOR) {
    return <Navigate to="/vendedor" replace />
  }

  return (
    <>
      <BotonTienda />
      <Navbar totalItems={totalItems} />
      <Outlet />
      <Footer />
    </>
  )
}

export default LayoutPublico
