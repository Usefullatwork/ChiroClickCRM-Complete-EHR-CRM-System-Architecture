#!/bin/bash
# ============================================================
# ChiroClick LoRA v4 Overnight Training Script
# ============================================================
# Trains Norwegian (7B) + chiro-no (7B) back-to-back
# Expected total time: ~9-10 hours on RTX 4070 12GB
#
# USAGE:
#   cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training
#   bash train-overnight-v4.sh 2>&1 | tee overnight-v4-run.log
#
# BEFORE RUNNING:
#   1. Close all GPU-heavy apps (browsers with HW accel, games, etc.)
#   2. Ollama will be killed automatically by this script
#   3. Keep the terminal open — do NOT close it
#
# VRAM NOTE (RTX 4070 12GB):
#   7B Qwen2.5 + LoRA + 4-bit = ~10.85GB VRAM after load.
#   batch_size=2 causes silent OOM kill on Windows (no Python exception).
#   batch_size=1 + gradient_accumulation_steps=2 = same effective batch,
#   but peak VRAM stays within the 12GB budget.
# ============================================================

set -uo pipefail
# NOTE: set -e intentionally omitted — each model training is wrapped in
# its own error handler so Norwegian failure doesn't prevent chiro-no.

AI_DIR="/c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training"
PYTHON="$AI_DIR/ml-env/Scripts/python.exe"
OLLAMA="/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe"
BASE_7B="/c/Users/MadsF/.cache/huggingface/hub/models--Qwen--Qwen2.5-7B-Instruct/snapshots/a09a35458c702b33eeacc393d103063234e8bc28"
LOG_DIR="$AI_DIR/logs"

export PYTHONIOENCODING=utf-8
export PYTHONUNBUFFERED=1

NORWEGIAN_OK=false
CHIRONO_OK=false
MAX_RETRIES=2  # Up to 2 retries (3 total attempts) from checkpoint

# ============================================================
# train_model: Train with auto-retry from checkpoint on failure
# ============================================================
# Usage: train_model <model_key> <label> <data_dir> <extra_args...>
# Sets TRAIN_RESULT=true on success, false on failure
train_model() {
  local model_key="$1"
  local label="$2"
  local data_dir="$3"
  TRAIN_RESULT=false

  local attempt=1
  local max_attempts=$((MAX_RETRIES + 1))
  local resume_flag=""

  while [ $attempt -le $max_attempts ]; do
    if [ $attempt -eq 1 ]; then
      echo "      Attempt $attempt/$max_attempts (fresh start)"
    else
      echo "      Attempt $attempt/$max_attempts (resuming from last checkpoint)"
      resume_flag="--resume"

      # Brief GPU cooldown before retry
      echo "      Waiting 15s for GPU memory to clear before retry..."
      sleep 15
    fi

    if "$PYTHON" train_unsloth.py \
      --model "$model_key" --epochs 1 --batch-size 1 --max-seq-length 1024 \
      --no-packing --data-dir "$data_dir" \
      --output ../models --log-dir ../logs --quantize q4_k_m \
      --gradient-accumulation-steps 2 --save-steps 100 \
      $resume_flag \
      2>&1 | tee "$LOG_DIR/${label}-v4-$(date '+%Y%m%d-%H%M%S')-attempt${attempt}.log"; then
      TRAIN_RESULT=true
      return 0
    fi

    echo ""
    echo "      WARNING: $label attempt $attempt FAILED at $(date '+%Y-%m-%d %H:%M:%S')"

    # Check if any checkpoint exists for retry to be useful
    local checkpoint_dir="$AI_DIR/models/${label}"
    if [ $attempt -lt $max_attempts ]; then
      if ls "$checkpoint_dir"/checkpoint-* 1>/dev/null 2>&1; then
        local latest_ckpt=$(ls -d "$checkpoint_dir"/checkpoint-* 2>/dev/null | sort -t- -k2 -n | tail -1)
        echo "      Found checkpoint: $(basename "$latest_ckpt") — will retry from there"
      else
        echo "      No checkpoint found — retry would restart from scratch"
        # Still retry: the failure might have been a transient OS issue
      fi
    fi

    attempt=$((attempt + 1))
  done

  echo "      FAILED after $max_attempts attempts."
  return 1
}

echo "============================================================"
echo "ChiroClick v4 Overnight Training"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Max retries per model: $MAX_RETRIES (from checkpoint)"
echo "Checkpoint interval: every 100 steps"
echo "============================================================"
echo ""

# Kill Ollama to free GPU
echo "[1/8] Killing Ollama to free GPU memory..."
taskkill //F //IM ollama.exe 2>/dev/null || true
taskkill //F //IM ollama_llama_server.exe 2>/dev/null || true
sleep 3
echo "      Ollama stopped."
echo ""

# ============================================================
# MODEL 1: Norwegian (7B) — ~3.5 hours
# ============================================================
echo "============================================================"
echo "[2/8] TRAINING: chiro-norwegian (7B, norwegian-clinical)"
echo "      Data: $AI_DIR/data/processed-v4/norwegian-clinical"
echo "      batch_size=1, grad_accum=2 (effective batch=2)"
echo "      Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

cd "$AI_DIR/training"
if train_model "norwegian" "chiro-norwegian" "../data/processed-v4/norwegian-clinical"; then
  NORWEGIAN_OK=true
  echo ""
  echo "[2/8] Norwegian training COMPLETE at $(date '+%Y-%m-%d %H:%M:%S')"
