@echo off
echo ========================================================
echo Starting Supply Chain BI Demo...
echo ========================================================

echo [1/3] Building frontend...
cd /d %~dp0frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b %ERRORLEVEL%
)
cd /d %~dp0

echo [2/3] Starting Python AI Service on port 8000...
start "Python AI Service" cmd /k "call D:\Users\13937\anaconda3\Scripts\activate.bat && cd /d %~dp0backend-python && python -m uvicorn main:app --reload --port 8000"

echo [3/3] Starting Node.js Backend + Frontend on port 3000...
start "Node.js Server" cmd /k "cd /d %~dp0backend-node && node server.js"

echo ========================================================
echo All services are starting in separate windows.
echo Frontend: http://localhost:3000
echo Node.js API: http://localhost:3000/api
echo Python AI API: http://localhost:8000
echo ========================================================
pause
