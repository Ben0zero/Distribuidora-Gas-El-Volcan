# ============================================================
#  Levanta Eureka + los 4 microservicios de "El Volcan"
#  (ms-produccion queda fuera del alcance de la Evaluacion Parcial 3)
#
#  Uso (desde la carpeta microservicios):
#    powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1
#    powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1 -Verificar         # solo revisa requisitos
#    powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1 -ReiniciarSemilla  # 1er arranque: recarga los 14 productos
#
#  Requisitos:
#    - Java 21 en el PATH
#    - %USERPROFILE%\.elvolcan\secrets.properties (copiar secrets.example.properties y completar)
#    - El Wallet de Oracle descomprimido en la carpeta indicada en ORACLE_WALLET_DIR
#  Logs: %USERPROFILE%\.elvolcan\logs\<servicio>.log
# ============================================================
param(
    [switch]$Verificar,
    [switch]$ReiniciarSemilla
)

$ErrorActionPreference = 'Stop'
$base     = $PSScriptRoot
$carpeta  = Join-Path $env:USERPROFILE '.elvolcan'
$logDir   = Join-Path $carpeta 'logs'
$secretos = Join-Path $carpeta 'secrets.properties'

# Orden de arranque: Eureka primero; inventario antes que catalogo (catalogo lo llama al crear productos)
$servicios = @(
    @{ nombre = 'eureka';     dir = 'MiniMarket-Proyecto-ms-eureka\eurekaserver';  puerto = 8761; eureka = $null },
    @{ nombre = 'auth';       dir = 'MiniMarket-Proyecto-ms-auth';                 puerto = 8081; eureka = 'MS-AUTH' },
    @{ nombre = 'inventario'; dir = 'MiniMarket-Proyecto-ms-inventario';           puerto = 8084; eureka = 'MS-INVENTARIO' },
    @{ nombre = 'catalogo';   dir = 'MiniMarket-Proyecto-ms-catalogoProductos';    puerto = 8082; eureka = 'MS-CATALOGOPRODUCTOS' },
    @{ nombre = 'ventas';     dir = 'MiniMarket-Proyecto-ms-ventas';               puerto = 8086; eureka = 'MS-VENTAS' }
)

function Leer-Secretos([string]$ruta) {
    $valores = @{}
    Get-Content $ruta | Where-Object { $_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$' } | ForEach-Object {
        $valores[$Matches[1]] = $Matches[2].Trim()
    }
    return $valores
}

function Puerto-Abierto([int]$puerto) {
    $cliente = New-Object System.Net.Sockets.TcpClient
    try {
        $intento = $cliente.BeginConnect('127.0.0.1', $puerto, $null, $null)
        return ($intento.AsyncWaitHandle.WaitOne(500) -and $cliente.Connected)
    } catch { return $false } finally { $cliente.Close() }
}

function Esperar-Puerto([int]$puerto, [int]$segundos) {
    $limite = (Get-Date).AddSeconds($segundos)
    while ((Get-Date) -lt $limite) {
        if (Puerto-Abierto $puerto) { return $true }
        Start-Sleep -Seconds 3
    }
    return $false
}

# ---------------------------------------------------------------- 1) Requisitos
$errores = @()
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    $errores += 'No se encontro "java" en el PATH (se necesita Java 21).'
}
if (-not (Test-Path $secretos)) {
    $errores += "Falta $secretos. Copia microservicios\secrets.example.properties a esa ruta y completa los valores."
} else {
    $s = Leer-Secretos $secretos
    foreach ($clave in @('DB_PASSWORD', 'ORACLE_WALLET_DIR', 'JWT_SECRET')) {
        if (-not $s.ContainsKey($clave) -or [string]::IsNullOrWhiteSpace($s[$clave])) {
            $errores += "En secrets.properties falta el valor de $clave."
        }
    }
    if ($s['ORACLE_WALLET_DIR'] -and -not (Test-Path $s['ORACLE_WALLET_DIR'])) {
        $errores += "La carpeta del Wallet no existe: $($s['ORACLE_WALLET_DIR'])"
    }
    if ($s['JWT_SECRET'] -and $s['JWT_SECRET'].Length -lt 32) {
        $errores += 'JWT_SECRET debe tener al menos 32 caracteres.'
    }
}
foreach ($svc in $servicios) {
    $mvnw = Join-Path (Join-Path $base $svc.dir) 'mvnw.cmd'
    if (-not (Test-Path $mvnw)) { $errores += "No se encontro $mvnw" }
    if (Puerto-Abierto $svc.puerto) { $errores += "El puerto $($svc.puerto) ($($svc.nombre)) ya esta en uso. Ejecuta detener-servicios.ps1." }
}

