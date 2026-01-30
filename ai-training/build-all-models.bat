@echo off
REM ============================================================================
REM ChiroClick AI Models - Standalone Build Script
REM ============================================================================
REM This script builds all ChiroClick AI models using Ollama.
REM No backend access, coding tools, or special permissions required.
REM Just needs Ollama installed and running.
REM ============================================================================

echo.
echo ============================================================
echo    ChiroClick AI Models - Build Script
echo ============================================================
echo.

REM Check if Ollama is running
ollama list >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Ollama is not running or not installed.
    echo.
    echo Please install Ollama from: https://ollama.ai
    echo Then start it and run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Ollama is running.
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

echo Building ChiroClick AI Models...
echo This may take 10-30 minutes depending on your internet speed.
echo.

REM ============================================================================
REM Model 1: chiro-fast (Quick autocomplete, ~2GB)
REM ============================================================================
echo ============================================================
echo [1/4] Building chiro-fast (Quick autocomplete)
echo       Base: llama3.2:3b (~2GB)
echo ============================================================
echo.

REM First, ensure base model is available
echo Pulling base model llama3.2:3b...
ollama pull llama3.2:3b
if errorlevel 1 (
    echo [WARNING] Could not pull llama3.2:3b, trying alternative...
    ollama pull llama3.2
)

echo Creating chiro-fast model...
ollama create chiro-fast -f "%SCRIPT_DIR%Modelfile-fast"
if errorlevel 1 (
    echo [ERROR] Failed to create chiro-fast model
) else (
    echo [OK] chiro-fast created successfully
)
echo.

REM ============================================================================
REM Model 2: chiro-norwegian (Norwegian narratives, ~4GB)
REM ============================================================================
echo ============================================================
echo [2/4] Building chiro-norwegian (Norwegian narratives)
echo       Base: mistral:7b (~4GB)
echo ============================================================
echo.

echo Pulling base model mistral:7b...
ollama pull mistral:7b
if errorlevel 1 (
    echo [WARNING] Could not pull mistral:7b, trying alternative...
    ollama pull mistral
)

echo Creating chiro-norwegian model...
ollama create chiro-norwegian -f "%SCRIPT_DIR%Modelfile-norwegian"
if errorlevel 1 (
    echo [ERROR] Failed to create chiro-norwegian model
) else (
    echo [OK] chiro-norwegian created successfully
)
echo.

REM ============================================================================
REM Model 3: chiro-medical (Clinical reasoning, ~5GB)
REM ============================================================================
echo ============================================================
echo [3/4] Building chiro-medical (Clinical reasoning)
echo       Base: gemma2:9b (~5GB)
echo ============================================================
echo.

echo Pulling base model gemma2:9b...
ollama pull gemma2:9b
if errorlevel 1 (
    echo [WARNING] Could not pull gemma2:9b, trying gemma2...
    ollama pull gemma2
)

echo Creating chiro-medical model...
ollama create chiro-medical -f "%SCRIPT_DIR%Modelfile-medical"
if errorlevel 1 (
    echo [ERROR] Failed to create chiro-medical model
) else (
    echo [OK] chiro-medical created successfully
)
echo.

REM ============================================================================
REM Model 4: chiro-no (Default balanced model, ~4GB)
REM ============================================================================
echo ============================================================
echo [4/4] Building chiro-no (Default balanced)
echo       Base: llama3.2 (~4GB)
echo ============================================================
echo.

echo Pulling base model llama3.2...
ollama pull llama3.2

echo Creating chiro-no model...
ollama create chiro-no -f "%SCRIPT_DIR%Modelfile"
if errorlevel 1 (
    echo [ERROR] Failed to create chiro-no model
) else (
    echo [OK] chiro-no created successfully
)
echo.

REM ============================================================================
REM Summary
REM ============================================================================
echo ============================================================
echo    BUILD COMPLETE
echo ============================================================
echo.
echo Installed models:
ollama list | findstr chiro
echo.
echo ============================================================
echo    QUICK TEST
echo ============================================================
echo.
echo Testing chiro-fast...
echo Prompt: "Generer hovedklage for nakkesmerter"
ollama run chiro-fast "Generer hovedklage for nakkesmerter" --verbose 2>nul
echo.

echo ============================================================
echo    USAGE
echo ============================================================
echo.
echo From command line:
echo   ollama run chiro-fast "Your prompt here"
echo   ollama run chiro-norwegian "Skriv SOAP-notat"
echo   ollama run chiro-medical "Klinisk vurdering"
echo   ollama run chiro-no "General prompt"
echo.
echo From ChiroClick app:
echo   Models are automatically used by the AI features.
echo   chiro-fast: Quick fields (chief complaint, onset)
echo   chiro-norwegian: Narrative fields (history, subjective)
echo   chiro-medical: Clinical reasoning (diagnosis, palpation)
echo.
echo ============================================================
pause
