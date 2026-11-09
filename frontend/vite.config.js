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

    // Cobertura (v8). Desde la V3 se mide TODO el código fuente de src/
    // (también los archivos que ninguna prueba toca), para que el % sea honesto.
    // Se excluyen solo las pruebas y el arranque de la app.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/setupTests.js', 'src/testUtils/**', 'src/main.jsx'],
    },
  },
})