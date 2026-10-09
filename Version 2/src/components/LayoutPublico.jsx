import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import BotonTienda from './BotonTienda'

// Layout de la parte pública: barra de navegación + contenido (Outlet) + footer.
// El Navbar y el Footer se muestran en todas las páginas públicas sin repetir código.
function LayoutPublico({ totalItems }) {
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
