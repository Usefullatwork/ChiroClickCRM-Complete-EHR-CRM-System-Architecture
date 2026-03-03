#!/bin/bash
set -euo pipefail
# ChiroClickCRM Rollback Script
# Restores the previous deployment using saved state

DEPLOY_DIR="/opt/chiroclickcrm"
STATE_FILE="$DEPLOY_DIR/.deploy-state"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.production.yml"
LOG_FILE="$DEPLOY_DIR/deploy.log"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [ROLLBACK] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

# ---------------------------------------------------
# 1. Read previous image SHAs from backup state
# ---------------------------------------------------
if [ ! -f "$STATE_FILE.bak" ]; then
  log "ERROR: No backup state file found at $STATE_FILE.bak"
  log "Cannot rollback — no previous deployment state available"
  exit 1
fi

log "=== Rollback starting ==="
log "Reading previous state from $STATE_FILE.bak"

PREV_IMAGES=$(cat "$STATE_FILE.bak")
if [ -z "$PREV_IMAGES" ]; then
  log "ERROR: Backup state file is empty"
  exit 1
fi

# ---------------------------------------------------
# 2. Pull previous images
# ---------------------------------------------------
log "Pulling previous images..."
while IFS= read -r image; do
  if [ -n "$image" ]; then
    log "  Pulling: $image"
    docker pull "$image" || log "  WARNING: Failed to pull $image (may already be cached)"
  fi
done <<< "$PREV_IMAGES"

# ---------------------------------------------------
# 3. Update .env with old tags
# ---------------------------------------------------
BACKEND_IMG=$(echo "$PREV_IMAGES" | grep 'backend' | head -1)
FRONTEND_IMG=$(echo "$PREV_IMAGES" | grep 'frontend' | head -1)

if [ -n "$BACKEND_IMG" ]; then
  BACKEND_TAG="${BACKEND_IMG##*:}"
  log "Restoring backend tag: $BACKEND_TAG"
  sed -i "s|BACKEND_TAG=.*|BACKEND_TAG=${BACKEND_TAG}|" "$DEPLOY_DIR/.env"
fi

if [ -n "$FRONTEND_IMG" ]; then
  FRONTEND_TAG="${FRONTEND_IMG##*:}"
  log "Restoring frontend tag: $FRONTEND_TAG"
  sed -i "s|FRONTEND_TAG=.*|FRONTEND_TAG=${FRONTEND_TAG}|" "$DEPLOY_DIR/.env"
fi

# ---------------------------------------------------
# 4. Restart with previous images
# ---------------------------------------------------
log "Restarting services with previous images..."
docker compose -f "$COMPOSE_FILE" up -d --no-build

# ---------------------------------------------------
# 5. Wait for health check
# ---------------------------------------------------
log "Waiting for health check..."
HEALTHY=false
for i in $(seq 1 30); do
  if curl -sf http://localhost/health > /dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  log "  Health check attempt $i/30 — waiting..."
  sleep 2
done

if [ "$HEALTHY" != "true" ]; then
  log "ERROR: Health check failed after rollback — manual intervention required"
  exit 1
fi

# ---------------------------------------------------
# 6. Log rollback complete
# ---------------------------------------------------
log "=== Rollback complete ==="
