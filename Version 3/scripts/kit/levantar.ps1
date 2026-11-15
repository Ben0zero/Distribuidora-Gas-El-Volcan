# ==============================================================================
#  El Volcan - KIT PORTATIL: levantar el sistema
#
#  Uso (PowerShell abierto en la carpeta del kit):
#    powershell -ExecutionPolicy Bypass -File .\levantar.ps1
#  Si el zip se descargo de internet, antes ejecuta en esta carpeta:
#    Get-ChildItem -Recurse | Unblock-File
#
#  1. Revisa Docker, los archivos del kit y el puerto 80.
#  2. Carga las imagenes desde imagenes.tar (solo si faltan).
#  3. Levanta los 6 contenedores y espera a que esten "healthy".
# ==============================================================================

Set-Location $PSScriptRoot

$imagenes = @(
    'elvolcan/eureka:1.0',
    'elvolcan/ms-auth:1.0',
    'elvolcan/ms-catalogoproductos:1.0',
    'elvolcan/ms-inventario:1.0',
    'elvolcan/ms-ventas:1.0',
    'elvolcan/frontend:1.0'
)

function Fallar([string]$mensaje) {
    Write-Host "[ERROR] $mensaje" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------ requisitos
docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) { Fallar 'Docker no esta corriendo. Abre Docker Desktop, espera "Engine running" y vuelve a ejecutar.' }

foreach ($archivo in 'docker-compose.yml', '.env', 'OracleWallet\cwallet.sso') {
    if (-not (Test-Path $archivo)) { Fallar "Falta $archivo en la carpeta del kit. Descomprime el zip completo." }
}

$puerto80 = Get-NetTCPConnection -State Listen -LocalPort 80 -ErrorAction SilentlyContinue
if ($puerto80) {
    $kitArriba = docker compose ps -q frontend 2>$null
    if (-not $kitArriba) {
        Fallar 'El puerto 80 esta ocupado por otro programa (IIS, otro servidor u otro contenedor). Detenlo y vuelve a ejecutar.'
    }
}
Write-Host '[OK] Docker corriendo y archivos del kit completos' -ForegroundColor Green

# ------------------------------------------------------------------ imagenes
$faltan = @($imagenes | Where-Object { docker image inspect $_ *> $null; $LASTEXITCODE -ne 0 })
if ($faltan.Count -gt 0) {
    if (-not (Test-Path 'imagenes.tar')) { Fallar 'Faltan imagenes y no existe imagenes.tar en la carpeta del kit.' }
    Write-Host "Cargando $($faltan.Count) imagen(es) desde imagenes.tar (puede tardar unos minutos)..."
    docker load -i imagenes.tar
    if ($LASTEXITCODE -ne 0) { Fallar 'Fallo docker load.' }
} else {
    Write-Host '[OK] Las 6 imagenes ya estan cargadas' -ForegroundColor Green
}

# ------------------------------------------------------------------ levantar
Write-Host 'Levantando los contenedores y esperando que esten healthy (hasta 5 minutos)...'
docker compose up -d --wait --wait-timeout 300
$codigo = $LASTEXITCODE
docker compose ps --format 'table {{.Service}}\t{{.Status}}'

if ($codigo -ne 0) {
    Write-Host ''
    Write-Host '[ERROR] Algun contenedor no quedo healthy.' -ForegroundColor Red
    Write-Host 'Revisa sus logs, por ejemplo:  docker compose logs ms-auth'
    Write-Host 'Causas comunes: la base Oracle detenida, la IP de este PC no permitida en Oracle, o un JWT_SECRET de menos de 32 caracteres.'
    exit 1
}

Write-Host ''
Write-Host 'El Volcan esta arriba. Abre en el navegador:  http://localhost' -ForegroundColor Green
Write-Host 'Eureka (solo en este PC):                     http://127.0.0.1:8761'
Write-Host 'Para detener:  powershell -ExecutionPolicy Bypass -File .\detener.ps1'
