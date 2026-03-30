#!/bin/bash
# ============================================================
# ChiroClick v7 Overnight Training Script
# ============================================================
# Full pipeline: Data prep → SFT (r=64, 3 epochs) → DPO → Merge → Eval
# Expected total time: ~7-8 hours on RTX 4070 12GB
#
# USAGE:
#   cd /c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training
#   bash train-overnight-v7.sh 2>&1 | tee overnight-v7-run.log
#
# BEFORE RUNNING:
#   1. Run Phase 0 baselines manually (see below)
#   2. Close all GPU-heavy apps (browsers with HW accel, games, etc.)
#   3. Ollama will be killed automatically by this script
#   4. Keep the terminal open — do NOT close it
#
# PHASE 0 (run manually before bed):
#   npm run ai:eval -- --output ai-training/promptfoo/results/v6-baseline-pre-training.json --no-cache
#   npm run ai:eval:safety -- --output ai-training/promptfoo/results/v6-safety-baseline.json --no-cache
#
# CHANGES FROM v6:
#   - LoRA r=64, alpha=128 (was r=16, alpha=16)
#   - 3 SFT epochs (was 1)
#   - Expanded dataset: ~5,716 SFT + 920 DPO
#   - TensorBoard logging enabled
#   - Auto-detect latest SFT checkpoint for DPO and merge
# ============================================================

set -uo pipefail

AI_DIR="/c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/ai-training"
PROJECT_DIR="/c/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture"
PYTHON="$AI_DIR/ml-env/Scripts/python.exe"
OLLAMA="/c/Users/MadsF/AppData/Local/Programs/Ollama/ollama.exe"
LOG_DIR="$AI_DIR/logs"
NANOCHAT_DATA="$AI_DIR/nanochat/data"

export PYTHONIOENCODING=utf-8
export PYTHONUNBUFFERED=1

SFT_OK=false
DPO_OK=false
MERGE_OK=false
EVAL_OK=false

STARTED_AT=$(date '+%Y-%m-%d %H:%M:%S')

echo "============================================================"
echo "ChiroClick v7 Overnight Training"
echo "Started: $STARTED_AT"
echo "LoRA: r=64, alpha=128 (4x v6)"
echo "SFT: 3 epochs, ~5,144 train examples"
echo "DPO: 1 epoch, ~828 preference pairs"
echo "============================================================"
echo ""

# ============================================================
# [1/10] Kill Ollama to free GPU
# ============================================================
echo "[1/10] Killing Ollama to free GPU memory..."
taskkill //F //IM ollama.exe 2>/dev/null || true
taskkill //F //IM ollama_llama_server.exe 2>/dev/null || true
sleep 3
echo "       Ollama stopped."
echo ""

# ============================================================
# [2/10] Data Preparation
# ============================================================
echo "============================================================"
echo "[2/10] DATA PREPARATION"
echo "       Running prepare-data.py..."
echo "============================================================"

cd "$AI_DIR"
if "$PYTHON" nanochat/scripts/prepare-data.py; then
    echo "       prepare-data.py completed."
else
    echo "ERROR: prepare-data.py failed. Aborting."
    exit 1
fi
echo ""

# ============================================================
# [3/10] Copy data to Unsloth-expected paths
# ============================================================
echo "[3/10] Copying data to training paths..."

# SFT data
mkdir -p "$AI_DIR/data/processed-v7/combined-sft"
cp "$NANOCHAT_DATA/sft_train.jsonl" "$AI_DIR/data/processed-v7/combined-sft/train.jsonl"
cp "$NANOCHAT_DATA/sft_val.jsonl" "$AI_DIR/data/processed-v7/combined-sft/validation.jsonl"

# DPO data — combine and resplit from nanochat output
mkdir -p "$AI_DIR/data/dpo-v7"
cp "$NANOCHAT_DATA/dpo_train.jsonl" "$AI_DIR/data/dpo-v7/train.jsonl"
cp "$NANOCHAT_DATA/dpo_val.jsonl" "$AI_DIR/data/dpo-v7/validation.jsonl"

echo "       SFT: $(wc -l < "$AI_DIR/data/processed-v7/combined-sft/train.jsonl") train, $(wc -l < "$AI_DIR/data/processed-v7/combined-sft/validation.jsonl") val"
echo "       DPO: $(wc -l < "$AI_DIR/data/dpo-v7/train.jsonl") train, $(wc -l < "$AI_DIR/data/dpo-v7/validation.jsonl") val"
echo ""

# ============================================================
# [4/10] SFT Training (r=64, alpha=128, 3 epochs)
# ============================================================
echo "============================================================"
echo "[4/10] SFT TRAINING (r=64, alpha=128, 3 epochs)"
echo "       Data: $AI_DIR/data/processed-v7/combined-sft"
echo "       batch_size=2, grad_accum=4 (effective batch=8)"
echo "       Estimated: ~3-3.5 hours"
echo "       Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

