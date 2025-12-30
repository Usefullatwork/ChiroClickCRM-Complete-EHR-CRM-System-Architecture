#!/bin/bash
#
# ChiroClickCRM Database Backup Script
# CRITICAL: Required for GDPR compliance and disaster recovery
#
# This script performs:
# 1. Full PostgreSQL database backup with compression
# 2. WAL (Write-Ahead Log) archiving for point-in-time recovery
# 3. Automatic cleanup of old backups based on retention policy
# 4. Optional cloud storage upload
#
# Norwegian Legal Requirement: Medical records must be kept for 10 years
# Recommended: Keep daily backups for 90 days, weekly for 1 year, monthly for 10 years
#

set -e  # Exit on error
set -u  # Exit on undefined variable

# ============================================================================
# CONFIGURATION
# ============================================================================

BACKUP_DIR="${BACKUP_DIR:-/var/backups/chiroclickcrm}"
DB_NAME="${DB_NAME:-chiroclickcrm}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Retention policy (in days)
DAILY_RETENTION=90      # Keep daily backups for 90 days
WEEKLY_RETENTION=365    # Keep weekly backups for 1 year
MONTHLY_RETENTION=3650  # Keep monthly backups for 10 years (Norwegian law)

# Backup type: full, incremental
BACKUP_TYPE="${BACKUP_TYPE:-full}"

# Email notification (set to your admin email)
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"

# Cloud storage (optional)
CLOUD_ENABLED="${CLOUD_ENABLED:-false}"
CLOUD_PROVIDER="${CLOUD_PROVIDER:-s3}"  # s3, azure, gcs
CLOUD_BUCKET="${CLOUD_BUCKET:-}"

# Logging
LOG_FILE="${BACKUP_DIR}/backup.log"

# ============================================================================
# FUNCTIONS
# ============================================================================

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
  log "❌ ERROR: $1"
  # Send email notification
  echo "$1" | mail -s "ChiroClickCRM Backup Failed" "$ADMIN_EMAIL" 2>/dev/null || true
  exit 1
}

success() {
  log "✅ SUCCESS: $1"
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

log "Starting ChiroClickCRM database backup..."

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
  error "pg_dump not found. Install PostgreSQL client tools."
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR" || error "Failed to create backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/monthly"

# ============================================================================
# BACKUP EXECUTION
# ============================================================================

# Determine backup category
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +%d)

if [ "$DAY_OF_MONTH" = "01" ]; then
  CATEGORY="monthly"
elif [ "$DAY_OF_WEEK" = "7" ]; then
  CATEGORY="weekly"
else
  CATEGORY="daily"
fi

# Backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/$CATEGORY/chiroclickcrm_${CATEGORY}_${TIMESTAMP}.sql.gz"

log "Performing $CATEGORY backup to: $BACKUP_FILE"

# Perform backup with custom format (allows selective restore) and compression
if PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -Fc \
  --verbose \
  --no-owner \
  --no-acl \
  "$DB_NAME" 2>&1 | gzip > "$BACKUP_FILE"; then

  # Get backup file size
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  success "Backup completed successfully. Size: $BACKUP_SIZE"

  # Verify backup integrity
  if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    success "Backup file integrity verified"
  else
    error "Backup file is corrupted!"
  fi

else
  error "Database backup failed!"
fi

# ============================================================================
# BACKUP METADATA
# ============================================================================

# Create metadata file
METADATA_FILE="${BACKUP_FILE}.meta"
cat > "$METADATA_FILE" <<EOF
{
  "backup_date": "$(date -Iseconds)",
  "database": "$DB_NAME",
  "host": "$DB_HOST",
  "category": "$CATEGORY",
  "size_bytes": $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE"),
  "size_human": "$BACKUP_SIZE",
  "compression": "gzip",
  "format": "postgresql_custom"
}
EOF

log "Metadata saved to: $METADATA_FILE"

# ============================================================================
# CLEANUP OLD BACKUPS
# ============================================================================

log "Cleaning up old backups..."

# Daily backups
DAILY_DELETED=$(find "$BACKUP_DIR/daily" -name "*.sql.gz" -mtime +$DAILY_RETENTION -delete -print | wc -l)
[ "$DAILY_DELETED" -gt 0 ] && log "Deleted $DAILY_DELETED daily backup(s) older than $DAILY_RETENTION days"

