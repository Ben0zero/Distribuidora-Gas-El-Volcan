# Documento de Cobertura y Análisis de Testing

**Proyecto:** Distribuidora de Gas El Volcán (migración a React)
**Asignatura:** DSY1104 — Desarrollo Fullstack II
**Evaluación:** Evaluación Parcial N° 2
**Herramientas de testing:** Jasmine + Karma
**Fecha:** Octubre 2026

---

## 1. Objetivo

Este documento describe la estrategia de **pruebas unitarias** aplicada al frontend del proyecto React, presenta los **resultados de ejecución**, el **reporte de cobertura** obtenido y un **análisis** de los mismos.

El objetivo de las pruebas es verificar de forma automática:

- La **lógica de negocio** extraída a funciones puras (validaciones de formularios, carrito de compras y catálogo de productos).
- El **comportamiento en el DOM** de componentes reaccionando a sus **props** y a su **estado** (`useState`).
- El uso de **mocks** (espías de Jasmine) para aislar la comunicación entre componentes.

---

## 2. Herramientas y versiones

| Herramienta | Rol | Versión |
|---|---|---|
| **Jasmine** (`jasmine-core`) | Framework de pruebas (describe / it / expect) | 4.6.1 |
| **Karma** | Test runner: levanta un Chrome real y ejecuta los specs | 6.4.4 |
| **karma-jasmine** | Adaptador Jasmine ↔ Karma | 5.1.0 |
| **karma-esbuild** | Empaqueta los `.jsx`/`.js` con **esbuild** (soporte JSX) | 2.3.0 |
| **esbuild** | Transpilador/bundler de las pruebas | 0.28.2 |
| **@testing-library/react** | Renderizado y consultas del DOM | 16.3.3 |
| **@testing-library/dom** | API de consultas del DOM | 10.4.2 |
| **@testing-library/jasmine-dom** | Matchers de DOM para Jasmine (`toBeInTheDocument`, `toHaveTextContent`, `toHaveAttribute`, …) | 1.3.3 |
| **karma-coverage** + **istanbul-lib-instrument** | Instrumentación y reporte de cobertura | 2.2.1 |
| **karma-spec-reporter** | Salida legible de resultados por consola | 0.0.37 |

**Entorno de ejecución:** Node.js v24.19.0 · Google Chrome 154 (Headless) · Windows.

> **Nota de diseño:** Karma no entiende JSX por sí solo. El preprocesador `karma-esbuild`
> empaqueta los specs con esbuild (con `jsx: "automatic"` para el runtime de React 19).
> Como la cobertura necesita instrumentar el bundle servido por middleware, la
> instrumentación con **istanbul** se inyecta como un *plugin* de esbuild. El adaptador
> de `karma-jasmine` expone `window.__coverage__` y el reporter de cobertura lo consolida.

---

## 3. Estructura de las pruebas

```
src/
├── test/
│   └── setup.js                     # Config global: matchers DOM, entorno act(), limpieza
├── utils/
│   ├── validaciones.spec.js         # 3 pruebas (lógica de formularios)
│   ├── carrito.spec.js              # 3 pruebas (lógica del carrito)
│   └── productos.spec.js            # 1 prueba  (lógica del catálogo)
├── components/
│   ├── Producto.spec.jsx            # 1 prueba  (props + DOM + mock)
│   └── Navbar.spec.jsx              # 1 prueba  (props + DOM)
└── pages/
    └── Nosotros.spec.jsx            # 1 prueba  (estado con useState)
```

**Total: 10 pruebas unitarias.**

### Cómo ejecutar

```bash
npm install        # instala dependencias (incluidas las de testing)
npm test           # ejecuta las 10 pruebas con cobertura (una vez)
npm run test:watch # modo vigilancia durante el desarrollo
```

El reporte de cobertura se genera en:

- `coverage/html/index.html` — reporte navegable por archivo y línea.
- `coverage/lcov/lcov.info` — formato estándar (LCOV) para herramientas externas.

---

## 4. Inventario de las 10 pruebas

