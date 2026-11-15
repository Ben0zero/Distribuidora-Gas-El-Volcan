# Docker — El Volcán en contenedores (local y AWS EC2)

Esta guía explica cómo levantar **todo el sistema** (Eureka, los 4 microservicios y el frontend) con **Docker Compose**: en tu PC con Docker Desktop o en una instancia **AWS EC2** con Ubuntu.

> `ms-produccion` queda fuera del alcance y no se incluye.

---

## 1. Arquitectura de contenedores

```
                  Navegador  ──  http://localhost  (o http://<IP-EC2>)
                                  │  puerto 80 (el único público)
┌─────────────────────────────────▼──────────────────────────────────────────┐
│ Red interna Docker "elvolcan" (172.28.0.0/16)                              │
│                                                                            │
│   frontend (Nginx :80)  ── SPA de React + proxy /api/v1 y /api/v2          │
│      │ /api/v[12]/auth|usuarios|cuenta → ms-auth:8081                      │
│      │ /api/v[12]/productos            → ms-catalogoproductos:8082         │
│      │ /api/v[12]/inventario           → ms-inventario:8084                │
│      │ /api/v[12]/ventas               → ms-ventas:8086                    │
│      ▼                                                                     │
│   ms-auth · ms-catalogoproductos · ms-inventario · ms-ventas               │
│      │  se registran en Eureka y se llaman entre sí con Feign              │
│      ▼                                                                     │
│   eureka :8761  (publicado solo en 127.0.0.1:8761)                         │
└──────────────┬─────────────────────────────────────────────────────────────┘
               │ salida a Internet (TLS)
               ▼
     Oracle Autonomous Database (Wallet montado en /wallet, solo lectura)
```

| Contenedor | Imagen | Puerto interno | Publicado | Healthcheck |
|---|---|---|---|---|
| `eureka` | `elvolcan/eureka` | 8761 | `127.0.0.1:8761` | `GET /` |
| `ms-auth` | `elvolcan/ms-auth` | 8081 | no | `GET /v3/api-docs/swagger-config` |
| `ms-catalogoproductos` | `elvolcan/ms-catalogoproductos` | 8082 | no | ídem |
| `ms-inventario` | `elvolcan/ms-inventario` | 8084 | no | ídem |
| `ms-ventas` | `elvolcan/ms-ventas` | 8086 | no | ídem |
| `frontend` | `elvolcan/frontend` | 80 | `80` | `GET /` |

- **Orden de arranque**: `eureka` (healthy) → los 4 microservicios (healthy) → `frontend`.
- **Imágenes multi-etapa**: los microservicios se compilan con Maven + Java 21 dentro de la imagen y corren en `eclipse-temurin:21-jre-alpine` con un usuario sin privilegios. El frontend se compila con Node 22 y lo sirve `nginx:1.27-alpine`. No hace falta tener Java ni Node instalados para levantar con Docker.
- **Secretos fuera de las imágenes**: las claves se leen de `.env` y el Wallet se monta como volumen de solo lectura. Los `.dockerignore` excluyen `OracleWallet`, `target`, `node_modules`, `dist`, `coverage`, `.env` y los logs.
- **Memoria**: cada microservicio usa `JAVA_OPTS` (por defecto `-Xmx384m`) y Eureka usa `EUREKA_JAVA_OPTS` (`-Xmx256m`). Todo junto necesita unos **2,5 a 3 GB de RAM**.

### Límite de intentos de login detrás de Nginx

ms-auth limita los logins fallidos por IP. Dentro de Docker, todas las peticiones le llegan desde el contenedor de Nginx. Por eso Nginx envía la IP real del navegador en `X-Forwarded-For`, y ms-auth solo acepta ese header si la petición viene de un **proxy confiable**:

- `app.seguridad.proxies-confiables`: por defecto `127.0.0.1,::1`, que es el proxy de Vite en desarrollo.
- En `docker-compose.yml` se agrega la red interna con `APP_SEGURIDAD_PROXIES_CONFIABLES=127.0.0.1,::1,172.28.0.0/16`.

