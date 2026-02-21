@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: ChiroClickCRM - Overnight AI Model Training Pipeline
:: ============================================================
::
:: This script runs unattended for ~10-12 hours:
:: 1. Checks environment (Python 3.11, CUDA, Ollama, venv)
:: 2. Cleans and prepares training data
:: 3. Trains 4 models sequentially (smallest first)
:: 4. Exports each to GGUF and deploys to Ollama
:: 5. Validates trained models
::
:: Usage: train-overnight.bat
:: ============================================================

:: Paths
set "PROJECT_DIR=%~dp0.."
set "AI_DIR=%~dp0"
set "TRAINING_DIR=%AI_DIR%training"
set "SCRIPTS_DIR=%AI_DIR%scripts"
set "DATA_DIR=%AI_DIR%data\processed"
set "MODELS_DIR=%AI_DIR%models"
set "GGUF_DIR=%MODELS_DIR%\gguf"
set "LOGS_DIR=%AI_DIR%logs"
set "VENV_DIR=%AI_DIR%ml-env"

:: Python 3.11 paths to try (in order)
set "PY311_PATHS=C:\Python311\python.exe;C:\Python\Python311\python.exe;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\python.exe"

:: Timestamp for log file
for /f "tokens=1-6 delims=/:. " %%a in ("%date% %time%") do (
    set "TIMESTAMP=%%c%%b%%a-%%d%%e%%f"
)
set "LOGFILE=%LOGS_DIR%\overnight-%TIMESTAMP%.log"

:: Create directories
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if not exist "%MODELS_DIR%" mkdir "%MODELS_DIR%"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

:: ============================================================
:: Logging function
:: ============================================================
call :log "============================================================"
call :log "ChiroClickCRM Overnight Training Pipeline"
call :log "Started: %date% %time%"
call :log "Log file: %LOGFILE%"
call :log "============================================================"

:: ============================================================
:: Phase 0: Environment Checks
:: ============================================================
call :log ""
call :log "[Phase 0] Environment Checks"
call :log "------------------------------------------------------------"

:: Check NVIDIA GPU
call :log "Checking GPU..."
nvidia-smi >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :log "WARNING: nvidia-smi not found. GPU training may not work."
) else (
    for /f "tokens=*" %%a in ('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2^>nul') do (
        call :log "GPU: %%a"
    )
)

:: Check Ollama
call :log "Checking Ollama..."
ollama --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :log "WARNING: Ollama not found. Model deployment will be skipped."
    set "OLLAMA_AVAILABLE=0"
) else (
    call :log "Ollama: OK"
    set "OLLAMA_AVAILABLE=1"
)

:: Find Python 3.11
call :log "Looking for Python 3.11..."
set "PYTHON311="

:: Check if venv already exists
if exist "%VENV_DIR%\Scripts\python.exe" (
    call :log "Found existing venv at %VENV_DIR%"
    set "PYTHON_CMD=%VENV_DIR%\Scripts\python.exe"
    set "PIP_CMD=%VENV_DIR%\Scripts\pip.exe"
    goto :check_venv_python
)

:: Search for Python 3.11
for %%p in (%PY311_PATHS%) do (
    if exist "%%p" (
        set "PYTHON311=%%p"
        goto :found_python
    )
)

:: Try system python
for /f "tokens=*" %%v in ('python --version 2^>^&1') do set "PY_VER=%%v"
echo %PY_VER% | findstr "3.11" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PYTHON311=python"
    goto :found_python
)

:: Try py launcher
for /f "tokens=*" %%v in ('py -3.11 --version 2^>^&1') do set "PY_VER=%%v"
echo %PY_VER% | findstr "3.11" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PYTHON311=py -3.11"
    goto :found_python
)

call :log "ERROR: Python 3.11 not found!"
call :log ""
call :log "Please install Python 3.11:"
call :log "  1. Download from https://www.python.org/downloads/release/python-3119/"
call :log "  2. Install to C:\Python311\"
call :log "  3. Re-run this script"
call :log ""
call :log "Or if you have Python 3.10+, it may work - edit this script to change PY311_PATHS"
goto :failed

:found_python
call :log "Python 3.11: %PYTHON311%"

