#!/usr/bin/env bash
# ============================================================
# ChiroClick Weekend Training Pipeline
# ============================================================
# Orchestrates: SFT v3 → Deploy → Eval → DPO → Deploy → Eval
#
# Usage:
#   bash train-weekend.sh              # Full pipeline
#   bash train-weekend.sh --dry-run    # Print commands without executing
#   bash train-weekend.sh --skip-sft   # Skip SFT, go straight to DPO
#   bash train-weekend.sh --only-eval  # Only run evaluations
#
# Prerequisites:
#   - Python virtual environment at ml-env/
#   - Ollama installed (will be killed before training)
#   - RTX 4070 12GB VRAM
#   - ~8-16h uninterrupted GPU time
#
# CRITICAL WARNINGS:
#   - NEVER kill nvcontainer.exe during training (10x slowdown)
#   - Kill Ollama before training to free GPU memory
#   - batch=2 + seq=1024 is the safe config for 12GB VRAM

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TRAINING_DIR="$SCRIPT_DIR/training"
MODELS_DIR="$SCRIPT_DIR/models"
GGUF_DIR="$MODELS_DIR/gguf"
EVAL_DIR="$SCRIPT_DIR/evaluation"
LOG_DIR="$SCRIPT_DIR/logs"
DATA_DIR="$SCRIPT_DIR/data/processed"
DPO_DIR="$SCRIPT_DIR/data/dpo"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/weekend-training-$TIMESTAMP.log"

DRY_RUN=false
SKIP_SFT=false
ONLY_EVAL=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --skip-sft) SKIP_SFT=true ;;
    --only-eval) ONLY_EVAL=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

# ============================================================
# Helper functions
# ============================================================

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

run_cmd() {
  if [ "$DRY_RUN" = true ]; then
    log "[DRY-RUN] $1"
    return 0
  fi
  log "[RUN] $1"
  eval "$1" 2>&1 | tee -a "$LOG_FILE"
  return ${PIPESTATUS[0]}
}

check_gpu() {
  log "Checking GPU availability..."
  if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader 2>&1 | tee -a "$LOG_FILE"
  else
    log "WARNING: nvidia-smi not found. GPU status unknown."
  fi
}

kill_ollama() {
  log "Killing Ollama to free GPU memory..."
  if [ "$DRY_RUN" = true ]; then
    log "[DRY-RUN] Would kill Ollama processes"
    return 0
  fi
  # Windows: use taskkill
  taskkill //F //IM ollama.exe 2>/dev/null || true
  taskkill //F //IM ollama_llama_server.exe 2>/dev/null || true
  sleep 5
  log "Ollama killed. GPU memory should be free."
}

start_ollama() {
  log "Starting Ollama..."
  if [ "$DRY_RUN" = true ]; then
    log "[DRY-RUN] Would start Ollama"
    return 0
  fi
  # Start Ollama in background (Windows)
  ollama serve &
  sleep 10
  log "Ollama started."
}

activate_env() {
  log "Activating Python environment..."
  if [ -f "$SCRIPT_DIR/ml-env/Scripts/activate" ]; then
    source "$SCRIPT_DIR/ml-env/Scripts/activate"
  elif [ -f "$SCRIPT_DIR/ml-env/bin/activate" ]; then
    source "$SCRIPT_DIR/ml-env/bin/activate"
  else
    log "WARNING: ml-env not found. Using system Python."
  fi
}

# ============================================================
# Phase 0: Preparation
# ============================================================

log "============================================================"
log "ChiroClick Weekend Training Pipeline"
log "============================================================"
log "Started: $(date)"
log "Dry run: $DRY_RUN"
log "Skip SFT: $SKIP_SFT"
log "Only eval: $ONLY_EVAL"
log "Log file: $LOG_FILE"
log ""

check_gpu
activate_env

# ============================================================
# Phase 1: Rebuild Dataset (with v2 upsampling)
# ============================================================

if [ "$ONLY_EVAL" = false ]; then
  log ""
  log "============================================================"
  log "Phase 1: Rebuilding dataset with v2 upsampling"
  log "============================================================"
  run_cmd "python '$SCRIPT_DIR/scripts/clean_and_prepare.py' --output-dir '$DATA_DIR'"
fi

# ============================================================
# Phase 2: SFT chiro-no v3
# ============================================================

