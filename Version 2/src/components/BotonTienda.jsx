import { Link } from 'react-router-dom'

function BotonTienda() {
  return (
    <Link to="/tiendas" className="boton-tienda" aria-label="Encontrar tienda más cercana">
      <img src="/IMAGENES/loguito-boton.png" alt="Encuentra tu tienda más cercana" />
    </Link>
  )
}

export default BotonTienda
