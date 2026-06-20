@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: Supply Chain BI - Unified Entry Point
:: ============================================================

set "ROOT=%~dp0"
set "MYSQL_CLI=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

:: ---- Anaconda Python ----
set "PYTHON_EXE=D:\ProgramData\anaconda3\python.exe"
if not exist "%PYTHON_EXE%" (
    for %%p in (python3.exe python.exe) do (
        where %%p >nul 2>&1
        if !ERRORLEVEL! equ 0 (set "PYTHON_EXE=%%p" & goto :python_done)
    )
)
:python_done

:: ============================================================
::  Function: cmd_start (Production Mode)
:: ============================================================
:cmd_start
cls
echo.
echo ============================================================
echo   Production Mode
echo ============================================================
echo.

if exist "%ROOT%ui\dist\" (
    echo [OK] Frontend dist exists, skip build
) else (
    echo [INFO] Building frontend...
    cd /d "%ROOT%ui"
    if not exist "node_modules\" call npm install --silent
    call npm run build
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Build failed
        cd /d "%ROOT%"
        goto :pause_and_menu
    )
    cd /d "%ROOT%"
    echo [OK] Frontend build done
)
echo.

:: Python AI
call :check_port 8000
if !PORT_FOUND!==1 (
    echo [OK] Python AI already running (port 8000)
) else (
    if "%PYTHON_EXE%"=="" (
        echo [WARN] Python not found, skipping AI service
    ) else (
        echo [INFO] Starting Python AI...
        cd /d "%ROOT%backend-python"
        start "" /B "%PYTHON_EXE%" main.py --port 8000
        timeout /t 3 /nobreak >nul
        cd /d "%ROOT%"
        echo [OK] Python AI started
    )
)
echo.

:: Node.js backend
call :check_port 3000
if !PORT_FOUND!==1 (
    echo [OK] Node.js backend already running (port 3000)
) else (
    echo [INFO] Starting Node.js backend...
    cd /d "%ROOT%backend-node"
    if not exist "node_modules\" call npm install --silent
    start "" /B node server.js
    timeout /t 3 /nobreak >nul
    cd /d "%ROOT%"
    echo [OK] Node.js backend started
)

echo.
echo ============================================================
echo   All services started!
echo ============================================================
echo   Frontend:       http://localhost:3000
echo   Node.js API:    http://localhost:3000/api
echo   Python AI docs: http://localhost:8000/docs
echo ============================================================
goto :pause_and_menu

:: ============================================================
::  Function: cmd_dev (Development Mode)
:: ============================================================
:cmd_dev
cls
echo.
echo ============================================================
echo   Development Mode (Hot Reload)
echo ============================================================
echo.

echo [1/3] Starting Node.js backend (port 3000)...
cd /d "%ROOT%backend-node"
if not exist "node_modules\" call npm install --silent
start "" /B node server.js

echo [2/3] Starting Python AI (port 8000)...
cd /d "%ROOT%backend-python"
if not "%PYTHON_EXE%"=="" start "" /B "%PYTHON_EXE%" -m uvicorn main:app --reload --port 8000

echo [3/3] Starting Frontend Vite (port 5173)...
cd /d "%ROOT%ui"
if not exist "node_modules\" call npm install --silent
start "" /B npm run dev

timeout /t 5 /nobreak >nul

echo.
echo ============================================================
echo   Development Mode Active
echo ============================================================
echo   Frontend (HMR):  http://localhost:5173
echo   Node.js API:     http://localhost:3000/api
echo   Python AI docs:  http://localhost:8000/docs
echo   Login:           admin / 123456
echo ============================================================
echo.
echo   Press any key to STOP all dev servers and return to menu
echo ============================================================
pause >nul

echo.
echo Stopping dev servers...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im pythonw.exe >nul 2>&1
taskkill /f /im uvicorn.exe >nul 2>&1
echo All dev servers stopped.
cd /d "%ROOT%"
goto :menu

:: ============================================================
::  Function: cmd_stop
:: ============================================================
:cmd_stop
cls
echo.
echo ============================================================
echo   Stopping All Services
echo ============================================================
echo.

for %%p in (3000 8000 5173) do (
    call :kill_port %%p
    echo.
)
echo All services stopped.
goto :pause_and_menu

:: ============================================================
::  Function: cmd_setup (MySQL Setup)
:: ============================================================
:cmd_setup
cls
echo.
echo ============================================================
echo   MySQL Database Setup
echo ============================================================
echo.

if not exist "%MYSQL_CLI%" (
    echo [ERROR] MySQL client not found at: %MYSQL_CLI%
    goto :pause_and_menu
)

