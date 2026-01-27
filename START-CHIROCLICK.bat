@echo off
title ChiroClick CRM - Starting...
color 0A
setlocal enabledelayedexpansion

echo.
echo  ========================================
echo   ChiroClick CRM - Starting Application
echo  ========================================
echo.

:: Ask user if they want to load AI models
echo  AI Models require ~4-14GB RAM and slow startup.
echo.
echo  [A] Start with AI (full features)
echo  [S] Skip AI (faster startup, no AI features)
echo.
choice /C AS /N /M "  Choose option [A/S]: "
if errorlevel 2 goto SKIP_AI
if errorlevel 1 goto WITH_AI

:WITH_AI
set AI_MODE=enabled
echo.
echo  Starting with AI enabled...

:: Update .env to enable AI
powershell -Command "(Get-Content 'C:\Users\MadsF\ChiroClickCRM\backend\.env') -replace '^AI_ENABLED=.*', 'AI_ENABLED=true' | Set-Content 'C:\Users\MadsF\ChiroClickCRM\backend\.env'"

:: Check if Ollama is running
echo [1/5] Checking Ollama AI...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       Ollama is already running
) else (
    echo       Starting Ollama...
    start "" ollama serve
    timeout /t 3 /nobreak >nul
)

:: Check if chiro models exist, build if missing
echo [2/5] Checking AI models...
set "MODELS_MISSING=0"
set "MODELS_FOUND=0"

for %%M in (chiro-no chiro-fast chiro-norwegian chiro-medical) do (
    ollama list 2>nul | findstr /i "%%M" >nul 2>nul
    if !errorlevel! equ 0 (
        echo       %%M - OK
        set /a MODELS_FOUND+=1
    ) else (
        echo       %%M - MANGLER
        set /a MODELS_MISSING+=1
    )
)

if !MODELS_MISSING! gtr 0 (
    echo.
    echo  %MODELS_MISSING% modell(er) mangler. Bygger automatisk...
    echo.

    REM Try restore from backup first
    if exist "C:\Users\MadsF\ChiroClickCRM\ai-training\models-cache" (
        echo  Prøver å gjenopprette fra backup...
        call "C:\Users\MadsF\ChiroClickCRM\scripts\restore-models.bat"
    ) else (
        REM Build from Modelfiles (will pull base models if needed)
        echo  Bygger modeller fra Modelfiles...
        pushd "C:\Users\MadsF\ChiroClickCRM\ai-training"
        call build-model.bat
        popd
    )
    echo.
) else (
    echo       Alle 4 modeller funnet!
)

goto START_BACKEND

:SKIP_AI
set AI_MODE=disabled
echo.
echo  Starting WITHOUT AI (faster startup)...

:: Update .env to disable AI
powershell -Command "(Get-Content 'C:\Users\MadsF\ChiroClickCRM\backend\.env') -replace '^AI_ENABLED=.*', 'AI_ENABLED=false' | Set-Content 'C:\Users\MadsF\ChiroClickCRM\backend\.env'"

echo [1/4] Skipping Ollama AI (disabled)
goto START_BACKEND

:START_BACKEND
:: Start Backend
echo.
if "%AI_MODE%"=="enabled" (
    echo [3/5] Starting Backend Server...
) else (
    echo [2/4] Starting Backend Server...
)
cd /d "C:\Users\MadsF\ChiroClickCRM\backend"
start "ChiroClick Backend" cmd /k "npm start"
timeout /t 5 /nobreak >nul

:: Start Frontend
echo.
if "%AI_MODE%"=="enabled" (
    echo [4/5] Starting Frontend...
) else (
    echo [3/4] Starting Frontend...
)
cd /d "C:\Users\MadsF\ChiroClickCRM\frontend"
start "ChiroClick Frontend" cmd /k "npm run dev"
timeout /t 8 /nobreak >nul

:: Open Browser
echo.
if "%AI_MODE%"=="enabled" (
    echo [5/5] Opening Browser...
) else (
    echo [4/4] Opening Browser...
)
start msedge "http://localhost:5173"

echo.
echo  ========================================
echo   ChiroClick CRM is now running!
echo  ========================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
if "%AI_MODE%"=="disabled" (
    echo   AI Model: DISABLED (Skip mode)
) else (
    echo   AI Models: chiro-no, chiro-fast, chiro-norwegian, chiro-medical
)
echo.
echo   To stop: Close the terminal windows
echo.
endlocal
pause