if [ "$ONLY_EVAL" = false ] && [ "$SKIP_SFT" = false ]; then
  log ""
  log "============================================================"
  log "Phase 2: SFT Training — chiro-no v3"
  log "============================================================"
  log "Config: batch=2, seq=1024, epochs=1, lr=1.5e-4, cosine scheduler"
  log "Expected duration: 5-7 hours"
  log ""

  kill_ollama

  run_cmd "python '$TRAINING_DIR/train_unsloth.py' \
    --model default \
    --data-dir '$DATA_DIR/all-clean' \
    --epochs 1 \
    --batch-size 2 \
    --max-seq-length 1024 \
    --lr 1.5e-4"

  log "SFT chiro-no v3 training complete."

  # Convert LoRA adapter to GGUF format
  log "Converting LoRA adapter to GGUF..."
  CHIRO_NO_V3_DIR="$MODELS_DIR/chiro-no"
  if [ -d "$CHIRO_NO_V3_DIR" ]; then
    # Find the latest checkpoint
    LATEST_CKPT=$(ls -td "$CHIRO_NO_V3_DIR"/checkpoint-* 2>/dev/null | head -1)
    if [ -n "$LATEST_CKPT" ]; then
      log "Latest checkpoint: $LATEST_CKPT"
      run_cmd "python '$SCRIPT_DIR/llama-cpp-convert/convert_lora_to_gguf.py' \
        '$LATEST_CKPT' \
        --outfile '$GGUF_DIR/chiro-no-lora-adapter-v3.gguf' \
        --outtype f16"
    fi
  fi

  # Deploy to Ollama
  log "Deploying chiro-no-lora-v3 to Ollama..."
  cat > "$GGUF_DIR/Modelfile.chiro-no-lora-v3" << 'MODELFILE_EOF'
FROM qwen2.5:7b-instruct
ADAPTER ./chiro-no-lora-adapter-v3.gguf

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

SYSTEM """Du er en spesialisert klinisk assistent for kiropraktorer i Norge med kunnskap om SOAP-notater, diagnosekoding (ICPC-2), røde flagg, behandlingsplanlegging, og norsk medisinsk fagspråk. Bruk ICPC-2 koder (L01-L98, N01-N93) ved diagnoser. Klassifiser røde flagg som AKUTT/HENVIS/MONITORÉR/TRYGT. Svar alltid på norsk."""
MODELFILE_EOF

  start_ollama
  sleep 5

  run_cmd "cd '$GGUF_DIR' && ollama create chiro-no-lora-v3 -f Modelfile.chiro-no-lora-v3"

  # Evaluate v3
  log ""
  log "Evaluating chiro-no-lora-v3..."
  run_cmd "python '$EVAL_DIR/evaluate.py' \
    --model chiro-no-lora-v3 \
    --compare --model-b chiro-no-lora-v2 \
    --verbose \
    --output '$EVAL_DIR/baseline/chiro-no-lora-v3.json'"

  kill_ollama
fi

# ============================================================
# Phase 3: DPO Training
# ============================================================

if [ "$ONLY_EVAL" = false ]; then
  log ""
  log "============================================================"
  log "Phase 3: DPO Training — chiro-no"
  log "============================================================"
  log "Config: batch=1, seq=2048, epochs=2, lr=5e-5, beta=0.1"
  log "Expected duration: 3-5 hours"
  log ""

  # Check DPO data exists
  if [ ! -f "$DPO_DIR/train.jsonl" ]; then
    log "ERROR: DPO training data not found at $DPO_DIR/train.jsonl"
    log "Skipping DPO phase."
  else
    DPO_COUNT=$(wc -l < "$DPO_DIR/train.jsonl")
    log "DPO training pairs: $DPO_COUNT"

    run_cmd "python '$TRAINING_DIR/train_dpo.py' \
      --model default \
      --data-dir '$DPO_DIR' \
      --epochs 2 \
      --beta 0.1 \
      --learning-rate 5e-5"

    log "DPO training complete."

    # Deploy DPO model
    log "Deploying DPO model..."
    DPO_MODEL_DIR="$MODELS_DIR/chiro-no-dpo"
    if [ -d "$DPO_MODEL_DIR" ]; then
      run_cmd "python '$SCRIPT_DIR/llama-cpp-convert/convert_lora_to_gguf.py' \
        '$DPO_MODEL_DIR' \
        --outfile '$GGUF_DIR/chiro-no-dpo-adapter.gguf' \
        --outtype f16"

      start_ollama
      sleep 5

      cat > "$GGUF_DIR/Modelfile.chiro-no-dpo" << 'DPO_EOF'
FROM qwen2.5:7b-instruct
ADAPTER ./chiro-no-dpo-adapter.gguf

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

