import { Navigate, useLocation } from 'react-router-dom'
import { sesionActiva, rutaInicial } from '../utils/sesion'

/**
 * Protege una ruta según el rol de la sesión:
 * - sin sesión o con el token expirado -> /login (recordando a dónde quería ir)
 * - con un rol no permitido -> la ruta inicial de su propio rol
 * La seguridad real la aplica el backend (JWT + roles); esto evita mostrar vistas que no corresponden.
 */
function RutaProtegida({ roles, children }) {
  const location = useLocation()
  const sesion = sesionActiva()

  if (!sesion) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }
  if (roles && !roles.includes(sesion.rol)) {
    return <Navigate to={rutaInicial(sesion.rol)} replace />
  }
  return children
}

export default RutaProtegida
