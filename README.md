# Distribuidora de Gas El Volcán — Proyecto DSY1104 (Full Stack II)

Proyecto semestral de la asignatura **DSY1104 — Desarrollo Full Stack II** (Duoc UC, Analista Programador).
Plataforma web para la **Distribuidora de Gas El Volcán**, empresa de comercialización de cilindros de gas GLP
y accesorios en la **Región de Ñuble, Chile**.

El repositorio contiene **dos versiones** del proyecto: la primera entrega (sitio estático) y la segunda
(aplicación React), según lo solicitado en la evaluación.

---

## 📁 Estructura del repositorio

```
Distribuidora-Gas-El-Volcan/
│
├── README.md      → este archivo (portada del repositorio)
│
├── Version 1/     → PRIMERA ENTREGA: sitio estático (HTML5 + CSS3 + Bootstrap 5 + JavaScript)
│   ├── index.html, catalogo.html, carrito.html, login.html, ...
│   ├── admin*.html (panel de administración)
│   └── README.md  → documentación de la Versión 1
│
└── Version 2/     → SEGUNDA ENTREGA: SPA en React (React + Vite + React Bootstrap + React Router)
    ├── README.md  → índice y guía rápida de la Versión 2
    ├── src/       → código fuente React
    ├── docs/      → documentación (cada documento en .md y .pdf)
    └── ...
```

---

## 🚀 Version 2 — SPA en React (entrega actual)

Reescribe el sitio estático de la Versión 1 como una **Single Page Application** con componentes,
`props`, `state`, rutas y **pruebas unitarias (10/10 · cobertura 100 %)**.

**Stack:** React 19 · Vite 8 · react-router-dom 7 · react-bootstrap 2 · Bootstrap 5 ·
Vitest 3 + Testing Library · oxlint.

**Cómo correrlo:**

```bash
cd "Version 2"
npm install           # solo la primera vez
npm run dev           # servidor de desarrollo → http://localhost:5173
npm test              # 10 pruebas unitarias
npm run test:coverage # reporte de cobertura
npm run build         # build de producción → dist/
```

> En PowerShell usar `npm.cmd` (la política de ejecución puede bloquear `npm.ps1`).

**Credenciales de prueba (administrador):** `admin@duoc.cl` / `Admin123`

📖 Ver el detalle completo en **[`Version 2/README.md`](Version%202/README.md)**.

### Documentación de la Versión 2 (`Version 2/docs/`)

| Documento | Contenido |
|---|---|
| [`README`](Version%202/README.md) | Índice y guía rápida |
| [`DOCUMENTACION.md`](Version%202/docs/DOCUMENTACION.md) | Explicación técnica de cada parte y decisión de diseño |
| [`GUIA_CONCEPTOS_CODIGO.md`](Version%202/docs/GUIA_CONCEPTOS_CODIGO.md) | Conceptos de JS/React aplicados en el código |
| [`ERS_ACTUALIZADO.md`](Version%202/docs/ERS_ACTUALIZADO.md) | Especificación de Requerimientos de Software |
| [`DOCUMENTO_COBERTURA_TESTING.md`](Version%202/docs/DOCUMENTO_COBERTURA_TESTING.md) | Inventario de pruebas y análisis de cobertura |
| [`DEPLOY.md`](Version%202/docs/DEPLOY.md) | Guía de despliegue en AWS EC2 + Nginx |
| [`BITACORA_DEPLOY_AWS.md`](Version%202/docs/BITACORA_DEPLOY_AWS.md) | Bitácora real del despliegue (evidencia) |

Cada documento está disponible también en **PDF** dentro de `Version 2/docs/`.

---

## 📦 Version 1 — Sitio estático (primera entrega)

Sitio frontend en **HTML5, CSS3, Bootstrap 5 y JavaScript (Vanilla)**, con persistencia en `localStorage`.
Incluye catálogo dinámico, carrito de compras, validación de formularios, selección Región → Comuna y un
panel administrativo (gestión de usuarios y mantenedor de productos).

📖 Ver el detalle en **[`Version 1/README.md`](Version%201/README.md)**.

---

## 👥 Integrantes

- Nicolás Arancibia
- Pablo Gómez
- Benjamín González

**Profesor:** Hernán Saavedra · **Duoc UC — Analista Programador**
