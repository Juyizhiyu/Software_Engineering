@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: Supply Chain BI - Start All Services
:: ============================================================

set "ROOT=%~dp0"
set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
set "MYSQL_CLI=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
set "MYSQL_DATA=%USERPROFILE%\mysql-data"
set "PYTHON_EXE=D:\Users\13937\anaconda3\python.exe"

echo ============================================================
echo   Supply Chain BI - Starting...
echo ============================================================
echo.

:: ============ 1. MySQL ============
call :check_port 3306
if !PORT_FOUND!==1 (
    echo [OK] MySQL already running (port 3306)
) else (
    echo [INFO] Starting MySQL...

    if not exist "%MYSQL_BIN%" (
        echo [ERROR] mysqld.exe not found
        echo         Path: %MYSQL_BIN%
        goto :error
    )

    if not exist "%MYSQL_DATA%\" (
        echo [INFO] Initializing MySQL data directory...
        "%MYSQL_BIN%" --initialize-insecure --datadir="%MYSQL_DATA%" --console
    )

    start "MySQL" /B "%MYSQL_BIN%" --standalone --datadir="%MYSQL_DATA%" --port=3306
    timeout /t 4 /nobreak >nul

    call :wait_mysql
    if !ERRORLEVEL! neq 0 goto :error
    echo [OK] MySQL ready (port 3306)
)
echo.

:: ============ 2. Frontend Build ============
if exist "%ROOT%ui\dist\" (
    echo [OK] Frontend dist exists, skip build
) else (
    echo [INFO] Building frontend...
    cd /d "%ROOT%ui"
    if not exist "node_modules\" call npm install --silent
    call npm run build
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Frontend build failed
        goto :error
    )
    echo [OK] Frontend build done
)
cd /d "%ROOT%"
echo.

:: ============ 3. Python AI ============
call :check_port 8000
if !PORT_FOUND!==1 (
    echo [OK] Python AI already running (port 8000)
) else (
    echo [INFO] Starting Python AI service...
    cd /d "%ROOT%backend-python"

    if exist "%PYTHON_EXE%" (
        start "PythonAI" /B "%PYTHON_EXE%" -m uvicorn main:app --port 8000
    ) else (
        start "PythonAI" /B python -m uvicorn main:app --port 8000
    )
    timeout /t 3 /nobreak >nul

    call :check_port 8000
    if !PORT_FOUND!==1 (
        echo [OK] Python AI ready (port 8000)
    ) else (
        echo [ERROR] Python AI failed to start
    )
)
cd /d "%ROOT%"
echo.

:: ============ 4. Node.js Backend ============
call :check_port 3000
if !PORT_FOUND!==1 (
    echo [OK] Node.js backend already running (port 3000)
) else (
    echo [INFO] Starting Node.js backend...
    cd /d "%ROOT%backend-node"

    if not exist "node_modules\" (
        echo [INFO] Installing backend dependencies...
        call npm install --silent
    )

    start "NodeServer" /B node server.js
    timeout /t 3 /nobreak >nul

    call :check_port 3000
    if !PORT_FOUND!==1 (
        echo [OK] Node.js backend ready (port 3000)
    ) else (
        echo [ERROR] Node.js backend failed to start
    )
)
cd /d "%ROOT%"

:: ===================== Done =====================
echo.
echo ============================================================
echo   All services started!
echo ============================================================
echo.
echo   Frontend:       http://localhost:3000
echo   Node.js API:    http://localhost:3000/api
echo   Health check:   http://localhost:3000/api/health
echo   Python AI docs: http://localhost:8000/docs
echo.
echo   Run stop.bat to stop all services
echo.
pause
goto :eof

:: ============ Subroutines ============

:check_port
rem Check if port is in use. Sets PORT_FOUND=1 if yes, 0 if no.
set PORT_FOUND=0
netstat -ano 2>nul | findstr ":%1 " | findstr "LISTENING" >nul
if !ERRORLEVEL! equ 0 set PORT_FOUND=1
goto :eof

:wait_mysql
rem Wait up to 15s for MySQL to be ready
for /L %%i in (1,1,15) do (
    "%MYSQL_CLI%" -u root -p123456 -e "SELECT 1" 2>nul >nul
    if !ERRORLEVEL! equ 0 goto :eof
    timeout /t 1 /nobreak >nul
)
rem Try first-time password setup
"%MYSQL_CLI%" -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '123456'; FLUSH PRIVILEGES;" 2>nul
timeout /t 1 /nobreak >nul
"%MYSQL_CLI%" -u root -p123456 -e "SELECT 1" 2>nul >nul
if !ERRORLEVEL! neq 0 (
    echo [ERROR] MySQL startup failed
    exit /b 1
)
goto :eof

:error
cd /d "%ROOT%"
echo.
echo ============================================================
echo   Startup FAILED - check messages above
echo ============================================================
pause
exit /b 1
