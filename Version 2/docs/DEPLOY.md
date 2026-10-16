# Guía de despliegue en AWS EC2 — Versión 2 (React)

Cómo publicar la **Distribuidora de Gas El Volcán** (Versión 2, React + Vite + React Bootstrap) en una
instancia **EC2** de AWS y servirla con **Nginx** en el puerto 80.

> Esta guía está adaptada a **nuestro proyecto** a partir de la *Guía 2.1.2 — Configuración de React + Vite +
> React Bootstrap en una instancia EC2 de AWS* (DSY1104). La diferencia principal: la app de la guía tiene una
> sola página con anclas; la nuestra usa **React Router** con rutas reales, por eso Nginx necesita una regla
> especial (`try_files ... /index.html`).

---

## 0. ¿Hay que cambiar el código?

**No.** Para publicar el frontend no se toca ni una línea de código. El único ajuste necesario es de
**configuración de Nginx** (incluido en `nginx.conf`), porque usamos `BrowserRouter`.

El código recién cambiará **cuando conectemos el backend** (microservicios Spring Boot): ahí se reemplaza
`localStorage` por `fetch()` y se manejan tokens y CORS.

---

## 1. Crear la instancia EC2 (resumen)

En AWS Academy → EC2 → **Lanzar instancia**:

| Ajuste | Valor |
|---|---|
| Nombre | `reactViteBootstrap` |
| Sistema operativo | **Ubuntu Server 22.04 LTS** |
| Tipo | `t2.micro` o `t3.micro` |
| Par de claves | Nueva, RSA, formato **`.pem`** (ej. `userReactVite.pem`) — guárdala |
| Almacenamiento | 20 GiB (si el laboratorio lo permite) |

**Reglas de entrada del grupo de seguridad:**

| Tipo | Puerto | Origen | Uso |
|---|---|---|---|
| SSH | 22 | Mi IP (recomendado) | Conexión remota |
| TCP personalizado | 5173 | Mi IP (solo mientras pruebas) | Servidor de desarrollo Vite |
| HTTP | 80 | 0.0.0.0/0 | Aplicación publicada con Nginx |

---

## 2. Conectarse por SSH

Desde **PowerShell** (Windows):

```powershell
ssh -i "C:\ruta\a\userReactVite.pem" ubuntu@IP-PUBLICA
```

- La IP pública está en la consola de EC2 (columna *Dirección IPv4 pública*).
- Usuario de Ubuntu en EC2: **`ubuntu`**.
- Si Windows rechaza el `.pem` por permisos, ajústalos una vez:

```powershell
icacls "C:\ruta\a\userReactVite.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

---

## 3. Instalar Node.js 22 (con NVM)

Ya dentro de la instancia:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl build-essential

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc

nvm install 22
nvm use 22

node --version   # v22.x
npm --version
```

> Si `nvm` no aparece, cierra la sesión SSH, vuelve a entrar y prueba `nvm --version`.

---

## 4. Traer el proyecto a la EC2

### Opción A — Clonar el repositorio (recomendado)

```bash
git clone https://github.com/Ben0zero/Distribuidora-Gas-El-Volcan.git
cd "Distribuidora-Gas-El-Volcan/Version 2"
```

> ⚠️ La carpeta `Version 2` tiene un **espacio**: usa comillas en el `cd`.

### Opción B — Subir el proyecto por SCP

Desde **PowerShell** (en tu PC), comprime la carpeta `Version 2` (sin `node_modules`, `dist` ni `coverage`) y súbela:

```powershell
scp -i "C:\ruta\a\userReactVite.pem" "C:\ruta\Version2.zip" ubuntu@IP-PUBLICA:/home/ubuntu/
```

En la EC2:

```bash
sudo apt install -y unzip
unzip Version2.zip
cd "Version 2"
```

---

## 5. Compilar la aplicación

```bash
npm install
npm run build      # genera la carpeta dist/
ls dist            # debería mostrar index.html y assets/
```

---

## 6. (Opcional) Probar el servidor de desarrollo

Igual que en la guía, en el puerto **5173**:

```bash
npm run dev -- --host 0.0.0.0
```

Abre en tu navegador: `http://IP-PUBLICA:5173`. Detén el servidor con `Ctrl+C` antes de publicar con Nginx.

---

## 7. Publicar con Nginx (puerto 80)

```bash
# Instalar Nginx
sudo apt install -y nginx

# Copiar la app compilada
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# Instalar NUESTRA configuración (incluye el try_files para React Router)
sudo cp nginx.conf /etc/nginx/sites-available/elvolcan
sudo ln -sf /etc/nginx/sites-available/elvolcan /etc/nginx/sites-enabled/elvolcan

# Desactivar el sitio por defecto (usa el mismo puerto 80 y daría conflicto)
sudo rm -f /etc/nginx/sites-enabled/default

# Validar y reiniciar
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

Visita: **`http://IP-PUBLICA`**

---

## 8. Verificar que todo funcione

- [ ] La portada carga en `http://IP-PUBLICA`
- [ ] Navega a **Productos**, **Nosotros**, **Carrito**, **Contacto**
- [ ] **Refresca** (F5) estando en `/productos` → debe seguir cargando (¡no 404!)
- [ ] Entra directo a `http://IP-PUBLICA/admin` → carga el panel
- [ ] Inicia sesión con `admin@duoc.cl` / `Admin123`
- [ ] Las imágenes de los productos se ven correctamente

---

## 9. Actualizar la publicación cuando cambies el código

```bash
cd "Distribuidora-Gas-El-Volcan/Version 2"
git pull
npm install
npm run build

sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx
```

---

## 10. Alternativa: compilar en tu PC y subir solo `dist/` (sin Node en la EC2)

Si el build en la EC2 (t2.micro, 1 GB de RAM) se queda corto:

```powershell
# En tu PC, dentro de "Version 2"
npm run build
scp -i "C:\ruta\a\userReactVite.pem" -r ".\dist\*" ubuntu@IP-PUBLICA:/home/ubuntu/dist
```

Luego en la EC2:

```bash
sudo rm -rf /var/www/html/*
sudo cp -r /home/ubuntu/dist/* /var/www/html/
sudo systemctl reload nginx
```

---

## 11. Problemas típicos

| Síntoma | Causa y solución |
|---|---|
| **404 al refrescar** `/productos` o `/admin` | Falta el `try_files $uri $uri/ /index.html;` en el `location /`. Revisa que `nginx.conf` esté instalado y `sudo nginx -t`. |
| `http://IP:5173` no responde | Falta `--host 0.0.0.0` o falta la regla TCP 5173 en el grupo de seguridad. |
| No carga `http://IP` (puerto 80) | Falta la regla HTTP 80 en el grupo de seguridad, o Nginx no está corriendo (`sudo systemctl status nginx`). |
| Conflicto "duplicate default server" | No se desactivó el sitio por defecto: `sudo rm -f /etc/nginx/sites-enabled/default`. |
| Alguna imagen no carga en Linux | Los nombres en `public/IMAGENES` tienen espacios y tildes. Si ocurre, renómbralos sin espacios/acentos (ej. `cilindro-5kg.png`) y actualiza las rutas en `src/datos/productos.js`. |
| `nvm: command not found` | Cierra y reabre la sesión SSH; luego `source ~/.bashrc`. |
| El build muere por memoria | Usa la alternativa de la sección 10 (compilar en tu PC y subir `dist/`). |

---

## 12. Notas finales

- El **servidor de desarrollo (5173)** es solo para probar; la **publicación real** es Nginx en el **80**.
- **No es necesario** ejecutar `npm test` en la EC2 (las pruebas en jsdom no aportan a la instalación). Eso se corre en tu PC antes de cada commit.
- Para **HTTPS** con un dominio, usa `certbot` (instrucciones al final de `nginx.conf`).
- Cuando existan los **microservicios** (Spring Boot), se agregará en Nginx un `location /api { proxy_pass ... }`
  y se reemplazará `localStorage` por `fetch()` en el frontend.