Si se cambia la subred de la red `elvolcan`, hay que cambiar también esa variable.

> En **Docker Desktop**, las peticiones desde el propio PC llegan a Nginx con la IP del gateway de la red (`172.28.0.1`), así que el log de ms-auth muestra esa IP. Es normal: todas vienen de la misma máquina. En **EC2 (Linux)** Docker conserva la IP de origen y el log muestra la IP pública real de cada usuario.

### Headers de seguridad (H-13) y Content-Security-Policy

`frontend/nginx/default.conf` agrega estos headers a todas las respuestas:

| Header | Valor |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | ver abajo |

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self' data:; connect-src 'self';
frame-src https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com;
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

- Scripts, estilos y fuentes solo del propio sitio: Bootstrap y bootstrap-icons vienen empaquetados en el build. `'unsafe-inline'` en `style-src` cubre los atributos `style` de React y React Bootstrap.
- `frame-src` permite solo el mapa de **Google Maps** (Tiendas) y el video de **YouTube** (Consejos).
- `connect-src 'self'`: la API se consume por `/api/...` en el mismo origen, a través de Nginx.

> ⚠️ **Imágenes de productos**: deben ser **rutas locales `/IMAGENES/...`** (por ejemplo `/IMAGENES/cilindro de 15K.png`). Por `img-src 'self' data:`, una URL externa (`https://...`) cargada desde el panel de Inventario **queda bloqueada** y no se muestra. Para agregar una imagen nueva, se copia a `frontend/public/IMAGENES/` y se reconstruye el frontend.

---

## 2. Variables de entorno (`.env`)

Todo se configura en un archivo **`.env` en la raíz** del repositorio, junto a `docker-compose.yml`. Se crea copiando la plantilla:

```bash
cp .env.example .env       # Windows PowerShell: Copy-Item .env.example .env
```

| Variable | Obligatoria | Uso |
|---|---|---|
| `WALLET_HOST_DIR` | sí | Carpeta del Wallet de Oracle **en esta máquina**. Se monta en `/wallet:ro` y `ORACLE_WALLET_DIR=/wallet` apunta a ella dentro del contenedor. |
| `DB_USER` | no (`ADMIN`) | Usuario de la base Oracle |
| `DB_PASSWORD` | sí | Contraseña de la base Oracle |
| `JWT_SECRET` | sí | Clave del JWT (≥ 32 caracteres, la misma para los 4 servicios) |
| `JAVA_OPTS` / `EUREKA_JAVA_OPTS` | no | Memoria de la JVM (`-Xmx384m` / `-Xmx256m`) |
| `APP_FRONTEND_URL` | no (`http://localhost`) | URL del sitio para los enlaces de recuperación de contraseña |
| `REINICIAR_SEMILLA` | no (`false`) | `true` recarga los 14 productos (una sola vez) |
| `NOTIFICACION_MODO` | no (`log`) | `log` = el enlace queda en el log de ms-auth; `correo` = SMTP |
| `SPRING_MAIL_*`, `APP_NOTIFICACION_REMITENTE` | solo con `correo` | Datos SMTP, equivalentes a `spring.mail.*` |

- Si falta una variable obligatoria, `docker compose` se detiene con un mensaje como `Define DB_PASSWORD en .env`.
- **Prioridad**: las variables de entorno tienen prioridad sobre `~/.elvolcan/secrets.properties`. Ese archivo es para correr sin Docker y además no existe dentro de los contenedores.
- `.env` está en `.gitignore`: **nunca se sube al repositorio**. Solo se versiona `.env.example`.

---

## 3. Levantar en local (Docker Desktop)

### Requisitos

- **Docker Desktop** (Windows/Mac) con el motor iniciado. En Windows se usa el backend WSL 2.
- El **Wallet de Oracle** descomprimido, por ejemplo en `C:\Users\<usuario>\.elvolcan\OracleWallet`.
- Libres los puertos **80** y **8761**. Si están corriendo los servicios de `levantar-servicios.ps1` o el `npm run dev`, hay que detenerlos antes (`detener-servicios.ps1` y Ctrl+C).