| # | Archivo | Prueba | Qué verifica | Tipo |
|---|---------|--------|--------------|------|
| 1 | `utils/validaciones.spec.js` | *valida campos simples: RUN, teléfono, correo y formato de precio* | Funciones puras `validarRun`, `validarTelefono`, `validarCorreo`, `correoDominioPermitido`, `formatearPrecio` con casos válidos e inválidos | Lógica |
| 2 | `utils/validaciones.spec.js` | *validarFormularioRegistro…* | Devuelve el **primer error** de cada campo y `''` cuando todo es correcto | Lógica |
| 3 | `utils/validaciones.spec.js` | *…Contacto y helpers de almacenamiento* | `validarFormularioContacto`, `leerLista`, `leerObjeto` (incluye JSON corrupto) | Lógica + mock de `localStorage` |
| 4 | `utils/carrito.spec.js` | *agregarItem e incrementarItem…* | Agrega/acumula cantidades y **no muta** el arreglo original | Lógica |
| 5 | `utils/carrito.spec.js` | *decrementarItem y eliminarItem…* | Descuenta, elimina al llegar a 0 y `contarItems` cuenta el total | Lógica |
| 6 | `utils/carrito.spec.js` | *obtenerItemsCompletos… y calcularTotal* | Une el carrito con el catálogo, descarta ids inexistentes y suma por tipo (residencial/comercial) | Lógica |
| 7 | `utils/productos.spec.js` | *aplicarEdiciones, catalogoActual y productosConCreados* | Sobreescribe solo los campos editados y construye el catálogo real (base + ediciones + creados) | Lógica + `localStorage` |
| 8 | `components/Producto.spec.jsx` | *renderiza los props… y avisa al agregar (mock)* | Renderiza **props** en el DOM y llama a `onAgregar(id)` mediante un **mock** (`jasmine.createSpy`) | Componente (props + DOM + mock) |
| 9 | `components/Navbar.spec.jsx` | *muestra los enlaces… y el total de items (prop)* | Rutas de los enlaces y el **badge** con el prop `totalItems` | Componente (props + DOM) |
| 10 | `pages/Nosotros.spec.jsx` | *expande y contrae el blog…* | Cambio de **estado** (`useState`) al presionar “Ver Más” / “Ver Menos” | Componente (estado + DOM) |

---

## 5. Resultado de la ejecución

```
Chrome Headless 154.0.0.0 (Windows 10): Executed 10 of 10 SUCCESS
TOTAL: 10 SUCCESS
```

| Indicador | Valor |
|---|---|
| Pruebas ejecutadas | **10** |
| Pruebas exitosas | **10** |
| Pruebas fallidas | **0** |
| Tiempo aproximado | < 1 segundo (tras compilar) |

> Las advertencias `404: /IMAGENES/...` que aparecen al ejecutar **no son errores**: en las
> pruebas los `<img>` apuntan a recursos que el servidor de Karma no sirve. No afectan a
> los resultados ni a la cobertura.

---

## 6. Reporte de cobertura

Cobertura obtenida sobre los módulos que participan en las pruebas:

| Archivo | % Sentencias | % Ramas | % Funciones | % Líneas |
|---|---:|---:|---:|---:|
| `components/Navbar.jsx` | 100 | 100 | 100 | 100 |
| `components/Producto.jsx` | 100 | 100 | 100 | 100 |
| `datos/productos.js` | 100 | 100 | 100 | 100 |
| `pages/Nosotros.jsx` | 100 | 100 | 100 | 100 |
| `utils/carrito.js` | 100 | 72,72 | 100 | 100 |
| `utils/productos.js` | 100 | 75,00 | 100 | 100 |
| `utils/validaciones.js` | 86,20 | 83,33 | 100 | 100 |
| **TOTAL** | **92,15** | **80,00** | **100** | **100** |

Resumen:

```
Statements : 92.15% (94/102)
Branches   : 80.00% (76/95)
Functions  : 100%   (42/42)
Lines      : 100%   (75/75)
```

**Lectura de los indicadores**

- **Funciones 100%:** todas las funciones exportadas de los módulos bajo prueba fueron
  invocadas al menos una vez.
- **Líneas 100%:** toda línea de código ejecutable de esos módulos se ejecutó.
- **Sentencias 92,15%:** algunas sentencias dentro de bifurcaciones (ramas) no se
  alcanzaron; se detallan en el punto 7.
- **Ramas 80%:** las ramas no cubiertas corresponden a **caminos defensivos** (ver punto 7).

---

## 7. Análisis de resultados

### 7.1 Cobertura de lógica vs. de interfaz

Las pruebas cubren **dos niveles complementarios**:

1. **Lógica pura (funciones de `utils/`)** — se prueban sin DOM: entradas y salidas
   deterministas. Es la base con mayor cobertura y la más valiosa, porque concentra las
   reglas de negocio (validaciones, cálculo del carrito, ediciones del catálogo).
