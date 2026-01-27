@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   ChiroClick AI - Model Builder
echo   Bygger tilpassede kiropraktor-modeller med Ollama
echo ============================================================
echo.
echo Estimert diskplass needed: ~14GB total
echo.

REM ---- Step 1: Check if Ollama is installed ----
echo [1/6] Sjekker om Ollama er installert...
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo FEIL: Ollama er ikke installert eller ikke i PATH.
    echo Last ned fra https://ollama.com/download
    exit /b 1
)
echo OK - Ollama funnet.
echo.

REM ---- Step 2: Check if Ollama is running ----
echo [2/6] Sjekker om Ollama-serveren kjoerer...
ollama list >nul 2>nul
if %errorlevel% neq 0 (
    echo ADVARSEL: Ollama server svarer ikke. Proever aa starte...
    start "" ollama serve
    timeout /t 5 /nobreak >nul
    ollama list >nul 2>nul
    if %errorlevel% neq 0 (
        echo FEIL: Kunne ikke starte Ollama server.
        echo Start Ollama manuelt og proev igjen.
        exit /b 1
    )
)
echo OK - Ollama server kjoerer.
echo.

REM ---- Step 3: Generate Modelfiles from training data ----
echo [3/7] Genererer Modelfiles fra treningsdata...
where node >nul 2>nul
if %errorlevel% equ 0 (
    node "%~dp0scripts\build-modelfiles.js"
    if %errorlevel% equ 0 (
        echo OK - Modelfiles generert med treningseksempler.
    ) else (
        echo ADVARSEL: Modelfile-generering feilet. Bruker eksisterende Modelfiles.
    )
) else (
    echo ADVARSEL: Node.js ikke funnet. Bruker eksisterende Modelfiles.
)
echo.

REM ---- Step 4: Pull base models ----
echo [4/7] Laster ned base-modeller (dette kan ta lang tid)...
echo.

set "PULL_ERRORS=0"

echo   Pulling mistral:7b ...
ollama pull mistral:7b
if %errorlevel% neq 0 (
    echo   FEIL: Kunne ikke laste ned mistral:7b
    set /a PULL_ERRORS+=1
) else (
    echo   OK - mistral:7b lastet ned.
)
echo.

echo   Pulling llama3.2:3b ...
ollama pull llama3.2:3b
if %errorlevel% neq 0 (
    echo   FEIL: Kunne ikke laste ned llama3.2:3b
    set /a PULL_ERRORS+=1
) else (
    echo   OK - llama3.2:3b lastet ned.
)
echo.

echo   Pulling gemma3:4b (for chiro-norwegian)...
ollama pull gemma3:4b
if %errorlevel% neq 0 (
    echo   FEIL: Kunne ikke laste ned gemma3:4b
    set /a PULL_ERRORS+=1
) else (
    echo   OK - gemma3:4b lastet ned.
)
echo.

echo   Pulling alibayram/medgemma:4b (for chiro-medical)...
ollama pull alibayram/medgemma:4b
if %errorlevel% neq 0 (
    echo   FEIL: Kunne ikke laste ned alibayram/medgemma:4b
    set /a PULL_ERRORS+=1
) else (
    echo   OK - alibayram/medgemma:4b lastet ned.
)
echo.

if %PULL_ERRORS% gtr 0 (
    echo ADVARSEL: %PULL_ERRORS% base-modell(er) feilet. Fortsetter med tilgjengelige modeller...
) else (
    echo Alle base-modeller lastet ned.
)
echo.

REM ---- Step 5: Build custom models ----
echo [5/7] Bygger tilpassede ChiroClick-modeller...
echo.

set "BUILD_ERRORS=0"
set "BUILD_SUCCESS=0"

echo   Building chiro-no fra Modelfile.chiro-no ...
ollama create chiro-no -f Modelfile.chiro-no
if %errorlevel% neq 0 (
    echo   FEIL: Bygging av chiro-no feilet.
    set /a BUILD_ERRORS+=1
) else (
    echo   OK - chiro-no bygget.
    set /a BUILD_SUCCESS+=1
)
echo.

echo   Building chiro-fast fra Modelfile.chiro-fast ...
ollama create chiro-fast -f Modelfile.chiro-fast
if %errorlevel% neq 0 (
    echo   FEIL: Bygging av chiro-fast feilet.
    set /a BUILD_ERRORS+=1
) else (
    echo   OK - chiro-fast bygget.
    set /a BUILD_SUCCESS+=1
)
echo.

echo   Building chiro-norwegian fra Modelfile.chiro-norwegian ...
ollama create chiro-norwegian -f Modelfile.chiro-norwegian
if %errorlevel% neq 0 (
    echo   FEIL: Bygging av chiro-norwegian feilet.
    set /a BUILD_ERRORS+=1
) else (
    echo   OK - chiro-norwegian bygget.
    set /a BUILD_SUCCESS+=1
)
echo.

echo   Building chiro-medical fra Modelfile.chiro-medical ...
ollama create chiro-medical -f Modelfile.chiro-medical
if %errorlevel% neq 0 (
    echo   FEIL: Bygging av chiro-medical feilet.
    set /a BUILD_ERRORS+=1
) else (
    echo   OK - chiro-medical bygget.
    set /a BUILD_SUCCESS+=1
)
echo.

echo Byggeresultat: %BUILD_SUCCESS% OK, %BUILD_ERRORS% feilet.
echo.

REM ---- Step 6: Test each model ----
echo [6/7] Tester modellene med en enkel prompt...
echo.

set "TEST_ERRORS=0"

for %%M in (chiro-no chiro-fast chiro-norwegian chiro-medical) do (
    echo   Testing %%M ...
    echo Hva er de vanligste aarsaker til korsryggsmerter? | ollama run %%M --nowordwrap 2>nul
    if %errorlevel% neq 0 (
        echo   FEIL: %%M svarte ikke.
        set /a TEST_ERRORS+=1
    ) else (
        echo.
        echo   OK - %%M svarte.
    )
    echo.
)

REM ---- Step 7: Disk space report ----
echo [7/7] Diskplassbruk for Ollama-modeller...
echo.
ollama list
echo.

REM Show Ollama storage directory size if accessible
if exist "%USERPROFILE%\.ollama\models" (
    echo Ollama modell-mappe:
    dir /s "%USERPROFILE%\.ollama\models" 2>nul | findstr /i "File(s)"
)
echo.

REM ---- Summary ----
echo ============================================================
echo   OPPSUMMERING / SUMMARY
echo ============================================================
echo   Base models pulled:    4 (med %PULL_ERRORS% feil)
echo   Custom models built:   %BUILD_SUCCESS% av 4
echo   Test failures:         %TEST_ERRORS%
echo.

if %BUILD_ERRORS% equ 0 if %PULL_ERRORS% equ 0 (
    echo   STATUS: ALLE MODELLER KLARE! Alt gikk bra.
    echo.
    echo   Du kan naa bruke modellene:
    echo     ollama run chiro-no
    echo     ollama run chiro-fast
    echo     ollama run chiro-norwegian
    echo     ollama run chiro-medical
) else (
    echo   STATUS: Noen steg feilet. Sjekk loggene ovenfor.
)
echo.
echo ============================================================

endlocal
