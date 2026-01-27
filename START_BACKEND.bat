@echo off
REM ==========================================
REM VideoSDK Backend Server Startup Script
REM ==========================================

echo.
echo 🔵 Starting VideoSDK Backend Token Server...
echo.

REM Navigate to backend folder
cd backend

REM Check if node_modules exists
if not exist "node_modules" (
    echo.
    echo ⏳ Installing dependencies...
    echo.
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo.
    echo ⚠️  WARNING: .env file not found in backend folder
    echo.
    echo Please create backend\.env with:
    echo ----------------------------------------
    echo VIDEOSDK_API_KEY=your_api_key
    echo VIDEOSDK_SECRET_KEY=your_secret_key
    echo PORT=3000
    echo ----------------------------------------
    echo.
    echo Get your credentials from: https://app.videosdk.live/settings
    echo.
    pause
    exit /b 1
)

echo.
echo 🟢 Starting server...
echo.

REM Start the server
call npm start

pause
