# ============================================================
# ChiroClick v8 Weekend Training Script (PowerShell)
# ============================================================
# Full pipeline: Kill GPU hogs → SFT → Eval SFT → DPO → Merge+Deploy → Final Eval
# Expected total time: ~8-10 hours on RTX 4070 12GB
#
# USAGE:
#   cd C:\Users\MadsF\Desktop\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\ai-training
#   powershell -ExecutionPolicy Bypass -File train-v8-weekend.ps1
#
# BEFORE RUNNING:
#   1. Run data merge: python scripts/merge_v8_data.py
#   2. Close GPU-heavy apps (browsers with HW accel, games)
#   3. Ollama will be killed automatically
#   4. Keep the terminal open — do NOT close it
# ============================================================

$ErrorActionPreference = "Continue"

# ============================================================
# Configuration
# ============================================================
$AI_DIR = $PSScriptRoot
$PYTHON = Join-Path $AI_DIR "ml-env\Scripts\python.exe"
$OLLAMA = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
$LOG_DIR = Join-Path $AI_DIR "logs"
$MODELS_DIR = Join-Path $AI_DIR "models"

$SFT_DATA = Join-Path $AI_DIR "data\processed-v8\combined-sft"
$DPO_DATA = Join-Path $AI_DIR "data\processed-v8\combined-dpo"

$VERSION = "v8"
$MODEL_NAME = "chiro-no-sft-dpo-v8"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$LOG_FILE = Join-Path $LOG_DIR "weekend-v8-$TIMESTAMP.log"

$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUNBUFFERED = "1"

# Phase status tracking
$PhaseResults = @{
    SFT   = "SKIPPED"
    EVAL1 = "SKIPPED"
    DPO   = "SKIPPED"
    MERGE = "SKIPPED"
    EVAL2 = "SKIPPED"
}

$OverallStart = Get-Date

# ============================================================
# Logging
# ============================================================
if (-not (Test-Path $LOG_DIR)) { New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null }

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $ts = Get-Date -Format "HH:mm:ss"
    $line = "$ts [$Level] $Message"
    Write-Host $line
    Add-Content -Path $LOG_FILE -Value $line -Encoding UTF8
}

function Write-Phase {
    param([string]$Phase, [string]$Message)
    $separator = "=" * 60
    Write-Log $separator
    Write-Log "  $Phase"
    Write-Log "  $Message"
    Write-Log $separator
}

function Get-ElapsedStr {
    param([datetime]$Start)
    $elapsed = (Get-Date) - $Start
    return "{0:D2}h {1:D2}m {2:D2}s" -f $elapsed.Hours, $elapsed.Minutes, $elapsed.Seconds
}

# ============================================================
# GPU Health Check
# ============================================================
function Test-GPU {
    Write-Log "GPU health check..."
    try {
        $smi = nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,temperature.gpu,utilization.gpu --format=csv,noheader,nounits 2>&1
        if ($LASTEXITCODE -eq 0) {
            $parts = $smi -split ","
            $gpuName = $parts[0].Trim()
            $memTotal = [int]$parts[1].Trim()
            $memUsed = [int]$parts[2].Trim()
            $memFree = [int]$parts[3].Trim()
            $temp = [int]$parts[4].Trim()
            $util = $parts[5].Trim()
            Write-Log "  GPU: $gpuName"
            Write-Log "  VRAM: ${memUsed}MB / ${memTotal}MB (${memFree}MB free)"
            Write-Log "  Temp: ${temp}C, Utilization: ${util}%"

            if ($memFree -lt 8000) {
                Write-Log "WARNING: Less than 8GB VRAM free ($memFree MB). Training may OOM." "WARN"
            }
            if ($temp -gt 85) {
                Write-Log "WARNING: GPU temperature ${temp}C is high. Consider cooling." "WARN"
            }
            return $true
        }
    } catch {
        Write-Log "nvidia-smi not available: $_" "WARN"
    }
    return $false
}

