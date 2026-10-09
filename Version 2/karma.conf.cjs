// Configuración de Karma + Jasmine para el proyecto React (Vite).
//
// ¿Por qué este archivo se llama .cjs?
//   package.json tiene "type": "module", así que un archivo .js se interpreta
//   como ESM. Karma carga su configuración con require(), por lo que usamos
//   la extensión .cjs para forzar CommonJS.
//
// ¿Cómo se ejecutan los .jsx?
//   Karma no entiende JSX por sí solo, así que usamos el preprocesador
//   "karma-esbuild", que empaqueta los specs (y todo lo que importan) con
//   esbuild. A esbuild le indicamos jsx: "automatic" para el runtime de React 19.
//
// ¿Cómo funciona la cobertura?
//   El adaptador de karma-jasmine envía `window.__coverage__` en cada
//   resultado (ver node_modules/karma-jasmine/lib/adapter.js). Por eso
//   instrumentamos el código fuente con istanbul DENTRO del build de esbuild
//   (plugin de abajo): solo así el bundle servido por middleware queda
//   instrumentado, ya que los preprocesadores no ven ese bundle.

const fs = require('fs')
const path = require('path')
const { createInstrumenter } = require('istanbul-lib-instrument')
const schema = require('@istanbuljs/schema')

const SRC = path.resolve(__dirname, 'src')

// --- Plugin de esbuild que instrumenta el código de src/ con istanbul ---
function pluginIstanbul() {
  const instrumenter = createInstrumenter({
    produceSourceMap: true,
    esModules: true, // conserva import/export para que esbuild los resuelva
    coverageVariable: '__coverage__',
    // Habilitamos el parseo de JSX (istanbul no lo trae por defecto).
    parserPlugins: [...schema.defaults.instrumenter.parserPlugins, 'jsx'],
  })

  return {
    name: 'istanbul-src',
    setup(build) {
      build.onLoad({ filter: /\.(js|jsx)$/ }, (args) => {
        const rel = path.relative(SRC, args.path)
        const dentroDeSrc = rel && !rel.startsWith('..') && !path.isAbsolute(rel)
        const esSpec = /\.spec\.[jt]sx?$/.test(args.path)
        const esSetup = rel.startsWith('test' + path.sep)

        // Solo instrumentamos el código de la aplicación (no tests, no
        // node_modules). Devolver null deja que esbuild lo maneje normal.
        if (!dentroDeSrc || esSpec || esSetup) return null

        const source = fs.readFileSync(args.path, 'utf8')
        const contents = instrumenter.instrumentSync(source, args.path)
        return { contents, loader: args.path.endsWith('.jsx') ? 'jsx' : 'js' }
      })
    },
  }
}

// --- Plugin que arregla la resolución de specs .jsx ---
// karma-esbuild nombra cada spec terminado en ".js" dentro del bundle de
// entrada (normaliza la extensión). Para los specs de componentes, que son
// ".spec.jsx", redirigimos esa importación a su archivo real ".spec.jsx".
function pluginResolverSpecJsx() {
  return {
    name: 'resolver-spec-jsx',
    setup(build) {
      build.onResolve({ filter: /\.spec\.js$/ }, (args) => {
        const absoluto = path.isAbsolute(args.path) ? args.path : path.resolve(args.resolveDir, args.path)
        const conJsx = absoluto.replace(/\.js$/, '.jsx')
        if (fs.existsSync(conJsx)) return { path: conJsx }
        return null
      })
    },
  }
}

// Aseguramos que Karma encuentre Chrome aunque no esté en el PATH.
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
if (!process.env.CHROME_BIN && fs.existsSync(chrome)) {
  process.env.CHROME_BIN = chrome
}

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],

    files: [
      'src/test/setup.js',
      'src/**/*.spec.js',
      'src/**/*.spec.jsx',
    ],

    preprocessors: {
      'src/test/setup.js': ['esbuild'],
      'src/**/*.spec.js': ['esbuild'],
      'src/**/*.spec.jsx': ['esbuild'],
    },

    esbuild: {
      jsx: 'automatic',
      loader: { '.jsx': 'jsx' },
      define: { 'process.env.NODE_ENV': JSON.stringify('test') },
      plugins: [pluginResolverSpecJsx(), pluginIstanbul()],
    },

    reporters: ['spec', 'coverage'],

    coverageReporter: {
      includeAllSources: false,
      reporters: [
        { type: 'text', dir: 'coverage', subdir: '.' },
        { type: 'text-summary', dir: 'coverage', subdir: '.' },
        { type: 'html', dir: 'coverage', subdir: 'html' },
        { type: 'lcovonly', dir: 'coverage', subdir: 'lcov' },
      ],
    },

    browsers: ['ChromeHeadlessCI'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },

    singleRun: true,
    concurrency: 1,
    logLevel: config.LOG_INFO,
  })
}
