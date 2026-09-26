@echo off
title DermAI - First Time Setup + Run
color 0A
echo.
echo ======================================================================
echo     DermAI Skin Disease Detection - FULL SETUP (New PC / First Run)
echo ======================================================================
echo.
echo  This script will:
echo   [1] Install Node.js dependencies (backend + frontend)
echo   [2] Create Python virtual environment + install ML packages
echo   [3] Create .env config file (if missing)
echo   [4] Start all 3 services
echo.
echo  Requirements: Node.js (v18+) and Python (3.10+) must be installed.
echo ======================================================================
echo.
pause

:: ---- Step 1: Check Node.js ----
echo.
echo [STEP 1/5] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install from https://nodejs.org/
    echo         Download LTS version, install it, restart this script.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo   Node.js version: %%v
echo   OK!

:: ---- Step 2: Check Python ----
echo.
echo [STEP 2/5] Checking Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install from https://python.org/
    echo         Download 3.10+, check "Add to PATH", restart this script.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version') do echo   %%v
echo   OK!

:: ---- Step 3: Install Node dependencies ----
echo.
echo [STEP 3/5] Installing Node.js dependencies...
echo   [3a] Root project (concurrently)...
cd /d %~dp0
call npm install
if %errorlevel% neq 0 (
    echo [WARNING] Root npm install had issues, continuing...
)

echo.
echo   [3b] Backend dependencies...
cd /d %~dp0backend
call npm install
if %errorlevel% neq 0 (
    echo [WARNING] Backend npm install had issues, continuing...
)

echo.
echo   [3c] Frontend dependencies...
cd /d %~dp0frontend
call npm install
if %errorlevel% neq 0 (
    echo [WARNING] Frontend npm install had issues, continuing...
)

:: ---- Step 4: Setup Python Virtual Environment ----
echo.
echo [STEP 4/5] Setting up Python ML Service...
cd /d %~dp0ml-service

if not exist ".venv" (
    echo   Creating Python virtual environment...
    python -m venv .venv
    echo   Virtual environment created!
) else (
    echo   Virtual environment already exists.
)

echo   Installing Python packages (tensorflow, fastapi, etc.)...
.venv\Scripts\pip.exe install --quiet --upgrade pip
.venv\Scripts\pip.exe install --quiet -r requirements.txt
echo   Python packages installed!

:: ---- Step 5: Create .env if missing ----
echo.
echo [STEP 5/5] Checking .env configuration...
cd /d %~dp0

if not exist ".env" (
    echo   Creating .env file with default settings...
    (
        echo APP_ENV=development
        echo BACKEND_PORT=5000
        echo FRONTEND_ORIGIN=http://localhost:5173
        echo MONGODB_URI=mongodb://localhost:27017/skincare_detection
        echo JWT_SECRET=dermai-dev-secret-change-in-production
        echo JWT_EXPIRES_IN=7d
        echo ML_SERVICE_URL=http://localhost:8000
        echo OLLAMA_BASE_URL=http://localhost:11434
        echo OLLAMA_MODEL=qwen3:8b
        echo LLM_PROVIDER=gemini
        echo GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
        echo GEMINI_MODEL=gemini-3.6-flash
        echo UPLOAD_DIR=uploads
        echo MAX_UPLOAD_SIZE=10485760
        echo RAG_DATABASE=./rag/knowledge
        echo CONFIDENCE_THRESHOLD=0.55
    ) > .env
    echo.
    echo   ============================================================
    echo   [IMPORTANT] .env file created with placeholder API key!
    echo   To enable AI Chatbot, edit .env and replace:
    echo     GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    echo   with your real Google Gemini API key from:
    echo     https://aistudio.google.com/apikey
    echo   ============================================================
    echo.
    pause
) else (
    echo   .env file already exists. OK!
)

:: ---- Step 6: Create required directories ----
if not exist "backend\uploads" mkdir backend\uploads
if not exist "backend\data" mkdir backend\data

:: ---- Launch all services ----
echo.
echo ======================================================================
echo   SETUP COMPLETE! Now starting all 3 services...
echo ======================================================================
echo.

start "DermAI - ML Service (Port 8000)" cmd /k "cd /d %~dp0ml-service && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
start "DermAI - Backend Server (Port 5000)" cmd /k "cd /d %~dp0backend && node src/server.js"
start "DermAI - Frontend UI (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ======================================================================
echo   All 3 services started!
echo   - Frontend : http://localhost:5173/
echo   - Backend  : http://localhost:5000/
echo   - ML Model : http://localhost:8000/
echo ======================================================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5173/
echo.
echo Setup and launch complete! You can close this window.
pause
