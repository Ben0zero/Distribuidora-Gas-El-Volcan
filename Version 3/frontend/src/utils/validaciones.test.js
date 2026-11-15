// Pruebas unitarias de las validaciones y helpers de formularios.
// Se prueban funciones puras: reciben datos y devuelven un resultado, sin DOM.
import {
  validarRun,
  normalizarRut,
  digitoVerificadorRut,
  rutValido,
  formatearRut,
  validarTelefono,
  validarCorreo,
  correoDominioPermitido,
  formatearPrecio,
  validarFormularioRegistro,
  validarContrasena,
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
    // RUN: cuerpo de 6 a 8 dígitos + DV (0-9 o K), con o sin puntos, guion o espacios
    expect(validarRun('1234567')).toBe(true)
    expect(validarRun('12 345 678')).toBe(true)
    expect(validarRun('19.011.022')).toBe(true)
    expect(validarRun('12.345.678-K')).toBe(true)
    expect(validarRun('123456')).toBe(false)
    expect(validarRun('1234567890')).toBe(false)
    expect(validarRun('abcdefgh')).toBe(false)
    expect(validarRun('1234567K8')).toBe(false) // la K solo puede ir al final

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
      run: '12.345.678-5',
      correo: 'ana@duoc.cl',
      telefono: '+56912345678',
      direccion: 'Av. Siempre Viva 123',
      region: 'Región de Ñuble',
      comuna: 'Chillán',
      password: 'Clave123',
      confirmar: 'Clave123',
      terminos: true,
    }

    expect(validarFormularioRegistro(validoRegistro)).toBe('')

    expect(validarFormularioRegistro({ ...validoRegistro, nombre: '' })).toBe('Ingresa tu nombre completo')
    expect(validarFormularioRegistro({ ...validoRegistro, nombre: 'x'.repeat(101) })).toBe(
      'El nombre no puede superar los 100 caracteres',
    )
    expect(validarFormularioRegistro({ ...validoRegistro, run: '1' })).toBe(
      'Ingresa un RUT válido, con o sin puntos y guion (ej: 12.345.678-5)',
    )
    // al crear (registro) se exige el dígito verificador correcto
    expect(validarFormularioRegistro({ ...validoRegistro, run: '12.345.678-9' })).toBe('El dígito verificador del RUT no es válido')
    expect(validarFormularioRegistro({ ...validoRegistro, correo: 'x@hotmail.com' })).toBe(
      'El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com',
    )
    expect(validarFormularioRegistro({ ...validoRegistro, telefono: '12' })).toBe(
      'Ingresa un teléfono válido (ej: +56 9 1234 5678)',
    )
    expect(validarFormularioRegistro({ ...validoRegistro, direccion: '' })).toBe('Ingresa tu dirección de despacho')
    expect(validarFormularioRegistro({ ...validoRegistro, region: '' })).toBe('Selecciona tu región')
    expect(validarFormularioRegistro({ ...validoRegistro, comuna: '' })).toBe('Selecciona tu comuna de despacho')
    expect(validarFormularioRegistro({ ...validoRegistro, password: 'abc12', confirmar: 'abc12' })).toBe(
      'La contraseña debe tener entre 8 y 64 caracteres, con al menos una letra y un número',
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
    expect(validarFormularioContacto({ ...validoContacto, nombre: 'x'.repeat(101) })).toBe(
      'El nombre no puede superar los 100 caracteres',
    )
    expect(validarFormularioContacto({ ...validoContacto, correo: 'mal' })).toBe('Ingresa un correo válido')
    expect(validarFormularioContacto({ ...validoContacto, telefono: 'abc' })).toBe('Ingresa un teléfono válido')
    expect(validarFormularioContacto({ ...validoContacto, asunto: 'Seleccione una opción' })).toBe(
      'Selecciona un asunto',
    )
    expect(validarFormularioContacto({ ...validoContacto, mensaje: '' })).toBe('Escribe tu mensaje')
    expect(validarFormularioContacto({ ...validoContacto, mensaje: 'x'.repeat(501) })).toBe(
      'El mensaje no puede superar los 500 caracteres',
    )

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

describe('validarContrasena (H-07)', () => {
  test('exige 8 a 64 caracteres con al menos una letra y un número', () => {
    const error = 'La contraseña debe tener entre 8 y 64 caracteres, con al menos una letra y un número'
    expect(validarContrasena('Clave123')).toBe('')
    expect(validarContrasena('abc12345')).toBe('')
    expect(validarContrasena('abc123')).toBe(error) // corta
    expect(validarContrasena('abcdefghi')).toBe(error) // sin número
    expect(validarContrasena('123456789')).toBe(error) // sin letra
    expect(validarContrasena('Clave123456')).toBe('') // más de 10: ahora se permite
    expect(validarContrasena('a1' + 'x'.repeat(62))).toBe('') // 64: el máximo
    expect(validarContrasena('a1' + 'x'.repeat(63))).toBe(error) // 65: sobre el máximo
    expect(validarContrasena(undefined)).toBe(error)
  })
})

describe('RUT: normalizar, dígito verificador (módulo 11) y formato', () => {
  test('normaliza quitando puntos, guion y espacios, con K en mayúscula', () => {
    expect(normalizarRut('12.345.678-5')).toBe('123456785')
    expect(normalizarRut(' 9.876.543-k ')).toBe('9876543K')
    expect(normalizarRut(undefined)).toBe('')
  })

  test('calcula el dígito verificador con módulo 11, incluidos los casos 0 y K', () => {
    expect(digitoVerificadorRut('12345678')).toBe('5')
    expect(digitoVerificadorRut('1723456')).toBe('0') // resto 11 -> 0
    expect(digitoVerificadorRut('1901102')).toBe('K') // resto 10 -> K
  })

  test('rutValido exige formato y dígito verificador correctos', () => {
    expect(rutValido('12.345.678-5')).toBe(true)
    expect(rutValido('123456785')).toBe(true)
    expect(rutValido('1.901.102-k')).toBe(true)
    expect(rutValido('17234560')).toBe(true)
    expect(rutValido('12.345.678-9')).toBe(false)
    expect(rutValido('19011022')).toBe(false) // RUT semilla antiguo: DV inválido
    expect(rutValido('abc')).toBe(false)
  })

  test('formatea con puntos y guion; si no es un RUT lo deja tal cual', () => {
    expect(formatearRut('123456785')).toBe('12.345.678-5')
    expect(formatearRut('19011022')).toBe('1.901.102-2')
    expect(formatearRut('9876543k')).toBe('9.876.543-K')
    expect(formatearRut('12.345.678-5')).toBe('12.345.678-5')
    expect(formatearRut('')).toBe('')
    expect(formatearRut('abc')).toBe('abc')
  })
})
