@echo off
title ChiroClick CRM - Lag Ren Kopi (Create Clean Copy)
color 0B
setlocal enabledelayedexpansion

echo.
echo  =====================================================
echo   ChiroClick CRM - Lag Ren Kopi (Create Clean Copy)
echo  =====================================================
echo.
echo   Lager en distribuerbar kopi UTEN:
echo   (Creates a distributable copy WITHOUT:)
echo     - Pasientdata (patient database)
echo     - node_modules (reinstalleres av INSTALL.bat)
echo     - Git-historikk (.git)
echo     - Hemmeligheter (backend\.env)
echo     - AI treningsdata og Python venv
echo     - Logger og test-coverage
echo.
echo   INKLUDERER portable AI-modeller (data\ollama\)
echo   (INCLUDES portable AI models)
echo.
echo  -----------------------------------------------------
echo.

:: =========================================================================
:: Step 1: Ask for destination
:: =========================================================================
set "DEFAULT_DEST=%USERPROFILE%\Desktop\ChiroClickCRM"

echo   Hvor skal kopien lagres?
echo   (Where should the copy be saved?)
echo.
echo   Standard (Default): %DEFAULT_DEST%
echo.
set /p "DEST=  Sti (Path) [Enter for standard]: "

if "%DEST%"=="" set "DEST=%DEFAULT_DEST%"

:: Remove trailing backslash if present
if "%DEST:~-1%"=="\" set "DEST=%DEST:~0,-1%"

echo.
echo   Destinasjon: %DEST%
echo.

:: Check if destination already exists
if exist "%DEST%" (
    echo   ADVARSEL: Mappen finnes allerede!
    echo   (WARNING: Destination folder already exists!)
    echo.
    echo   [O] Overskriv / Oppdater (Overwrite / Update)
    echo   [A] Avbryt (Cancel)
    echo.
    choice /C OA /N /M "  Velg (Choose) [O/A]: "
    if errorlevel 2 (
        echo.
        echo   Avbrutt. (Cancelled.)
        echo.
        pause
        exit /b 0
    )
    echo.
)

:: =========================================================================
:: Step 2: Copy with robocopy
:: =========================================================================
echo  [1/3] Kopierer filer... (Copying files...)
echo         Dette kan ta en stund, spesielt AI-modeller.
echo         (This may take a while, especially AI models.)
echo.

set "SRC=%~dp0"
:: Remove trailing backslash from source
if "%SRC:~-1%"=="\" set "SRC=%SRC:~0,-1%"

robocopy "%SRC%" "%DEST%" /MIR /NFL /NDL /NJH /NP ^
    /XD "%SRC%\data\pglite" ^
        "%SRC%\node_modules" ^
        "%SRC%\backend\node_modules" ^
        "%SRC%\frontend\node_modules" ^
        "%SRC%\.git" ^
        "%SRC%\ai-training\ml-env" ^
        "%SRC%\ai-training\models" ^
        "%SRC%\ai-training\data\processed" ^
        "%SRC%\logs" ^
        "%SRC%\backend\logs" ^
        "%SRC%\data\logs" ^
        "%SRC%\coverage" ^
        "%SRC%\backend\coverage" ^
        "%SRC%\frontend\coverage" ^
        "%SRC%\.claude" ^
        "%SRC%\e2e\test-results" ^
        "%SRC%\e2e\playwright-report" ^
    /XF "backend\.env" ^
        "*.log" ^
        "crash_log.txt" ^
        "cookies.txt"

:: Robocopy exit codes: 0-7 = success, 8+ = error
if %errorlevel% geq 8 (
    color 0C
    echo.
    echo   FEIL: Kopiering feilet med kode %errorlevel%!
    echo   (ERROR: Copy failed with code %errorlevel%!)
    echo.
    pause
    exit /b 1
)

echo.
echo         Filer kopiert!
echo         (Files copied!)
echo.

:: =========================================================================
:: Step 3: Report size
:: =========================================================================
echo  [2/3] Beregner stoerrelse... (Calculating size...)
echo.

set "TOTAL_SIZE=0"
set "FILE_COUNT=0"

:: Use PowerShell to get accurate folder size (batch dir /s is unreliable)
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-ChildItem -Path '%DEST%' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB" 2^>nul') do set "SIZE_MB=%%a"
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-ChildItem -Path '%DEST%' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count" 2^>nul') do set "FILE_COUNT=%%a"

:: Round the MB value
for /f "tokens=1 delims=." %%a in ("!SIZE_MB!") do set "SIZE_ROUNDED=%%a"

:: Check for GB range
set /a SIZE_GB=!SIZE_ROUNDED! / 1024
if !SIZE_GB! geq 1 (
    echo         Total stoerrelse: ca. !SIZE_GB! GB (!SIZE_ROUNDED! MB^)
    echo         (Total size: approx. !SIZE_GB! GB (!SIZE_ROUNDED! MB^))
) else (
    echo         Total stoerrelse: ca. !SIZE_ROUNDED! MB
    echo         (Total size: approx. !SIZE_ROUNDED! MB)
)
echo         Antall filer: !FILE_COUNT!
echo         (File count: !FILE_COUNT!)
echo.

