import { Link } from 'react-router-dom'
import { Card, Button } from 'react-bootstrap'
import '../productos.css'

function Producto(props) {
  return (
    <Card className="h-100">
      <Card.Img className="imagen-producto" variant="top" src={props.imagen} alt={props.nombre} />
      <Card.Body className="d-flex flex-column">
        <Card.Title>{props.nombre}</Card.Title>
        <Card.Text className="text-muted">{props.descripcion}</Card.Text>
        <Card.Text className="fw-bold">Precio residencial: ${props.residencial.toLocaleString('es-CL')}</Card.Text>
        <div className="d-flex gap-2 mt-auto">
          <Button className="btn-login" variant="primary" onClick={() => props.onAgregar(props.id)}>
            Agregar
          </Button>
          <Button className="btn-login" as={Link} to={`/producto/${props.id}`} variant="outline-primary">
            Ver detalle
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}

export default Producto