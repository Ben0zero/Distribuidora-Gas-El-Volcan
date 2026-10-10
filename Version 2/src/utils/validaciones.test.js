// Pruebas unitarias de las validaciones y helpers de formularios.
// Se prueban funciones puras: reciben datos y devuelven un resultado, sin DOM.
import {
  validarRun,
  validarTelefono,
  validarCorreo,
  correoDominioPermitido,
  formatearPrecio,
  validarFormularioRegistro,
  validarFormularioContacto,
  leerLista,
  leerObjeto,
} from './validaciones'
import { describe, test, expect, beforeEach } from 'vitest'

describe('validaciones (lógica de formularios)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('valida campos simples: RUN, teléfono, correo y formato de precio', () => {
    // RUN: 7 a 9 dígitos, sin puntos ni guion (tolera espacios)
    expect(validarRun('1234567')).toBe(true)
    expect(validarRun('12 345 678')).toBe(true)
    expect(validarRun('123456')).toBe(false)
    expect(validarRun('1234567890')).toBe(false)
    expect(validarRun('19.011.022')).toBe(false)
    expect(validarRun('abcdefgh')).toBe(false)

    // Teléfono: 9 a 12 dígitos con "+" opcional
    expect(validarTelefono('+56 9 1234 5678')).toBe(true)
    expect(validarTelefono('912345678')).toBe(true)
    expect(validarTelefono('123')).toBe(false)

    // Correo: formato general
    expect(validarCorreo('alguien@dominio.cl')).toBe(true)
    expect(validarCorreo('sin-arroba')).toBe(false)

    // Dominio institucional / gmail (sin distinguir mayúsculas)
    expect(correoDominioPermitido('alumno@duoc.cl')).toBe(true)
    expect(correoDominioPermitido('docente@profesor.duoc.cl')).toBe(true)
    expect(correoDominioPermitido('Persona@Gmail.com')).toBe(true)
    expect(correoDominioPermitido('alumno@hotmail.com')).toBe(false)

    // Formato de precio en pesos chilenos
    expect(formatearPrecio(6500)).toBe('$6.500')
  })

  test('validarFormularioRegistro, validarFormularioContacto y helpers de almacenamiento', () => {
    const validoRegistro = {
      nombre: 'Ana Pérez',
      run: '12345678',
      correo: 'ana@duoc.cl',
      telefono: '+56912345678',
      direccion: 'Av. Siempre Viva 123',
      region: 'Región de Ñuble',
      comuna: 'Chillán',
      password: 'abc123',
      confirmar: 'abc123',
      terminos: true,
    }

    expect(validarFormularioRegistro(validoRegistro)).toBe('')

    expect(validarFormularioRegistro({ ...validoRegistro, nombre: '' })).toBe('Ingresa tu nombre completo')
    expect(validarFormularioRegistro({ ...validoRegistro, run: '1' })).toBe(
      'El RUN debe tener entre 7 y 9 dígitos, sin puntos y sin guion',
    )
    expect(validarFormularioRegistro({ ...validoRegistro, correo: 'x@hotmail.com' })).toBe(
      'El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com',
    )
    expect(validarFormularioRegistro({ ...validoRegistro, password: 'abc', confirmar: 'abc' })).toBe(
      'La contraseña debe tener entre 4 y 10 caracteres',
    )
    expect(validarFormularioRegistro({ ...validoRegistro, confirmar: 'otra' })).toBe('Las contraseñas no coinciden')
    expect(validarFormularioRegistro({ ...validoRegistro, terminos: false })).toBe(
      'Debes aceptar los términos y condiciones',
    )

    const validoContacto = {
      nombre: 'Ana',
      correo: 'ana@gmail.com',
      telefono: '912345678',
      asunto: 'Pedido',
      mensaje: 'Hola, necesito un cilindro.',
    }

    expect(validarFormularioContacto(validoContacto)).toBe('')
    expect(validarFormularioContacto({ ...validoContacto, nombre: '' })).toBe('Ingresa tu nombre')
    expect(validarFormularioContacto({ ...validoContacto, correo: 'mal' })).toBe('Ingresa un correo válido')
    expect(validarFormularioContacto({ ...validoContacto, asunto: 'Seleccione una opción' })).toBe(
      'Selecciona un asunto',
    )
    expect(validarFormularioContacto({ ...validoContacto, mensaje: '' })).toBe('Escribe tu mensaje')

    // leerLista: devuelve solo arreglos válidos y tolera JSON corrupto
    localStorage.setItem('lista', JSON.stringify([1, 2, 3]))
    expect(leerLista('lista')).toEqual([1, 2, 3])
    localStorage.setItem('lista', 'no-es-json')
    expect(leerLista('lista')).toEqual([])
    expect(leerLista('no-existe')).toEqual([])

    // leerObjeto: devuelve solo objetos válidos
    localStorage.setItem('obj', JSON.stringify({ a: 1 }))
    expect(leerObjeto('obj')).toEqual({ a: 1 })
    localStorage.setItem('obj', '123')
    expect(leerObjeto('obj')).toBeNull()
    localStorage.setItem('obj', '{json roto')
    expect(leerObjeto('obj')).toBeNull()
  })
})