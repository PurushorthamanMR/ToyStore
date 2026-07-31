@echo off
title City Cycle Stores - Frontend
cd /d "%~dp0frontend"

if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo Failed to install frontend dependencies.
        pause
        exit /b 1
    )
)

echo.
echo Starting City Cycle Stores frontend on http://localhost:5173
echo.
call npm run dev

pause