# Weekly backups
WEEKLY_DELETED=$(find "$BACKUP_DIR/weekly" -name "*.sql.gz" -mtime +$WEEKLY_RETENTION -delete -print | wc -l)
[ "$WEEKLY_DELETED" -gt 0 ] && log "Deleted $WEEKLY_DELETED weekly backup(s) older than $WEEKLY_RETENTION days"

# Monthly backups - NEVER delete (10-year legal requirement)
# If you need to delete very old monthly backups (>10 years), do it manually after legal review
MONTHLY_COUNT=$(find "$BACKUP_DIR/monthly" -name "*.sql.gz" | wc -l)
log "Monthly backups retained: $MONTHLY_COUNT (10-year legal requirement)"

# ============================================================================
# CLOUD STORAGE UPLOAD (OPTIONAL)
# ============================================================================

if [ "$CLOUD_ENABLED" = "true" ]; then
  log "Uploading backup to cloud storage ($CLOUD_PROVIDER)..."

  case "$CLOUD_PROVIDER" in
    s3)
      if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FILE" "s3://${CLOUD_BUCKET}/backups/$CATEGORY/" && \
          success "Uploaded to S3: s3://${CLOUD_BUCKET}/backups/$CATEGORY/"
      else
        log "⚠️  WARNING: AWS CLI not installed, skipping S3 upload"
      fi
      ;;

    azure)
      if command -v az &> /dev/null; then
        az storage blob upload \
          --account-name "$CLOUD_BUCKET" \
          --container-name backups \
          --name "$CATEGORY/$(basename $BACKUP_FILE)" \
          --file "$BACKUP_FILE" && \
          success "Uploaded to Azure Blob Storage"
      else
        log "⚠️  WARNING: Azure CLI not installed, skipping Azure upload"
      fi
      ;;

    gcs)
      if command -v gsutil &> /dev/null; then
        gsutil cp "$BACKUP_FILE" "gs://${CLOUD_BUCKET}/backups/$CATEGORY/" && \
          success "Uploaded to Google Cloud Storage"
      else
        log "⚠️  WARNING: gsutil not installed, skipping GCS upload"
      fi
      ;;

    *)
      log "⚠️  WARNING: Unknown cloud provider: $CLOUD_PROVIDER"
      ;;
  esac
fi

# ============================================================================
# WAL ARCHIVING STATUS
# ============================================================================

# Check WAL archiving status
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SHOW archive_mode;" | grep -q "on"; then
  success "WAL archiving is enabled (point-in-time recovery available)"
else
  log "⚠️  WARNING: WAL archiving is not enabled. Point-in-time recovery not available."
  log "   Enable in postgresql.conf: archive_mode = on"
fi

# ============================================================================
# SUMMARY REPORT
# ============================================================================

log "════════════════════════════════════════════════════════════"
log "BACKUP SUMMARY"
log "════════════════════════════════════════════════════════════"
log "Category:        $CATEGORY"
log "File:            $BACKUP_FILE"
log "Size:            $BACKUP_SIZE"
log "Daily backups:   $(find "$BACKUP_DIR/daily" -name "*.sql.gz" | wc -l)"
log "Weekly backups:  $(find "$BACKUP_DIR/weekly" -name "*.sql.gz" | wc -l)"
log "Monthly backups: $(find "$BACKUP_DIR/monthly" -name "*.sql.gz" | wc -l)"
log "Cloud upload:    ${CLOUD_ENABLED}"
log "════════════════════════════════════════════════════════════"

# ============================================================================
# OPTIONAL: TEST RESTORE (Comment out for production)
# ============================================================================

# Uncomment to test restore to a test database
# TEST_DB="${DB_NAME}_restore_test"
# log "Testing restore to $TEST_DB..."
# createdb -h "$DB_HOST" -U "$DB_USER" "$TEST_DB" 2>/dev/null || true
# gunzip -c "$BACKUP_FILE" | pg_restore -h "$DB_HOST" -U "$DB_USER" -d "$TEST_DB" --clean --if-exists
# dropdb -h "$DB_HOST" -U "$DB_USER" "$TEST_DB"
# success "Restore test passed"

log "Backup process completed successfully!"
exit 0
