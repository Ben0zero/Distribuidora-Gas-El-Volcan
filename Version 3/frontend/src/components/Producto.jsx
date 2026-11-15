import { Link } from 'react-router-dom'
import { Card, Button } from 'react-bootstrap'
import { formatearPrecio } from '../utils/validaciones'
import { tipoPrecioSesion } from '../utils/sesion'
import '../productos.css'

// Una línea de precio. Con sesión se destaca la del tipo de cliente y la otra queda tenue;
// sin sesión (tipo = null) ambas se ven iguales.
function LineaPrecio({ etiqueta, valor, tipo, propio }) {
  const destacada = tipo !== null && propio
  const tenue = tipo !== null && !propio
  return (
    <Card.Text className={`mb-1 ${tenue ? 'text-muted small' : ''}`}>
      <span className="fw-bold">{etiqueta}:</span>{' '}
      <span className={`text-nowrap ${destacada ? 'fw-bold' : ''}`}>{formatearPrecio(valor ?? 0)}</span>
      {destacada && <span className="badge rounded-pill text-bg-warning ms-2 align-text-bottom">Tu precio</span>}
    </Card.Text>
  )
}

function Producto(props) {
  const tipo = tipoPrecioSesion()
  return (
    <Card className="h-100 tarjeta-producto">
      <Card.Img className="imagen-producto" variant="top" src={props.imagen} alt={props.nombre} />
      <Card.Body className="d-flex flex-column">
        <Card.Title>{props.nombre}</Card.Title>
        <Card.Text className="text-muted">{props.descripcion}</Card.Text>
        <LineaPrecio etiqueta="Residencial" valor={props.residencial} tipo={tipo} propio={tipo === 'residencial'} />
        <LineaPrecio etiqueta="Comercial" valor={props.comercial} tipo={tipo} propio={tipo === 'comercial'} />
        <div className="mb-2" />
        <div className="d-flex gap-2 mt-auto">
          <Button className="btn-login" variant="primary" onClick={() => props.onAgregar(props.id)}>
            Agregar
          </Button>
          <Button className="btn-producto-detalle" as={Link} to={`/producto/${props.id}`}>
            Ver detalles
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}

export default Producto