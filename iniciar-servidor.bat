@echo off
echo Iniciando servidor web...
echo.

REM Obtener la IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    set IP=!IP:~1!
    goto :found
)

:found
echo.
echo ========================================
echo Servidor iniciado correctamente!
echo ========================================
echo.
echo Accede desde este equipo:
echo   http://localhost:8000
echo.
echo Accede desde otros dispositivos en la red:
echo   http://%IP%:8000
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

python -m http.server 8000 --bind 0.0.0.0

