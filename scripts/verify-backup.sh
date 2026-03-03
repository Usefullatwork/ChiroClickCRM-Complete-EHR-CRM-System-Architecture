#!/bin/bash
#
# ChiroClickCRM Backup Verification Script
# Restores the most recent backup into a temporary database and validates it.
#
# Exit codes:
#   0 = PASS (backup verified successfully)
#   1 = FAIL (missing backup, restore error, or empty tables)
#
# Usage:
#   BACKUP_DIR=/backups/postgresql ./scripts/verify-backup.sh
#
# Required tools: pg_restore (or psql), createdb, dropdb

set -e
set -u

# ============================================================================
# CONFIGURATION
# ============================================================================

BACKUP_DIR="${BACKUP_DIR:-/backups/postgresql}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMP_DB="chiroclickcrm_verify_${TIMESTAMP}"

# ============================================================================
# FUNCTIONS
# ============================================================================

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cleanup() {
  log "Dropping temporary database ${TEMP_DB}..."
  dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --if-exists "$TEMP_DB" 2>/dev/null || true
}

trap cleanup EXIT

# ============================================================================
# FIND LATEST BACKUP
# ============================================================================

log "Searching for backups in ${BACKUP_DIR}..."

LATEST_BACKUP=$(find "$BACKUP_DIR" -type f \( -name "*.sql.gz" -o -name "*.sql" -o -name "*.dump" \) -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | awk '{print $2}')

if [ -z "$LATEST_BACKUP" ]; then
  log "FAIL: No backup files found in ${BACKUP_DIR}"
  exit 1
fi

log "Latest backup: ${LATEST_BACKUP}"
log "Backup size: $(du -h "$LATEST_BACKUP" | cut -f1)"

# ============================================================================
# CREATE TEMP DATABASE & RESTORE
# ============================================================================

log "Creating temporary database: ${TEMP_DB}"
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB"

log "Restoring backup..."

case "$LATEST_BACKUP" in
  *.sql.gz)
    gunzip -c "$LATEST_BACKUP" | pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" --no-owner --no-acl 2>/dev/null || \
    gunzip -c "$LATEST_BACKUP" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -q 2>/dev/null
    ;;
  *.dump)
    pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" --no-owner --no-acl "$LATEST_BACKUP"
    ;;
  *.sql)
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -q -f "$LATEST_BACKUP"
    ;;
esac

log "Restore complete."

# ============================================================================
# VERIFICATION QUERIES
# ============================================================================

PASS=true

run_check() {
  local table="$1"
  local count
  count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -t -A -c "SELECT COUNT(*) FROM ${table};" 2>/dev/null || echo "0")
  count=$(echo "$count" | tr -d '[:space:]')
  if [ "$count" -gt 0 ] 2>/dev/null; then
    log "  ${table}: ${count} rows - OK"
  else
    log "  ${table}: ${count} rows - EMPTY"
    PASS=false
  fi
}

log "Running verification queries..."
run_check "patients"
run_check "clinical_encounters"
run_check "organizations"

# Database size
DB_SIZE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -t -A -c "SELECT pg_size_pretty(pg_database_size('${TEMP_DB}'));" 2>/dev/null || echo "unknown")
log "  Restored database size: ${DB_SIZE}"

# ============================================================================
# RESULT SUMMARY
# ============================================================================

log "================================================================"
if [ "$PASS" = true ]; then
  log "RESULT: PASS - Backup verified successfully"
  log "  Backup file: ${LATEST_BACKUP}"
  log "  Database size: ${DB_SIZE}"
  log "================================================================"
  exit 0
else
  log "RESULT: FAIL - One or more tables were empty"
  log "  Backup file: ${LATEST_BACKUP}"
  log "================================================================"
  exit 1
fi
