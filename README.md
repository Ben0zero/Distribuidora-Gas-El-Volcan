# Distribuidora de Gas El Volcán

Sistema web de venta y distribución de cilindros de gas y accesorios para la Región de Ñuble.
Proyecto semestral de **DSY1104 – Desarrollo Full Stack II (Duoc UC)**.

## Entregas

| Carpeta | Evaluación | Contenido |
|---|---|---|
| `Version 1/` | EP1 | Sitio estático con HTML, CSS y JavaScript |
| `Version 2/` | EP2 | SPA en React con `localStorage`, publicada en AWS |
| `Version 3/` | EP3 | 4 microservicios Spring Boot + Eureka, frontend React, Oracle Autonomous Database, autenticación JWT con roles y despliegue con Docker |

`Version 3/` es el espejo completo de la rama `version-3`: código, archivos de Docker y documentación.

## Cómo levantar la Versión 3 con Docker

**Requisitos:** Docker Desktop y el Wallet de Oracle descomprimido en tu equipo (se pide por privado).

Desde la carpeta `Version 3/` (PowerShell):

```powershell
# 1. Crear el archivo de configuración y completarlo
Copy-Item .env.example .env
notepad .env        # WALLET_HOST_DIR, DB_PASSWORD y JWT_SECRET

# 2. Construir y levantar (la primera vez tarda varios minutos)
docker compose up -d --build

# 3. Abrir el sitio
start http://localhost

# 4. Detener todo
docker compose down
```

El detalle (variables de `.env`, comandos útiles, pruebas y **despliegue en AWS EC2**) está en
[`Version 3/docs/DOCKER.md`](Version%203/docs/DOCKER.md).

**Sin Docker:** también se puede levantar con `levantar-servicios.ps1` (microservicios) y `npm run dev` (frontend),
siguiendo [`Version 3/README.md`](Version%203/README.md) y [`Version 3/microservicios/README.md`](Version%203/microservicios/README.md).

## Documentación

| Documento | Enlace |
|---|---|
| ERS v3.6 (Markdown) | [`ERS_ACTUALIZADO.md`](ERS_ACTUALIZADO.md) |
| ERS v3.6 (PDF) | [`ERS_ACTUALIZADO.pdf`](ERS_ACTUALIZADO.pdf) |
| Anexo 2 – Documentación de APIs e integración | [`Anexo 2 (.docx)`](Version%203/docs/parcial3/Anexo%202%20-%20Documentaci%C3%B3n%20APIs%20e%20Integraci%C3%B3n%20(El%20Volc%C3%A1n).docx) |
| Anexo 3 – Documentación de APIs | [`Anexo 3 (.xlsx)`](Version%203/docs/parcial3/Anexo%203%20-%20Documentaci%C3%B3n%20APIs%20(El%20Volc%C3%A1n).xlsx) |
| Anexo 4 – Manual de usuario | [`Anexo 4 (.docx)`](Version%203/docs/parcial3/Anexo%204%20-%20Manual%20de%20usuario%20(El%20Volc%C3%A1n).docx) |
| Guía de Docker (local y AWS EC2) | [`Version 3/docs/DOCKER.md`](Version%203/docs/DOCKER.md) |
| README técnico de la EP3 | [`Version 3/README.md`](Version%203/README.md) |
| Despliegue de la EP2 en AWS | [`Version 2/docs/DEPLOY.md`](Version%202/docs/DEPLOY.md) |

Las cuentas de prueba de cada rol se describen en el Anexo 4 y en el README técnico de la EP3.

## Seguridad

Los secretos (`.env`, Wallet de Oracle y `secrets.properties`) **nunca se suben al repositorio** y se comparten
solo por privado. En el repositorio solo se versiona la plantilla `.env.example`, sin valores reales.

## Ramas

| Rama | Uso |
|---|---|
| `main` | Entregas cerradas (Versión 1, 2 y 3) |
| `version-3` | Desarrollo: aquí se trabaja el código vivo (`frontend/` y `microservicios/`) |
