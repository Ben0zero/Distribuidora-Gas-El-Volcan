import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // JSX con runtime automático (react/jsx-runtime): las pruebas .jsx no
  // necesitan importar React para usar <Componente />.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    // Configuración de Vitest según la guía de clases:
    // - jsdom simula el navegador para las pruebas.
    // - setupFiles carga jest-dom antes de cada prueba.
    // - globals permite usar describe/test/expect sin importarlos.
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
    css: false,

    // Cobertura (v8, igual que la reportada en el documento de testing).
    // Se reportan SOLO los módulos que participan en las pruebas; así el %
    // refleja realmente la porción de código protegida por los tests
    // (mismo criterio que el karma con includeAllSources: false).
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: [
        'src/utils/**',
        'src/components/Navbar.jsx',
        'src/components/Producto.jsx',
        'src/pages/Login.jsx',
        'src/pages/Nosotros.jsx',
        'src/datos/productos.js',
      ],
    },
  },
})