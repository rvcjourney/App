#!/usr/bin/env pwsh
<#
==========================================
VideoSDK Backend Server Startup Script
==========================================
#>

Write-Host "`n🔵 Starting VideoSDK Backend Token Server...`n" -ForegroundColor Cyan

# Navigate to backend folder
Set-Location backend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "`n⏳ Installing dependencies...`n" -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "`n⚠️  WARNING: .env file not found in backend folder`n" -ForegroundColor Yellow
    Write-Host "Please create backend\.env with:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "VIDEOSDK_API_KEY=your_api_key" -ForegroundColor Gray
    Write-Host "VIDEOSDK_SECRET_KEY=your_secret_key" -ForegroundColor Gray
    Write-Host "PORT=3000" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Get your credentials from: https://app.videosdk.live/settings" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n🟢 Starting server...`n" -ForegroundColor Green

# Start the server
npm start

Read-Host "`nPress Enter to exit"
