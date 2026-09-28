@echo off
title DermAI - First Time Setup + Run
color 0A
echo.
echo ======================================================================
echo     DermAI Skin Disease Detection - AUTOMATED SETUP & LAUNCHER
echo ======================================================================
echo.
echo  Requirements: Node.js (v18+) and Python (3.10+) must be installed.
echo  Starting automated setup...
echo ======================================================================
echo.

:: ---- Step 1: Check Node.js ----
echo [STEP 1/5] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js (LTS) from https://nodejs.org/
    echo         After installing, reopen terminal and run this command again.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo   Node.js version: %%v - OK!

:: ---- Step 2: Check Python ----
echo.
echo [STEP 2/5] Checking Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python (3.10+) from https://python.org/
    echo         Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version') do echo   Python version: %%v - OK!

:: ---- Step 3: Setup .env file ----
echo.
echo [STEP 3/5] Checking environment configuration (.env)...
cd /d %~dp0
if not exist ".env" (
    if exist ".env.example" (
        copy /y ".env.example" ".env" >nul
        echo   Created .env from .env.example with pre-configured settings!
    ) else (
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
        echo   Created default .env file!
    )
) else (
    echo   .env file already exists - OK!
)

:: Create required directories
if not exist "backend\uploads" mkdir backend\uploads
if not exist "backend\data" mkdir backend\data
if not exist "uploads" mkdir uploads

:: ---- Step 4: Install Node Dependencies ----
echo.
echo [STEP 4/5] Installing Node.js dependencies...

if not exist "%~dp0node_modules" (
    echo   [4a] Installing root dependencies (concurrently)...
    cd /d %~dp0
    call npm install
) else (
    echo   [4a] Root dependencies already installed - OK!
)

if not exist "%~dp0backend\node_modules" (
    echo   [4b] Installing backend dependencies...
    cd /d %~dp0backend
    call npm install
) else (
    echo   [4b] Backend dependencies already installed - OK!
)

if not exist "%~dp0frontend\node_modules" (
    echo   [4c] Installing frontend dependencies...
    cd /d %~dp0frontend
    call npm install
) else (
    echo   [4c] Frontend dependencies already installed - OK!
)

:: ---- Step 5: Setup Python Virtual Environment ----
echo.
echo [STEP 5/5] Setting up Python ML Service...
cd /d %~dp0ml-service

if not exist ".venv" (
    echo   Creating Python virtual environment (.venv)...
    python -m venv .venv
    echo   Upgrading pip and installing ML packages...
    .venv\Scripts\pip.exe install --quiet --upgrade pip
    .venv\Scripts\pip.exe install --quiet -r requirements.txt
    echo   ML packages installed successfully!
) else (
    echo   Python virtual environment already exists - OK!
)

:: ---- Launch all 3 services ----
echo.
echo ======================================================================
echo   SETUP COMPLETE! Starting all 3 services...
echo ======================================================================
echo.

start "DermAI - ML Service (Port 8000)" cmd /k "cd /d %~dp0ml-service && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
start "DermAI - Backend Server (Port 5000)" cmd /k "cd /d %~dp0backend && node src/server.js"
start "DermAI - Frontend UI (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ======================================================================
echo   All 3 services have been launched in dedicated windows!
echo   - Frontend : http://localhost:5173/
echo   - Backend  : http://localhost:5000/
echo   - ML Model : http://localhost:8000/
echo ======================================================================
echo.
echo Opening browser in 4 seconds...
timeout /t 4 /nobreak >nul
start http://localhost:5173/
echo.
echo DermAI is now running! You can minimize or close this setup window.
