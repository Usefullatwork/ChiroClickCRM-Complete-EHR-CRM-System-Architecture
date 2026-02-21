#!/usr/bin/env bash
# ============================================================
# Remove legacy Ollama models to free ~30GB disk space
# ============================================================
# These are old base architectures from Sprint 1 and experimental models.
# All production models now use Qwen2.5 base + LoRA ADAPTER method.
#
# Usage: bash cleanup-legacy-models.sh
# Safe to run: Will only remove models that are NOT in the current routing.

echo "Current Ollama models:"
ollama list
echo ""

# Models to remove (old architectures, never used in current routing)
LEGACY_MODELS=(
  "gemma2:9b"
  "mistral:7b"
  "llama3.1:latest"
  "llama3.2:latest"
  "llama3.2:3b"
  "qwen3:4b"
  "chiroclick-clinical:latest"
  "chiro-en:latest"
)

# Old merged GGUF models (replaced by 4.8GB ADAPTER method)
OLD_MERGED=(
  "chiro-norwegian-lora:latest"
  "chiro-no-lora:latest"
  "chiro-medical-lora:latest"
  "chiro-fast-lora:latest"
)

echo "Removing legacy base models..."
for model in "${LEGACY_MODELS[@]}"; do
  if ollama list 2>/dev/null | grep -q "${model%%:*}"; then
    echo "  Removing $model..."
    ollama rm "$model" 2>/dev/null || true
  else
    echo "  $model not found, skipping."
  fi
done

echo ""
echo "Removing old merged GGUF models (replaced by ADAPTER method)..."
echo "NOTE: Only removes v1 merged models. v2 ADAPTER models are kept."
for model in "${OLD_MERGED[@]}"; do
  if ollama list 2>/dev/null | grep -q "${model%%:*}"; then
    echo "  Removing $model..."
    ollama rm "$model" 2>/dev/null || true
  else
    echo "  $model not found, skipping."
  fi
done

echo ""
echo "Remaining models (these are KEPT):"
ollama list
echo ""
echo "Done. Check freed space with: du -sh ~/.ollama/models/"
