// Búsqueda del catálogo: funciones puras (sin React) para poder probarlas aisladas.
// Reglas:
//  - No distingue mayúsculas ni tildes ("conexion" encuentra "Conexiones").
//  - Busca en nombre, categoría y código (no en la descripción: evita ruido).
//  - Se combina con el filtro por categoría.
//  - Sugiere palabras clave del catálogo ("cil" -> "Cilindro").

const DIACRITICOS = /[\u0300-\u036f]/g

// Texto comparable: minúsculas, sin tildes, sin espacios repetidos.
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const CAMPOS_BUSQUEDA = ['nombre', 'categoria', 'codigo']

// true si el producto contiene el término en alguno de sus campos.
export function coincideProducto(producto, termino) {
  const buscado = normalizar(termino)
  if (!buscado) return true
  return CAMPOS_BUSQUEDA.some((campo) => normalizar(producto?.[campo]).includes(buscado))
}

// Filtra por categoría (exacta) y por texto libre. Sin filtros devuelve todo.
export function filtrarProductos(productos, { categoria = null, texto = '' } = {}) {
  return (productos || []).filter(
    (producto) => (!categoria || producto.categoria === categoria) && coincideProducto(producto, texto),
  )
}

// Palabras clave sugeridas: categorías y palabras de los nombres que contienen
// el texto escrito. Devuelve como máximo `limite` sugerencias sin repetir.
export function sugerenciasProductos(productos, texto, limite = 5) {
  const buscado = normalizar(texto)
  if (buscado.length < 2) return []

  const candidatos = []
  const agregar = (valor) => {
    const limpio = String(valor ?? '').trim()
    if (!limpio) return
    const clave = normalizar(limpio)
    if (candidatos.some((c) => c.clave === clave)) return
    candidatos.push({ clave, valor: limpio })
  }

  for (const producto of productos || []) {
    for (const campo of ['nombre', 'categoria']) {
      const valor = String(producto?.[campo] ?? '').trim()
      if (!valor) continue
      agregar(valor)
      // También las palabras sueltas: "Cilindro de Gas 5 kg" -> "Cilindro", "Gas"…
      valor.split(/[^\p{L}\p{N}]+/u).forEach(agregar)
    }
  }

  return candidatos
    .filter((c) => c.clave !== buscado && c.clave.includes(buscado))
    .sort((a, b) => {
      const inicioA = a.clave.indexOf(buscado)
      const inicioB = b.clave.indexOf(buscado)
      // Primero las que empiezan con el texto, después las más cortas.
      if (inicioA !== inicioB) return inicioA - inicioB
      return a.clave.length - b.clave.length
    })
    .slice(0, limite)
    .map((c) => c.valor)
}
