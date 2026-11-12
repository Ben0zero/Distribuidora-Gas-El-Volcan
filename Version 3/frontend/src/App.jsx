import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import MisCompras from './pages/MisCompras'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Inventario from './pages/admin/Inventario'
import ListaUsuarios from './pages/admin/ListaUsuarios'
import NuevoUsuario from './pages/admin/NuevoUsuario'
import Ordenes from './pages/admin/Ordenes'
import Reportes from './pages/admin/Reportes'
import Clientes from './pages/admin/Clientes'
import VendedorLayout from './pages/vendedor/VendedorLayout'
import ProductosVendedor from './pages/vendedor/ProductosVendedor'
import DetalleProductoVendedor from './pages/vendedor/DetalleProductoVendedor'
import OrdenesVendedor from './pages/vendedor/OrdenesVendedor'
import DetalleOrdenVendedor from './pages/vendedor/DetalleOrdenVendedor'
import { CLAVES } from './utils/validaciones'
import RutaProtegida from './components/RutaProtegida'
import { ROLES } from './utils/sesion'
import {
  agregarItem,
  incrementarItem,
  decrementarItem,
  eliminarItem,
  contarItems,
} from './utils/carrito'

// Roles que pueden comprar en la tienda (el Vendedor no compra: solo ve productos y órdenes)
const ROLES_TIENDA = [ROLES.CLIENTE, ROLES.ADMIN]

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
          {/* Checkout e historial: requieren sesión de Cliente (o Administrador) */}
          <Route
            path="/mis-compras"
            element={
              <RutaProtegida roles={ROLES_TIENDA}>
                <MisCompras />
              </RutaProtegida>
            }
          />
          <Route
            path="/ventas"
            element={
              <RutaProtegida roles={ROLES_TIENDA}>
                <Ventas
                  carrito={carrito}
                  incrementar={incrementar}
                  decrementar={decrementar}
                  vaciar={vaciar}
                />
              </RutaProtegida>
            }
          />
        </Route>

        {/* Panel de administración (con su propio layout): solo Administrador */}
        <Route
          path="/admin"
          element={
            <RutaProtegida roles={[ROLES.ADMIN]}>
              <AdminLayout />
            </RutaProtegida>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="usuarios" element={<ListaUsuarios />} />
          <Route path="usuarios/nuevo" element={<NuevoUsuario />} />
          <Route path="ordenes" element={<Ordenes />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="clientes" element={<Clientes />} />
        </Route>

        {/* Panel del Vendedor: SOLO lista y detalle de productos y de órdenes */}
        <Route
          path="/vendedor"
          element={
            <RutaProtegida roles={[ROLES.VENDEDOR, ROLES.ADMIN]}>
              <VendedorLayout />
            </RutaProtegida>
          }
        >
          <Route index element={<Navigate to="productos" replace />} />
          <Route path="productos" element={<ProductosVendedor />} />
          <Route path="productos/:id" element={<DetalleProductoVendedor />} />
          <Route path="ordenes" element={<OrdenesVendedor />} />
          <Route path="ordenes/:id" element={<DetalleOrdenVendedor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