### Paso a paso

```powershell
# 1. Desde la raíz del repositorio
Copy-Item .env.example .env
notepad .env        # WALLET_HOST_DIR (con /), DB_PASSWORD, JWT_SECRET

# 2. Construir y levantar (la primera vez tarda varios minutos: descarga dependencias)
docker compose up -d --build

# 3. Ver el estado: todos deben quedar "healthy" (1-3 minutos)
docker compose ps

# 4. Revisar Eureka: los 4 servicios en estado UP
start http://127.0.0.1:8761

# 5. Abrir el sitio
start http://localhost
```

En `WALLET_HOST_DIR` usa `/` como separador (`C:/Users/<usuario>/.elvolcan/OracleWallet`).

### Comandos útiles

```bash
docker compose logs -f ms-auth          # logs de un servicio (enlace de recuperación en modo log)
docker compose logs --tail 100          # últimas líneas de todos
docker compose restart ms-ventas        # reiniciar un servicio
docker compose up -d --build frontend   # reconstruir solo el frontend tras un cambio
docker compose down                     # detener y borrar los contenedores (las imágenes quedan)
```

### Pruebas rápidas

1. **Login** en http://localhost/login con `cliente@elvolcan.cl` / `Cliente123`.
2. **Catálogo** en `/productos`: los 14 productos con sus imágenes.
3. **Compra**: carrito → "Ir a pagar" → confirmar. La orden aparece en "Mis compras" como Pagada.
4. **Refrescar** `/productos` con F5: no da 404, porque Nginx usa `try_files`.
5. Los headers se revisan con `curl -I http://localhost`.

---

## 4. Desplegar en AWS EC2 (Ubuntu)

### 4.1 Crear la instancia

| Opción | Valor recomendado |
|---|---|
| AMI | Ubuntu Server 24.04 LTS |
| Tipo | **t3.medium** (4 GB RAM). Con una t3.small (2 GB) hay que agregar swap (paso 4.3). |
| Almacenamiento | 20 GB gp3 |
| Par de claves | uno nuevo (`elvolcan.pem`), guardado fuera del repositorio |

**Grupo de seguridad (entrada): solo dos reglas.**

| Tipo | Puerto | Origen |
|---|---|---|
| SSH | 22 | **Mi IP** (no `0.0.0.0/0`) |
| HTTP | 80 | `0.0.0.0/0` |

No se abren 8081-8086 ni 8761: los microservicios solo existen en la red interna de Docker, y Eureka escucha en `127.0.0.1` de la instancia.

### 4.2 Permitir la IP de EC2 en Oracle Cloud

La Autonomous Database puede tener una **lista de control de acceso (ACL)**. Si la tiene, la IP pública de la instancia debe estar permitida:

1. Oracle Cloud → Autonomous Database → la base del proyecto → **Network** → *Access control list* → **Edit**.
2. Agrega la **IP pública de EC2** (tipo *IP address*) y guarda.
3. Si la base está **detenida** (error `ORA-12514` en los logs), inícala desde la consola de Oracle.

Conviene asignar una **Elastic IP** a la instancia, para que la IP no cambie al reiniciarla. Si cambia, hay que actualizar la ACL y `APP_FRONTEND_URL`.

### 4.3 Instalar Docker

