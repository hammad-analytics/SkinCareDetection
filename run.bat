@echo off
title DermAI - All Services Launcher
color 0A
echo ======================================================================
echo           Starting DermAI Skin Disease Detection System
echo ======================================================================
echo.

:: Check if first-time setup is needed on this PC
if not exist "%~dp0.env" goto :do_setup
if not exist "%~dp0backend\node_modules" goto :do_setup
if not exist "%~dp0frontend\node_modules" goto :do_setup
if not exist "%~dp0ml-service\.venv" goto :do_setup
goto :launch

:do_setup
echo [INFO] First-time setup detected on this PC.
echo [INFO] Running automatic setup and installing dependencies...
echo.
call "%~dp0setup.bat"
exit /b

:launch
:: Create required directories if missing
if not exist "%~dp0backend\uploads" mkdir "%~dp0backend\uploads"
if not exist "%~dp0backend\data" mkdir "%~dp0backend\data"
if not exist "%~dp0uploads" mkdir "%~dp0uploads"

echo [1/3] Launching ML Service - FastAPI / CNN on Port 8000...
start "DermAI - ML Service (Port 8000)" cmd /k "cd /d %~dp0ml-service && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [2/3] Launching Backend Server - Node.js / Express on Port 5000...
start "DermAI - Backend Server (Port 5000)" cmd /k "cd /d %~dp0backend && node src/server.js"

echo [3/3] Launching Frontend UI - Vite / React on Port 5173...
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
ping 127.0.0.1 -n 4 >nul
start http://localhost:5173/
echo Done! You can close this launcher window anytime.
