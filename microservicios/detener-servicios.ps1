# ============================================================
#  Detiene los microservicios levantados con levantar-servicios.ps1
#  Uso:  powershell -ExecutionPolicy Bypass -File .\detener-servicios.ps1
# ============================================================
$logDir = 'C:\Users\ben95\.elvolcan\logs'
if (-not (Test-Path $logDir)) { Write-Host 'No hay logs/pids: nada que detener.'; exit 0 }

Get-ChildItem $logDir -Filter '*.pid' | ForEach-Object {
    $nombre = $_.BaseName
    $pidProc = Get-Content $_.FullName
    $p = Get-Process -Id $pidProc -ErrorAction SilentlyContinue
    if ($p) {
        Write-Host ">> Deteniendo $nombre (PID $pidProc)..."
        # mvnw.cmd lanza java como hijo: matar el árbol de procesos
        & taskkill.exe /PID $pidProc /T /F 2>$null | Out-Null
    } else {
        Write-Host ">> $nombre (PID $pidProc) ya no corre."
    }
    Remove-Item $_.FullName -Force
}
Write-Host 'Listo.'
