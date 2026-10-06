import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Inicio from './pages/Inicio'
import Productos from './pages/Productos'
import DetalleProducto from './pages/DetalleProducto'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Carrito from './pages/Carrito'

const CLAVE_CARRITO = 'carrito'

function App() {
  const [carrito, setCarrito] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito))
  }, [carrito])

  function agregar(id) {
    setCarrito((anterior) => {
      const existente = anterior.find((item) => item.id === id)
      if (existente) {
        return anterior.map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item))
      }
      return [...anterior, { id, cantidad: 1 }]
    })
  }

  function incrementar(id) {
    setCarrito((anterior) =>
      anterior.map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item)),
    )
  }

  function decrementar(id) {
    setCarrito((anterior) =>
      anterior
        .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item))
        .filter((item) => item.cantidad > 0),
    )
  }

  function eliminar(id) {
    setCarrito((anterior) => anterior.filter((item) => item.id !== id))
  }

  const totalItems = carrito.reduce((suma, item) => suma + item.cantidad, 0)

  return (
    <BrowserRouter>
      <Navbar totalItems={totalItems} />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/productos" element={<Productos onAgregar={agregar} />} />
        <Route path="/producto/:id" element={<DetalleProducto onAgregar={agregar} />} />
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
      </Routes>
    </BrowserRouter>
  )
}

export default App