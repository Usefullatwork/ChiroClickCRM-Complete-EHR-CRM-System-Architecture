#!/bin/bash
set -euo pipefail

# Rollback to previous model version from manifest backup
OLLAMA_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"
MANIFEST_FILE="${1:-models-manifest.json}"
BACKUP_FILE="${MANIFEST_FILE}.bak"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') [model-rollback] $*"; }

# ------------------------------------------------------------------
# 1. Verify backup manifest exists
# ------------------------------------------------------------------
if [ ! -f "$BACKUP_FILE" ]; then
  log "ERROR: No backup manifest found at $BACKUP_FILE"
  log "Run model-inventory.sh first to create a baseline."
  exit 1
fi

# ------------------------------------------------------------------
# 2. Get current models
# ------------------------------------------------------------------
CURRENT=$(curl -sf "$OLLAMA_URL/api/tags" 2>/dev/null) || {
  log "ERROR: Cannot reach Ollama at $OLLAMA_URL"
  exit 1
}

PREV_MODELS=$(jq -r '.models[].name' "$BACKUP_FILE")
ROLLBACK_COUNT=0

# ------------------------------------------------------------------
# 3. For each model in backup, check if it differs from current
# ------------------------------------------------------------------
for model in $PREV_MODELS; do
  PREV_DIGEST=$(jq -r --arg m "$model" '.models[] | select(.name == $m) | .digest' "$BACKUP_FILE")
  CURR_DIGEST=$(echo "$CURRENT" | jq -r --arg m "$model" '.models[] | select(.name == $m) | .digest // "missing"')

  if [ "$PREV_DIGEST" != "$CURR_DIGEST" ]; then
    log "Rolling back: $model (digest changed or missing)"
    log "  Previous: ${PREV_DIGEST:0:16}..."
    log "  Current:  ${CURR_DIGEST:0:16}..."

    if ollama pull "$model" 2>&1; then
      log "  Pulled: $model"
      ROLLBACK_COUNT=$((ROLLBACK_COUNT + 1))
    else
      log "  ERROR: Failed to pull $model"
    fi
  else
    log "Unchanged: $model — skipping"
  fi
done

# ------------------------------------------------------------------
# 4. Summary
# ------------------------------------------------------------------
if [ "$ROLLBACK_COUNT" -eq 0 ]; then
  log "No models needed rollback. All digests match backup manifest."
else
  log "Rolled back ${ROLLBACK_COUNT} model(s) to previous versions."
  log "Run model-inventory.sh to update the manifest."
fi
