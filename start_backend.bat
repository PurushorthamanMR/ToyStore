@echo off
title City Cycle Stores - Backend
cd /d "%~dp0backend"

if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo Failed to install backend dependencies.
        pause
        exit /b 1
    )
)

echo.
echo Starting City Cycle Stores backend on http://localhost:5000
echo.
call npm start

pause
