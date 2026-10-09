import { useState } from 'react'
import { Card, Table, Button, Form, Modal, Alert, Row, Col } from 'react-bootstrap'
import { CATEGORIAS, CLAVES, formatearPrecio, leerLista } from '../../utils/validaciones'
import { productosConCreados } from '../../utils/productos'

const FORM_VACIO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  residencial: '',
  comercial: '',
  stock: '',
  stockCritico: '',
  categoria: '',
}

const esEntero = (v) => /^\d+$/.test(String(v).trim())

function Inventario() {
  const [filas, setFilas] = useState(() => productosConCreados())
  const [form, setForm] = useState(FORM_VACIO)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [editando, setEditando] = useState(null)

  const recargar = () => setFilas(productosConCreados())

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const guardarNuevo = (event) => {
    event.preventDefault()
    setOk('')

    if (form.codigo.trim().length < 3) return setError('El código debe tener al menos 3 caracteres')
    if (!form.nombre.trim()) return setError('Ingresa el nombre del producto')
    if (form.nombre.length > 100) return setError('El nombre no puede superar los 100 caracteres')

    const precioRes = parseFloat(form.residencial)
    const precioCom = parseFloat(form.comercial)
    if (isNaN(precioRes) || precioRes < 0 || isNaN(precioCom) || precioCom < 0) {
      return setError('Ingresa precios válidos (residencial y comercial)')
    }
    if (!esEntero(form.stock)) return setError('El stock debe ser un entero mayor o igual a 0')
    if (form.stockCritico && !esEntero(form.stockCritico)) return setError('El stock crítico debe ser un entero')
    if (!form.categoria) return setError('Selecciona una categoría')

    const duplicado = filas.some((f) => f.codigo.toLowerCase() === form.codigo.trim().toLowerCase())
    if (duplicado) return setError('Ya existe un producto con ese código')

    const creados = leerLista(CLAVES.productos)
    creados.push({
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      residencial: Math.round(precioRes),
      comercial: Math.round(precioCom),
      stock: parseInt(form.stock, 10),
      stockCritico: form.stockCritico ? parseInt(form.stockCritico, 10) : 0,
      categoria: form.categoria,
    })
    localStorage.setItem(CLAVES.productos, JSON.stringify(creados))

    setForm(FORM_VACIO)
    setError('')
    setOk('Producto guardado correctamente en el inventario')
    recargar()
  }

  const abrirEdicion = (fila) => {
    setError('')
    setOk('')
    setEditando({
      tipo: fila.base ? 'base' : 'creado',
      id: fila.id,
      codigo: fila.codigo,
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      residencial: fila.residencial,
      comercial: fila.comercial,
      stock: fila.stock,
      stockCritico: fila.stockCritico,
      categoria: fila.categoria,
    })
  }

  const guardarEdicion = (event) => {
    event.preventDefault()
    const e = editando

    if (!e.nombre.trim()) return setError('El nombre no puede estar vacío')
    const precioRes = parseFloat(e.residencial)
    const precioCom = parseFloat(e.comercial)
    if (isNaN(precioRes) || precioRes < 0 || isNaN(precioCom) || precioCom < 0) {
      return setError('Ingresa precios válidos (residencial y comercial)')
    }
    if (!esEntero(e.stock)) return setError('El stock debe ser un entero mayor o igual a 0')
    if (e.stockCritico !== '' && !esEntero(e.stockCritico)) return setError('El stock crítico debe ser un entero')

    const cambios = {
      nombre: e.nombre.trim(),
      descripcion: e.descripcion.trim(),
      residencial: Math.round(precioRes),
      comercial: Math.round(precioCom),
      stock: parseInt(e.stock, 10),
      stockCritico: e.stockCritico !== '' ? parseInt(e.stockCritico, 10) : 0,
      categoria: e.categoria,
    }

    if (e.tipo === 'base') {
      const ediciones = leerLista(CLAVES.edicionesProductos)
      const idx = ediciones.findIndex((x) => x.id === e.id)
      if (idx >= 0) ediciones[idx] = { ...ediciones[idx], ...cambios }
      else ediciones.push({ id: e.id, ...cambios })
      localStorage.setItem(CLAVES.edicionesProductos, JSON.stringify(ediciones))
    } else {
      const creados = leerLista(CLAVES.productos)
      const idx = creados.findIndex((p) => p.codigo.toLowerCase() === e.codigo.toLowerCase())
      if (idx >= 0) creados[idx] = { ...creados[idx], ...cambios }
      localStorage.setItem(CLAVES.productos, JSON.stringify(creados))
    }

    setEditando(null)
    setError('')
    setOk('Producto actualizado correctamente')
    recargar()
  }

  const eliminar = (codigo) => {
    const creados = leerLista(CLAVES.productos).filter((p) => p.codigo.toLowerCase() !== codigo.toLowerCase())
    localStorage.setItem(CLAVES.productos, JSON.stringify(creados))
    setOk('Producto eliminado del inventario')
    recargar()
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="display-6 text-dark fw-bold mb-0">INVENTARIO</h1>
        <span className="text-dark fs-4" aria-label="Notificaciones">
          <i className="bi bi-bell-fill" />
        </span>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {ok && <Alert variant="success">{ok}</Alert>}

      <Card className="border border-2 shadow-sm rounded-0 mx-auto mb-4" style={{ maxWidth: 1100 }}>
        <div
          className="card-header bg-secondary bg-opacity-25 py-2 border-bottom border-2 text-uppercase fw-bold text-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          Lista de productos
        </div>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="table-secondary">
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio Res.</th>
                  <th>Precio Com.</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => {
                  const critico = f.stock <= f.stockCritico
                  return (
                    <tr key={`${f.base ? 'b' : 'c'}-${f.codigo}`}>
                      <td className="fw-bold">{f.codigo}</td>
                      <td>{f.nombre}</td>
                      <td>{f.categoria}</td>
                      <td>
                        <span className={`badge ${critico ? 'bg-danger' : 'bg-success'}`}>{f.stock}</span>
                      </td>
                      <td>{formatearPrecio(f.residencial)}</td>
                      <td>{formatearPrecio(f.comercial)}</td>
                      <td className="text-end">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-1"
                          onClick={() => abrirEdicion(f)}
                        >
                          Editar
                        </Button>
                        {!f.base && (
                          <Button size="sm" variant="outline-danger" onClick={() => eliminar(f.codigo)}>
                            Eliminar
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <h2 className="h4 mb-3 text-uppercase fw-bold text-dark">Nuevo producto</h2>

      <Card className="border border-2 shadow-sm rounded-0 mx-auto" style={{ maxWidth: 900 }}>
        <div
          className="card-header bg-secondary bg-opacity-25 py-2 border-bottom border-2 text-uppercase fw-bold text-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          Agregar producto al inventario
        </div>
        <Card.Body className="p-4">
          <Form onSubmit={guardarNuevo} noValidate>
            <Form.Group className="mb-3">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                Código del Producto (Min. 3 caracteres)
              </Form.Label>
              <Form.Control
                className="rounded-0 border-dark"
                placeholder="Ej: CL001"
                value={form.codigo}
                onChange={cambiar('codigo')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                Nombre del Producto (Max. 100 caracteres)
              </Form.Label>
              <Form.Control
                className="rounded-0 border-dark"
                maxLength={100}
                placeholder="Ej: Cilindro de Gas 15 Kg"
                value={form.nombre}
                onChange={cambiar('nombre')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                Descripción (Opcional, Max. 500 caracteres)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                maxLength={500}
                className="rounded-0 border-dark"
                placeholder="Detalles del producto..."
                value={form.descripcion}
                onChange={cambiar('descripcion')}
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6} className="mb-3 mb-md-0">
                <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                  Precio Residencial ($)
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  className="rounded-0 border-dark"
                  value={form.residencial}
                  onChange={cambiar('residencial')}
                />
              </Col>
              <Col md={6}>
                <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                  Precio Comercial ($)
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  className="rounded-0 border-dark"
                  value={form.comercial}
                  onChange={cambiar('comercial')}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6} className="mb-3 mb-md-0">
                <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                  Stock Inicial (Enteros)
                </Form.Label>
                <Form.Control
                  type="number"
                  step="1"
                  min="0"
                  className="rounded-0 border-dark"
                  value={form.stock}
                  onChange={cambiar('stock')}
                />
              </Col>
              <Col md={6}>
                <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                  Stock Crítico (Alerta opcional)
                </Form.Label>
                <Form.Control
                  type="number"
                  step="1"
                  min="0"
                  className="rounded-0 border-dark"
                  value={form.stockCritico}
                  onChange={cambiar('stockCritico')}
                />
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                  -- Seleccione la Categoría --
                </Form.Label>
                <Form.Select
                  className="rounded-0 border-dark"
                  value={form.categoria}
                  onChange={cambiar('categoria')}
                >
                  <option value="">Elige una categoría...</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            <div className="text-center mt-4">
              <Button
                type="submit"
                variant="dark"
                className="text-uppercase px-5 py-2 rounded-0 fw-bold"
                style={{ fontSize: '0.9rem' }}
              >
                Guardar Producto
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Modal show={!!editando} onHide={() => setEditando(null)} size="lg" centered>
        <Modal.Header closeButton className="bg-secondary bg-opacity-25 border-bottom border-2">
          <Modal.Title className="fw-bold text-uppercase" style={{ fontSize: '0.95rem' }}>
            Editar producto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {editando && (
            <Form onSubmit={guardarEdicion} noValidate>
              <Row className="mb-3">
                <Col md={6} className="mb-3 mb-md-0">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                    Código
                  </Form.Label>
                  <Form.Control className="rounded-0 border-dark bg-light" value={editando.codigo} readOnly />
                </Col>
                <Col md={6}>
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                    Nombre
                  </Form.Label>
                  <Form.Control
                    className="rounded-0 border-dark"
                    maxLength={100}
                    value={editando.nombre}
                    onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6} className="mb-3 mb-md-0">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                    Precio Residencial ($)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    className="rounded-0 border-dark"
                    value={editando.residencial}
                    onChange={(e) => setEditando({ ...editando, residencial: e.target.value })}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                    Precio Comercial ($)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    className="rounded-0 border-dark"
                    value={editando.comercial}
                    onChange={(e) => setEditando({ ...editando, comercial: e.target.value })}
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6} className="mb-3 mb-md-0">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                    Stock
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="1"
                    min="0"
                    className="rounded-0 border-dark"
                    value={editando.stock}
                    onChange={(e) => setEditando({ ...editando, stock: e.target.value })}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                    Stock Crítico
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="1"
                    min="0"
                    className="rounded-0 border-dark"
                    value={editando.stockCritico}
                    onChange={(e) => setEditando({ ...editando, stockCritico: e.target.value })}
                  />
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                  Categoría
                </Form.Label>
                <Form.Select
                  className="rounded-0 border-dark"
                  value={editando.categoria}
                  onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}
                >
                  <option value="">Elige una categoría...</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                  Descripción
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  maxLength={500}
                  className="rounded-0 border-dark"
                  value={editando.descripcion}
                  onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
                />
              </Form.Group>

              <div className="text-center">
                <Button
                  type="submit"
                  variant="dark"
                  className="text-uppercase px-5 py-2 rounded-0 fw-bold"
                  style={{ fontSize: '0.9rem' }}
                >
                  Guardar cambios
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}

export default Inventario
