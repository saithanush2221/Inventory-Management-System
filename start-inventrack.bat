@echo off
title InvenTrack Launcher
color 0B

echo ===================================================
echo        Starting InvenTrack Management System
echo ===================================================
echo.

echo [1/3] Starting the Node.js Backend Server...
start "InvenTrack Backend API" cmd /c "cd backend && npm run dev"
echo Backend initializing on port 4000...
echo.

echo [2/3] Starting the Next.js Frontend Server...
start "InvenTrack Frontend UI" cmd /c "cd frontend && npm run dev"
echo Frontend initializing on port 3000...
echo.

echo [3/3] Waiting for servers to warm up...
timeout /t 6 /nobreak > NUL

echo Launching application in your default web browser...
start http://localhost:3000

echo.
echo ===================================================
echo                 SYSTEM IS LIVE!
echo ===================================================
echo - The backend terminal is running in a separate window.
echo - The frontend terminal is running in a separate window.
echo - To STOP the system, simply close those two terminal windows.
echo.
pause
