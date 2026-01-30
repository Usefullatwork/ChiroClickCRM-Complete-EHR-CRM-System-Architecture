@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   ChiroClick - Setup Ollama Models from USB/Project Folder
echo   Kopierer AI-modeller til lokal Ollama-installasjon
echo ============================================================
echo.

set "SOURCE_DIR=%~dp0..\ollama-models"
set "DEST_DIR=%USERPROFILE%\.ollama\models"

REM Check if source exists
if not exist "%SOURCE_DIR%" (
    echo FEIL: Kan ikke finne ollama-models mappen.
    echo Forventet: %SOURCE_DIR%
    echo.
    echo Har du kjort backup-models.bat for a eksportere modellene?
    exit /b 1
)

REM Check if Ollama is installed
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo FEIL: Ollama er ikke installert.
    echo Last ned fra: https://ollama.ai/download
    echo.
    pause
    exit /b 1
)

REM Create destination if needed
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"

echo Kilde:      %SOURCE_DIR%
echo Destinasjon: %DEST_DIR%
echo.
echo Dette vil kopiere alle ChiroClick AI-modeller til din Ollama-installasjon.
echo Storrelse: ca. 30 GB
echo.

set /p CONFIRM="Vil du fortsette? (J/N): "
if /i not "%CONFIRM%"=="J" (
    echo Avbrutt.
    exit /b 0
)

echo.
echo Kopierer modeller... (dette kan ta noen minutter)
echo.

xcopy "%SOURCE_DIR%" "%DEST_DIR%" /E /I /H /Y

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   SUKSESS! Modeller er kopiert.
    echo ============================================================
    echo.
    echo Verifiserer modeller...
    ollama list | findstr chiro
    echo.
    echo Hvis modellene ikke vises, start Ollama pa nytt:
    echo   1. Lukk Ollama (system tray)
    echo   2. Start Ollama igjen
    echo   3. Kjor: ollama list
) else (
    echo.
    echo FEIL: Noe gikk galt under kopiering.
    echo Sjekk at du har nok diskplass og skriverettigheter.
)

echo.
pause
endlocal
