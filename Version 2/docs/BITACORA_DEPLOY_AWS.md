# Bitácora de despliegue en AWS EC2 — Distribuidora de Gas El Volcán

**Proyecto:** Distribuidora de Gas El Volcán — Versión 2 (React + Vite + React Bootstrap)
**Asignatura:** DSY1104 — Desarrollo Fullstack II · Evaluación Parcial N° 2
**Fecha de despliegue:** sábado 10 de octubre de 2026
**URL pública:** http://44.203.9.96 (verificada con HTTP 200)

---

## 1. Resumen de la solución

La aplicación es una **SPA estática** (React compilado con Vite). En AWS no se ejecuta un
servidor Node para la app: se compila (`npm run build`) y la carpeta `dist/` resultante se
sirve con **Nginx** en el puerto 80. El único ajuste de configuración es la regla de Nginx
`try_files ... /index.html` (ya incluida en el `nginx.conf` del proyecto), necesaria por usar
**React Router** con rutas reales (`/productos`, `/admin`, etc.) para que el refresco no dé 404.

| Concepto | Valor |
|---|---|
| ID de instancia | `i-0e183885a9f6227b4` |
| Tipo de instancia | `t3.micro` (2 vCPU, 1 GiB RAM) |
| Sistema operativo | Ubuntu Server 26.04 LTS (AMI `ubuntu-resolute-26.04-amd64-server`) |
| IP pública (asignación automática) | `44.203.9.96` |
| Par de claves SSH | `userReactVite.pem` (RSA, formato `.pem`) |
| Node.js | v22.23.3 (instalado con NVM) |
| Nginx | 1.28.3 (Ubuntu) |

---

## 2. Antes de empezar (en tu PC Windows)

### 2.1 El archivo de la clave `.pem`

El par de claves se crea en AWS (EC2 → Key pairs). AWS descarga automáticamente
`userReactVite.pem` al navegador (carpeta Descargas).

### 2.2 Permisos del `.pem` en Windows

Windows bloquea claves con permisos abiertos. Se ajustan una vez con **PowerShell**:

```powershell
icacls "C:\Users\ben95\Downloads\userReactVite.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

> En PowerShell: primero se comprobó que la clave estaba en `Descargas` y se ajustaron los
> permisos **antes** de la primera conexión.

### 2.3 Grupo de seguridad (reglas de entrada)

| Tipo | Puerto | Origen | Uso |
|---|---|---|---|
| SSH | 22 | Mi IP | Conexión remota para administrar |
| HTTP | 80 | 0.0.0.0/0 | Aplicación publicada (visible para cualquiera) |

---

## 3. Paso 1 — Conexión por SSH

Desde PowerShell:

```powershell
ssh -i "C:\Users\ben95\Downloads\userReactVite.pem" ubuntu@44.203.9.96
```

Resultado: conexión establecida con `ubuntu@ip-172-31-3-121`
(Linux `ip-172-31-3-121 7.0.0-1013-aws` … x86_64 GNU/Linux).

> El usuario de Ubuntu en EC2 es **`ubuntu`**.

---

## 4. Paso 2 — Actualizar el sistema e instalar paquetes

```bash
sudo apt-get update -y
sudo apt-get install -y git curl nginx unzip
```

Salida relevante: se instalaron `nginx` (1.28.3) y `unzip`; `git` y `curl` ya venían.

---

## 5. Paso 3 — Instalar Node.js 22 con NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Luego, en cada sesión nueva hay que cargar NVM. **Nota:** al pasar comandos por SSH desde
PowerShell, `$HOME` se escapaba mal; por eso se usó la ruta absoluta:

```bash
export NVM_DIR=/home/ubuntu/.nvm
. /home/ubuntu/.nvm/nvm.sh
nvm install 22
nvm alias default 22
node --version   # v22.23.3
npm --version    # 10.9.9
```

> **Vite 8 requiere Node ≥ 22.12**, así que Node 22 es la versión adecuada.

---

## 6. Paso 4 — Traer el proyecto a la instancia

El repositorio es público, se clona directo:

```bash
cd /home/ubuntu
git clone https://github.com/Ben0zero/Distribuidora-Gas-El-Volcan.git
```

**⚠️ La carpeta se llama `Version 2` (con espacio).** Al ejecutar comandos por SSH desde
PowerShell las comillas se pierden y `cd "Version 2"` falla con *too many arguments*. Se
soluciona con un glob (comodín) para evitar el espacio:

```bash
cd /home/ubuntu/Distribuidora-Gas-El-Volcan/Version*2*
pwd   # /home/ubuntu/Distribuidora-Gas-El-Volcan/Version 2
```

---

## 7. Paso 5 — Instalar dependencias y compilar

```bash
npm install --no-audit --no-fund
npm run build
```

Salida del build (Vite 8.3.2):

```text
✓ 362 modules transformed.
dist/index.html                             0.48 kB │ gzip:   0.31 kB
dist/assets/bootstrap-icons-*.woff2       134.01 kB
dist/assets/bootstrap-icons-*.woff        180.28 kB
dist/assets/index-*.css                   320.80 kB │ gzip:  47.04 kB
dist/assets/index-*.js                    403.41 kB │ gzip: 116.45 kB
✓ built in 1.50s
```

La app quedó compilada en la carpeta `dist/`.

---

## 8. Paso 6 — Publicar con Nginx (puerto 80)

```bash
sudo rm -rf /var/www/html/*                          # limpiar la carpeta del sitio
sudo cp -r dist/* /var/www/html/                     # copiar la app compilada

sudo cp nginx.conf /etc/nginx/sites-available/elvolcan
sudo ln -sf /etc/nginx/sites-available/elvolcan /etc/nginx/sites-enabled/elvolcan

sudo rm -f /etc/nginx/sites-enabled/default          # ojo: el sitio default usa el mismo puerto 80

sudo nginx -t                                        # validar configuración
sudo systemctl restart nginx
sudo systemctl is-active nginx                       # → active
```

Qué hace `nginx.conf` (del proyecto):

- Sirve `root /var/www/html` con `index index.html`.
- **`try_files $uri $uri/ /index.html;`** → evita el 404 al refrescar rutas de React Router.
- Cachea imágenes/CSS/JS por 7 días.

---

## 9. Paso 7 — Verificación pública (desde el PC local, fuera de AWS)

```powershell
curl.exe -s -o NUL -w "Portada: HTTP %{http_code}\n" -m 20 http://44.203.9.96/
curl.exe -s -o NUL -w "Ruta /productos: HTTP %{http_code}\n" -m 20 http://44.203.9.96/productos
curl.exe -s -o NUL -w "Ruta /admin: HTTP %{http_code}\n" -m 20 http://44.203.9.96/admin
```

Resultado:

```text
Portada: HTTP 200
Ruta /productos: HTTP 200
Ruta /admin: HTTP 200
```

- La portada carga (HTTP 200).
- `/productos` y `/admin` responden 200 al refrescar **o al entrar directo** (React Router OK).

---

## 10. Cómo actualizar la publicación cuando cambie el código

```bash
ssh -i "C:\Users\ben95\Downloads\userReactVite.pem" ubuntu@44.203.9.96
export NVM_DIR=/home/ubuntu/.nvm && . /home/ubuntu/.nvm/nvm.sh
cd /home/ubuntu/Distribuidora-Gas-El-Volcan/Version*2*
git pull
npm install
npm run build

sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx
```

---

## 11. Notas y problemas típicos encontrados

| Situación | Causa y solución |
|---|---|
| `cd "Version 2"` daba *too many arguments* | Las comillas se pierden al pasar el comando por SSH desde Windows. Usar comodín: `cd .../Version*2*`. |
| NVM no cargaba (`/nvm.sh: No such file`) | El `$HOME` se escapaba mal entre PowerShell y bash. Usar ruta absoluta: `export NVM_DIR=/home/ubuntu/.nvm`. |
| `UNPROTECTED PRIVATE KEY FILE` | Ejecutar el `icacls` de la sección 2.2 sobre el `.pem`. |
| 404 al refrescar `/productos` o `/admin` | Falta el `try_files $uri $uri/ /index.html;` (revisar `nginx.conf` instalado y `sudo nginx -t`). |
| Conflicto *duplicate default server* | El sitio por defecto de Ubuntu sigue activo: `sudo rm -f /etc/nginx/sites-enabled/default`. |
| El build se cae por memoria en `t2.micro` | Alternativa: compilar en el PC local y subir solo `dist/` (`scp -r dist/* …`). En `t3.micro` el build funcionó bien (1.5 s). |
| La IP pública cambia al detener/encender | La instancia usa **IP automática** (sin Elastic IP). Verificar la IP nueva en la consola tras cada arranque. |
| ¿Correr `npm test` en la EC2? | No: las pruebas (jsdom) se ejecutan en el PC del desarrollador antes de cada commit. |

---

## 12. Recursos relacionados

- `DEPLOY.md` — guía original de despliegue (paso a paso completo, incluye HTTPS con certbot).
- `nginx.conf` — configuración de Nginx usada en la instancia.
- Repositorio público: https://github.com/Ben0zero/Distribuidora-Gas-El-Volcan (rama `main`, carpeta `Version 2`).

**Estado final:** aplicación desplegada y verificada en **http://44.203.9.96** (HTTP 200 en
portada, `/productos` y `/admin`). Acceso admin de prueba: `admin@duoc.cl` / `Admin123`.