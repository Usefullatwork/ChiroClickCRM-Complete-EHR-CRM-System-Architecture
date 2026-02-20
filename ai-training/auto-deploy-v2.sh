#!/usr/bin/env bash
# =============================================================
# Auto-Deploy Script — chiro-no-lora v2
# =============================================================
# Monitors training completion, then:
#   1. Converts LoRA adapter to GGUF
#   2. Creates Ollama Modelfile
#   3. Deploys as chiro-no-lora-v2
#   4. Runs evaluation vs v1 baseline
#
# Usage: bash auto-deploy-v2.sh
# =============================================================

set -euo pipefail

AI_DIR="/c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training"
MODELS_DIR="$AI_DIR/models"
GGUF_DIR="$MODELS_DIR/gguf"
LORA_DIR="$MODELS_DIR/chiro-no-lora"
PYTHON="$AI_DIR/ml-env/Scripts/python.exe"
OLLAMA="/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe"
BASE_MODEL_PATH="/c/Users/MadsF/.cache/huggingface/hub/models--Qwen--Qwen2.5-7B-Instruct/snapshots/a09a35458c702b33eeacc393d103063234e8bc28"
CONVERTER="$AI_DIR/llama-cpp-convert/convert_lora_to_gguf.py"
EVAL_SCRIPT="$AI_DIR/evaluation/evaluate.py"

ADAPTER_GGUF="$GGUF_DIR/chiro-no-lora-adapter-v2.gguf"
MODELFILE="$GGUF_DIR/Modelfile.chiro-no-lora-v2"
MODEL_NAME="chiro-no-lora-v2"

LOG_FILE="$AI_DIR/logs/auto-deploy-v2.log"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

# =============================================================
# Step 1: Wait for training to finish
# =============================================================
log "=== AUTO-DEPLOY v2 STARTED ==="
log "Waiting for training to complete..."
log "Watching for: $LORA_DIR/adapter_config.json"

