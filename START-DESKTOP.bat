@echo off
title ChiroClickCRM Desktop
echo ========================================
echo   ChiroClickCRM - Standalone Desktop
echo ========================================
echo.

:: Check for Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exist
if not exist "desktop\node_modules" (
    echo Installing desktop dependencies...
    cd desktop
    call npm install
    cd ..
)

if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install --legacy-peer-deps
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

:: Build frontend if dist doesn't exist
if not exist "frontend\dist" (
    echo Building frontend...
    cd frontend
    call npm run build
    cd ..
)

echo.
echo Starting ChiroClickCRM Desktop...
echo.
cd desktop
call npx electron main.js
