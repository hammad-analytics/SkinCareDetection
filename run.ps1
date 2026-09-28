Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          Starting DermAI Skin Disease Detection System               " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if first-time setup is needed on this PC
$needSetup = -not (Test-Path "$rootDir\.env") -or `
             -not (Test-Path "$rootDir\backend\node_modules") -or `
             -not (Test-Path "$rootDir\frontend\node_modules") -or `
             -not (Test-Path "$rootDir\ml-service\.venv")

if ($needSetup) {
    Write-Host "`n[INFO] First time run detected on this PC!" -ForegroundColor Yellow
    Write-Host "[INFO] Running automatic setup (installing dependencies)...`n" -ForegroundColor Yellow
    & "$rootDir\setup.bat"
    exit
}

# Create required directories if missing
New-Item -ItemType Directory -Force -Path "$rootDir\backend\uploads", "$rootDir\backend\data", "$rootDir\uploads" | Out-Null

Write-Host "`n[1/3] Launching ML Service (Port 8000)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$rootDir\ml-service`" && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

Write-Host "[2/3] Launching Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$rootDir\backend`" && node src/server.js"

Write-Host "[3/3] Launching Frontend UI (Port 5173)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$rootDir\frontend`" && npm run dev"

Write-Host "`nAll 3 services have been launched!" -ForegroundColor Green
Write-Host "Opening http://localhost:5173/ in browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173/"
