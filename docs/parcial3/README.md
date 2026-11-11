# Documentación — Evaluación Parcial 3

Documentos de entrega de la EP3 para **Distribuidora de Gas El Volcán**.

| Archivo | Contenido |
|---|---|
| `Anexo 2 - Documentación APIs e Integración (El Volcán).docx` | Arquitectura, seguridad por roles, endpoints v1/v2, integración con el frontend, base de datos y pruebas |
| `Anexo 3 - Documentación APIs (El Volcán).xlsx` | Planilla de APIs por microservicio (versión, método, endpoint, auth, roles, body, respuestas y observaciones) |
| `Anexo 4 - Manual de usuario (El Volcán).docx` | Manual de uso por rol: Cliente, Vendedor y Administrador |

## Regenerar los documentos Word

Los Anexo 2 y 4 se generan con `docx`. Desde la raíz del repositorio:

```bash
npm install docx
node docs/parcial3/generar-anexos.js
```

El Anexo 3 se mantiene en Excel y se edita directamente en `Anexo 3 - Documentación APIs (El Volcán).xlsx`.

## Antes de entregar

- Agregar las capturas de pantalla indicadas al final del Anexo 4.
- Verificar que las rutas documentadas coincidan con los controladores (`/api/v1` y `/api/v2`).
- Confirmar que los servicios estén en estado `UP` en Eureka al momento de las capturas.