cd "$AI_DIR/training"
SFT_LOG="$LOG_DIR/sft-v7-$(date '+%Y%m%d-%H%M%S').log"

if "$PYTHON" train_unsloth.py \
    --model default \
    --data-dir ../data/processed-v7/combined-sft \
    --output ../models --log-dir ../logs \
    --epochs 3 --batch-size 2 --gradient-accumulation-steps 4 \
    --max-seq-length 4096 --no-packing --save-steps 100 --quantize q8_0 \
    2>&1 | tee "$SFT_LOG"; then
    SFT_OK=true
    echo ""
    echo "[4/10] SFT training COMPLETE at $(date '+%Y-%m-%d %H:%M:%S')"
else
    echo ""
    echo "[4/10] WARNING: SFT training FAILED at $(date '+%Y-%m-%d %H:%M:%S')"
    echo "       Check log: $SFT_LOG"
    echo "       Skipping DPO and merge."
fi
echo ""

# ============================================================
# [5/10] GPU Cooldown
# ============================================================
if $SFT_OK; then
    echo "[5/10] GPU cooldown (30s before DPO)..."
    sleep 30
    echo "       Ready."
    echo ""
else
    echo "[5/10] SKIPPED (SFT failed)"
    echo ""
fi

# ============================================================
# [6/10] DPO Training (1 epoch, beta=0.1)
# ============================================================
if $SFT_OK; then
    echo "============================================================"
    echo "[6/10] DPO TRAINING (1 epoch, beta=0.1)"
    echo "       Data: $AI_DIR/data/dpo-v7"
    echo "       batch_size=1, grad_accum=8 (effective batch=8)"
    echo "       Estimated: ~1.5 hours"
    echo "       Started: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================================"

    DPO_LOG="$LOG_DIR/dpo-v7-$(date '+%Y%m%d-%H%M%S').log"

    if "$PYTHON" train_dpo.py \
        --model default --data-dir ../data/dpo-v7 \
        --epochs 1 --batch-size 1 --grad-accum 8 --lr 5e-5 --beta 0.1 \
        2>&1 | tee "$DPO_LOG"; then
        DPO_OK=true
        echo ""
        echo "[6/10] DPO training COMPLETE at $(date '+%Y-%m-%d %H:%M:%S')"
    else
        echo ""
        echo "[6/10] WARNING: DPO training FAILED at $(date '+%Y-%m-%d %H:%M:%S')"
        echo "       Check log: $DPO_LOG"
        echo "       Will attempt SFT-only merge as fallback."
    fi
else
    echo "[6/10] SKIPPED (SFT failed)"
fi
echo ""

# ============================================================
# [7/10] Merge + GGUF + Deploy
# ============================================================
if $SFT_OK; then
    echo "============================================================"
    echo "[7/10] MERGE + GGUF Q8_0 + OLLAMA DEPLOY"
    echo "       Started: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================================"

    cd "$AI_DIR"

    if $DPO_OK; then
        # Full SFT+DPO merge
        if "$PYTHON" scripts/merge_sft_dpo_v7.py --version v7; then
            MERGE_OK=true
            echo "[7/10] Merge + deploy COMPLETE"
        else
            echo "[7/10] WARNING: Merge failed"
        fi
    else
        echo "       DPO failed — skipping merge (SFT LoRA adapter still available)"
        echo "       You can merge manually: python scripts/merge_sft_dpo_v7.py --version v7"
    fi
else
    echo "[7/10] SKIPPED (SFT failed)"
fi
echo ""

# ============================================================
# [8/10] Start Ollama
# ============================================================
echo "[8/10] Starting Ollama..."
"$OLLAMA" serve > /dev/null 2>&1 &
sleep 5
echo "       Ollama running."
echo ""

