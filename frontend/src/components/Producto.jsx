import { Link } from 'react-router-dom'
import { Card, Button } from 'react-bootstrap'
import { formatearPrecio } from '../utils/validaciones'
import '../productos.css'

function Producto(props) {
  return (
    <Card className="h-100 tarjeta-producto">
      <Card.Img className="imagen-producto" variant="top" src={props.imagen} alt={props.nombre} />
      <Card.Body className="d-flex flex-column">
        <Card.Title>{props.nombre}</Card.Title>
        <Card.Text className="text-muted">{props.descripcion}</Card.Text>
        <Card.Text className="mb-1">
          <span className="fw-bold">Residencial:</span> {formatearPrecio(props.residencial ?? 0)}
        </Card.Text>
        <Card.Text className="mb-2">
          <span className="fw-bold">Comercial:</span> {formatearPrecio(props.comercial ?? 0)}
        </Card.Text>
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