#!/bin/bash
set -euo pipefail

# Archive audit logs older than 2 years to encrypted JSONL files
# Norwegian law requires 10-year retention, but active DB shouldn't hold it all
# Run monthly via cron: 0 2 1 * * /path/to/archive-audit-logs.sh

# ------------------------------------------------------------------
# Configuration (override via environment)
# ------------------------------------------------------------------
ARCHIVE_DIR="${ARCHIVE_DIR:-/backups/audit-archive}"
RETENTION_MONTHS="${RETENTION_MONTHS:-24}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-chiroclickcrm}"
DB_USER="${DB_USER:-chiroclickcrm}"
PGPASSWORD="${PGPASSWORD:-}"
export PGPASSWORD

TIMESTAMP=$(date +%Y%m)
ARCHIVE_FILE="${ARCHIVE_DIR}/audit_archive_${TIMESTAMP}.jsonl"
LOG_PREFIX="[audit-archive]"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') ${LOG_PREFIX} $*"; }

# ------------------------------------------------------------------
# 1. Create archive directory
# ------------------------------------------------------------------
if [ ! -d "$ARCHIVE_DIR" ]; then
  mkdir -p "$ARCHIVE_DIR"
  log "Created archive directory: $ARCHIVE_DIR"
fi

# ------------------------------------------------------------------
# 2. Count rows to archive
# ------------------------------------------------------------------
ROW_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
  "SELECT COUNT(*) FROM audit_logs WHERE created_at < NOW() - INTERVAL '${RETENTION_MONTHS} months';")

if [ "$ROW_COUNT" -eq 0 ]; then
  log "No audit logs older than ${RETENTION_MONTHS} months. Nothing to archive."
  exit 0
fi

log "Found ${ROW_COUNT} rows to archive (older than ${RETENTION_MONTHS} months)"

# ------------------------------------------------------------------
# 3. Export to JSONL
# ------------------------------------------------------------------
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
  "COPY (SELECT row_to_json(t) FROM (SELECT * FROM audit_logs WHERE created_at < NOW() - INTERVAL '${RETENTION_MONTHS} months' ORDER BY created_at ASC) t) TO STDOUT;" \
  > "$ARCHIVE_FILE"

FILE_SIZE=$(stat -c%s "$ARCHIVE_FILE" 2>/dev/null || stat -f%z "$ARCHIVE_FILE" 2>/dev/null || echo 0)
CHECKSUM=$(sha256sum "$ARCHIVE_FILE" | awk '{print $1}')
log "Exported ${ROW_COUNT} rows to ${ARCHIVE_FILE} (${FILE_SIZE} bytes, SHA-256: ${CHECKSUM})"

# ------------------------------------------------------------------
# 4. Encrypt if key is available
# ------------------------------------------------------------------
ENCRYPTED=false
FINAL_FILE="$ARCHIVE_FILE"

if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  openssl enc -aes-256-cbc -pbkdf2 -in "$ARCHIVE_FILE" -out "${ARCHIVE_FILE}.enc" -k "$BACKUP_ENCRYPTION_KEY"
  rm "$ARCHIVE_FILE"
  FINAL_FILE="${ARCHIVE_FILE}.enc"
  FILE_SIZE=$(stat -c%s "$FINAL_FILE" 2>/dev/null || stat -f%z "$FINAL_FILE" 2>/dev/null || echo 0)
  CHECKSUM=$(sha256sum "$FINAL_FILE" | awk '{print $1}')
  ENCRYPTED=true
  log "Encrypted archive: ${FINAL_FILE}"
fi

# ------------------------------------------------------------------
# 5. Record archival in manifest table
# ------------------------------------------------------------------
OLDEST_DATE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
  "SELECT MIN(created_at) FROM audit_logs WHERE created_at < NOW() - INTERVAL '${RETENTION_MONTHS} months';")
NEWEST_DATE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
  "SELECT MAX(created_at) FROM audit_logs WHERE created_at < NOW() - INTERVAL '${RETENTION_MONTHS} months';")

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
  "INSERT INTO audit_archive_manifest (file_name, file_size_bytes, rows_archived, oldest_record_date, newest_record_date, encrypted, checksum)
   VALUES ('$(basename "$FINAL_FILE")', ${FILE_SIZE}, ${ROW_COUNT}, '${OLDEST_DATE}', '${NEWEST_DATE}', ${ENCRYPTED}, '${CHECKSUM}');"

log "Recorded archival in audit_archive_manifest"

# ------------------------------------------------------------------
# 6. Delete archived rows
# ------------------------------------------------------------------
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
  "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '${RETENTION_MONTHS} months';"

log "Deleted ${ROW_COUNT} archived rows from audit_logs"

# ------------------------------------------------------------------
# 7. Summary
# ------------------------------------------------------------------
log "=== Archive Summary ==="
log "  Rows archived: ${ROW_COUNT}"
log "  File: $(basename "$FINAL_FILE")"
log "  Size: ${FILE_SIZE} bytes"
log "  Encrypted: ${ENCRYPTED}"
log "  Checksum: ${CHECKSUM}"
log "  Date range: ${OLDEST_DATE} to ${NEWEST_DATE}"
log "=== Done ==="