if ($errores.Count -gt 0) {
    Write-Host "`n[ERROR] No se puede levantar el sistema:" -ForegroundColor Red
    $errores | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}
Write-Host '[OK] Requisitos verificados (Java, secretos, Wallet y puertos libres).' -ForegroundColor Green
if ($Verificar) { exit 0 }

# ---------------------------------------------------------------- 2) Arranque
New-Item -ItemType Directory -Force $logDir | Out-Null
foreach ($svc in $servicios) {
    $dir = Join-Path $base $svc.dir
    $log = Join-Path $logDir "$($svc.nombre).log"

    # Solo catalogo e inventario reciben la orden de recargar la semilla (commit 11)
    $env:REINICIAR_SEMILLA = if ($ReiniciarSemilla -and $svc.nombre -in @('catalogo', 'inventario')) { 'true' } else { 'false' }

    Write-Host ">> Arrancando $($svc.nombre) (puerto $($svc.puerto))..."
    $proc = Start-Process -FilePath (Join-Path $dir 'mvnw.cmd') `
        -ArgumentList '-q', 'spring-boot:run' `
        -WorkingDirectory $dir `
        -RedirectStandardOutput $log -RedirectStandardError "$log.err" `
        -WindowStyle Hidden -PassThru
    $proc.Id | Set-Content (Join-Path $logDir "$($svc.nombre).pid")

    if (Esperar-Puerto $svc.puerto 180) {
        Write-Host "   $($svc.nombre) responde en el puerto $($svc.puerto)." -ForegroundColor Green
    } else {
        Write-Host "   [AVISO] $($svc.nombre) no respondio en 3 minutos. Revisa $log" -ForegroundColor Yellow
    }
}
Remove-Item Env:\REINICIAR_SEMILLA -ErrorAction SilentlyContinue

# ---------------------------------------------------------------- 3) Registro en Eureka
Write-Host "`n>> Esperando el registro en Eureka (http://localhost:8761)..."
$esperados = $servicios | Where-Object { $_.eureka } | ForEach-Object { $_.eureka }
$limite = (Get-Date).AddMinutes(2)
do {
    Start-Sleep -Seconds 5
    try {
        [xml]$xml = (Invoke-WebRequest 'http://localhost:8761/eureka/apps' -UseBasicParsing -TimeoutSec 5).Content
        $apps = @($xml.SelectNodes('/applications/application') | ForEach-Object { $_.name })
    } catch { $apps = @() }
    $faltan = @($esperados | Where-Object { $_ -notin $apps })
} while ($faltan.Count -gt 0 -and (Get-Date) -lt $limite)

if ($faltan.Count -gt 0) {
    Write-Host "[AVISO] No se registraron en Eureka: $($faltan -join ', '). Revisa los logs en $logDir" -ForegroundColor Yellow
} else {
    Write-Host '[OK] Eureka + 4 microservicios UP.' -ForegroundColor Green
}

Write-Host "`nURLs:"
Write-Host '  Eureka          http://localhost:8761'
Write-Host '  Swagger auth    http://localhost:8081/swagger-ui/index.html'
Write-Host '  Swagger catalogo http://localhost:8082/swagger-ui/index.html'
Write-Host '  Swagger inventario http://localhost:8084/swagger-ui/index.html'
Write-Host '  Swagger ventas  http://localhost:8086/swagger-ui/index.html'
Write-Host '  Frontend        cd ..\frontend ; npm run dev  ->  http://localhost:5173'
