@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: Supply Chain BI - Stop All Services
:: ============================================================

echo ============================================================
echo   Supply Chain BI - Stopping...
echo ============================================================
echo.

:: ---------- Stop Node.js backend (port 3000) ----------
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    set FOUND=1
    echo [INFO] Stopping Node.js backend (PID %%a^)...
    taskkill /F /PID %%a >nul 2>&1
    if !ERRORLEVEL! equ 0 (echo [OK] Node.js backend stopped) else (echo [WARN] Failed to kill PID %%a)
)
if !FOUND! equ 0 echo [OK] Node.js backend (port 3000) not running

:: ---------- Stop Python AI (port 8000) ----------
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    set FOUND=1
    echo [INFO] Stopping Python AI (PID %%a^)...
    taskkill /F /PID %%a >nul 2>&1
    if !ERRORLEVEL! equ 0 (echo [OK] Python AI stopped) else (echo [WARN] Failed to kill PID %%a)
)
if !FOUND! equ 0 echo [OK] Python AI (port 8000) not running

:: ---------- Stop MySQL (port 3306) ----------
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3306 " ^| findstr "LISTENING"') do (
    set FOUND=1
    echo [INFO] Stopping MySQL (PID %%a^)...
    taskkill /F /PID %%a >nul 2>&1
    if !ERRORLEVEL! equ 0 (echo [OK] MySQL stopped) else (echo [WARN] Failed to kill PID %%a)
)
if !FOUND! equ 0 echo [OK] MySQL (port 3306) not running

echo.
echo   All services stopped.
echo.
pause
