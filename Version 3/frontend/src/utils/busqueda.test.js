// Pruebas unitarias de la búsqueda del catálogo (funciones puras, sin DOM).
import { describe, test, expect } from 'vitest'
import {
  normalizar,
  coincideProducto,
  filtrarProductos,
  productosSugeridos,
} from './busqueda'

const PRODUCTOS = [
  {
    id: 1,
    nombre: 'Cilindro GLP 5 kg',
    descripcion: 'Cilindro de gas licuado para uso doméstico',
    categoria: 'Cilindros de Gas',
    codigo: 'CL005',
  },
  {
    id: 2,
    nombre: 'Regulador de presión',
    descripcion: 'Regulador para cilindros de 5 y 11 kg',
    categoria: 'Reguladores',
    codigo: 'RE001',
  },
  {
    id: 3,
    nombre: 'Manguera de conexión',
    descripcion: 'Manguera reforzada para conexiones de gas',
    categoria: 'Mangueras y Conexiones',
    codigo: 'MA010',
  },
]

describe('normalizar', () => {
  test('quita mayúsculas, tildes y espacios sobrantes', () => {
    expect(normalizar('  Cilíndro   de GÁS ')).toBe('cilindro de gas')
    expect(normalizar('Conexión')).toBe('conexion')
    expect(normalizar(null)).toBe('')
  })
})

describe('coincideProducto', () => {
  test('encuentra por nombre sin distinguir mayúsculas ni tildes', () => {
    expect(coincideProducto(PRODUCTOS[0], 'CILINDRO')).toBe(true)
    expect(coincideProducto(PRODUCTOS[2], 'conexion')).toBe(true)
  })

  test('encuentra por categoría y código', () => {
    expect(coincideProducto(PRODUCTOS[1], 'reguladores')).toBe(true)
    expect(coincideProducto(PRODUCTOS[2], 'ma010')).toBe(true)
    // La descripción no se usa para buscar (evita coincidencias ruidosas)
    expect(coincideProducto(PRODUCTOS[0], 'domestico')).toBe(false)
  })

  test('con un término vacío devuelve true (no filtra)', () => {
    expect(coincideProducto(PRODUCTOS[0], '')).toBe(true)
    expect(coincideProducto(PRODUCTOS[0], '   ')).toBe(true)
  })

  test('devuelve false cuando no hay coincidencia', () => {
    expect(coincideProducto(PRODUCTOS[0], 'regulador')).toBe(false)
  })
})

describe('filtrarProductos', () => {
  test('filtra solo por texto', () => {
    expect(filtrarProductos(PRODUCTOS, { texto: 'cil' }).map((p) => p.id)).toEqual([1])
  })

  test('combina texto y categoría', () => {
    expect(filtrarProductos(PRODUCTOS, { texto: 'cilindro', categoria: 'Reguladores' })).toEqual([])
    expect(
      filtrarProductos(PRODUCTOS, { texto: 'cilindro', categoria: 'Cilindros de Gas' }).map((p) => p.id),
    ).toEqual([1])
  })

  test('sin filtros devuelve el catálogo completo', () => {
    expect(filtrarProductos(PRODUCTOS)).toHaveLength(3)
    expect(filtrarProductos(null)).toEqual([])
  })
})

describe('productosSugeridos', () => {
  test('sugiere productos por nombre, categoría o código sin distinguir mayúsculas ni tildes', () => {
    expect(productosSugeridos(PRODUCTOS, 'REGULADOR').map((p) => p.id)).toEqual([2])
    expect(productosSugeridos(PRODUCTOS, 'conexion').map((p) => p.id)).toEqual([3])
    expect(productosSugeridos(PRODUCTOS, 'cl005').map((p) => p.id)).toEqual([1])
    expect(productosSugeridos(PRODUCTOS, 'presión').map((p) => p.id)).toEqual([2])
  })

  test('ordena primero los que empiezan con el texto y respeta el límite', () => {
    // "man" está al inicio de "Manguera…" y no aparece en los demás nombres
    expect(productosSugeridos(PRODUCTOS, 'man')[0].id).toBe(3)
    expect(productosSugeridos(PRODUCTOS, 're', 1)).toHaveLength(1)
  })

  test('ordena los números de forma natural (5 kg antes que 11 kg)', () => {
    const cilindros = [
      { id: 11, nombre: 'Cilindro GLP 11 kg', categoria: 'Cilindros de Gas', codigo: 'CL002' },
      { id: 5, nombre: 'Cilindro GLP 5 kg', categoria: 'Cilindros de Gas', codigo: 'CL001' },
    ]
    expect(productosSugeridos(cilindros, 'cil').map((p) => p.id)).toEqual([5, 11])
  })

  test('no sugiere nada con menos de 2 caracteres o sin coincidencias', () => {
    expect(productosSugeridos(PRODUCTOS, 'c')).toEqual([])
    expect(productosSugeridos(PRODUCTOS, 'zzz')).toEqual([])
  })
})