# ============================================================
# Header
# ============================================================
Write-Log "############################################################"
Write-Log "  ChiroClick v8 Weekend Training"
Write-Log "  Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Log "  Log: $LOG_FILE"
Write-Log "  SFT data: $SFT_DATA"
Write-Log "  DPO data: $DPO_DATA"
Write-Log "  Target model: $MODEL_NAME"
Write-Log "############################################################"
Write-Log ""

# ============================================================
# PHASE 1: Free GPU Memory
# ============================================================
$phase1Start = Get-Date
Write-Phase "PHASE 1/6" "Free GPU Memory"

Write-Log "Killing Ollama..."
Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "ollama_llama_server" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Log "Killing known memory hogs..."
Stop-Process -Name "msedge" -Force -ErrorAction SilentlyContinue
# NEVER kill: nvcontainer.exe, dwm.exe, csrss.exe, explorer.exe

Write-Log "Preventing Windows sleep during training..."
try {
    powercfg -change -standby-timeout-ac 0
    powercfg -change -monitor-timeout-ac 0
    powercfg -change -hibernate-timeout-ac 0
    Write-Log "  Sleep/hibernate disabled."
} catch {
    Write-Log "  Could not disable sleep: $_" "WARN"
}

Start-Sleep -Seconds 5
Test-GPU | Out-Null

Write-Log "Phase 1 complete ($(Get-ElapsedStr $phase1Start))"
Write-Log ""

# ============================================================
# PHASE 2: SFT Training
# ============================================================
$phase2Start = Get-Date
Write-Phase "PHASE 2/6" "SFT Training (3 epochs, batch=2, grad_accum=4)"

