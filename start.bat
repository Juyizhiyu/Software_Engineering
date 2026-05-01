@echo off
echo ========================================================
echo Starting Supply Chain BI Demo...
echo ========================================================

echo [1/3] Starting Python AI Service on port 8000...
start "Python AI Service" cmd /k "cd /d %~dp0backend-python && .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

echo [2/3] Starting Node.js Backend Service on port 3000...
start "Node.js Backend Service" cmd /k "cd /d %~dp0backend-node && node server.js"

echo [3/3] Starting Vue Frontend on port 5173...
start "Vue Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ========================================================
echo All services are starting in separate windows.
echo Frontend: http://localhost:5173
echo Node.js API: http://localhost:3000
echo Python AI API: http://localhost:8000
echo ========================================================
