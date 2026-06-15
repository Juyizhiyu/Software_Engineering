@echo off
chcp 65001 >nul

set "PROJECT_DIR=%~dp0"

echo =========================================
echo   Supply Chain BI System - Starting...
echo =========================================

echo [1/3] Starting Node.js Backend (Port 3000)...
cd /d "%PROJECT_DIR%backend-node"
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)
start "Node.js Backend" cmd /k "node server.js"

echo [2/3] Starting Python AI Backend (Port 8000)...
cd /d "%PROJECT_DIR%backend-python"
start "Python AI Backend" cmd /k "uv run uvicorn main:app --reload --port 8000"

echo [3/3] Starting Frontend (Port 5173)...
cd /d "%PROJECT_DIR%ui"
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)
start "Frontend" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo =========================================
echo   All Services Started!
echo =========================================
echo   Frontend:       http://localhost:5173
echo   Node Backend:   http://localhost:3000
echo   Python Backend: http://localhost:8000
echo   Login:          admin / 123456
echo =========================================
echo   Press any key to stop all services
echo =========================================

pause >nul

echo.
echo Stopping all services...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im pythonw.exe >nul 2>&1
taskkill /f /im uvicorn.exe >nul 2>&1

echo All services stopped.