else
  echo ""
  echo "[2/8] WARNING: Norwegian training FAILED after all retries at $(date '+%Y-%m-%d %H:%M:%S')"
  echo "      Continuing to chiro-no training..."
fi
echo ""

# Brief pause to let GPU memory clear
echo "[3/8] Waiting 30s for GPU memory to fully release..."
sleep 30

# ============================================================
# MODEL 2: chiro-no (7B, general-clinical) — THE CRITICAL MODEL
# ============================================================
echo "============================================================"
echo "[4/8] TRAINING: chiro-no (7B, general-clinical) — CRITICAL"
echo "      Data: $AI_DIR/data/processed-v4/general-clinical"
echo "      batch_size=1, grad_accum=2 (effective batch=2)"
echo "      Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

if train_model "default" "chiro-no" "../data/processed-v4/general-clinical"; then
  CHIRONO_OK=true
  echo ""
  echo "[4/8] chiro-no training COMPLETE at $(date '+%Y-%m-%d %H:%M:%S')"
else
  echo ""
  echo "[4/8] WARNING: chiro-no training FAILED after all retries at $(date '+%Y-%m-%d %H:%M:%S')"
fi
echo ""

# ============================================================
# Training Summary
# ============================================================
echo "============================================================"
echo "TRAINING SUMMARY"
echo "  Norwegian: $( $NORWEGIAN_OK && echo 'SUCCESS' || echo 'FAILED' )"
echo "  chiro-no:  $( $CHIRONO_OK && echo 'SUCCESS' || echo 'FAILED' )"
echo "============================================================"
echo ""

if ! $NORWEGIAN_OK && ! $CHIRONO_OK; then
  echo "ERROR: Both models failed. Skipping deployment."
  echo "Check logs in $LOG_DIR for details."
  exit 1
fi

# ============================================================
# DEPLOY: Convert LoRA adapters to GGUF
# ============================================================
if $NORWEGIAN_OK; then
  echo "============================================================"
  echo "[5/8] Converting Norwegian LoRA to GGUF adapter..."
  echo "============================================================"

  "$PYTHON" "$AI_DIR/llama-cpp-convert/convert_lora_to_gguf.py" \
    "$AI_DIR/models/chiro-norwegian-lora" \
    --outfile "$AI_DIR/models/gguf/chiro-norwegian-lora-adapter-v4.gguf" \
    --outtype f16 --base "$BASE_7B"

  echo "[5/8] Norwegian GGUF adapter created."
  echo ""
else
  echo "[5/8] SKIPPED: Norwegian GGUF (training failed)"
  echo ""
fi

if $CHIRONO_OK; then
  echo "============================================================"
  echo "[6/8] Converting chiro-no LoRA to GGUF adapter..."
  echo "============================================================"

  "$PYTHON" "$AI_DIR/llama-cpp-convert/convert_lora_to_gguf.py" \
    "$AI_DIR/models/chiro-no-lora" \
    --outfile "$AI_DIR/models/gguf/chiro-no-lora-adapter-v4.gguf" \
    --outtype f16 --base "$BASE_7B"

  echo "[6/8] chiro-no GGUF adapter created."
  echo ""
else
  echo "[6/8] SKIPPED: chiro-no GGUF (training failed)"
  echo ""
fi

# ============================================================
# DEPLOY: Create Ollama models
# ============================================================
if $NORWEGIAN_OK || $CHIRONO_OK; then
  echo "============================================================"
  echo "[7/8] Starting Ollama and deploying models..."
  echo "============================================================"

  # Start Ollama
  "$OLLAMA" serve > /dev/null 2>&1 &
  sleep 5

  cd "$AI_DIR/models/gguf"

  if $NORWEGIAN_OK; then
    echo "      Deploying chiro-norwegian-lora-v4..."
    "$OLLAMA" create chiro-norwegian-lora-v4 -f Modelfile.chiro-norwegian-lora-v4
    echo "      Done."
  fi

  if $CHIRONO_OK; then
    echo "      Deploying chiro-no-lora-v4..."
    "$OLLAMA" create chiro-no-lora-v4 -f Modelfile.chiro-no-lora-v4
    echo "      Done."
  fi
else
  echo "[7/8] SKIPPED: No models to deploy."
fi

echo ""
echo "============================================================"
echo "[8/8] ALL DONE!"
echo "      Finished: $(date '+%Y-%m-%d %H:%M:%S')"
echo "      Norwegian: $( $NORWEGIAN_OK && echo 'DEPLOYED' || echo 'FAILED' )"
echo "      chiro-no:  $( $CHIRONO_OK && echo 'DEPLOYED' || echo 'FAILED' )"
echo "============================================================"
echo ""
if $NORWEGIAN_OK || $CHIRONO_OK; then
  echo "Models deployed to Ollama:"
  "$OLLAMA" list | grep "v4" || true
  echo ""
fi
echo "NEXT STEPS:"
echo "  1. Evaluate: python evaluation/evaluate.py --model chiro-no-lora-v4 --compare --model-b chiro-no-lora-v2"
echo "  2. Evaluate: python evaluation/evaluate.py --model chiro-norwegian-lora-v4 --compare --model-b chiro-norwegian-lora-v2"
echo "  3. Update .env to use v4 models"
echo ""