```bash
ssh -i elvolcan.pem ubuntu@<IP-EC2>

# Docker Engine + plugin compose (repositorio oficial)
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Usar docker sin sudo (cerrar y volver a abrir la sesión SSH después)
sudo usermod -aG docker ubuntu

# (Solo con 2 GB de RAM) swap de 2 GB
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4.4 Copiar el código y los secretos

```bash
# En EC2: clonar el repositorio
git clone <URL-del-repositorio> elvolcan
mkdir -p ~/elvolcan-secretos
```

Desde **tu PC**, copia el Wallet y el `.env` con `scp`. **Nunca los subas a GitHub.**

```powershell
# Desde tu PC (PowerShell), en la carpeta donde está elvolcan.pem
scp -i elvolcan.pem -r C:\Users\<usuario>\.elvolcan\OracleWallet ubuntu@<IP-EC2>:~/elvolcan-secretos/
scp -i elvolcan.pem .env ubuntu@<IP-EC2>:~/elvolcan/.env
```

En EC2, ajusta el `.env` y protege los archivos:

```bash
cd ~/elvolcan
nano .env
#   WALLET_HOST_DIR=/home/ubuntu/elvolcan-secretos/OracleWallet
#   APP_FRONTEND_URL=http://<IP-EC2>
chmod 600 .env
chmod 700 ~/elvolcan-secretos
```

Los archivos del Wallet deben poder leerse desde el contenedor, que corre con un usuario sin privilegios: `chmod -R a+rX ~/elvolcan-secretos/OracleWallet`. La carpeta padre sigue protegida (700) para los demás usuarios de la instancia.

### 4.5 Levantar

```bash
cd ~/elvolcan
docker compose up -d --build
docker compose ps                      # todos "healthy"
curl -s http://127.0.0.1:8761/eureka/apps | grep -o '<name>[^<]*</name>'   # los 4 servicios
```

Abre `http://<IP-EC2>` en el navegador.

**Ver el panel de Eureka desde tu PC**, sin abrir el puerto 8761, con un túnel SSH:

```powershell
ssh -i elvolcan.pem -L 8761:127.0.0.1:8761 ubuntu@<IP-EC2>
# y en tu PC abre http://localhost:8761
```

Los contenedores tienen `restart: unless-stopped`: vuelven a levantarse solos si la instancia se reinicia.

### 4.6 Actualizar a una nueva versión

```bash
cd ~/elvolcan
git pull
docker compose up -d --build
docker image prune -f                  # borra imágenes antiguas
```

---

## 5. Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Define DB_PASSWORD en .env` (o `WALLET_HOST_DIR`, `JWT_SECRET`) | Falta `.env` o la variable | Copiar `.env.example` a `.env` y completarlo |
| Los 4 servicios quedan `unhealthy` y en los logs aparece `WeakKeyException: ... key byte array is N bits` | `JWT_SECRET` tiene menos de 32 caracteres (256 bits) | Usar una clave de 32 caracteres o más, sin comillas ni espacios, y `docker compose up -d` |
| `failed to connect to the docker API` | Docker Desktop no está iniciado | Abrir Docker Desktop y esperar a que diga *Engine running* |
| `Bind for 0.0.0.0:80 failed: port is already allocated` | Otro programa usa el puerto 80 (IIS, Nginx local, otro contenedor) | Detenerlo, o cambiar `"80:80"` por `"8080:80"` y abrir `http://localhost:8080` |
| Un servicio queda `unhealthy` y en los logs aparece `ORA-12514`, `ORA-12506` o `IO Error` | La base Oracle está detenida o la IP no está en la ACL | Iniciar la base o agregar la IP (paso 4.2) |
| `ORA-17957` / `SSO not found` / `cwallet.sso` | `WALLET_HOST_DIR` apunta a una carpeta equivocada | Debe ser la carpeta que contiene `cwallet.sso` y `tnsnames.ora` |
| El servicio se reinicia solo / `OOMKilled` | Falta memoria | Usar una instancia de 4 GB, agregar swap o bajar `JAVA_OPTS` |
| El frontend muestra "Sin conexión" | Algún microservicio no está healthy | `docker compose ps` y `docker compose logs <servicio>` |
| Una imagen de producto no se ve | La imagen es una URL externa, bloqueada por la CSP | Usar una ruta `/IMAGENES/...` (sección 1) |
| El enlace de recuperación apunta a `localhost` en EC2 | `APP_FRONTEND_URL` sin cambiar | Poner `http://<IP-EC2>` en `.env` y `docker compose up -d` |
