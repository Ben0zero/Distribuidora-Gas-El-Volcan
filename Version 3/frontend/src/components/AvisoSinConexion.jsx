import { Alert } from 'react-bootstrap'

// Aviso visible cuando el catálogo no se pudo cargar desde la API
function AvisoSinConexion() {
  return (
    <Alert variant="warning" className="d-flex align-items-center gap-2" role="alert">
      <i className="bi bi-wifi-off fs-4" />
      <span>
        No pudimos conectar con el servidor. Se muestran productos de referencia y{' '}
        <strong>por ahora no es posible comprar</strong>. Intenta nuevamente en unos minutos.
      </span>
    </Alert>
  )
}

export default AvisoSinConexion