:: ============================================================
:: Phase 1: Create Virtual Environment & Install Dependencies
:: ============================================================
call :log ""
call :log "[Phase 1] Setting up ML environment"
call :log "------------------------------------------------------------"

if not exist "%VENV_DIR%\Scripts\python.exe" (
    call :log "Creating virtual environment..."
    %PYTHON311% -m venv "%VENV_DIR%" >> "%LOGFILE%" 2>&1
    if %ERRORLEVEL% neq 0 (
        call :log "ERROR: Failed to create venv"
        goto :failed
    )
    call :log "Venv created at %VENV_DIR%"
)

set "PYTHON_CMD=%VENV_DIR%\Scripts\python.exe"
set "PIP_CMD=%VENV_DIR%\Scripts\pip.exe"

:check_venv_python
call :log "Using Python: %PYTHON_CMD%"

:: Check if torch is already installed
"%PYTHON_CMD%" -c "import torch; print(f'PyTorch {torch.__version__}, CUDA: {torch.cuda.is_available()}')" 2>nul
if %ERRORLEVEL% neq 0 (
    call :log "Installing PyTorch with CUDA support..."
    "%PIP_CMD%" install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 >> "%LOGFILE%" 2>&1
    if %ERRORLEVEL% neq 0 (
        call :log "ERROR: PyTorch installation failed. Check %LOGFILE%"
        goto :failed
    )
    call :log "PyTorch installed"
) else (
    call :log "PyTorch already installed"
)

:: Check if unsloth is installed
"%PYTHON_CMD%" -c "import unsloth" 2>nul
if %ERRORLEVEL% neq 0 (
    call :log "Installing ML dependencies (this takes a while)..."
    "%PIP_CMD%" install transformers>=4.44.0 datasets>=2.18.0 accelerate>=0.28.0 >> "%LOGFILE%" 2>&1
    "%PIP_CMD%" install peft>=0.10.0 trl>=0.8.0 bitsandbytes>=0.43.0 >> "%LOGFILE%" 2>&1
    "%PIP_CMD%" install xformers >> "%LOGFILE%" 2>&1
    "%PIP_CMD%" install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git" >> "%LOGFILE%" 2>&1
    if %ERRORLEVEL% neq 0 (
        call :log "WARNING: Unsloth install may have failed. Trying standard peft/trl..."
        call :log "Will attempt training anyway..."
    )
    "%PIP_CMD%" install rouge-score nltk tqdm pandas numpy >> "%LOGFILE%" 2>&1
    call :log "ML dependencies installed"
) else (
    call :log "ML dependencies already installed"
)

:: Verify CUDA
call :log "Verifying CUDA..."
"%PYTHON_CMD%" -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0)}' if torch.cuda.is_available() else 'No GPU')" >> "%LOGFILE%" 2>&1
"%PYTHON_CMD%" -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0)}' if torch.cuda.is_available() else 'No GPU')"

:: ============================================================
:: Phase 2: Clean and Prepare Training Data
:: ============================================================
call :log ""
call :log "[Phase 2] Cleaning and preparing training data"
call :log "------------------------------------------------------------"

"%PYTHON_CMD%" "%SCRIPTS_DIR%\clean_and_prepare.py" --output-dir "%DATA_DIR%" >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% neq 0 (
    call :log "ERROR: Data cleaning failed. Check %LOGFILE%"
    goto :failed
)

:: Check that data was produced
if not exist "%DATA_DIR%\all-clean\train.jsonl" (
    call :log "ERROR: No training data produced. Check %LOGFILE%"
    goto :failed
)

:: Count examples
for /f %%a in ('type "%DATA_DIR%\all-clean\train.jsonl" ^| find /c /v ""') do set "TRAIN_COUNT=%%a"
call :log "Training data ready: %TRAIN_COUNT% examples in all-clean/train.jsonl"

:: ============================================================
:: Phase 3: Train Models (smallest first)
:: ============================================================

:: Track results
set "TRAINED=0"
set "FAILED_MODELS="
set "SUCCESS_MODELS="

:: --- 3a. chiro-fast (Llama 3.2 3B, ~1h) ---
call :log ""
call :log "[Phase 3a] Training chiro-fast (Llama 3.2 3B)"
call :log "------------------------------------------------------------"
set "FAST_START=%time%"

