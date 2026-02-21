@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: Train chiro-no (Mistral 7B) - Individual Model
:: Estimated: ~3-4 hours on RTX 2060
:: ============================================================

set "AI_DIR=%~dp0"
set "VENV_DIR=%AI_DIR%ml-env"
set "PYTHON_CMD=%VENV_DIR%\Scripts\python.exe"
set "TRAINING_DIR=%AI_DIR%training"
set "SCRIPTS_DIR=%AI_DIR%scripts"
set "DATA_DIR=%AI_DIR%data\processed"
set "MODELS_DIR=%AI_DIR%models"
set "GGUF_DIR=%MODELS_DIR%\gguf"
set "LOGS_DIR=%AI_DIR%logs"

if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if not exist "%MODELS_DIR%" mkdir "%MODELS_DIR%"

echo ============================================================
echo Training: chiro-no (Mistral 7B - General)
echo Started: %date% %time%
echo ============================================================

:: Check venv
if not exist "%PYTHON_CMD%" (
    echo ERROR: ML environment not found at %VENV_DIR%
    echo Run train-overnight.bat first to set up the environment.
    pause
    exit /b 1
)

:: Clean data if needed
if not exist "%DATA_DIR%\general-clinical\train.jsonl" (
    echo Preparing training data...
    "%PYTHON_CMD%" "%SCRIPTS_DIR%\clean_and_prepare.py" --output-dir "%DATA_DIR%"
)

:: Select data directory
if exist "%DATA_DIR%\general-clinical\train.jsonl" (
    set "TRAIN_DATA=%DATA_DIR%\general-clinical"
) else (
    set "TRAIN_DATA=%DATA_DIR%\all-clean"
)
echo Data: %TRAIN_DATA%

:: Train
echo.
echo Starting training...
"%PYTHON_CMD%" "%TRAINING_DIR%\train_unsloth.py" ^
    --model default ^
    --data-dir "%TRAIN_DATA%" ^
    --output "%MODELS_DIR%" ^
    --log-dir "%LOGS_DIR%" ^
    --low-vram ^
    --quantize q4_k_m

if %ERRORLEVEL% neq 0 (
    echo TRAINING FAILED
    pause
    exit /b 1
)

:: Deploy to Ollama
if exist "%GGUF_DIR%\Modelfile.chiro-no-lora" (
    echo Deploying to Ollama...
    pushd "%GGUF_DIR%"
    ollama create chiro-no-lora -f Modelfile.chiro-no-lora
    popd
)

echo.
echo ============================================================
echo chiro-no COMPLETE: %date% %time%
echo Test: ollama run chiro-no-lora "Skriv behandlingsoppsummering for skuldersmerte"
echo ============================================================
pause
exit /b 0
