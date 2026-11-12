// Hook del catálogo: obtiene los productos de ms-catalogoProductos (ids numéricos).
// Si la API no responde, usa el catálogo local de referencia y lo indica con
// sinConexion = true para que la página muestre un aviso (en vez de fallar en silencio).
import { useEffect, useState } from 'react'
import { obtenerProductos } from './api'
import { desdeApi, productosConCreados } from './productos'

export function useCatalogo() {
  const [estado, setEstado] = useState({ productos: [], cargando: true, sinConexion: false })

  useEffect(() => {
    let activo = true
    obtenerProductos()
      .then((data) => {
        if (activo) setEstado({ productos: data.map(desdeApi), cargando: false, sinConexion: false })
      })
      .catch(() => {
        if (activo) setEstado({ productos: productosConCreados(), cargando: false, sinConexion: true })
      })
    return () => {
      activo = false
    }
  }, [])

  return estado
}