SYSTEM """Du er en spesialisert klinisk assistent for kiropraktorer i Norge med kunnskap om SOAP-notater, diagnosekoding (ICPC-2), røde flagg, behandlingsplanlegging, og norsk medisinsk fagspråk. Bruk ICPC-2 koder ved diagnoser. Klassifiser røde flagg som AKUTT/HENVIS/MONITORÉR/TRYGT. Svar alltid på norsk."""
DPO_EOF

      run_cmd "cd '$GGUF_DIR' && ollama create chiro-no-dpo -f Modelfile.chiro-no-dpo"

      # Evaluate DPO vs SFT-only
      log ""
      log "Evaluating DPO model vs SFT v3..."
      run_cmd "python '$EVAL_DIR/evaluate.py' \
        --model chiro-no-dpo \
        --compare --model-b chiro-no-lora-v3 \
        --verbose \
        --output '$EVAL_DIR/baseline/chiro-no-dpo.json'"

      kill_ollama
    fi
  fi
fi

# ============================================================
# Phase 4: SFT chiro-norwegian v3 (if time permits)
# ============================================================

if [ "$ONLY_EVAL" = false ] && [ "$SKIP_SFT" = false ]; then
  log ""
  log "============================================================"
  log "Phase 4: SFT Training — chiro-norwegian v3"
  log "============================================================"
  log "Expected duration: 3-5 hours"
  log ""

  kill_ollama

  run_cmd "python '$TRAINING_DIR/train_unsloth.py' \
    --model norwegian \
    --data-dir '$DATA_DIR/norwegian-clinical' \
    --epochs 1 \
    --batch-size 2 \
    --max-seq-length 1024 \
    --lr 1.5e-4"

  log "SFT chiro-norwegian v3 training complete."

  # Convert and deploy
  CHIRO_NO_V3_DIR="$MODELS_DIR/chiro-norwegian"
  if [ -d "$CHIRO_NO_V3_DIR" ]; then
    LATEST_CKPT=$(ls -td "$CHIRO_NO_V3_DIR"/checkpoint-* 2>/dev/null | head -1)
    if [ -n "$LATEST_CKPT" ]; then
      run_cmd "python '$SCRIPT_DIR/llama-cpp-convert/convert_lora_to_gguf.py' \
        '$LATEST_CKPT' \
        --outfile '$GGUF_DIR/chiro-norwegian-lora-adapter-v3.gguf' \
        --outtype f16"

      start_ollama
      sleep 5

      cat > "$GGUF_DIR/Modelfile.chiro-norwegian-lora-v3" << 'NOR_EOF'
FROM qwen2.5:7b-instruct
ADAPTER ./chiro-norwegian-lora-adapter-v3.gguf

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

SYSTEM """Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge. Generer nøyaktige, profesjonelle SOAP-notater og klinisk dokumentasjon med korrekt norsk medisinsk terminologi. Bruk ICPC-2 koder ved diagnoser. Følg norsk helselovgivning."""
NOR_EOF

      run_cmd "cd '$GGUF_DIR' && ollama create chiro-norwegian-lora-v3 -f Modelfile.chiro-norwegian-lora-v3"
    fi
  fi
fi

# ============================================================
# Phase 5: Final Evaluation (all models)
# ============================================================

log ""
log "============================================================"
log "Phase 5: Final Evaluation"
log "============================================================"

start_ollama
sleep 10

# Run eval for each available model
for model in chiro-no-lora-v2 chiro-no-lora-v3 chiro-no-dpo chiro-norwegian-lora-v2 chiro-norwegian-lora-v3; do
  # Check if model exists in Ollama
  if ollama list 2>/dev/null | grep -q "$model"; then
    log "Evaluating $model..."
    run_cmd "python '$EVAL_DIR/evaluate.py' \
      --model $model \
      --verbose \
      --save-baseline \
      --output '$EVAL_DIR/baseline/${model}-weekend.json'" || true
  else
    log "Model $model not available, skipping."
  fi
done

# ============================================================
# Summary
# ============================================================

log ""
log "============================================================"
log "TRAINING PIPELINE COMPLETE"
log "============================================================"
log "Finished: $(date)"
log "Log file: $LOG_FILE"
log ""
log "Review results:"
log "  ls -la $EVAL_DIR/baseline/"
log ""
log "Next steps:"
log "  1. Review eval results and compare v3 vs v2"
log "  2. If DPO improves, update MODEL_ROUTING in backend/src/services/ai.js"
log "  3. Update MODEL_CONFIG with new model entries"
log "  4. Commit results: git add -A && git commit -m 'feat(ai): weekend training v3 results'"
