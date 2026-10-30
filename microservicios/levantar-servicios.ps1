# ============================================================
#  Levanta Eureka + los 5 microservicios de "El Volcán"
#  Uso:  powershell -ExecutionPolicy Bypass -File .\levantar-servicios.ps1
#  Logs: C:\Users\ben95\.elvolcan\logs\<servicio>.log
# ============================================================
$base = 'C:\Users\ben95\OneDrive\Documentos\Duoc\Full Stack 2\Microservicios'
$logDir = 'C:\Users\ben95\.elvolcan\logs'
New-Item -ItemType Directory -Force $logDir | Out-Null

# Servicios en orden de arranque (Eureka primero, luego los demás)
$servicios = @(
    @{ nombre='eureka';    dir="$base\MiniMarket-Proyecto-ms-eureka\eurekaserver"; puerto=8761; espera=40 },
    @{ nombre='auth';      dir="$base\MiniMarket-Proyecto-ms-auth";                puerto=8081; espera=45 },
    @{ nombre='catalogo';  dir="$base\MiniMarket-Proyecto-ms-catalogoProductos";   puerto=8082; espera=45 },
    @{ nombre='recepcion'; dir="$base\MiniMarket-Proyecto-ms-produccion";          puerto=8083; espera=45 },
    @{ nombre='inventario';dir="$base\MiniMarket-Proyecto-ms-inventario";          puerto=8084; espera=45 },
    @{ nombre='ventas';    dir="$base\MiniMarket-Proyecto-ms-ventas";              puerto=8086; espera=45 }
)

foreach ($s in $servicios) {
    $log = Join-Path $logDir "$($s.nombre).log"
    Write-Host ">> Arrancando $($s.nombre) (puerto $($s.puerto))..."
    $proc = Start-Process -FilePath "$($s.dir)\mvnw.cmd" `
        -ArgumentList '-q','spring-boot:run' `
        -WorkingDirectory $s.dir `
        -RedirectStandardOutput $log -RedirectStandardError "$log.err" `
        -WindowStyle Hidden -PassThru
    $proc.Id | Set-Content (Join-Path $logDir "$($s.nombre).pid")
    Start-Sleep -Seconds $s.espera
}

Write-Host "`n>> Esperando registro en Eureka (http://localhost:8761)..."
$deadline = (Get-Date).AddMinutes(4)
# Nombres reales de spring.application.name (Eureka los muestra en mayúsculas).
# eureka-server NO se auto-registra (register-with-eureka=false), por eso no está en la lista.
$esperados = @('LOGINAUTH','CATALOGOPRODUCTOS','PRODUCCION','INVENTARIO-SERVICE','VENTAS-SERVICE')
do {
    Start-Sleep -Seconds 10
    try {
        [xml]$xml = (Invoke-WebRequest 'http://localhost:8761/eureka/apps' -UseBasicParsing -TimeoutSec 5).Content
        $apps = @($xml.SelectNodes('/applications/application') | ForEach-Object { $_.name })
    } catch { $apps = @() }
    $faltan = $esperados | Where-Object { $_ -notin $apps }
    Write-Host "   registrados: $($apps -join ', ')"
} while ($faltan -and (Get-Date) -lt $deadline)

if ($faltan) {
    Write-Host "`n[AVISO] No registraron a tiempo: $($faltan -join ', ')" -ForegroundColor Yellow
    Write-Host "Revisa los logs en $logDir"
} else {
    Write-Host "`n[OK] Los 6 servicios estan UP en Eureka." -ForegroundColor Green
}
