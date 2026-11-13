import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/

// Cada microservicio corre en su puerto. Vite hace de proxy para que el
// navegador use rutas relativas (/api/v1/...) sin CORS ni URLs fijas: funciona
// igual en localhost, por IP de la red local o detrás de un túnel.
const SERVICIOS = {
  '/api/v1/auth': 'http://localhost:8081',
  '/api/v1/usuarios': 'http://localhost:8081',
  '/api/v1/productos': 'http://localhost:8082',
  '/api/v1/inventario': 'http://localhost:8084',
  '/api/v1/ventas': 'http://localhost:8086',
}

function proxyServicios() {
  return Object.fromEntries(
    Object.entries(SERVICIOS).map(([ruta, target]) => [ruta, { target, changeOrigin: true }]),
  )
}

export default defineConfig({
  plugins: [react()],
  // host: true escucha en toda la red local (http://<IP>:5173).
  // allowedHosts: true permite dominios de túneles (ngrok, cloudflared).
  server: { host: true, allowedHosts: true, proxy: proxyServicios() },
  preview: { host: true, allowedHosts: true, proxy: proxyServicios() },
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