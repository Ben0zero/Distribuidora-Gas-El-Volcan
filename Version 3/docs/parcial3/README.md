# Documentación — Evaluación Parcial 3

Documentos de entrega de la EP3 para **Distribuidora de Gas El Volcán**.

| Archivo | Contenido |
|---|---|
| `Anexo 2 - Documentación APIs e Integración (El Volcán).docx` | Arquitectura, seguridad por roles, endpoints v1/v2, integración con el frontend, base de datos y pruebas |
| `Anexo 3 - Documentación APIs (El Volcán).xlsx` | Planilla de APIs por microservicio (versión, método, endpoint, auth, roles, body, respuestas y observaciones) |
| `Anexo 4 - Manual de usuario (El Volcán).docx` | Manual de uso por rol: Cliente, Vendedor y Administrador |
| `capturas/` | Capturas de pantalla del sistema en funcionamiento, embebidas en los Anexo 2 y 4 |

## Regenerar los documentos Word

Los Anexo 2 y 4 se generan con `docx`. Desde la raíz del repositorio:

```bash
npm install        # instala docx (una sola vez)
npm run anexos     # genera los Anexos 2 y 4
```

El comando equivale a `node docs/parcial3/generar-anexos.js` y sobrescribe los `.docx` existentes.

El Anexo 3 se mantiene en Excel y se edita directamente en `Anexo 3 - Documentación APIs (El Volcán).xlsx`.

## Antes de entregar

- Los Anexo 2 y 4 ya incluyen las capturas de `capturas/` (11 y 19 imágenes respectivamente).
- Verificar que las rutas documentadas coincidan con los controladores (`/api/v1` y `/api/v2`).
- Confirmar que los servicios estén en estado `UP` en Eureka al momento de las capturas.
- Si se regeneran las capturas, mantener los mismos nombres de archivo: el generador los referencia por nombre.
