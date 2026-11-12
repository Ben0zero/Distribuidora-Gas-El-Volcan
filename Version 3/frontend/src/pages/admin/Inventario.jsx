import { useCallback, useEffect, useState } from 'react'
import { Card, Table, Button, Form, Modal, Alert, Row, Col, Spinner } from 'react-bootstrap'
import { CATEGORIAS, formatearPrecio } from '../../utils/validaciones'
import { desdeApi } from '../../utils/productos'
import { combinarInventario, ajusteDeStock, productoDesdeFormulario, validarProducto } from '../../utils/inventario'
import {
  obtenerProductos,
  obtenerInventario,
  crearProducto,
  actualizarProducto,
  desactivarProducto,
  ajustarStock,
  ApiError,
} from '../../utils/api'

const FORM_VACIO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  residencial: '',
  comercial: '',
  stock: '',
  categoria: '',
  imagen: '',
}

const etiqueta = { fontSize: '0.75rem' }

function mensaje(e) {
  return e instanceof ApiError ? e.message.replace(/^Error:\s*/, '') : 'No se pudo conectar con el servidor.'
}

// Trae catálogo y stock en paralelo; el stock es opcional (si falla, se muestra el catálogo igual)
async function cargarInventario() {
  const [productos, stock] = await Promise.allSettled([obtenerProductos(), obtenerInventario()])
  if (productos.status === 'rejected') {
    return { filas: [], error: 'No se pudo cargar el catálogo: ' + mensaje(productos.reason) }
  }
  return {
    filas: combinarInventario(productos.value.map(desdeApi), stock.status === 'fulfilled' ? stock.value : []),
    error: stock.status === 'rejected' ? 'No se pudo cargar el stock: ' + mensaje(stock.reason) : '',
  }
}

