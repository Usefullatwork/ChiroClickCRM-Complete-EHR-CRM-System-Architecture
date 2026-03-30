#!/bin/bash
set -euo pipefail
# ChiroClickCRM Deployment Script
# Usage: deploy.sh <environment> <backend_image> <frontend_image>

ENVIRONMENT="${1:?Usage: deploy.sh <environment> <backend_image> <frontend_image>}"
BACKEND_IMAGE="${2:?Backend image required}"
FRONTEND_IMAGE="${3:?Frontend image required}"
DEPLOY_DIR="/opt/chiroclickcrm"
STATE_FILE="$DEPLOY_DIR/.deploy-state"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.production.yml"
LOG_FILE="$DEPLOY_DIR/deploy.log"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

# ---------------------------------------------------
# 1. Log deployment start
# ---------------------------------------------------
log "=== Deployment starting: environment=$ENVIRONMENT ==="
log "Backend image:  $BACKEND_IMAGE"
log "Frontend image: $FRONTEND_IMAGE"

# ---------------------------------------------------
# 2. Save current image SHAs for rollback
# ---------------------------------------------------
if [ -f "$COMPOSE_FILE" ]; then
  log "Saving current state for rollback..."
  docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null \
    | jq -r '.[].Image' > "$STATE_FILE.bak" || true
fi

# ---------------------------------------------------
# 3. Log in to GHCR
# ---------------------------------------------------
log "Logging in to container registry..."
echo "${GHCR_TOKEN:-}" | docker login ghcr.io -u "${GHCR_USER:-github}" --password-stdin

# ---------------------------------------------------
# 4. Pull new images
# ---------------------------------------------------
log "Pulling backend image..."
docker pull "$BACKEND_IMAGE"

log "Pulling frontend image..."
docker pull "$FRONTEND_IMAGE"

# ---------------------------------------------------
# 5. Update .env with new image tags
# ---------------------------------------------------
BACKEND_TAG="${BACKEND_IMAGE##*:}"
FRONTEND_TAG="${FRONTEND_IMAGE##*:}"

log "Updating .env with tags: backend=$BACKEND_TAG frontend=$FRONTEND_TAG"
sed -i "s|BACKEND_TAG=.*|BACKEND_TAG=${BACKEND_TAG}|" "$DEPLOY_DIR/.env"
sed -i "s|FRONTEND_TAG=.*|FRONTEND_TAG=${FRONTEND_TAG}|" "$DEPLOY_DIR/.env"

# ---------------------------------------------------
# 6. Run database migrations
# ---------------------------------------------------
log "Running database migrations..."
docker compose -f "$COMPOSE_FILE" exec -T backend node database/migrations/run.js || {
  log "WARNING: Migration failed — continuing with deployment"
}

# ---------------------------------------------------
# 7. Rolling restart
# ---------------------------------------------------
log "Starting rolling restart..."
docker compose -f "$COMPOSE_FILE" up -d --no-build

# ---------------------------------------------------
# 8. Wait for health check
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
  log "ERROR: Health check failed after 60 seconds"
  exit 1
fi

# ---------------------------------------------------
# 9. Save new deploy state
# ---------------------------------------------------
log "Saving new deploy state..."
cat > "$STATE_FILE" <<EOF
ENVIRONMENT=$ENVIRONMENT
BACKEND_IMAGE=$BACKEND_IMAGE
FRONTEND_IMAGE=$FRONTEND_IMAGE
DEPLOYED_AT=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
EOF

# ---------------------------------------------------
# 10. Log deployment complete
# ---------------------------------------------------
log "=== Deployment complete: $ENVIRONMENT ==="
log "Backend:  $BACKEND_IMAGE"
log "Frontend: $FRONTEND_IMAGE"
