# Documentación — Evaluación Parcial 3

Documentos de entrega de la EP3 para **Distribuidora de Gas El Volcán**.

| Archivo | Contenido |
|---|---|
| `Anexo 2 - Documentación APIs e Integración (El Volcán).docx` | Arquitectura, seguridad por roles, endpoints v1/v2, integración con el frontend, base de datos y pruebas |
| `Anexo 3 - Documentación APIs (El Volcán).xlsx` | Planilla de APIs por microservicio (versión, método, endpoint, auth, roles, body, respuestas y observaciones) |
| `Anexo 4 - Manual de usuario (El Volcán).docx` | Manual de uso por rol: Cliente, Vendedor y Administrador |
| `capturas/` | Capturas del sistema en funcionamiento: JPG del Anexo 2 y PNG de 1366x768 del Anexo 4 |

## Regenerar los documentos Word

Los Anexo 2 y 4 se generan con `docx`. Desde la raíz del repositorio:

```bash
npm install        # instala docx (una sola vez)
npm run anexos     # genera los Anexos 2 y 4
node docs/parcial3/generar-anexos.js anexo4   # genera solo el Anexo 4 (o anexo2)
```

El comando equivale a `node docs/parcial3/generar-anexos.js` y sobrescribe los `.docx` existentes.

El Anexo 3 se mantiene en Excel y se edita directamente en `Anexo 3 - Documentación APIs (El Volcán).xlsx`.

## Antes de entregar

- El Anexo 2 incluye 11 capturas JPG. El Anexo 4 (v4.0) tiene 26 figuras numeradas, en PNG y con borde negro. Las figuras 10 y 11 (recuperar y restablecer la contraseña) se toman a mano; mientras falten, el generador inserta un recuadro "Captura pendiente".
- Verificar que las rutas documentadas coincidan con los controladores (`/api/v1` y `/api/v2`).
- Confirmar que los servicios estén en estado `UP` en Eureka al momento de las capturas.
- Si se regeneran las capturas, mantener los mismos nombres de archivo: el generador los referencia por nombre. Las del Anexo 4 son PNG de 1366x768 y no deben mostrar datos personales reales (los de otras personas se difuminan).
