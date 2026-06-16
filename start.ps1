# EduPulse - Student Performance Tracker Launcher
# Run this script in PowerShell to start the project

$Host.UI.RawUI.WindowTitle = "EduPulse - Student Performance Tracker"

Write-Host ""
Write-Host "  =====================================================" -ForegroundColor Cyan
Write-Host "    EduPulse - Student Performance Tracker" -ForegroundColor Cyan
Write-Host "    Starting server on http://localhost:3000" -ForegroundColor Cyan
Write-Host "  =====================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to script directory
Set-Location -Path $PSScriptRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "  [INFO] Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "  [INFO] Starting server..." -ForegroundColor Green
Write-Host "  [INFO] Open your browser at: http://localhost:3000" -ForegroundColor Green
Write-Host "  [INFO] Press Ctrl+C to stop the server." -ForegroundColor Green
Write-Host ""

# Open browser after 2 seconds (in background)
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000"
} | Out-Null

# Start the Node.js server
npm start