2. **Componentes y estado (React)** — se renderizan en un Chrome real y se interactúa con
   el DOM (`fireEvent.click`), verificando props, estado y eventos.

### 7.2 Uso de mocks

- En la prueba **#8** se usa `jasmine.createSpy('onAgregar')` como **mock** del callback
  que el componente padre proveería. Así se verifica que `<Producto />` no solo se
  renderiza, sino que **notifica correctamente al hacer click**, pasando el `id` correcto.
  Esto desacopla el componente de la lógica del carrito.
- En las pruebas **#3** y **#7** se usa `localStorage` como dependencia controlada
  (se preparan datos y se limpia entre pruebas en `setup.js`), simulando el
  comportamiento del administrador y de la persistencia sin backend.

### 7.3 Detalle de líneas/ramas no cubiertas

| Archivo | Líneas/ramas reportadas | Explicación |
|---|---|---|
| `utils/carrito.js` | ramas 8–14 y 28 | Corresponde a los caminos en que un ítem del carrito tiene una **cantidad no numérica** o vacía (`Number(item.cantidad) || 0`). Es código defensivo para datos antiguos/corruptos en `localStorage`; nunca ocurre en el flujo normal. |
| `utils/productos.js` | ramas 15–16, 18–20 y 40–42 | Son los **ternarios de “conservar campo si no viene en la edición”** (`ed.campo !== undefined ? … : …`) y los respaldos `|| 0` al crear productos desde el admin. Cada edición parcial ejercita solo una parte de cada ternario. |
| `utils/validaciones.js` | ramas 67, 70–73, 87, 89, 92 | Ramas de **validaciones alternativas** (nombre demasiado largo, teléfono inválido, dirección/región/comuna faltantes, mensaje demasiado largo). Se validó el “primer error” de cada formulario, por lo que no se llegó a todas las ramas posteriores. |

En todos los casos, **las funciones y las líneas están 100% cubiertas**; lo que falta son
combinaciones de ramas (caminos alternativos) y no código muerto. La cobertura de ramas del
80% es alta para 10 pruebas unitarias.

### 7.4 Alcance del reporte

El porcentaje **no** representa la totalidad de la aplicación (por ejemplo, `App.jsx`, las
páginas públicas y el panel de administración no figuran), sino **los módulos que las 10
pruebas unitarias ejercitan**. Se optó por medir la cobertura de lo efectivamente probado
para que el indicador sea **real y verificable**, en lugar de inflarlo incluyendo archivos
sin pruebas. Ampliar el alcance implicaría agregar pruebas de integración/end-to-end.

---

## 8. Conclusiones

- Se implementaron **10 pruebas unitarias** con **Jasmine + Karma**, cumpliendo lo pedido por
  la evaluación.
- Las pruebas validan **lógica de negocio, props, estado y comportamiento en el DOM**, e
  incorporan **mocks** para aislar dependencias.
- El proyecto queda con **100% de funciones y líneas** cubiertas en los módulos probados, y
  **92,15% de sentencias / 80% de ramas** a nivel global de esos módulos.
- La ejecución es **automatizable** (`npm test`) e integrable en un flujo de integración
  continua, y deja un **reporte HTML** navegable para el equipo.

---

## 9. Recomendaciones / trabajo futuro

1. **Ampliar los casos de rama:** agregar aserciones para las ramas defensivas
   identificadas (teléfono/dirección inválidos, cadenas demasiado largas, ítems con
   cantidad corrupta) para acercar las ramas al 100%.
2. **Sumar pruebas de integración** de la página `Carrito` y del `App` (ruteo y estado
   global del carrito) para cubrir también las páginas y el panel de administración.
3. **Cobertura global de la app:** evaluar herramientas de cobertura a nivel de build (por
   ejemplo, con el plugin de Istanbul de Vite) para medir el 100% del proyecto, incluidas
   las páginas no probadas.
4. **Umbral mínimo de cobertura:** configurar `coverageReporter.check` para que la
   integración continua falle si la cobertura baja de un mínimo acordado.

---

### Anexo — Comandos y salida resumida

```text
$ npm test

Chrome Headless ...: Executed 10 of 10 SUCCESS

------------------|---------|----------|---------|---------|
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
All files         |   92.15 |    80.00 |  100.00 |  100.00 |
------------------|---------|----------|---------|---------|

Statements : 92.15% (94/102)
Branches   : 80.00% (76/95)
Functions  : 100%   (42/42)
Lines      : 100%   (75/75)
```
