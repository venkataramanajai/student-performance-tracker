@echo off
title EduPulse - Student Performance Tracker
color 0A

echo.
echo  =====================================================
echo    EduPulse - Student Performance Tracker
echo    Starting server on http://localhost:3000
echo  =====================================================
echo.

:: Navigate to project directory (same folder as this batch file)
cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules\" (
  echo  [INFO] Installing dependencies...
  npm install
  echo.
)

echo  [INFO] Starting server...
echo  [INFO] Open your browser at: http://localhost:3000
echo  [INFO] Press Ctrl+C to stop the server.
echo.

:: Open browser after 2 seconds (in background)
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start the Node.js server
npm start

pause