// Inventario del administrador: catálogo (ms-catalogoProductos) + stock (ms-inventario)
function Inventario() {
  const [filas, setFilas] = useState(null) // null = cargando
  const [form, setForm] = useState(FORM_VACIO)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const aplicar = useCallback(({ filas: nuevas, error: errorCarga }) => {
    setFilas(nuevas)
    if (errorCarga) setError(errorCarga)
  }, [])

  const cargar = useCallback(async () => aplicar(await cargarInventario()), [aplicar])

  useEffect(() => {
    let activo = true
    cargarInventario().then((resultado) => activo && aplicar(resultado))
    return () => {
      activo = false
    }
  }, [aplicar])

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  // Ejecuta una operación contra la API mostrando el resultado
  const ejecutar = async (accion, textoOk) => {
    setGuardando(true)
    setError('')
    setOk('')
    try {
      await accion()
      setOk(textoOk)
      await cargar()
      return true
    } catch (e) {
      setError(mensaje(e))
      return false
    } finally {
      setGuardando(false)
    }
  }

  const guardarNuevo = async (event) => {
    event.preventDefault()
    const invalido = validarProducto(form)
    if (invalido) return setError(invalido)

    const producto = productoDesdeFormulario(form)
    const creado = await ejecutar(async () => {
      // 1) POST /api/v1/productos (ms-catalogoProductos crea también su registro de inventario en 0)
      await crearProducto(producto)
      // 2) stock inicial: PUT /api/v1/inventario/aumentar
      const ajuste = ajusteDeStock(0, form.stock || 0)
      if (ajuste) await ajustarStock(ajuste.operacion, producto.sku, ajuste.cantidad)
    }, 'Producto guardado correctamente en el inventario')
    if (creado) setForm(FORM_VACIO)
  }

  const abrirEdicion = (fila) => {
    setError('')
    setOk('')
    setEditando({
      id: fila.id,
      codigo: fila.codigo,
      nombre: fila.nombre,
      descripcion: fila.descripcion || '',
      residencial: String(fila.residencial),
      comercial: String(fila.comercial),
      categoria: fila.categoria,
      imagen: fila.imagen || '',
      stock: fila.stock === null ? '' : String(fila.stock),
      stockOriginal: fila.stock ?? 0,
    })
  }

  const guardarEdicion = async (event) => {
    event.preventDefault()
    const e = editando
    const invalido = validarProducto(e, { nuevo: false })
    if (invalido) return setError(invalido)

    const listo = await ejecutar(async () => {
      // PUT /api/v1/productos/{id} (el SKU no cambia)
      await actualizarProducto(e.id, productoDesdeFormulario(e))
      // si cambió el stock se envía solo la diferencia a ms-inventario
      const ajuste = e.stock === '' ? null : ajusteDeStock(e.stockOriginal, e.stock)
      if (ajuste) await ajustarStock(ajuste.operacion, e.codigo, ajuste.cantidad)
    }, 'Producto actualizado correctamente')
    if (listo) setEditando(null)
  }

  const eliminar = (fila) => {
    if (!window.confirm(`¿Eliminar "${fila.nombre}" del catálogo? Dejará de mostrarse en la tienda.`)) return
    // DELETE /api/v1/productos/{sku}: borrado lógico (activo = false)
    ejecutar(() => desactivarProducto(fila.codigo), 'Producto eliminado del catálogo')
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
          {filas === null ? (
            <div className="text-center p-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando inventario…</span>
              </Spinner>
            </div>
          ) : (
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
                  {filas.map((f) => (
                    <tr key={f.id}>
                      <td className="fw-bold">{f.codigo}</td>
                      <td>{f.nombre}</td>
                      <td>{f.categoria}</td>
                      <td>
                        {f.stock === null ? (
                          <span className="badge bg-secondary">Sin registro</span>
                        ) : (
                          <span className={`badge ${f.bajoStock ? 'bg-danger' : 'bg-success'}`} title={f.bajoStock ? 'Stock crítico' : ''}>
                            {f.stock}
                          </span>
                        )}
                      </td>
                      <td>{formatearPrecio(f.residencial)}</td>
                      <td>{formatearPrecio(f.comercial)}</td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" className="me-1" onClick={() => abrirEdicion(f)} disabled={guardando}>
                          Editar
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => eliminar(f)} disabled={guardando}>
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
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
            <Form.Group className="mb-3" controlId="nuevo-codigo">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>
                Código del Producto (Min. 3 caracteres)
              </Form.Label>
              <Form.Control className="rounded-0 border-dark" placeholder="Ej: CL005" value={form.codigo} onChange={cambiar('codigo')} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="nuevo-nombre">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>
                Nombre del Producto (Max. 100 caracteres)
              </Form.Label>
              <Form.Control
                className="rounded-0 border-dark"
                maxLength={100}
                placeholder="Ej: Cilindro de Gas 25 Kg"
                value={form.nombre}
                onChange={cambiar('nombre')}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="nuevo-descripcion">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>
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
                <Form.Group controlId="nuevo-residencial">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Precio Residencial ($)</Form.Label>
                  <Form.Control type="number" min="0" className="rounded-0 border-dark" value={form.residencial} onChange={cambiar('residencial')} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="nuevo-comercial">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Precio Comercial ($)</Form.Label>
                  <Form.Control type="number" min="0" className="rounded-0 border-dark" value={form.comercial} onChange={cambiar('comercial')} />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6} className="mb-3 mb-md-0">
                <Form.Group controlId="nuevo-stock">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Stock Inicial (Enteros, máx. 500)</Form.Label>
                  <Form.Control type="number" step="1" min="0" className="rounded-0 border-dark" value={form.stock} onChange={cambiar('stock')} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="nuevo-categoria">
                  <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Categoría</Form.Label>
                  <Form.Select className="rounded-0 border-dark" value={form.categoria} onChange={cambiar('categoria')}>
                    <option value="">Elige una categoría...</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4" controlId="nuevo-imagen">
              <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>
                Imagen (opcional, ruta en /IMAGENES)
              </Form.Label>
              <Form.Control className="rounded-0 border-dark" placeholder="/IMAGENES/Logo Gas.png" value={form.imagen} onChange={cambiar('imagen')} />
            </Form.Group>

            <div className="text-center mt-4">
              <Button type="submit" variant="dark" className="text-uppercase px-5 py-2 rounded-0 fw-bold" style={{ fontSize: '0.9rem' }} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar Producto'}
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
                  <Form.Group controlId="editar-codigo">
                    <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Código (no editable)</Form.Label>
                    <Form.Control className="rounded-0 border-dark bg-light" value={editando.codigo} readOnly />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="editar-nombre">
                    <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Nombre</Form.Label>
                    <Form.Control
                      className="rounded-0 border-dark"
                      maxLength={100}
                      value={editando.nombre}
                      onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={4} className="mb-3 mb-md-0">
                  <Form.Group controlId="editar-residencial">
                    <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Precio Residencial ($)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      className="rounded-0 border-dark"
                      value={editando.residencial}
                      onChange={(e) => setEditando({ ...editando, residencial: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4} className="mb-3 mb-md-0">
                  <Form.Group controlId="editar-comercial">
                    <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Precio Comercial ($)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      className="rounded-0 border-dark"
                      value={editando.comercial}
                      onChange={(e) => setEditando({ ...editando, comercial: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="editar-stock">
                    <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Stock</Form.Label>
                    <Form.Control
                      type="number"
                      step="1"
                      min="0"
                      className="rounded-0 border-dark"
                      value={editando.stock}
                      onChange={(e) => setEditando({ ...editando, stock: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3" controlId="editar-categoria">
                <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Categoría</Form.Label>
                <Form.Select
                  className="rounded-0 border-dark"
                  value={editando.categoria}
                  onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}
                >
                  <option value="">Elige una categoría...</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="editar-descripcion">
                <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  maxLength={500}
                  className="rounded-0 border-dark"
                  value={editando.descripcion}
                  onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="editar-imagen">
                <Form.Label className="text-uppercase fw-bold text-secondary" style={etiqueta}>Imagen</Form.Label>
                <Form.Control
                  className="rounded-0 border-dark"
                  value={editando.imagen}
                  onChange={(e) => setEditando({ ...editando, imagen: e.target.value })}
                />
              </Form.Group>

              <div className="text-center">
                <Button type="submit" variant="dark" className="text-uppercase px-5 py-2 rounded-0 fw-bold" style={{ fontSize: '0.9rem' }} disabled={guardando}>
                  {guardando ? 'Guardando…' : 'Guardar cambios'}
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
