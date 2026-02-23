@echo off
title ChiroClick CRM - Installasjon
color 0B
setlocal enabledelayedexpansion

echo.
echo  =====================================================
echo   ChiroClick CRM - Installasjon (Installation)
echo  =====================================================
echo.
echo   Dette skriptet setter opp alt du trenger.
echo   (This script sets up everything you need.)
echo.
echo  -----------------------------------------------------
echo.

:: =========================================================================
:: Step 1: Check Node.js
:: =========================================================================
echo  [1/6] Sjekker Node.js... (Checking Node.js...)
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo   FEIL: Node.js ble ikke funnet!
    echo   (ERROR: Node.js was not found!)
    echo.
    echo   Last ned Node.js v18+ fra:
    echo   (Download Node.js v18+ from:)
    echo.
    echo     https://nodejs.org/en/download
    echo.
    echo   Velg "LTS" versjonen og installer.
    echo   (Choose the "LTS" version and install.)
    echo   Start dette skriptet pa nytt etterpaa.
    echo   (Restart this script afterwards.)
    echo.
    pause
    exit /b 1
)

:: Get Node.js version and check if v18+
for /f "tokens=1 delims=v" %%a in ('node --version 2^>nul') do set "NODE_RAW=%%a"
for /f "tokens=1 delims=." %%a in ('node --version 2^>nul') do set "NODE_VER=%%a"
set "NODE_VER=%NODE_VER:v=%"

echo         Funnet: Node.js %NODE_RAW%
if %NODE_VER% lss 18 (
    color 0C
    echo.
    echo   FEIL: Node.js v18+ er paakrevd, du har v%NODE_VER%.
    echo   (ERROR: Node.js v18+ is required, you have v%NODE_VER%.)
    echo.
    echo   Last ned nyeste LTS fra: https://nodejs.org/en/download
    echo   (Download the latest LTS from: https://nodejs.org/en/download)
    echo.
    pause
    exit /b 1
)
echo         OK!
echo.

:: =========================================================================
:: Step 2: Install backend dependencies
:: =========================================================================
echo  [2/6] Installerer backend-avhengigheter... (Installing backend dependencies...)
echo         Dette kan ta noen minutter...
echo         (This may take a few minutes...)
echo.

pushd "%~dp0backend"
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo   FEIL: Backend npm install feilet!
    echo   (ERROR: Backend npm install failed!)
    echo   Sjekk feilmeldingene over.
    echo   (Check the error messages above.)
    echo.
    popd
    pause
    exit /b 1
)
popd

echo.
echo         Backend-avhengigheter installert!
echo         (Backend dependencies installed!)
echo.

:: =========================================================================
:: Step 3: Install frontend dependencies
:: =========================================================================
echo  [3/6] Installerer frontend-avhengigheter... (Installing frontend dependencies...)
echo         Dette kan ta noen minutter...
echo         (This may take a few minutes...)
echo.

pushd "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo   FEIL: Frontend npm install feilet!
    echo   (ERROR: Frontend npm install failed!)
    echo   Sjekk feilmeldingene over.
    echo   (Check the error messages above.)
    echo.
    popd
    pause
    exit /b 1
)
popd

echo.
echo         Frontend-avhengigheter installert!
echo         (Frontend dependencies installed!)
echo.

:: =========================================================================
:: Step 4: Create .env from template
:: =========================================================================
echo  [4/6] Sjekker miljoevariabler... (Checking environment config...)
echo.

if exist "%~dp0backend\.env" (
    echo         backend\.env finnes allerede - hopper over.
    echo         (backend\.env already exists - skipping.)
) else (
    if exist "%~dp0backend\.env.example" (
        copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
        echo         Opprettet backend\.env fra .env.example
        echo         (Created backend\.env from .env.example)
        echo.
        echo         VIKTIG: Rediger backend\.env for aa endre passord/hemmeligheter.
        echo         (IMPORTANT: Edit backend\.env to change passwords/secrets.)
        echo         Standard innstillinger fungerer for lokal testing.
        echo         (Default settings work for local testing.)
    ) else (
        color 0E
        echo         ADVARSEL: backend\.env.example ble ikke funnet!
        echo         (WARNING: backend\.env.example was not found!)
        echo         Du maa opprette backend\.env manuelt.
        echo         (You must create backend\.env manually.)
    )
)
echo.

:: =========================================================================
:: Step 5: Create data directories
:: =========================================================================
echo  [5/6] Oppretter datamapper... (Creating data directories...)
echo.

