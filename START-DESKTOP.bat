@echo off
title ChiroClickCRM v2.0.0 - Desktop Edition
color 0A

echo.
echo  ============================================
echo   ChiroClickCRM v2.0.0 - Standalone Desktop
echo  ============================================
echo.

REM Get the directory where this script is located
set "ROOT=%~dp0"

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

echo  [OK] Node.js found
for /f "tokens=*" %%i in ('node -v') do echo       Version: %%i

REM Check if backend dependencies are installed
if not exist "%ROOT%backend\node_modules" (
    echo.
    echo  Installing backend dependencies...
    cd /d "%ROOT%backend"
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% NEQ 0 (
        echo  [ERROR] Backend install failed
        pause
        exit /b 1
    )
)

REM Check if frontend dependencies are installed
if not exist "%ROOT%frontend\node_modules" (
    echo.
    echo  Installing frontend dependencies...
    cd /d "%ROOT%frontend"
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% NEQ 0 (
        echo  [ERROR] Frontend install failed
        pause
        exit /b 1
    )
)

REM Check if .env exists, create from example if not
if not exist "%ROOT%backend\.env" (
    echo.
    echo  Creating default .env from .env.example...
    copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul
    echo  [OK] .env created - edit backend\.env to customize
)

REM Check Ollama (optional)
echo.
where ollama >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Ollama found - AI features available
    ollama list 2>nul | findstr /i "chiro" >nul
    if %ERRORLEVEL% EQU 0 (
        echo       ChiroClick AI models detected
    ) else (
        echo       No ChiroClick models found. Run: cd ai-training ^&^& build-model.bat
    )
) else (
    echo  [--] Ollama not found - AI features disabled
    echo       Install from https://ollama.ai for AI clinical assistant
)

echo.
echo  Starting ChiroClickCRM...
echo  ============================================
echo.
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5173
echo  Health:   http://localhost:3000/health
echo.
echo  Press Ctrl+C to stop.
echo.

REM Start backend in background
cd /d "%ROOT%"
start "ChiroClickCRM Backend" /min cmd /c "cd /d "%ROOT%backend" && node src/server.js"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend (foreground)
cd /d "%ROOT%frontend"
call npm run dev

REM If frontend exits, kill backend
taskkill /fi "WINDOWTITLE eq ChiroClickCRM Backend" /f >nul 2>&1
