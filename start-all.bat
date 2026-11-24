@echo off
title iPortal Campus Launcher
echo ===================================================
echo Starting iPortal Campus Development Environment
echo ===================================================

echo [1/3] Checking MySQL / MariaDB...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo MySQL is already running.
) else (
    echo Starting MySQL from XAMPP...
    start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
    timeout /t 2 /nobreak >nul
)

echo [2/3] Starting Laravel API Server on http://127.0.0.1:8000...
start "iPortal Laravel API" cmd /k "cd /d %~dp0laravel-api && php artisan serve --port=8000"

echo [3/3] Starting React Frontend on http://localhost:5173...
start "iPortal Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ===================================================
echo iPortal Campus is starting up!
echo Frontend: http://localhost:5173
echo Backend API: http://127.0.0.1:8000
echo Database: MySQL (iportal_campus_dev)
echo ===================================================
