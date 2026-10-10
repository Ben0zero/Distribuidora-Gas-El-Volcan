import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LayoutPublico from './components/LayoutPublico'
import Inicio from './pages/Inicio'
import Productos from './pages/Productos'
import DetalleProducto from './pages/DetalleProducto'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Carrito from './pages/Carrito'
import Nosotros from './pages/Nosotros'
import Consejos from './pages/Consejos'
import Tiendas from './pages/Tiendas'
import Contacto from './pages/Contacto'
import Ventas from './pages/Ventas'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Inventario from './pages/admin/Inventario'
import ListaUsuarios from './pages/admin/ListaUsuarios'
import NuevoUsuario from './pages/admin/NuevoUsuario'
import Ordenes from './pages/admin/Ordenes'
import Reportes from './pages/admin/Reportes'
import { CLAVES } from './utils/validaciones'
import {
  agregarItem,
  incrementarItem,
  decrementarItem,
  eliminarItem,
  contarItems,
} from './utils/carrito'

function App() {
  // El carrito vive aquí (estado compartido) y se persiste en localStorage.
  const [carrito, setCarrito] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CLAVES.carrito)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(CLAVES.carrito, JSON.stringify(carrito))
  }, [carrito])

  const agregar = (id) => setCarrito((anterior) => agregarItem(anterior, id))
  const incrementar = (id) => setCarrito((anterior) => incrementarItem(anterior, id))
  const decrementar = (id) => setCarrito((anterior) => decrementarItem(anterior, id))
  const eliminar = (id) => setCarrito((anterior) => eliminarItem(anterior, id))
  const vaciar = () => setCarrito([])

  const totalItems = contarItems(carrito)

  return (
    <BrowserRouter>
      <Routes>
        {/* Parte pública (con Navbar y Footer) */}
        <Route element={<LayoutPublico totalItems={totalItems} />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/productos" element={<Productos onAgregar={agregar} />} />
          <Route path="/producto/:id" element={<DetalleProducto onAgregar={agregar} />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/consejos" element={<Consejos />} />
          <Route path="/tiendas" element={<Tiendas />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/carrito"
            element={
              <Carrito
                carrito={carrito}
                incrementar={incrementar}
                decrementar={decrementar}
                eliminar={eliminar}
              />
            }
          />
          <Route
            path="/ventas"
            element={
              <Ventas
                carrito={carrito}
                incrementar={incrementar}
                decrementar={decrementar}
                vaciar={vaciar}
              />
            }
          />
        </Route>

        {/* Panel de administración (con su propio layout) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="usuarios" element={<ListaUsuarios />} />
          <Route path="usuarios/nuevo" element={<NuevoUsuario />} />
          <Route path="ordenes" element={<Ordenes />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
