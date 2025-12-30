#!/bin/bash
set -e

# ============================================================================
# ChiroClick CRM Database Backup Script
# ============================================================================
# This script creates encrypted backups of the PostgreSQL database
# Compliant with GDPR 10-year retention requirement
# ============================================================================

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups/postgresql}"
RETENTION_DAYS=${RETENTION_DAYS:-3650}  # 10 years for GDPR compliance

# Database credentials from environment
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-chiroclickcrm}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "ChiroClick CRM Database Backup"
echo "=========================================="
echo "Date: $(date)"
echo "Database: $DB_NAME"
echo "Backup Directory: $BACKUP_DIR"
echo "=========================================="

# Create backup
echo "Creating backup..."
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup created: $BACKUP_FILE"
else
  echo "❌ Backup failed!"
  exit 1
fi

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"
echo "✅ Backup compressed: $BACKUP_FILE"

# Encrypt backup (optional but recommended for GDPR)
if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
  echo "Encrypting backup..."
  openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "$BACKUP_FILE" \
    -out "${BACKUP_FILE}.enc" \
    -k "$BACKUP_ENCRYPTION_KEY"

  if [ $? -eq 0 ]; then
    rm "$BACKUP_FILE"  # Remove unencrypted backup
    BACKUP_FILE="${BACKUP_FILE}.enc"
    echo "✅ Backup encrypted: $BACKUP_FILE"
  else
    echo "⚠️  Encryption failed, keeping unencrypted backup"
  fi
fi

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Upload to cloud storage (optional)
if [ -n "$S3_BUCKET" ]; then
  echo "Uploading to S3..."
  aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/$(basename $BACKUP_FILE)"

  if [ $? -eq 0 ]; then
    echo "✅ Backup uploaded to S3"
  else
    echo "⚠️  S3 upload failed, backup saved locally only"
  fi
fi

# Delete old backups (keep 10 years)
echo "Cleaning old backups (retention: $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -name "backup_*.sql.gz*" -mtime +$RETENTION_DAYS -delete
echo "✅ Old backups cleaned"

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/manifest.log"
echo "$TIMESTAMP|$BACKUP_FILE|$BACKUP_SIZE|SUCCESS" >> "$MANIFEST_FILE"

echo "=========================================="
echo "✅ Backup completed successfully!"
echo "=========================================="
