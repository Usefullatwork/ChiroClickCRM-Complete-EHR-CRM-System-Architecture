#!/bin/bash
set -euo pipefail

# Snapshot Ollama model inventory for drift detection
OLLAMA_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"
MANIFEST_FILE="${1:-models-manifest.json}"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') [model-inventory] $*"; }

# ------------------------------------------------------------------
# 1. Fetch current model list from Ollama
# ------------------------------------------------------------------
RESPONSE=$(curl -sf "$OLLAMA_URL/api/tags" 2>/dev/null) || {
  log "ERROR: Cannot reach Ollama at $OLLAMA_URL"
  exit 1
}

# ------------------------------------------------------------------
# 2. Build manifest with timestamp
# ------------------------------------------------------------------
CURRENT=$(echo "$RESPONSE" | jq '{
  timestamp: (now | todate),
  ollama_url: "'"$OLLAMA_URL"'",
  models: [.models[] | {
    name: .name,
    size_bytes: .size,
    modified_at: .modified_at,
    digest: .digest
  }]
}')

# ------------------------------------------------------------------
# 3. Compare with previous manifest if it exists
# ------------------------------------------------------------------
if [ -f "$MANIFEST_FILE" ]; then
  cp "$MANIFEST_FILE" "${MANIFEST_FILE}.bak"
  log "Backed up previous manifest to ${MANIFEST_FILE}.bak"

  PREV_MODELS=$(jq -r '.models[].name' "$MANIFEST_FILE" | sort)
  CURR_MODELS=$(echo "$CURRENT" | jq -r '.models[].name' | sort)

  NEW_MODELS=$(comm -13 <(echo "$PREV_MODELS") <(echo "$CURR_MODELS"))
  REMOVED_MODELS=$(comm -23 <(echo "$PREV_MODELS") <(echo "$CURR_MODELS"))

  CHANGED=""
  for model in $(comm -12 <(echo "$PREV_MODELS") <(echo "$CURR_MODELS")); do
    OLD_DIGEST=$(jq -r --arg m "$model" '.models[] | select(.name == $m) | .digest' "$MANIFEST_FILE")
    NEW_DIGEST=$(echo "$CURRENT" | jq -r --arg m "$model" '.models[] | select(.name == $m) | .digest')
    if [ "$OLD_DIGEST" != "$NEW_DIGEST" ]; then
      CHANGED="$CHANGED  modified: $model\n"
    fi
  done

  if [ -n "$NEW_MODELS" ] || [ -n "$REMOVED_MODELS" ] || [ -n "$CHANGED" ]; then
    log "=== Changes Detected ==="
    [ -n "$NEW_MODELS" ] && echo "$NEW_MODELS" | while read -r m; do log "  + added: $m"; done
    [ -n "$REMOVED_MODELS" ] && echo "$REMOVED_MODELS" | while read -r m; do log "  - removed: $m"; done
    [ -n "$CHANGED" ] && echo -e "$CHANGED" | while read -r line; do [ -n "$line" ] && log "$line"; done
  else
    log "No changes since last inventory."
  fi
else
  log "No previous manifest found. Creating initial snapshot."
fi

# ------------------------------------------------------------------
# 4. Write new manifest
# ------------------------------------------------------------------
echo "$CURRENT" > "$MANIFEST_FILE"
MODEL_COUNT=$(echo "$CURRENT" | jq '.models | length')
log "Saved manifest: ${MANIFEST_FILE} (${MODEL_COUNT} models)"