:: =========================================================================
:: Step 4: Verify key files
:: =========================================================================
echo  [3/3] Verifiserer noekkelfiler... (Verifying key files...)
echo.

set "VERIFY_OK=1"

if exist "%DEST%\INSTALL.bat" (
    echo         INSTALL.bat              OK
) else (
    echo         INSTALL.bat              MANGLER! (MISSING!)
    set "VERIFY_OK=0"
)

if exist "%DEST%\START-CHIROCLICK.bat" (
    echo         START-CHIROCLICK.bat     OK
) else (
    echo         START-CHIROCLICK.bat     MANGLER! (MISSING!)
    set "VERIFY_OK=0"
)

if exist "%DEST%\STOP-CHIROCLICK.bat" (
    echo         STOP-CHIROCLICK.bat      OK
) else (
    echo         STOP-CHIROCLICK.bat      MANGLER! (MISSING!)
    set "VERIFY_OK=0"
)

if exist "%DEST%\backend\.env.example" (
    echo         backend\.env.example     OK
) else (
    echo         backend\.env.example     MANGLER! (MISSING!)
    set "VERIFY_OK=0"
)

if exist "%DEST%\backend\package.json" (
    echo         backend\package.json     OK
) else (
    echo         backend\package.json     MANGLER! (MISSING!)
    set "VERIFY_OK=0"
)

if exist "%DEST%\frontend\package.json" (
    echo         frontend\package.json    OK
) else (
    echo         frontend\package.json    MANGLER! (MISSING!)
    set "VERIFY_OK=0"
)

if exist "%DEST%\README.md" (
    echo         README.md                OK
) else (
    echo         README.md                MANGLER! (MISSING!)
    set "VERIFY_OK=0"
)

:: Check if .env was correctly excluded
if exist "%DEST%\backend\.env" (
    echo.
    echo         ADVARSEL: backend\.env ble kopiert!
    echo         (WARNING: backend\.env was copied!)
    echo         Sletter... (Deleting...)
    del "%DEST%\backend\.env"
    echo         Slettet. (Deleted.)
)

:: Check if node_modules was correctly excluded
if exist "%DEST%\node_modules" (
    echo.
    echo         ADVARSEL: node_modules ble kopiert!
    echo         (WARNING: node_modules was copied!)
    echo         Sletter... (Deleting...)
    rmdir /s /q "%DEST%\node_modules"
    echo         Slettet. (Deleted.)
)

:: Check if pglite data was correctly excluded
if exist "%DEST%\data\pglite" (
    :: Check if it has contents (empty dir is OK, data inside is not)
    for /f %%a in ('dir /b "%DEST%\data\pglite" 2^>nul') do (
        echo.
        echo         ADVARSEL: Pasientdata i data\pglite ble kopiert!
        echo         (WARNING: Patient data in data\pglite was copied!)
        echo         Sletter... (Deleting...)
        rmdir /s /q "%DEST%\data\pglite"
        mkdir "%DEST%\data\pglite"
        echo         Slettet, tom mappe opprettet.
        echo         (Deleted, empty folder created.)
        goto :done_pglite_check
    )
)
:done_pglite_check

:: Check portable AI models
echo.
if exist "%DEST%\data\ollama\manifests" (
    set /a AI_COUNT=0
    for /d %%d in ("%DEST%\data\ollama\manifests\registry.ollama.ai\library\*") do (
        set /a AI_COUNT+=1
    )
    if !AI_COUNT! gtr 0 (
        echo         AI-modeller:             !AI_COUNT! modell(er) inkludert
        echo         (AI models:              !AI_COUNT! model(s) included)
    ) else (
        echo         AI-modeller:             Ingen funnet
        echo         (AI models:              None found)
    )
) else (
    echo         AI-modeller:             Ingen funnet (ingen i data\ollama\)
    echo         (AI models:              None found (none in data\ollama\))
)

:: =========================================================================
:: Summary
:: =========================================================================
echo.
echo.
echo  =====================================================
if !VERIFY_OK! equ 1 (
    echo   Ren kopi opprettet! (Clean Copy Created!)
) else (
    color 0E
    echo   Kopi opprettet med advarsler (Copy created with warnings)
)
echo  =====================================================
echo.
echo   Plassering (Location):
echo     %DEST%
echo.
if !SIZE_GB! geq 1 (
echo   Stoerrelse: ca. !SIZE_GB! GB (!FILE_COUNT! filer)
) else (
echo   Stoerrelse: ca. !SIZE_ROUNDED! MB (!FILE_COUNT! filer / files)
)
echo.
echo   -------------------------------------------------
echo   Instruksjoner til mottaker:
echo   (Instructions for recipient:)
echo.
echo     1. Kopier mappen til skrivebordet
echo        (Copy the folder to your desktop)
echo.
echo     2. Dobbeltklikk INSTALL.bat
echo        (Double-click INSTALL.bat)
echo.
echo     3. Dobbeltklikk START-CHIROCLICK.bat
echo        (Double-click START-CHIROCLICK.bat)
echo.
echo     4. Logg inn med:
echo        (Log in with:)
echo        E-post:  admin@chiroclickcrm.no
echo        Passord: admin123
echo   -------------------------------------------------
echo.

endlocal
pause