:: Use quick-fields data if available, else all-clean
if exist "%DATA_DIR%\quick-fields\train.jsonl" (
    set "FAST_DATA=%DATA_DIR%\quick-fields"
) else (
    set "FAST_DATA=%DATA_DIR%\all-clean"
)
call :log "Data: !FAST_DATA!"

"%PYTHON_CMD%" "%TRAINING_DIR%\train_unsloth.py" ^
    --model fast ^
    --data-dir "!FAST_DATA!" ^
    --output "%MODELS_DIR%" ^
    --log-dir "%LOGS_DIR%" ^
    --low-vram ^
    --quantize q4_k_m >> "%LOGFILE%" 2>&1

if %ERRORLEVEL% equ 0 (
    call :log "chiro-fast: TRAINING COMPLETE"
    set /a TRAINED+=1
    set "SUCCESS_MODELS=!SUCCESS_MODELS! chiro-fast"
    call :deploy_model "chiro-fast"
) else (
    call :log "chiro-fast: TRAINING FAILED - continuing with next model"
    set "FAILED_MODELS=!FAILED_MODELS! chiro-fast"
)
call :log "chiro-fast time: %FAST_START% - %time%"

:: --- 3b. chiro-medical (MedGemma 4B, ~2h) ---
call :log ""
call :log "[Phase 3b] Training chiro-medical (MedGemma 4B)"
call :log "------------------------------------------------------------"
set "MED_START=%time%"

if exist "%DATA_DIR%\medical-safety\train.jsonl" (
    set "MED_DATA=%DATA_DIR%\medical-safety"
) else (
    set "MED_DATA=%DATA_DIR%\all-clean"
)
call :log "Data: !MED_DATA!"

"%PYTHON_CMD%" "%TRAINING_DIR%\train_unsloth.py" ^
    --model medical ^
    --data-dir "!MED_DATA!" ^
    --output "%MODELS_DIR%" ^
    --log-dir "%LOGS_DIR%" ^
    --low-vram ^
    --quantize q4_k_m >> "%LOGFILE%" 2>&1

if %ERRORLEVEL% equ 0 (
    call :log "chiro-medical: TRAINING COMPLETE"
    set /a TRAINED+=1
    set "SUCCESS_MODELS=!SUCCESS_MODELS! chiro-medical"
    call :deploy_model "chiro-medical"
) else (
    call :log "chiro-medical: TRAINING FAILED - continuing with next model"
    set "FAILED_MODELS=!FAILED_MODELS! chiro-medical"
)
call :log "chiro-medical time: %MED_START% - %time%"

:: --- 3c. chiro-norwegian (Mistral 7B, ~3-4h) ---
call :log ""
call :log "[Phase 3c] Training chiro-norwegian (Mistral 7B)"
call :log "------------------------------------------------------------"
set "NOR_START=%time%"

if exist "%DATA_DIR%\norwegian-clinical\train.jsonl" (
    set "NOR_DATA=%DATA_DIR%\norwegian-clinical"
) else (
    set "NOR_DATA=%DATA_DIR%\all-clean"
)
call :log "Data: !NOR_DATA!"

"%PYTHON_CMD%" "%TRAINING_DIR%\train_unsloth.py" ^
    --model norwegian ^
    --data-dir "!NOR_DATA!" ^
    --output "%MODELS_DIR%" ^
    --log-dir "%LOGS_DIR%" ^
    --low-vram ^
    --quantize q4_k_m >> "%LOGFILE%" 2>&1

if %ERRORLEVEL% equ 0 (
    call :log "chiro-norwegian: TRAINING COMPLETE"
    set /a TRAINED+=1
    set "SUCCESS_MODELS=!SUCCESS_MODELS! chiro-norwegian"
    call :deploy_model "chiro-norwegian"
) else (
    call :log "chiro-norwegian: TRAINING FAILED - continuing with next model"
    set "FAILED_MODELS=!FAILED_MODELS! chiro-norwegian"
)
call :log "chiro-norwegian time: %NOR_START% - %time%"