set /p MYSQL_USER="MySQL username [root]: "
if "!MYSQL_USER!"=="" set MYSQL_USER=root
set /p MYSQL_PASS="MySQL password: "

echo.
echo Testing connection...
"%MYSQL_CLI%" -u !MYSQL_USER! -p!MYSQL_PASS! -e "SELECT 1" 2>nul >nul
if !ERRORLEVEL! neq 0 (
    echo [ERROR] Cannot connect. Check username/password.
    goto :pause_and_menu
)
echo [OK] Connection successful.
echo.

echo [1/4] Creating database...
"%MYSQL_CLI%" -u !MYSQL_USER! -p!MYSQL_PASS! -e "CREATE DATABASE IF NOT EXISTS supply_chain_bi DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
echo [OK] Database ready.

echo [2/4] Building star-schema tables...
type "%ROOT%database\build_database.sql" | "%MYSQL_CLI%" -u !MYSQL_USER! -p!MYSQL_PASS! --default-character-set=utf8mb4 supply_chain_bi 2>nul
echo [OK] Star-schema tables created.

echo [3/4] Creating douyin_sales table...
type "%ROOT%database\douyin_sales.sql" | "%MYSQL_CLI%" -u !MYSQL_USER! -p!MYSQL_PASS! --default-character-set=utf8mb4 supply_chain_bi 2>nul
echo [OK] douyin_sales table created.

echo [4/4] Writing .env file...
(
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_USER=!MYSQL_USER!
echo DB_PASSWORD='!MYSQL_PASS!'
echo DB_NAME=supply_chain_bi
echo.
echo PORT=3000
echo.
echo AI_SERVICE_URL=http://localhost:8000
) > "%ROOT%backend-node\.env"
echo [OK] .env updated.

echo.
set /p IMPORT_DATA="Import CSV data? (y/n): "
if /i "!IMPORT_DATA!"=="y" (
    echo Importing CSV data...
    cd /d "%ROOT%data\scripts"
    if not "%PYTHON_EXE%"=="" "%PYTHON_EXE%" import_to_mysql.py
    cd /d "%ROOT%"
    echo [OK] Data import complete.
)

echo.
echo ============================================================
echo   Database setup complete!
echo ============================================================
goto :pause_and_menu

:: ============================================================
::  Function: cmd_build
:: ============================================================
:cmd_build
cls
echo.
echo ============================================================
echo   Build Frontend
echo ============================================================
echo.
cd /d "%ROOT%ui"
if not exist "node_modules\" call npm install --silent
call npm run build
cd /d "%ROOT%"
echo.
echo [OK] Frontend built -^> ui\dist\
goto :pause_and_menu

:: ============================================================
::  Interactive Menu
:: ============================================================
:menu
cls
echo.
echo +==========================================+
echo ^|     Supply Chain BI - Supply Chain       ^|
echo +==========================================+
echo ^|                                          ^|
echo ^|   1. Start (Production Mode)             ^|
echo ^|   2. Start (Dev Mode / HMR)              ^|
echo ^|   3. Stop All Services                   ^|
echo ^|   4. MySQL Database Setup                ^|
echo ^|   5. Build Frontend Only                 ^|
echo ^|                                          ^|
echo ^|   0. Exit                                ^|
echo ^|                                          ^|
echo +==========================================+
echo.

set "choice="
set /p choice="Select [0-5]: "

if "%choice%"=="1" goto :cmd_start
if "%choice%"=="2" goto :cmd_dev
if "%choice%"=="3" goto :cmd_stop
if "%choice%"=="4" goto :cmd_setup
if "%choice%"=="5" goto :cmd_build
if "%choice%"=="0" goto :exit

echo Invalid choice, please retry
timeout /t 1 >nul
goto :menu

:: ============================================================
::  Helpers
:: ============================================================
:check_port
set PORT_FOUND=0
netstat -ano 2>nul | findstr ":%1 " | findstr "LISTENING" >nul
if !ERRORLEVEL! equ 0 set PORT_FOUND=1
goto :eof

:kill_port
netstat -ano 2>nul | findstr ":%1 " | findstr "LISTENING" >nul
if !ERRORLEVEL! neq 0 (
    echo [OK] Port %1 - not running
    goto :eof
)
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":%1 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%p >nul 2>&1
    echo [OK] Killed PID %%p (port %1)
)
goto :eof

:pause_and_menu
echo.
pause
goto :menu

:exit
cls
echo.
echo +==========================================+
echo ^|            Goodbye!                      ^|
echo +==========================================+
echo.
exit /b 0
