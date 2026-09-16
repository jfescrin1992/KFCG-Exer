@echo off
TITLE KFCG ExerFit Auto Setup
echo ======================================================
echo   KFCG EXERFIT - AUTOMATED LOCAL SETUP
echo ======================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js (v18, v20 or v22+) from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Checking and installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install encountered an error.
    pause
    exit /b 1
)

echo.
echo [2/3] Running Automated Environment & Database Provisioning...
node scripts/setup.js

echo.
echo [3/3] Launching KFCG ExerFit Application...
echo The application will open on http://localhost:3000
start http://localhost:3000
npm run dev
pause
