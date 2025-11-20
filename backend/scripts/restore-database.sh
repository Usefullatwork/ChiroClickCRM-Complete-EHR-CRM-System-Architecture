#!/bin/bash
set -e

# ============================================================================
# ChiroClick CRM Database Restore Script
# ============================================================================
# This script restores a PostgreSQL database from a backup file
# Supports encrypted and compressed backups
# ============================================================================

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Usage: ./restore-database.sh <backup-file>"
  echo "Example: ./restore-database.sh /backups/postgresql/backup_20251120_120000.sql.gz.enc"
  exit 1
fi

BACKUP_FILE="$1"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-chiroclickcrm}"

echo "=========================================="
echo "ChiroClick CRM Database Restore"
echo "=========================================="
echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (type 'YES' to confirm): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Decrypt if needed
if [[ "$BACKUP_FILE" == *.enc ]]; then
  echo "Decrypting backup..."

  if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
    echo "❌ BACKUP_ENCRYPTION_KEY environment variable not set!"
    exit 1
  fi

  DECRYPTED_FILE="${BACKUP_FILE%.enc}"
  openssl enc -aes-256-cbc -d -pbkdf2 \
    -in "$BACKUP_FILE" \
    -out "$DECRYPTED_FILE" \
    -k "$BACKUP_ENCRYPTION_KEY"

  if [ $? -eq 0 ]; then
    BACKUP_FILE="$DECRYPTED_FILE"
    echo "✅ Backup decrypted"
  else
    echo "❌ Decryption failed!"
    exit 1
  fi
fi

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "Decompressing backup..."
  gunzip -k "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE%.gz}"
  echo "✅ Backup decompressed"
fi

# Drop existing database and recreate
echo "Dropping existing database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
echo "✅ Database recreated"

# Restore backup
echo "Restoring backup..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "=========================================="
  echo "✅ Restore completed successfully!"
  echo "=========================================="
else
  echo "❌ Restore failed!"
  exit 1
fi

# Clean up temporary files
if [ -f "${BACKUP_FILE%.gz}.sql" ]; then
  rm "${BACKUP_FILE%.gz}.sql"
fi
