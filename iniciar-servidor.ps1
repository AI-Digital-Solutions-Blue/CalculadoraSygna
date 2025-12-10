Write-Host "Iniciando servidor web..." -ForegroundColor Green
Write-Host ""

# Obtener la IP local
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike '127.*' -and 
    $_.IPAddress -notlike '169.*' -and
    $_.IPAddress -notlike '*:*'
} | Select-Object -ExpandProperty IPAddress

if ($ipAddresses) {
    $localIP = $ipAddresses[0]
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Servidor iniciado correctamente!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Accede desde este equipo:" -ForegroundColor Yellow
    Write-Host "  http://localhost:8000" -ForegroundColor White
    Write-Host ""
    Write-Host "Accede desde otros dispositivos en la red:" -ForegroundColor Yellow
    foreach ($ip in $ipAddresses) {
        Write-Host "  http://$ip:8000" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Abrir navegador
    Start-Process "http://localhost:8000"
} else {
    Write-Host "No se pudo obtener la IP local" -ForegroundColor Red
    Write-Host "Accede desde: http://localhost:8000" -ForegroundColor Yellow
}

# Iniciar servidor
python -m http.server 8000 --bind 0.0.0.0