# Verify data exists
if (-not (Test-Path (Join-Path $SFT_DATA "train.jsonl"))) {
    Write-Log "ERROR: SFT training data not found at $SFT_DATA" "ERROR"
    Write-Log "Run: python scripts/merge_v8_data.py first" "ERROR"
    $PhaseResults.SFT = "FAILED"
} else {
    $trainLines = (Get-Content (Join-Path $SFT_DATA "train.jsonl") | Measure-Object -Line).Lines
    $valLines = (Get-Content (Join-Path $SFT_DATA "validation.jsonl") | Measure-Object -Line).Lines
    Write-Log "SFT data: $trainLines train, $valLines validation"

    Test-GPU | Out-Null

    Write-Log "Starting SFT training..."
    Write-Log "  Model: Qwen/Qwen2.5-7B-Instruct (default)"
    Write-Log "  Params: epochs=3, batch=2, grad_accum=4, seq_len=1024, low-vram"
    Write-Log "  Estimated time: ~3-4 hours"

    try {
        & $PYTHON (Join-Path $AI_DIR "training\train_unsloth.py") `
            --model default `
            --data-dir $SFT_DATA `
            --output $MODELS_DIR `
            --log-dir $LOG_DIR `
            --epochs 3 `
            --batch-size 2 `
            --gradient-accumulation-steps 4 `
            --max-seq-length 1024 `
            --save-steps 200 `
            --low-vram `
            --skip-export 2>&1 | ForEach-Object {
                Write-Log $_
            }

        if ($LASTEXITCODE -eq 0) {
            $PhaseResults.SFT = "SUCCESS"
            Write-Log "SFT training COMPLETE ($(Get-ElapsedStr $phase2Start))"
        } else {
            $PhaseResults.SFT = "FAILED"
            Write-Log "SFT training FAILED with exit code $LASTEXITCODE" "ERROR"
        }
    } catch {
        $PhaseResults.SFT = "FAILED"
        Write-Log "SFT training ERROR: $_" "ERROR"
    }
}

Write-Log "Phase 2 result: $($PhaseResults.SFT) ($(Get-ElapsedStr $phase2Start))"
Write-Log ""

# GPU cooldown
if ($PhaseResults.SFT -eq "SUCCESS") {
    Write-Log "GPU cooldown (30s before eval)..."
    Start-Sleep -Seconds 30
}

# ============================================================
# PHASE 3: Evaluate SFT Checkpoint
# ============================================================
$phase3Start = Get-Date
Write-Phase "PHASE 3/6" "Evaluate SFT Checkpoint"

if ($PhaseResults.SFT -ne "SUCCESS") {
    Write-Log "SKIPPED: SFT training failed" "WARN"
} else {
    Write-Log "Starting Ollama for SFT eval..."
    try {
        Start-Process -FilePath $OLLAMA -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 15
        Write-Log "Ollama started."

        # Find latest SFT LoRA and create temp Ollama model for eval
        $sftLoraDir = Join-Path $MODELS_DIR "chiro-no-lora"
        if (Test-Path $sftLoraDir) {
            Write-Log "SFT LoRA found at $sftLoraDir"
            Write-Log "SFT checkpoint eval — will be done after merge in Phase 6"
            $PhaseResults.EVAL1 = "DEFERRED"
        } else {
            Write-Log "SFT LoRA not found at $sftLoraDir — skipping intermediate eval" "WARN"
            $PhaseResults.EVAL1 = "SKIPPED"
        }

        # Kill Ollama again to free GPU for DPO
        Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "ollama_llama_server" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 5
    } catch {
        Write-Log "Eval setup error: $_" "WARN"
        $PhaseResults.EVAL1 = "SKIPPED"
    }
}

Write-Log "Phase 3 result: $($PhaseResults.EVAL1) ($(Get-ElapsedStr $phase3Start))"
Write-Log ""

# ============================================================
# PHASE 4: DPO Training
# ============================================================
$phase4Start = Get-Date
Write-Phase "PHASE 4/6" "DPO Training (2 epochs, batch=1, grad_accum=8, beta=0.1)"

if ($PhaseResults.SFT -ne "SUCCESS") {
    Write-Log "SKIPPED: SFT training failed" "WARN"
} else {
    # Verify DPO data exists
    if (-not (Test-Path (Join-Path $DPO_DATA "train.jsonl"))) {
        Write-Log "ERROR: DPO training data not found at $DPO_DATA" "ERROR"
        $PhaseResults.DPO = "FAILED"
    } else {
        $dpoTrainLines = (Get-Content (Join-Path $DPO_DATA "train.jsonl") | Measure-Object -Line).Lines
        $dpoValLines = (Get-Content (Join-Path $DPO_DATA "validation.jsonl") | Measure-Object -Line).Lines
        Write-Log "DPO data: $dpoTrainLines train, $dpoValLines validation"

        Test-GPU | Out-Null

        Write-Log "Starting DPO training..."
        Write-Log "  Params: epochs=2, batch=1, grad_accum=8, lr=5e-5, beta=0.1"
        Write-Log "  Estimated time: ~2-3 hours"

        try {
            & $PYTHON (Join-Path $AI_DIR "training\train_dpo.py") `
                --model default `
                --data-dir $DPO_DATA `
                --epochs 2 `
                --batch-size 1 `
                --grad-accum 8 `
                --lr 5e-5 `
                --beta 0.1 2>&1 | ForEach-Object {
                    Write-Log $_
                }

            if ($LASTEXITCODE -eq 0) {
                $PhaseResults.DPO = "SUCCESS"
                Write-Log "DPO training COMPLETE ($(Get-ElapsedStr $phase4Start))"
            } else {
                $PhaseResults.DPO = "FAILED"
                Write-Log "DPO training FAILED with exit code $LASTEXITCODE" "ERROR"
            }
        } catch {
            $PhaseResults.DPO = "FAILED"
            Write-Log "DPO training ERROR: $_" "ERROR"
        }
    }
}

Write-Log "Phase 4 result: $($PhaseResults.DPO) ($(Get-ElapsedStr $phase4Start))"
Write-Log ""

# GPU cooldown
if ($PhaseResults.DPO -eq "SUCCESS") {
    Write-Log "GPU cooldown (30s before merge)..."
    Start-Sleep -Seconds 30
}

