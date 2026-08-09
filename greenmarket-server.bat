@echo off
setlocal EnableExtensions

cd /d "%~dp0react-vite-bootstrap-project"

set "PORT=5173"
set "LOG=vite-dev.log"

if /i "%~1"=="start"   goto :start
if /i "%~1"=="stop"    goto :stop
if /i "%~1"=="restart" goto :restart
goto :usage

:usage
echo Usage:
echo   %~nx0 start     Start the GreenMarket dev server and open the browser
echo   %~nx0 stop      Stop the GreenMarket dev server
echo   %~nx0 restart   Restart the GreenMarket dev server
exit /b 0

:restart
call :stop
call :start
exit /b 0

:start
call :is_running
if defined RUNNING_PID (
    echo Server is already running on http://localhost:%PORT%/ ^(PID %RUNNING_PID%^)
    start "" "http://localhost:%PORT%/"
    exit /b 0
)
echo Starting GreenMarket dev server...
start "GreenMarket Vite Dev Server" /min cmd /c "npm run dev -- --host > %LOG% 2>&1"
set /a ATTEMPTS=0
:wait_loop
set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ 30 (
    echo Failed to start the server. Check %LOG%.
    exit /b 1
)
timeout /t 1 /nobreak >nul
call :is_running
if defined RUNNING_PID (
    echo Server is up: http://localhost:%PORT%/
    start "" "http://localhost:%PORT%/"
    exit /b 0
)
goto :wait_loop

:stop
call :is_running
if not defined RUNNING_PID (
    echo Server is not running.
    exit /b 0
)
taskkill /pid %RUNNING_PID% /f >nul
echo Server stopped.
exit /b 0

:is_running
set "RUNNING_PID="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /c:":%PORT% " ^| findstr "LISTENING"') do set "RUNNING_PID=%%p"
exit /b 0
