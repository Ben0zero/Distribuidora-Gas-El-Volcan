// Configuración global que se ejecuta antes de todas las pruebas.
import JasmineDOMImport from '@testing-library/jasmine-dom'

// React 19 exige esta bandera para que testing-library pueda envolver las
// actualizaciones en act() sin lanzar advertencias.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// El paquete es CommonJS y al empaquetar con esbuild el export por defecto
// queda envuelto; nos aseguramos de tomar el objeto de matchers.
const JasmineDOM = JasmineDOMImport.default || JasmineDOMImport

// Registramos los matchers de DOM para Jasmine
// (toBeInTheDocument, toHaveTextContent, toBeDisabled, etc.).
beforeAll(() => {
  jasmine.getEnv().addMatchers(JasmineDOM)
})

// Cada prueba parte desde un estado limpio de almacenamiento.
beforeEach(() => {
  localStorage.clear()
})