while true; do
    # Check if the LoRA adapter has been saved (training export step)
    if [ -f "$LORA_DIR/adapter_config.json" ] && [ -f "$LORA_DIR/adapter_model.safetensors" ]; then
        # Make sure the file isn't still being written (check if size is stable)
        size1=$(stat -c%s "$LORA_DIR/adapter_model.safetensors" 2>/dev/null || stat -f%z "$LORA_DIR/adapter_model.safetensors" 2>/dev/null || echo "0")
        sleep 10
        size2=$(stat -c%s "$LORA_DIR/adapter_model.safetensors" 2>/dev/null || stat -f%z "$LORA_DIR/adapter_model.safetensors" 2>/dev/null || echo "0")

        if [ "$size1" = "$size2" ] && [ "$size1" != "0" ]; then
            log "Training complete! LoRA adapter found (${size1} bytes, stable)"
            break
        else
            log "Adapter file still being written... (${size1} -> ${size2})"
        fi
    fi

    # Also check if python training process is still running
    if ! /c/Windows/System32/tasklist.exe //FI "IMAGENAME eq python3.13.exe" //NH 2>/dev/null | grep -q python; then
        # Python stopped — check if adapter was saved
        if [ -f "$LORA_DIR/adapter_config.json" ]; then
            log "Training process ended. Adapter found."
            break
        else
            log "WARNING: Training process ended but no adapter found!"
            log "Checking for checkpoint fallback..."

            # Look for the latest checkpoint
            latest_ckpt=$(ls -td "$MODELS_DIR/chiro-no/checkpoint-"* 2>/dev/null | head -1)
            if [ -n "$latest_ckpt" ] && [ -f "$latest_ckpt/adapter_config.json" ]; then
                log "Found checkpoint at: $latest_ckpt"
                log "Copying checkpoint to $LORA_DIR"
                mkdir -p "$LORA_DIR"
                cp "$latest_ckpt"/* "$LORA_DIR/"
                break
            else
                log "ERROR: No adapter or checkpoint found. Training may have failed."
                log "Check training logs in: $AI_DIR/logs/"
                exit 1
            fi
        fi
    fi

    sleep 60
done

# Wait a bit for any final cleanup by the training script
sleep 30
log "Proceeding with deployment pipeline..."

# =============================================================
# Step 2: Convert LoRA adapter to GGUF
# =============================================================
log ""
log "=== STEP 2: Convert LoRA to GGUF ==="

if [ -f "$ADAPTER_GGUF" ]; then
    log "Renaming existing adapter GGUF to .bak"
    mv "$ADAPTER_GGUF" "${ADAPTER_GGUF}.bak"
fi

log "Running convert_lora_to_gguf.py..."
cd "$AI_DIR"
PYTHONIOENCODING=utf-8 "$PYTHON" "$CONVERTER" \
    "$LORA_DIR" \
    --outfile "$ADAPTER_GGUF" \
    --outtype f16 \
    --base "$BASE_MODEL_PATH" \
    2>&1 | tee -a "$LOG_FILE"

if [ ! -f "$ADAPTER_GGUF" ]; then
    log "ERROR: GGUF conversion failed — adapter file not created"
    exit 1
fi

adapter_size=$(stat -c%s "$ADAPTER_GGUF" 2>/dev/null || stat -f%z "$ADAPTER_GGUF" 2>/dev/null || echo "?")
log "Adapter GGUF created: $ADAPTER_GGUF ($adapter_size bytes)"

# =============================================================
# Step 3: Create Ollama Modelfile
# =============================================================
log ""
log "=== STEP 3: Create Modelfile ==="

cat > "$MODELFILE" << 'MODELFILE_EOF'
FROM qwen2.5:7b-instruct
ADAPTER ./chiro-no-lora-adapter-v2.gguf

# ChiroClick LoRA v2 fine-tuned model (quantized base + LoRA adapter)
# Base: Qwen/Qwen2.5-7B-Instruct (q4 quantized via Ollama)
# LoRA: v2 training, 1 epoch, 10610 examples (incl. red-flag, ICPC-2, comms v2)

TEMPLATE """{{- if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{- range .Messages }}<|im_start|>{{ .Role }}
{{ .Content }}<|im_end|>
{{ end }}<|im_start|>assistant
"""

PARAMETER temperature 0.3
PARAMETER top_p 0.85
PARAMETER top_k 40
PARAMETER num_ctx 4096
PARAMETER repeat_penalty 1.1
PARAMETER stop <|im_end|>
PARAMETER stop <|im_start|>

SYSTEM """Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge. Generer nøyaktige, profesjonelle kliniske dokumenter."""
MODELFILE_EOF

log "Modelfile written: $MODELFILE"

# =============================================================
# Step 4: Deploy to Ollama
# =============================================================
log ""
log "=== STEP 4: Deploy to Ollama ==="

# Start Ollama if not running
if ! "$OLLAMA" list > /dev/null 2>&1; then
    log "Starting Ollama serve..."
    "$OLLAMA" serve > /dev/null 2>&1 &
    sleep 5
fi

log "Creating model: $MODEL_NAME"
cd "$GGUF_DIR"
"$OLLAMA" create "$MODEL_NAME" -f "$MODELFILE" 2>&1 | tee -a "$LOG_FILE"

if "$OLLAMA" list 2>/dev/null | grep -q "$MODEL_NAME"; then
    log "Model deployed successfully: $MODEL_NAME"
else
    log "ERROR: Model deployment failed"
    exit 1
fi

# Quick smoke test
log "Smoke test..."
response=$("$OLLAMA" run "$MODEL_NAME" "Skriv subjektiv for nakkesmerter" 2>&1 | head -5)
log "Smoke test response (first 5 lines):"
echo "$response" | tee -a "$LOG_FILE"

# =============================================================
# Step 5: Run evaluation
# =============================================================
log ""
log "=== STEP 5: Run Evaluation ==="

EVAL_OUTPUT="$AI_DIR/evaluation/v2-eval-results.json"

log "Evaluating $MODEL_NAME vs chiro-no (base)..."
cd "$AI_DIR"
PYTHONIOENCODING=utf-8 "$PYTHON" "$EVAL_SCRIPT" \
    --model "$MODEL_NAME" \
    --compare --model-b chiro-no \
    --output "$EVAL_OUTPUT" \
    --verbose \
    2>&1 | tee -a "$LOG_FILE"

log ""
log "=== ALSO comparing vs v1 (chiro-no-lora) ==="

EVAL_OUTPUT_V1="$AI_DIR/evaluation/v2-vs-v1-eval-results.json"

# v1 might not be loaded — try to load it
"$OLLAMA" run chiro-no-lora "" > /dev/null 2>&1 || true
sleep 2

PYTHONIOENCODING=utf-8 "$PYTHON" "$EVAL_SCRIPT" \
    --model "$MODEL_NAME" \
    --compare --model-b chiro-no-lora \
    --output "$EVAL_OUTPUT_V1" \
    --verbose \
    2>&1 | tee -a "$LOG_FILE"

# =============================================================
# Done!
# =============================================================
log ""
log "=========================================="
log "  AUTO-DEPLOY COMPLETE"
log "=========================================="
log "Model: $MODEL_NAME"
log "Adapter: $ADAPTER_GGUF"
log "Eval results: $EVAL_OUTPUT"
log "Eval vs v1:   $EVAL_OUTPUT_V1"
log "Full log:     $LOG_FILE"
log ""
log "Next steps:"
log "  1. Review eval results"
log "  2. If improved, update .env AI_MODEL=chiro-no-lora-v2"
log "  3. Commit: git add -A ai-training && git commit"
log "=========================================="
