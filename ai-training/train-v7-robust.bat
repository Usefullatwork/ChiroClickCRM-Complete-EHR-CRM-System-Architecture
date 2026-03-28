@echo off
REM ============================================================
REM ChiroClick v7 Robust Training (Windows-native)
REM ============================================================
REM - Prevents Windows sleep during training
REM - Auto-resumes from latest checkpoint on crash
REM - Runs natively in CMD (no Git Bash dependency)
REM - Logs everything to overnight-v7-run.log
REM
REM USAGE: Double-click this file, or run from CMD:
REM   cd C:\Users\MadsF\Desktop\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\ai-training
REM   train-v7-robust.bat
REM ============================================================

setlocal enabledelayedexpansion

set AI_DIR=C:\Users\MadsF\Desktop\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\ai-training
set PROJECT_DIR=C:\Users\MadsF\Desktop\ChiroClickCRM-Complete-EHR-CRM-System-Architecture
set PYTHON=%AI_DIR%\ml-env\Scripts\python.exe
set OLLAMA=C:\Users\MadsF\AppData\Local\Programs\Ollama\ollama.exe
set LOG=%AI_DIR%\overnight-v7-run.log

REM Maximum SFT retry attempts (each resumes from last checkpoint)
set MAX_SFT_RETRIES=5

echo ============================================================>> "%LOG%"
echo ChiroClick v7 Robust Training>> "%LOG%"
echo Started: %date% %time%>> "%LOG%"
echo ============================================================>> "%LOG%"

echo ============================================================
echo  ChiroClick v7 Robust Training
echo  Started: %date% %time%
echo ============================================================
echo.

REM ============================================================
REM [1] Prevent Windows sleep
REM ============================================================
echo [1/10] Preventing Windows sleep...
powershell -Command "powercfg -change -standby-timeout-ac 0; powercfg -change -hibernate-timeout-ac 0; powercfg -change -monitor-timeout-ac 0" 2>nul
echo        Sleep disabled for AC power.
echo [1/10] Sleep prevention enabled>> "%LOG%"

REM ============================================================
REM [2] Kill Ollama to free GPU
REM ============================================================
echo [2/10] Killing Ollama to free GPU...
taskkill /F /IM ollama.exe 2>nul
taskkill /F /IM ollama_llama_server.exe 2>nul
timeout /t 3 /nobreak >nul
echo        Ollama stopped.
echo [2/10] Ollama killed>> "%LOG%"

REM ============================================================
REM [3] Data Preparation
REM ============================================================
echo [3/10] Preparing data...
cd /d "%AI_DIR%"

"%PYTHON%" nanochat\scripts\prepare-data.py >> "%LOG%" 2>&1
if errorlevel 1 (
    echo ERROR: Data preparation failed. Check %LOG%
    goto :RESTORE_SLEEP
)
echo        Data prepared.

REM ============================================================
REM [4] Copy data to training paths
REM ============================================================
echo [4/10] Copying data...
if not exist "%AI_DIR%\data\processed-v7\combined-sft" mkdir "%AI_DIR%\data\processed-v7\combined-sft"
if not exist "%AI_DIR%\data\dpo-v7" mkdir "%AI_DIR%\data\dpo-v7"

copy /Y "%AI_DIR%\nanochat\data\sft_train.jsonl" "%AI_DIR%\data\processed-v7\combined-sft\train.jsonl" >nul
copy /Y "%AI_DIR%\nanochat\data\sft_val.jsonl" "%AI_DIR%\data\processed-v7\combined-sft\validation.jsonl" >nul
copy /Y "%AI_DIR%\nanochat\data\dpo_train.jsonl" "%AI_DIR%\data\dpo-v7\train.jsonl" >nul
copy /Y "%AI_DIR%\nanochat\data\dpo_val.jsonl" "%AI_DIR%\data\dpo-v7\validation.jsonl" >nul
echo        Data copied.
echo [4/10] Data copied>> "%LOG%"

REM ============================================================
REM [5] SFT Training with auto-resume on crash
REM ============================================================
echo ============================================================
echo [5/10] SFT TRAINING (r=64, alpha=128, 3 epochs)
echo        Auto-resume enabled (max %MAX_SFT_RETRIES% retries)
echo        Started: %date% %time%
echo ============================================================
echo [5/10] SFT started: %date% %time%>> "%LOG%"

REM Check if checkpoint-200 exists (from previous run)
set SFT_RESUME=
if exist "%AI_DIR%\models\chiro-no\checkpoint-200" (
    echo        Found checkpoint-200 from previous run, resuming...
    echo        Resuming from checkpoint-200>> "%LOG%"
    set SFT_RESUME=--resume
)

set SFT_OK=0
set SFT_ATTEMPT=0

:SFT_LOOP
set /a SFT_ATTEMPT+=1
if %SFT_ATTEMPT% gtr %MAX_SFT_RETRIES% (
    echo        SFT FAILED after %MAX_SFT_RETRIES% attempts.
    echo [5/10] SFT FAILED after %MAX_SFT_RETRIES% attempts>> "%LOG%"
    goto :SFT_DONE
)

echo        Attempt %SFT_ATTEMPT%/%MAX_SFT_RETRIES% - %date% %time%
echo        SFT attempt %SFT_ATTEMPT% started: %date% %time%>> "%LOG%"

cd /d "%AI_DIR%\training"
"%PYTHON%" train_unsloth.py ^
    --model default ^
    --data-dir ..\data\processed-v7\combined-sft ^
    --output ..\models --log-dir ..\logs ^
    --epochs 3 --batch-size 2 --gradient-accumulation-steps 4 ^
    --max-seq-length 4096 --no-packing --save-steps 100 --quantize q8_0 ^
    %SFT_RESUME% >> "%LOG%" 2>&1

