#!/usr/bin/env bash
# ============================================================
# Post-Training Auto-Deploy Script
# ============================================================
# Monitors the training process (PID from nvidia-smi) and when
# it finishes, converts the LoRA adapter to GGUF and deploys
# to Ollama automatically.
#
# Usage: bash post-training-deploy.sh
# ============================================================

set -uo pipefail

AI_DIR="/c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training"
PYTHON="$AI_DIR/ml-env/Scripts/python.exe"
OLLAMA="/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe"
BASE_7B="/c/Users/MadsF/.cache/huggingface/hub/models--Qwen--Qwen2.5-7B-Instruct/snapshots/a09a35458c702b33eeacc393d103063234e8bc28"
MODELS_DIR="$AI_DIR/models"
GGUF_DIR="$MODELS_DIR/gguf"
LOG_FILE="$AI_DIR/logs/post-training-deploy-$(date '+%Y%m%d-%H%M%S').log"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

log "============================================================"
log "Post-Training Auto-Deploy Monitor"
log "============================================================"
log "Waiting for training to complete..."
log ""

# ============================================================
# Phase 1: Wait for training process to finish
# ============================================================
# Poll every 60 seconds until GPU utilization drops below 50%
# (training keeps it at 99%)

WAIT_COUNT=0
while true; do
  GPU_UTIL=$("/c/Windows/System32/nvidia-smi.exe" --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null || echo "0")
  GPU_UTIL=$(echo "$GPU_UTIL" | tr -d ' ')

  if [ "$GPU_UTIL" -lt 50 ] 2>/dev/null; then
    # Double-check: wait 30s and check again to avoid false positives
    log "GPU utilization dropped to ${GPU_UTIL}%. Verifying..."
    sleep 30
    GPU_UTIL2=$("/c/Windows/System32/nvidia-smi.exe" --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null || echo "0")
    GPU_UTIL2=$(echo "$GPU_UTIL2" | tr -d ' ')
    if [ "$GPU_UTIL2" -lt 50 ] 2>/dev/null; then
      log "Confirmed: Training appears complete (GPU at ${GPU_UTIL2}%)."
      break
    else
      log "False alarm — GPU back to ${GPU_UTIL2}%. Continuing to wait..."
    fi
  fi

  WAIT_COUNT=$((WAIT_COUNT + 1))
  if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
    log "Still training... GPU at ${GPU_UTIL}% (checked ${WAIT_COUNT} times)"
  fi
  sleep 60
done

log ""

# ============================================================
# Phase 2: Verify training produced new checkpoints
# ============================================================
log "============================================================"
log "Phase 2: Verifying training output"
log "============================================================"

LATEST_CKPT=$(ls -d "$MODELS_DIR/chiro-no"/checkpoint-* 2>/dev/null | sort -t- -k2 -n | tail -1)

if [ -z "$LATEST_CKPT" ]; then
  log "ERROR: No checkpoints found! Training may have failed."
  exit 1
fi

CKPT_NUM=$(basename "$LATEST_CKPT" | sed 's/checkpoint-//')
log "Latest checkpoint: checkpoint-$CKPT_NUM"

if [ "$CKPT_NUM" -le 2400 ] 2>/dev/null; then
  log "WARNING: No new checkpoints beyond 2400. Training may have failed."
  log "Check the training log for errors."
  exit 1
fi

log "Training progressed from checkpoint-2400 to checkpoint-$CKPT_NUM"
log ""

# ============================================================
# Phase 3: Convert LoRA adapter to GGUF
# ============================================================
log "============================================================"
log "Phase 3: Converting LoRA adapter to GGUF"
log "============================================================"

# The training script saves the final adapter as chiro-no-lora/ or uses the latest checkpoint
ADAPTER_DIR="$MODELS_DIR/chiro-no"

# Check if a final merged adapter directory exists (train_unsloth.py may create this)
if [ -d "$MODELS_DIR/chiro-no-lora" ]; then
  ADAPTER_DIR="$MODELS_DIR/chiro-no-lora"
  log "Using final adapter directory: chiro-no-lora"
else
  # Use latest checkpoint
  ADAPTER_DIR="$LATEST_CKPT"
  log "Using latest checkpoint: $(basename $LATEST_CKPT)"
fi

log "Converting to GGUF..."
if "$PYTHON" "$AI_DIR/llama-cpp-convert/convert_lora_to_gguf.py" \
  "$ADAPTER_DIR" \
  --outfile "$GGUF_DIR/chiro-no-lora-adapter-v4.gguf" \
  --outtype f16 --base "$BASE_7B" 2>&1 | tee -a "$LOG_FILE"; then
  log "GGUF adapter created successfully."
else
  log "ERROR: GGUF conversion failed!"
  log "You can retry manually:"
  log "  $PYTHON $AI_DIR/llama-cpp-convert/convert_lora_to_gguf.py $ADAPTER_DIR --outfile $GGUF_DIR/chiro-no-lora-adapter-v4.gguf --outtype f16 --base $BASE_7B"
  exit 1
fi

log ""

# ============================================================
# Phase 4: Deploy to Ollama
# ============================================================
log "============================================================"
log "Phase 4: Deploying to Ollama"
log "============================================================"

# Start Ollama if not running
if ! tasklist 2>/dev/null | grep -qi ollama; then
  log "Starting Ollama..."
  "$OLLAMA" serve > /dev/null 2>&1 &
  sleep 10
  log "Ollama started."
else
  log "Ollama already running."
fi

log "Creating chiro-no-lora-v4 model..."
cd "$GGUF_DIR"
if "$OLLAMA" create chiro-no-lora-v4 -f Modelfile.chiro-no-lora-v4 2>&1 | tee -a "$LOG_FILE"; then
  log "Model chiro-no-lora-v4 deployed successfully!"
else
  log "ERROR: Ollama model creation failed!"
  log "You can retry manually:"
  log "  cd $GGUF_DIR && $OLLAMA create chiro-no-lora-v4 -f Modelfile.chiro-no-lora-v4"
  exit 1
fi

log ""

# ============================================================
# Phase 5: Quick smoke test
# ============================================================
log "============================================================"
log "Phase 5: Smoke test"
log "============================================================"

log "Testing model response..."
RESPONSE=$("$OLLAMA" run chiro-no-lora-v4 "Skriv en kort subjektiv for en pasient med akutte nakkesmerter." 2>&1 | head -20)
log "Response preview:"
echo "$RESPONSE" | tee -a "$LOG_FILE"

log ""
log "============================================================"
log "ALL DONE!"
log "============================================================"
log "Finished: $(date '+%Y-%m-%d %H:%M:%S')"
log ""
log "Model deployed: chiro-no-lora-v4"
log "GGUF adapter: $GGUF_DIR/chiro-no-lora-adapter-v4.gguf"
log "Latest checkpoint: $LATEST_CKPT"
log ""
log "Available models:"
"$OLLAMA" list 2>/dev/null | grep -i chiro | tee -a "$LOG_FILE" || true
log ""
log "Next: Run evaluation"
log "  cd $AI_DIR && $PYTHON evaluation/evaluate.py --model chiro-no-lora-v4 --compare --model-b chiro-no-lora-v2 --verbose"