# ============================================================
# PHASE 5: Merge SFT+DPO → GGUF → Ollama Deploy
# ============================================================
$phase5Start = Get-Date
Write-Phase "PHASE 5/6" "Merge SFT+DPO -> GGUF Q8_0 -> Ollama Deploy"

if ($PhaseResults.SFT -ne "SUCCESS") {
    Write-Log "SKIPPED: SFT training failed" "WARN"
} else {
    Test-GPU | Out-Null

    $mergeArgs = @("--version", $VERSION)
    if ($PhaseResults.DPO -ne "SUCCESS") {
        Write-Log "DPO failed — merge will use SFT-only weights" "WARN"
    }

    Write-Log "Starting merge + GGUF conversion + Ollama deploy..."
    Write-Log "  Estimated time: ~30-60 minutes"

    try {
        & $PYTHON (Join-Path $AI_DIR "scripts\merge_sft_dpo_v7.py") @mergeArgs 2>&1 | ForEach-Object {
            Write-Log $_
        }

        if ($LASTEXITCODE -eq 0) {
            $PhaseResults.MERGE = "SUCCESS"
            Write-Log "Merge + deploy COMPLETE ($(Get-ElapsedStr $phase5Start))"
        } else {
            $PhaseResults.MERGE = "FAILED"
            Write-Log "Merge + deploy FAILED with exit code $LASTEXITCODE" "ERROR"
        }
    } catch {
        $PhaseResults.MERGE = "FAILED"
        Write-Log "Merge ERROR: $_" "ERROR"
    }
}

Write-Log "Phase 5 result: $($PhaseResults.MERGE) ($(Get-ElapsedStr $phase5Start))"
Write-Log ""

# ============================================================
# PHASE 6: Final Evaluation
# ============================================================
$phase6Start = Get-Date
Write-Phase "PHASE 6/6" "Final Evaluation (v8 vs v6, best-of-3)"

if ($PhaseResults.MERGE -ne "SUCCESS") {
    Write-Log "SKIPPED: Merge/deploy failed" "WARN"
} else {
    # Ensure Ollama is running
    Write-Log "Ensuring Ollama is running..."
    try {
        Start-Process -FilePath $OLLAMA -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 15
    } catch {
        Write-Log "Ollama may already be running" "WARN"
    }

    $evalOutput = Join-Path $AI_DIR "evaluation\v8-weekend-final.json"

    Write-Log "Running final evaluation (best-of-3)..."
    Write-Log "  Model: $MODEL_NAME"
    Write-Log "  Output: $evalOutput"

    try {
        & $PYTHON (Join-Path $AI_DIR "evaluation\evaluate.py") `
            --model $MODEL_NAME `
            --runs 3 `
            --output $evalOutput `
            --save-baseline `
            --verbose 2>&1 | ForEach-Object {
                Write-Log $_
            }

        if ($LASTEXITCODE -eq 0) {
            $PhaseResults.EVAL2 = "SUCCESS"
            Write-Log "Final evaluation COMPLETE ($(Get-ElapsedStr $phase6Start))"

            # Show results summary
            if (Test-Path $evalOutput) {
                try {
                    $results = Get-Content $evalOutput -Raw | ConvertFrom-Json
                    $summary = $results.model_a.summary
                    Write-Log ""
                    Write-Log "  ========================================="
                    Write-Log "  EVAL RESULTS: $MODEL_NAME"
                    Write-Log "  Pass rate: $($summary.passed)/$($summary.total) ($($summary.pass_rate)%)"
                    Write-Log "  Avg partial score: $($summary.avg_partial_score)/100"
                    Write-Log "  Avg latency: $($summary.avg_latency_ms)ms"
                    Write-Log "  ========================================="
                } catch {
                    Write-Log "Could not parse eval results: $_" "WARN"
                }
            }
        } else {
            $PhaseResults.EVAL2 = "FAILED"
            Write-Log "Final evaluation FAILED with exit code $LASTEXITCODE" "ERROR"
        }
    } catch {
        $PhaseResults.EVAL2 = "FAILED"
        Write-Log "Eval ERROR: $_" "ERROR"
    }

    # Also run comparison against v6 if available
    Write-Log ""
    Write-Log "Running v8 vs v6 comparison..."
    $compOutput = Join-Path $AI_DIR "evaluation\v8-vs-v6-comparison.json"
    try {
        & $PYTHON (Join-Path $AI_DIR "evaluation\evaluate.py") `
            --model $MODEL_NAME `
            --model-b "chiro-no-sft-dpo-v6" `
            --compare `
            --runs 1 `
            --output $compOutput 2>&1 | ForEach-Object {
                Write-Log $_
            }
        Write-Log "Comparison complete. Results: $compOutput"
    } catch {
        Write-Log "v6 comparison failed (v6 model may not be available): $_" "WARN"
    }
}