if errorlevel 1 (
    echo        Attempt %SFT_ATTEMPT% crashed at %date% %time%
    echo        SFT attempt %SFT_ATTEMPT% crashed: %date% %time%>> "%LOG%"
    echo        Cooling down 60s before retry...
    timeout /t 60 /nobreak >nul
    set SFT_RESUME=--resume
    goto :SFT_LOOP
)

set SFT_OK=1
echo [5/10] SFT COMPLETE at %date% %time%
echo [5/10] SFT COMPLETE: %date% %time%>> "%LOG%"

:SFT_DONE

REM ============================================================
REM [6] GPU Cooldown
REM ============================================================
if %SFT_OK%==1 (
    echo [6/10] GPU cooldown 30s...
    timeout /t 30 /nobreak >nul
) else (
    echo [6/10] SKIPPED - SFT failed
)

REM ============================================================
REM [7] DPO Training
REM ============================================================
set DPO_OK=0
if %SFT_OK%==1 (
    echo ============================================================
    echo [7/10] DPO TRAINING (1 epoch, beta=0.1)
    echo        Started: %date% %time%
    echo ============================================================
    echo [7/10] DPO started: %date% %time%>> "%LOG%"

    cd /d "%AI_DIR%\training"
    "%PYTHON%" train_dpo.py ^
        --model default --data-dir ..\data\dpo-v7 ^
        --epochs 1 --batch-size 1 --grad-accum 8 --lr 5e-5 --beta 0.1 >> "%LOG%" 2>&1

    if errorlevel 1 (
        echo [7/10] DPO FAILED - will attempt SFT-only merge
        echo [7/10] DPO FAILED: %date% %time%>> "%LOG%"
    ) else (
        set DPO_OK=1
        echo [7/10] DPO COMPLETE at %date% %time%
        echo [7/10] DPO COMPLETE: %date% %time%>> "%LOG%"
    )
) else (
    echo [7/10] SKIPPED - SFT failed
)

REM ============================================================
REM [8] Merge + GGUF + Deploy
REM ============================================================
set MERGE_OK=0
if %SFT_OK%==1 (
    if %DPO_OK%==1 (
        echo [8/10] Merging SFT+DPO and deploying...
        echo [8/10] Merge started: %date% %time%>> "%LOG%"
        cd /d "%AI_DIR%"
        "%PYTHON%" scripts\merge_sft_dpo_v7.py --version v7 >> "%LOG%" 2>&1
        if errorlevel 1 (
            echo [8/10] Merge FAILED
            echo [8/10] Merge FAILED>> "%LOG%"
        ) else (
            set MERGE_OK=1
            echo [8/10] Merge COMPLETE
            echo [8/10] Merge COMPLETE>> "%LOG%"
        )
    ) else (
        echo [8/10] DPO failed - skipping merge
    )
) else (
    echo [8/10] SKIPPED - SFT failed
)

REM ============================================================
REM [9] Start Ollama
REM ============================================================
echo [9/10] Starting Ollama...
start "" "%OLLAMA%" serve
timeout /t 5 /nobreak >nul
echo        Ollama running.

REM ============================================================
REM [10] Evaluation
REM ============================================================
set EVAL_OK=0
if %MERGE_OK%==1 (
    echo [10/10] Running evaluation...
    echo [10/10] Eval started: %date% %time%>> "%LOG%"
    cd /d "%AI_DIR%\promptfoo"

    call npx promptfoo eval --providers "ollama:chiro-no-sft-dpo-v7" "ollama:chiro-no-sft-dpo-v6" --output results\v7-vs-v6-comparison.json --no-cache >> "%LOG%" 2>&1
    call npx promptfoo eval -c suites\clinical-safety.yaml --providers "ollama:chiro-no-sft-dpo-v7" --output results\v7-safety.json --no-cache >> "%LOG%" 2>&1

    set EVAL_OK=1
    echo [10/10] Evaluation COMPLETE
    echo [10/10] Eval COMPLETE: %date% %time%>> "%LOG%"
) else (
    echo [10/10] SKIPPED - merge failed
)

REM ============================================================
REM Restore sleep settings
REM ============================================================
:RESTORE_SLEEP
echo.
echo Restoring Windows sleep settings...
powershell -Command "powercfg -change -standby-timeout-ac 30; powercfg -change -monitor-timeout-ac 15" 2>nul
echo Sleep settings restored (30 min standby, 15 min monitor).

REM ============================================================
REM FINAL SUMMARY
REM ============================================================
echo.
echo ============================================================
echo  v7 TRAINING COMPLETE - %date% %time%
echo ============================================================
echo  SFT:    %SFT_OK% (1=OK, 0=FAIL) - attempts: %SFT_ATTEMPT%
echo  DPO:    %DPO_OK%
echo  Merge:  %MERGE_OK%
echo  Eval:   %EVAL_OK%
echo ============================================================
echo.
echo  Log: %LOG%
echo  Morning review: cd promptfoo ^& npx promptfoo view
echo ============================================================
echo.
echo FINAL SUMMARY>> "%LOG%"
echo SFT=%SFT_OK% DPO=%DPO_OK% MERGE=%MERGE_OK% EVAL=%EVAL_OK%>> "%LOG%"
echo Finished: %date% %time%>> "%LOG%"

echo.
echo Press any key to exit...
pause >nul

endlocal
