import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Table } from 'react-bootstrap'
import { ADMIN_DEFAULT, CLAVES, leerLista } from '../../utils/validaciones'

const FILTROS = ['Todos los usuarios', 'Administradores', 'Clientes', 'Vendedores']

function ListaUsuarios() {
  const [filtro, setFiltro] = useState('Todos los usuarios')

  const usuarios = [ADMIN_DEFAULT, ...leerLista(CLAVES.usuarios)]

  const filtrados = usuarios.filter((u) => {
    if (filtro === 'Administradores') return u.rol === 'Administrador'
    if (filtro === 'Clientes') return u.rol === 'Cliente'
    if (filtro === 'Vendedores') return u.rol === 'Vendedor'
    return true
  })

  return (
    <>
      <div className="d-flex justify-content-end mb-4">
        <span className="text-dark fs-4" aria-label="Notificaciones">
          <i className="bi bi-bell-fill" />
        </span>
      </div>

      <div className="d-flex align-items-center mb-4">
        <h1 className="display-6 me-4 mb-0 text-dark fw-bold">Usuarios</h1>
        <Link
          to="/admin/usuarios/nuevo"
          className="btn btn-dark text-uppercase px-4 py-2 rounded-0"
          style={{ fontSize: '0.8rem', fontWeight: 'bold' }}
        >
          Nuevo Usuario
        </Link>
      </div>

      <div className="mb-3">
        <select
          className="form-select form-select-sm w-auto border-0 bg-transparent fw-bold text-secondary"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          aria-label="Filtrar por rol"
        >
          {FILTROS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="table-responsive border border-2">
        <Table hover striped className="align-middle mb-0">
          <thead className="table-light border-bottom border-2 border-dark">
            <tr>
              <th className="py-3">Fecha Registro</th>
              <th className="py-3">RUN</th>
              <th className="py-3">Nombre Completo</th>
              <th className="py-3">Rol</th>
              <th className="py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-secondary">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            ) : (
              filtrados.map((u, i) => (
                <tr key={`${u.correo || u.email}-${i}`}>
                  <td className="py-3">{u.fecha || '-'}</td>
                  <td className="py-3">{u.run || '-'}</td>
                  <td className="py-3">{u.nombre || '-'}</td>
                  <td className="py-3">{u.rol || 'Cliente'}</td>
                  <td className="py-3">{u.estado || 'Activo'}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <nav className="mt-4 d-flex justify-content-center">
        <ul className="pagination pagination-sm rounded-0">
          <li className="page-item">
            <span className="page-link text-dark rounded-0 px-3">«</span>
          </li>
          <li className="page-item">
            <span className="page-link text-dark rounded-0 px-3">&lt;</span>
          </li>
          <li className="page-item active">
            <span className="page-link bg-primary text-white border-primary rounded-0 px-3">1</span>
          </li>
          <li className="page-item">
            <span className="page-link text-dark rounded-0 px-3">&gt;</span>
          </li>
          <li className="page-item">
            <span className="page-link text-dark rounded-0 px-3">»</span>
          </li>
        </ul>
      </nav>
    </>
  )
}

export default ListaUsuarios