:: --- 3d. chiro-no (Mistral 7B, ~3-4h) ---
call :log ""
call :log "[Phase 3d] Training chiro-no (Mistral 7B)"
call :log "------------------------------------------------------------"
set "DEF_START=%time%"

set "DEF_DATA=%DATA_DIR%\general-clinical"
if not exist "%DEF_DATA%\train.jsonl" set "DEF_DATA=%DATA_DIR%\all-clean"
call :log "Data: !DEF_DATA!"

"%PYTHON_CMD%" "%TRAINING_DIR%\train_unsloth.py" ^
    --model default ^
    --data-dir "!DEF_DATA!" ^
    --output "%MODELS_DIR%" ^
    --log-dir "%LOGS_DIR%" ^
    --low-vram ^
    --quantize q4_k_m >> "%LOGFILE%" 2>&1

if %ERRORLEVEL% equ 0 (
    call :log "chiro-no: TRAINING COMPLETE"
    set /a TRAINED+=1
    set "SUCCESS_MODELS=!SUCCESS_MODELS! chiro-no"
    call :deploy_model "chiro-no"
) else (
    call :log "chiro-no: TRAINING FAILED"
    set "FAILED_MODELS=!FAILED_MODELS! chiro-no"
)
call :log "chiro-no time: %DEF_START% - %time%"

:: ============================================================
:: Phase 4: Validation
:: ============================================================
call :log ""
call :log "[Phase 4] Validating trained models"
call :log "------------------------------------------------------------"

if exist "%SCRIPTS_DIR%\validate_models.py" (
    "%PYTHON_CMD%" "%SCRIPTS_DIR%\validate_models.py" --log-dir "%LOGS_DIR%" >> "%LOGFILE%" 2>&1
    if %ERRORLEVEL% equ 0 (
        call :log "Validation complete"
    ) else (
        call :log "WARNING: Validation had errors. Check logs."
    )
) else (
    call :log "Validation script not found, skipping"
)

:: ============================================================
:: Phase 5: Summary
:: ============================================================
call :log ""
call :log "============================================================"
call :log "OVERNIGHT TRAINING COMPLETE"
call :log "============================================================"
call :log "Finished: %date% %time%"
call :log "Models trained: %TRAINED% / 4"
call :log "Successful: %SUCCESS_MODELS%"
if defined FAILED_MODELS call :log "Failed: %FAILED_MODELS%"
call :log ""
call :log "Log file: %LOGFILE%"
call :log "Model files: %GGUF_DIR%"
call :log ""
call :log "Next steps:"
call :log "  1. Check logs: type %LOGFILE%"
call :log "  2. List models: ollama list | findstr chiro"
call :log "  3. Test a model: ollama run chiro-fast-lora ""Generer hovedklage for nakkesmerter"""
call :log "  4. Update .env if LoRA models are better than originals"
call :log "============================================================"

goto :end

:: ============================================================
:: Functions
:: ============================================================

:deploy_model
:: Deploy GGUF to Ollama
set "MODEL_NAME=%~1"
set "LORA_NAME=%MODEL_NAME%-lora"

if "%OLLAMA_AVAILABLE%"=="0" (
    call :log "Skipping Ollama deploy (Ollama not available)"
    goto :eof
)

if exist "%GGUF_DIR%\Modelfile.%LORA_NAME%" (
    call :log "Deploying %LORA_NAME% to Ollama..."
    pushd "%GGUF_DIR%"
    ollama create %LORA_NAME% -f "Modelfile.%LORA_NAME%" >> "%LOGFILE%" 2>&1
    if %ERRORLEVEL% equ 0 (
        call :log "%LORA_NAME%: Deployed to Ollama"
    ) else (
        call :log "WARNING: Failed to deploy %LORA_NAME% to Ollama"
    )
    popd
) else (
    call :log "No Modelfile found for %LORA_NAME% - GGUF export may have failed"
)
goto :eof

:log
echo %~1
echo [%date% %time%] %~1 >> "%LOGFILE%"
goto :eof

:failed
call :log ""
call :log "PIPELINE FAILED - see errors above"
call :log "Log file: %LOGFILE%"
pause
exit /b 1

:end
call :log "Pipeline finished successfully"
pause
exit /b 0
