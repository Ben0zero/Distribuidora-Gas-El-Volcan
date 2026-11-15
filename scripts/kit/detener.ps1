# ==============================================================================
#  El Volcan - KIT PORTATIL: detener el sistema
#
#  Uso (PowerShell abierto en la carpeta del kit):
#    powershell -ExecutionPolicy Bypass -File .\detener.ps1
#
#  Detiene y borra los contenedores del kit. Las imagenes quedan cargadas,
#  asi que la proxima vez levantar.ps1 arranca mas rapido.
# ==============================================================================

Set-Location $PSScriptRoot

docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host '[ERROR] Docker no esta corriendo.' -ForegroundColor Red
    exit 1
}

docker compose down
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host '[OK] El Volcan detenido.' -ForegroundColor Green