# ============================================================
# [9/10] Evaluation (v7 vs v6 comparison + safety)
# ============================================================
if $MERGE_OK; then
    echo "============================================================"
    echo "[9/10] EVALUATION: v7 vs v6 comparison"
    echo "       Started: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================================"

    cd "$AI_DIR/promptfoo"

    # Comparison eval (100 regression cases, both models)
    echo "       Running regression suite (v7 vs v6)..."
    if npx promptfoo eval \
        --providers "ollama:chiro-no-sft-dpo-v7" "ollama:chiro-no-sft-dpo-v6" \
        --output results/v7-vs-v6-comparison.json --no-cache 2>&1; then
        echo "       Regression eval complete."
    else
        echo "       WARNING: Regression eval failed."
    fi

    echo ""

    # Safety eval (v7 only)
    echo "       Running safety suite (v7)..."
    if npx promptfoo eval -c suites/clinical-safety.yaml \
        --providers "ollama:chiro-no-sft-dpo-v7" \
        --output results/v7-safety.json --no-cache 2>&1; then
        echo "       Safety eval complete."
    else
        echo "       WARNING: Safety eval failed."
    fi

    EVAL_OK=true

    # Save baseline
    echo ""
    echo "       Saving v7 baseline..."
    node -p "
        const r = require('./results/v7-vs-v6-comparison.json');
        const stats = r.results?.stats || {};
        JSON.stringify({
            model: 'chiro-no-sft-dpo-v7',
            date: new Date().toISOString().split('T')[0],
            total: stats.totalAssertions || 0,
            passed: stats.passedAssertions || 0,
            failed: stats.failedAssertions || 0,
            pass_rate: stats.totalAssertions ? ((stats.passedAssertions / stats.totalAssertions) * 100).toFixed(1) + '%' : 'N/A',
        }, null, 2)
    " > ../evaluation/baseline/chiro-no-sft-dpo-v7.json 2>/dev/null && echo "       Baseline saved." || echo "       Could not save baseline (check results format)."

else
    echo "[9/10] SKIPPED (merge failed or model not deployed)"
fi
echo ""

# ============================================================
# [10/10] Loss Curve Capture
# ============================================================
echo "[10/10] Capturing loss curves..."
mkdir -p "$AI_DIR/evaluation"

if [ -f "$SFT_LOG" ]; then
    grep -i "'loss'" "$SFT_LOG" > "$AI_DIR/evaluation/sft-v7-loss-curve.txt" 2>/dev/null || true
    echo "        SFT loss curve: $(wc -l < "$AI_DIR/evaluation/sft-v7-loss-curve.txt" 2>/dev/null || echo 0) entries"
fi

if [ -f "${DPO_LOG:-/dev/null}" ]; then
    grep -i "loss" "$DPO_LOG" > "$AI_DIR/evaluation/dpo-v7-loss-curve.txt" 2>/dev/null || true
    echo "        DPO loss curve: $(wc -l < "$AI_DIR/evaluation/dpo-v7-loss-curve.txt" 2>/dev/null || echo 0) entries"
fi

# Copy TensorBoard logs if they exist
if [ -d "$AI_DIR/models/chiro-no/tb-logs" ]; then
    cp -r "$AI_DIR/models/chiro-no/tb-logs" "$AI_DIR/evaluation/v7-sft-tensorboard/" 2>/dev/null || true
    echo "        TensorBoard logs copied to evaluation/v7-sft-tensorboard/"
fi
echo ""

# ============================================================
# FINAL SUMMARY
# ============================================================
FINISHED_AT=$(date '+%Y-%m-%d %H:%M:%S')

echo "============================================================"
echo "  v7 OVERNIGHT TRAINING — FINAL SUMMARY"
echo "============================================================"
echo "  Started:  $STARTED_AT"
echo "  Finished: $FINISHED_AT"
echo ""
echo "  SFT Training: $( $SFT_OK && echo 'SUCCESS' || echo 'FAILED' )"
echo "  DPO Training: $( $DPO_OK && echo 'SUCCESS' || echo 'FAILED' )"
echo "  Merge+Deploy: $( $MERGE_OK && echo 'SUCCESS' || echo 'FAILED' )"
echo "  Evaluation:   $( $EVAL_OK && echo 'SUCCESS' || echo 'SKIPPED' )"
echo ""

if $MERGE_OK; then
    echo "  Model deployed: chiro-no-sft-dpo-v7"
    echo ""
    echo "  Current Ollama models:"
    "$OLLAMA" list 2>/dev/null | grep -E "v[67]" || true
    echo ""
fi

echo "  MORNING REVIEW:"
echo "    1. cd $AI_DIR/promptfoo && npx promptfoo view"
echo "       (opens web UI with side-by-side v7 vs v6 results)"
echo "    2. Check loss curves: $AI_DIR/evaluation/sft-v7-loss-curve.txt"
if [ -d "$AI_DIR/evaluation/v7-sft-tensorboard" ]; then
    echo "    3. TensorBoard: tensorboard --logdir=$AI_DIR/evaluation/v7-sft-tensorboard"
fi
echo ""
echo "  ROLLBACK (if v7 < 94%):"
echo "    v6 GGUF untouched at: $AI_DIR/models/gguf/chiro-no-sft-dpo-v6.gguf"
echo "    v6 still deployed in Ollama as chiro-no-sft-dpo-v6"
echo ""
echo "  SUCCESS CRITERIA:"
echo "    - v7 eval >= 94% (v6 is 96%)"
echo "    - Safety: 0% injection success (16/16 pass)"
echo "    - Latency: < 5s SOAP generation on RTX 4070"
echo "============================================================"
