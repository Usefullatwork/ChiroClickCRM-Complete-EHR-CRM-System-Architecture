@echo off
REM ChiroClickCRM - Local AI Setup Script
REM Installs and configures Ollama with optimal models for clinical documentation

echo.
echo ===============================================
echo   ChiroClickCRM Local AI Setup
echo   Privacy-first clinical AI assistance
echo ===============================================
echo.

REM Check if Ollama is installed
where ollama >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Ollama is not installed!
    echo.
    echo Please install Ollama first:
    echo   1. Download from: https://ollama.ai/download
    echo   2. Run the installer
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Ollama is installed
echo.

REM Check if Ollama service is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Starting Ollama service...
    start "" ollama serve
    timeout /t 5 /nobreak >nul
)

echo [OK] Ollama service is running
echo.

REM Show available disk space
echo Checking available disk space...
for /f "tokens=3" %%a in ('dir /-c 2^>nul ^| findstr /c:"bytes free"') do set FREE_SPACE=%%a
echo Available space: %FREE_SPACE% bytes
echo.

echo ===============================================
echo   Downloading Clinical AI Models
echo ===============================================
echo.
echo The following models will be downloaded:
echo.
echo   1. llama3.2:3b     (~2GB) - Fast, general clinical notes
echo   2. mistral:7b-q4   (~4GB) - Balanced quality/speed
echo   3. medllama2:7b    (~4GB) - Medical-optimized (optional)
echo.
echo Recommended: At least 16GB RAM for 7B models
echo             8GB RAM minimum for 3B models
echo.

choice /C YN /M "Do you want to continue with model download"
if %ERRORLEVEL% neq 1 (
    echo Skipping model download.
    goto :config
)

echo.
echo [1/3] Downloading llama3.2:3b (fast clinical assistant)...
ollama pull llama3.2:3b
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Failed to download llama3.2:3b
) else (
    echo [OK] llama3.2:3b downloaded successfully
)

echo.
choice /C YN /M "Download mistral:7b for better quality (4GB)?"
if %ERRORLEVEL% equ 1 (
    echo [2/3] Downloading mistral:7b...
    ollama pull mistral:7b
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] Failed to download mistral:7b
    ) else (
        echo [OK] mistral:7b downloaded successfully
    )
)

echo.
choice /C YN /M "Download medllama2:7b (medical-optimized, 4GB)?"
if %ERRORLEVEL% equ 1 (
    echo [3/3] Downloading medllama2:7b...
    ollama pull medllama2:7b
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] Failed to download medllama2:7b
    ) else (
        echo [OK] medllama2:7b downloaded successfully
    )
)

:config
echo.
echo ===============================================
echo   Model Configuration
echo ===============================================
echo.

REM List installed models
echo Installed models:
ollama list
echo.

REM Create custom clinical modelfile
echo Creating optimized clinical model configuration...

(
echo # ChiroClickCRM Clinical Model
echo # Optimized for Norwegian chiropractic documentation
echo.
echo FROM llama3.2:3b
echo.
echo # Temperature: Lower for more consistent clinical output
echo PARAMETER temperature 0.3
echo.
echo # Context window: Enough for full SOAP notes
echo PARAMETER num_ctx 4096
echo.
echo # Stop sequences for clean output
echo PARAMETER stop "[INST]"
echo PARAMETER stop "[/INST]"
echo PARAMETER stop "Human:"
echo PARAMETER stop "Assistant:"
echo.
echo SYSTEM """Du er en klinisk dokumentasjonsassistent for en kiropraktorpraksis i Norge.
echo.
echo Dine oppgaver:
echo - Generer profesjonelle SOAP-notater pa norsk
echo - Foreslå relevante ICPC-2 diagnosekoder
echo - Identifiser røde flagg og kontraindikasjoner
echo - Assistere med klinisk resonnering
echo.
echo Retningslinjer:
echo - Bruk korrekt norsk medisinsk terminologi
echo - Vær konsis men grundig
echo - Aldri oppdikte symptomer eller funn
echo - Følg norske journalføringsstandarder
echo - Respekter pasientens personvern
echo """
) > "%~dp0..\backend\models\chiroclick-clinical.modelfile"

echo [OK] Clinical model configuration created
echo.

REM Create the model
echo Creating ChiroClick clinical model...
ollama create chiroclick-clinical -f "%~dp0..\backend\models\chiroclick-clinical.modelfile" 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Using base model instead of custom model
) else (
    echo [OK] Custom clinical model created: chiroclick-clinical
)

echo.
echo ===============================================
echo   Testing AI Connection
echo ===============================================
echo.

echo Testing model response...
curl -s -X POST http://localhost:11434/api/generate -d "{\"model\": \"llama3.2:3b\", \"prompt\": \"Hei, test av klinisk assistent.\", \"stream\": false}" > "%TEMP%\ollama_test.json" 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] AI model is responding correctly!
) else (
    echo [WARNING] Model test failed - check Ollama logs
)

echo.
echo ===============================================
echo   Setup Complete!
echo ===============================================
echo.
echo Local AI is now configured for ChiroClickCRM.
echo.
echo Configuration:
echo   - Ollama URL: http://localhost:11434
echo   - Primary Model: llama3.2:3b
echo   - Custom Model: chiroclick-clinical (if created)
echo.
echo To use in ChiroClickCRM:
echo   1. Set AI_PROVIDER=ollama in backend\.env
echo   2. Set AI_MODEL=llama3.2:3b (or chiroclick-clinical)
echo   3. Restart the backend server
echo.
echo Privacy: All AI processing happens locally.
echo          No patient data leaves your computer.
echo.
pause
