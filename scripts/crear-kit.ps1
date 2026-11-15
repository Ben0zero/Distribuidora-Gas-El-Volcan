# ==============================================================================
#  El Volcan - Crear el KIT PORTATIL (solo Docker Desktop, sin el codigo)
#
#  Uso (desde la raiz del repositorio):
#    powershell -ExecutionPolicy Bypass -File scripts\crear-kit.ps1
#    powershell -ExecutionPolicy Bypass -File scripts\crear-kit.ps1 -Destino D:\kits\elvolcan-kit
#    powershell -ExecutionPolicy Bypass -File scripts\crear-kit.ps1 -SinBuild   # usa las imagenes ya construidas
#
#  Genera, FUERA del repositorio:
#    <Destino>\                 imagenes.tar, docker-compose.yml, .env, OracleWallet\,
#                               levantar.ps1, detener.ps1, LEEME.txt
#    <Destino>.zip              todo lo anterior comprimido
#
#  ATENCION: el kit contiene SECRETOS (.env y Wallet). Compartir solo por privado.
#  Este script nunca muestra el contenido del .env ni del Wallet.
# ==============================================================================

param(
    [string]$Destino = (Join-Path $env:USERPROFILE 'elvolcan-kit'),
    [switch]$SinBuild
)

$repo = Split-Path -Parent $PSScriptRoot
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

function Paso([string]$mensaje) {
    Write-Host ''
    Write-Host "==> $mensaje" -ForegroundColor Cyan
}

function TamanoMB([string]$ruta) {
    return [math]::Round((Get-Item $ruta).Length / 1MB, 1)
}

# ------------------------------------------------------------------ validaciones
Paso 'Revisando requisitos'

docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) { Fallar 'Docker no esta corriendo. Abre Docker Desktop y espera "Engine running".' }

$envRepo = Join-Path $repo '.env'
$composeKit = Join-Path $repo 'docker-compose.kit.yml'
if (-not (Test-Path $envRepo)) { Fallar "Falta $envRepo (copia .env.example a .env y completalo)." }
if (-not (Test-Path $composeKit)) { Fallar "Falta $composeKit." }

# Solo se lee la linea WALLET_HOST_DIR del .env; su valor no se muestra
$lineaWallet = Get-Content $envRepo | Where-Object { $_ -match '^\s*WALLET_HOST_DIR\s*=' } | Select-Object -Last 1
if (-not $lineaWallet) { Fallar 'El .env no define WALLET_HOST_DIR.' }
$wallet = ($lineaWallet -replace '^\s*WALLET_HOST_DIR\s*=\s*', '').Trim().Trim('"').Trim("'")
if (-not (Test-Path (Join-Path $wallet 'cwallet.sso'))) {
    Fallar 'La carpeta indicada en WALLET_HOST_DIR no existe o no contiene cwallet.sso.'
}
Write-Host '[OK] Docker, .env y Wallet encontrados' -ForegroundColor Green

# El destino debe quedar FUERA del repositorio (contiene secretos)
$destinoAbs = [System.IO.Path]::GetFullPath($Destino).TrimEnd('\')
$repoAbs = [System.IO.Path]::GetFullPath($repo).TrimEnd('\')
if ($destinoAbs -eq $repoAbs -or $destinoAbs.StartsWith($repoAbs + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    Fallar "El destino no puede estar dentro del repositorio: $destinoAbs"
}

# Si ya existe, solo se reemplaza si es un kit anterior (para no borrar otra carpeta por error)
if (Test-Path $destinoAbs) {
    $composeAnterior = Join-Path $destinoAbs 'docker-compose.yml'
    $esKit = (Test-Path $composeAnterior) -and (Select-String -Path $composeAnterior -Pattern '^name: elvolcan-kit' -Quiet)
    if (-not $esKit) { Fallar "La carpeta $destinoAbs ya existe y no es un kit de El Volcan. Elige otro -Destino." }
    Write-Host "Reemplazando el kit anterior en $destinoAbs"
    Remove-Item -Recurse -Force $destinoAbs
}
$zip = "$destinoAbs.zip"

# ------------------------------------------------------------------ imagenes
if (-not $SinBuild) {
    Paso 'Construyendo las imagenes (docker compose build)'
    docker compose -f (Join-Path $repo 'docker-compose.yml') build
    if ($LASTEXITCODE -ne 0) { Fallar 'Fallo docker compose build.' }
}
foreach ($img in $imagenes) {
    docker image inspect $img *> $null
    if ($LASTEXITCODE -ne 0) { Fallar "No existe la imagen $img. Ejecuta el script sin -SinBuild." }
}

New-Item -ItemType Directory -Path $destinoAbs | Out-Null

Paso 'Guardando las 6 imagenes en imagenes.tar (docker save)'
$tar = Join-Path $destinoAbs 'imagenes.tar'
docker save -o $tar @imagenes
if ($LASTEXITCODE -ne 0) { Fallar 'Fallo docker save.' }
Write-Host "[OK] imagenes.tar: $(TamanoMB $tar) MB" -ForegroundColor Green

# ------------------------------------------------------------------ archivos
Paso 'Copiando compose, secretos y scripts'
Copy-Item $composeKit (Join-Path $destinoAbs 'docker-compose.yml')
Copy-Item $envRepo (Join-Path $destinoAbs '.env')
$walletKit = Join-Path $destinoAbs 'OracleWallet'
New-Item -ItemType Directory -Path $walletKit | Out-Null
Copy-Item (Join-Path $wallet '*') $walletKit -Recurse
$archivosWallet = (Get-ChildItem $walletKit -Recurse -File | Measure-Object).Count
foreach ($archivo in 'levantar.ps1', 'detener.ps1', 'LEEME.txt') {
    Copy-Item (Join-Path $PSScriptRoot "kit\$archivo") (Join-Path $destinoAbs $archivo)
}
Write-Host "[OK] .env copiado, Wallet copiado ($archivosWallet archivos), scripts copiados" -ForegroundColor Green

# ------------------------------------------------------------------ zip
Paso 'Comprimiendo el kit'
if (Test-Path $zip) { Remove-Item -Force $zip }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($destinoAbs, $zip, [System.IO.Compression.CompressionLevel]::Optimal, $true)
Write-Host "[OK] $zip ($(TamanoMB $zip) MB)" -ForegroundColor Green

Write-Host ''
Write-Host 'Kit listo:' -ForegroundColor Green
Write-Host "  Carpeta: $destinoAbs"
Write-Host "  Zip:     $zip ($(TamanoMB $zip) MB)"
Write-Host ''
Write-Host 'ATENCION: el kit contiene SECRETOS (.env con la clave de la BD y el JWT, y el Oracle Wallet).' -ForegroundColor Yellow
Write-Host 'Compartelo solo por privado con el equipo y borralo cuando ya no lo uses (ver docs/DOCKER.md).' -ForegroundColor Yellow
