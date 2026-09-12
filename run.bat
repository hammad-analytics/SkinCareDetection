@echo off
title DermAI - All Services Launcher
color 0A
echo ======================================================================
echo           Starting DermAI Skin Disease Detection System
echo ======================================================================
echo.

echo [1/3] Launching ML Service (FastAPI / HAM10000 CNN on Port 8000)...
start "DermAI - ML Service (Port 8000)" cmd /k "cd /d %~dp0ml-service && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [2/3] Launching Backend Server (Node.js / Express on Port 5000)...
start "DermAI - Backend Server (Port 5000)" cmd /k "cd /d %~dp0backend && node src/server.js"

echo [3/3] Launching Frontend UI (Vite / React on Port 5173)...
start "DermAI - Frontend UI (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ======================================================================
echo   All 3 services have been started in their own dedicated windows!
echo   - Frontend : http://localhost:5173/
echo   - Backend  : http://localhost:5000/
echo   - ML Model : http://localhost:8000/
echo ======================================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173/
echo Done! You can close this launcher window anytime.