Write-Log "Phase 6 result: $($PhaseResults.EVAL2) ($(Get-ElapsedStr $phase6Start))"
Write-Log ""

# ============================================================
# Restore sleep settings
# ============================================================
Write-Log "Restoring Windows sleep settings..."
try {
    powercfg -change -standby-timeout-ac 30
    powercfg -change -monitor-timeout-ac 15
    powercfg -change -hibernate-timeout-ac 180
    Write-Log "  Sleep settings restored."
} catch {
    Write-Log "  Could not restore sleep settings: $_" "WARN"
}

# ============================================================
# FINAL SUMMARY
# ============================================================
$overallElapsed = (Get-Date) - $OverallStart

Write-Log ""
Write-Log "############################################################"
Write-Log "  v8 WEEKEND TRAINING — FINAL SUMMARY"
Write-Log "############################################################"
Write-Log "  Started:  $(Get-Date $OverallStart -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Log "  Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Log "  Duration: $(Get-ElapsedStr $OverallStart)"
Write-Log ""
Write-Log "  Phase 1 (GPU Free):     OK"
Write-Log "  Phase 2 (SFT):          $($PhaseResults.SFT)"
Write-Log "  Phase 3 (SFT Eval):     $($PhaseResults.EVAL1)"
Write-Log "  Phase 4 (DPO):          $($PhaseResults.DPO)"
Write-Log "  Phase 5 (Merge+Deploy): $($PhaseResults.MERGE)"
Write-Log "  Phase 6 (Final Eval):   $($PhaseResults.EVAL2)"
Write-Log ""

if ($PhaseResults.MERGE -eq "SUCCESS") {
    Write-Log "  Model deployed: $MODEL_NAME"
    Write-Log ""
    Write-Log "  Current Ollama models:"
    try {
        & $OLLAMA list 2>&1 | ForEach-Object { Write-Log "    $_" }
    } catch {
        Write-Log "    (could not list models)" "WARN"
    }
}

Write-Log ""
Write-Log "  MORNING REVIEW:"
Write-Log "    1. Check eval results: $AI_DIR\evaluation\v8-weekend-final.json"
Write-Log "    2. Check loss curves in log: $LOG_FILE"
Write-Log "    3. Run comparison: python evaluation/evaluate.py --model $MODEL_NAME --model-b chiro-no-sft-dpo-v6 --compare --verbose"
Write-Log ""
Write-Log "  SUCCESS CRITERIA:"
Write-Log "    - v8 eval >= 95% on original 100 cases"
Write-Log "    - v8 eval >= 85% on v2.1 20 cases"
Write-Log "    - No safety regressions"
Write-Log ""
Write-Log "  ROLLBACK (if v8 fails criteria):"
Write-Log "    v6 GGUF untouched: $AI_DIR\models\gguf\chiro-no-sft-dpo-v6.gguf"
Write-Log "    v6 still in Ollama: ollama run chiro-no-sft-dpo-v6"
Write-Log ""
Write-Log "  Full training log: $LOG_FILE"
Write-Log "############################################################"