if not exist "%~dp0data\pglite" (
    mkdir "%~dp0data\pglite"
    echo         Opprettet data\pglite\ (embedded database)
) else (
    echo         data\pglite\ finnes allerede
)

if not exist "%~dp0data\ollama" (
    mkdir "%~dp0data\ollama"
    echo         Opprettet data\ollama\ (AI-modeller / AI models)
) else (
    echo         data\ollama\ finnes allerede
)

if not exist "%~dp0data\backups" (
    mkdir "%~dp0data\backups"
    echo         Opprettet data\backups\
) else (
    echo         data\backups\ finnes allerede
)

if not exist "%~dp0data\uploads" (
    mkdir "%~dp0data\uploads"
    echo         Opprettet data\uploads\
) else (
    echo         data\uploads\ finnes allerede
)

if not exist "%~dp0data\exports" (
    mkdir "%~dp0data\exports"
    echo         Opprettet data\exports\
) else (
    echo         data\exports\ finnes allerede
)

if not exist "%~dp0data\logs" (
    mkdir "%~dp0data\logs"
    echo         Opprettet data\logs\
) else (
    echo         data\logs\ finnes allerede
)

if not exist "%~dp0data\temp" (
    mkdir "%~dp0data\temp"
    echo         Opprettet data\temp\
) else (
    echo         data\temp\ finnes allerede
)
echo.

:: =========================================================================
:: Step 6: Check Ollama (optional AI)
:: =========================================================================
echo  [6/6] Sjekker Ollama AI (valgfritt)... (Checking Ollama AI (optional)...)
echo.

set "OLLAMA_STATUS=IKKE FUNNET"
set "OLLAMA_MODELS_COUNT=0"

where ollama >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%a in ('ollama --version 2^>nul') do set "OLLAMA_VER=%%a"
    echo         Funnet: !OLLAMA_VER!
    set "OLLAMA_STATUS=INSTALLERT"
) else (
    echo         Ollama ble ikke funnet - AI-funksjoner er deaktivert.
    echo         (Ollama not found - AI features are disabled.)
    echo.
    echo         For AI-stotte, last ned Ollama fra:
    echo         (For AI support, download Ollama from:)
    echo           https://ollama.ai
    echo.
    echo         ChiroClick fungerer fint uten AI ogsaa!
    echo         (ChiroClick works fine without AI too!)
)

:: Check portable models
echo.
if exist "%~dp0data\ollama\manifests" (
    set /a MODEL_COUNT=0
    for /d %%d in ("%~dp0data\ollama\manifests\registry.ollama.ai\library\*") do (
        set /a MODEL_COUNT+=1
    )
    if !MODEL_COUNT! gtr 0 (
        echo         Fant !MODEL_COUNT! portable AI-modell(er) i data\ollama\
        echo         (Found !MODEL_COUNT! portable AI model(s) in data\ollama\)
        set "OLLAMA_MODELS_COUNT=!MODEL_COUNT!"
    ) else (
        echo         Ingen portable modeller funnet i data\ollama\
        echo         (No portable models found in data\ollama\)
    )
) else (
    echo         Ingen portable modeller funnet. AI bruker sky eller er deaktivert.
    echo         (No portable models found. AI will use cloud or be disabled.)
)

:: =========================================================================
:: Summary
:: =========================================================================
echo.
echo.
echo  =====================================================
echo   Installasjon fullfoert! (Installation Complete!)
echo  =====================================================
echo.
echo   Sammendrag (Summary):
echo   ---------------------
echo     Node.js:           v%NODE_VER% OK
echo     Backend:           Installert (Installed)
echo     Frontend:          Installert (Installed)
if exist "%~dp0backend\.env" (
echo     Miljoevariabler:   backend\.env OK
) else (
echo     Miljoevariabler:   MANGLER backend\.env
)
echo     Datamapper:        OK
echo     Ollama AI:         !OLLAMA_STATUS!
if !OLLAMA_MODELS_COUNT! gtr 0 (
echo     AI-modeller:       !OLLAMA_MODELS_COUNT! portable modell(er)
)
echo.
echo   -------------------------------------------------
echo   For aa starte ChiroClick CRM, kjoer:
echo   (To start ChiroClick CRM, run:)
echo.
echo     START-CHIROCLICK.bat
echo.
echo   Innlogging (Login):
echo     E-post:  admin@chiroclickcrm.no
echo     Passord: admin123
echo.
echo   -------------------------------------------------
echo.

endlocal
pause
