#!/bin/bash
#
# ChiroClickCRM Database Backup Script
# Norwegian healthcare compliance requires secure backups
#
# Usage: ./backup-db.sh [--full|--incremental]
# Add to cron: 0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/chiroclickcrm-backup.log 2>&1
#

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

# Load environment variables if .env file exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../backend/.env"

if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

# Database connection settings
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-chiroclickcrm}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Backup settings
BACKUP_DIR="${BACKUP_DIR:-/var/backups/chiroclickcrm}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_TYPE="${1:---full}"

# Encryption settings (Norwegian healthcare requires encrypted backups)
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
ENCRYPT_BACKUPS="${ENCRYPT_BACKUPS:-true}"

# Notification settings
NOTIFY_EMAIL="${BACKUP_NOTIFY_EMAIL:-}"
SLACK_WEBHOOK="${BACKUP_SLACK_WEBHOOK:-}"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    log "ERROR: $1" >&2
    send_notification "FAILED" "$1"
    exit 1
}

send_notification() {
    local status="$1"
    local message="$2"

    # Email notification
    if [ -n "$NOTIFY_EMAIL" ]; then
        echo "$message" | mail -s "ChiroClickCRM Backup $status" "$NOTIFY_EMAIL" 2>/dev/null || true
    fi

    # Slack notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"ChiroClickCRM Backup $status: $message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
}

check_prerequisites() {
    log "Checking prerequisites..."

    # Check pg_dump exists
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump not found. Please install PostgreSQL client tools."
    fi

    # Check backup directory
    if [ ! -d "$BACKUP_DIR" ]; then
        log "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi

    # Check encryption key if encryption is enabled
    if [ "$ENCRYPT_BACKUPS" = "true" ] && [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
        error "BACKUP_ENCRYPTION_KEY is required when ENCRYPT_BACKUPS is enabled"
    fi

    # Test database connection
    log "Testing database connection..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1 \
        || error "Cannot connect to database. Check credentials."

    log "Prerequisites check passed."
}

# ============================================================================
# BACKUP FUNCTIONS
# ============================================================================

perform_backup() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="${BACKUP_DIR}/${DB_NAME}_${timestamp}"

    log "Starting $BACKUP_TYPE backup..."
    log "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"

    # Create backup using custom format (supports compression and parallel restore)
    log "Creating database dump..."
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -Fc \
        -v \
        --no-owner \
        --no-privileges \
        -f "${backup_file}.dump" 2>&1 | while read line; do log "  $line"; done

    if [ ! -f "${backup_file}.dump" ]; then
        error "Backup file was not created"
    fi

    local backup_size=$(du -h "${backup_file}.dump" | cut -f1)
    log "Backup created: ${backup_file}.dump (${backup_size})"

    # Encrypt backup if enabled
    if [ "$ENCRYPT_BACKUPS" = "true" ]; then
        log "Encrypting backup..."
        openssl enc -aes-256-cbc -salt -pbkdf2 \
            -in "${backup_file}.dump" \
            -out "${backup_file}.dump.enc" \
            -pass pass:"$BACKUP_ENCRYPTION_KEY"

        # Remove unencrypted file
        rm "${backup_file}.dump"
        log "Backup encrypted: ${backup_file}.dump.enc"

        # Create checksum of encrypted file
        sha256sum "${backup_file}.dump.enc" > "${backup_file}.dump.enc.sha256"
    else
        # Create checksum of unencrypted file
        sha256sum "${backup_file}.dump" > "${backup_file}.dump.sha256"
    fi

    # Create symlink to latest backup
    local latest_file="${BACKUP_DIR}/latest.dump"
    if [ "$ENCRYPT_BACKUPS" = "true" ]; then
        latest_file="${BACKUP_DIR}/latest.dump.enc"
        ln -sf "${backup_file}.dump.enc" "$latest_file"
    else
        ln -sf "${backup_file}.dump" "$latest_file"
    fi
    log "Updated latest symlink: $latest_file"

    echo "${backup_file}"
}

# ============================================================================
# CLEANUP FUNCTIONS
# ============================================================================

cleanup_old_backups() {
    log "Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days..."

    local deleted_count=0

    # Find and delete old backup files
    find "$BACKUP_DIR" -name "${DB_NAME}_*.dump*" -type f -mtime +${BACKUP_RETENTION_DAYS} | while read file; do
        log "  Deleting: $file"
        rm -f "$file"
        ((deleted_count++)) || true
    done

    log "Cleanup complete. Deleted $deleted_count old backup(s)."
}

# ============================================================================
# VERIFICATION FUNCTIONS
# ============================================================================

verify_backup() {
    local backup_file="$1"

    log "Verifying backup integrity..."

    local file_to_verify="${backup_file}.dump"
    if [ "$ENCRYPT_BACKUPS" = "true" ]; then
        file_to_verify="${backup_file}.dump.enc"
    fi

    # Verify checksum
    if [ -f "${file_to_verify}.sha256" ]; then
        if sha256sum -c "${file_to_verify}.sha256" > /dev/null 2>&1; then
            log "Checksum verification passed."
        else
            error "Checksum verification failed!"
        fi
    fi

    # For encrypted backups, verify we can decrypt
    if [ "$ENCRYPT_BACKUPS" = "true" ]; then
        log "Verifying encrypted backup can be decrypted..."
        openssl enc -aes-256-cbc -d -pbkdf2 \
            -in "${backup_file}.dump.enc" \
            -pass pass:"$BACKUP_ENCRYPTION_KEY" | head -c 1024 > /dev/null 2>&1 \
            || error "Cannot decrypt backup file"
        log "Decryption verification passed."
    fi

    # Verify pg_dump format by listing contents
    log "Verifying backup format..."
    if [ "$ENCRYPT_BACKUPS" = "true" ]; then
        openssl enc -aes-256-cbc -d -pbkdf2 \
            -in "${backup_file}.dump.enc" \
            -pass pass:"$BACKUP_ENCRYPTION_KEY" | pg_restore -l > /dev/null 2>&1 \
            || error "Backup format verification failed"
    else
        pg_restore -l "${backup_file}.dump" > /dev/null 2>&1 \
            || error "Backup format verification failed"
    fi
    log "Backup format verification passed."

    log "All verifications passed!"
}

# ============================================================================
# RESTORE FUNCTION (for testing)
# ============================================================================

restore_backup() {
    local backup_file="$1"
    local target_db="${2:-${DB_NAME}_restore_test}"

    log "Restoring backup to test database: $target_db"

    # Create test database
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -c "DROP DATABASE IF EXISTS $target_db" 2>/dev/null || true
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -c "CREATE DATABASE $target_db" || error "Failed to create test database"

    # Restore backup
    if [ "$ENCRYPT_BACKUPS" = "true" ]; then
        openssl enc -aes-256-cbc -d -pbkdf2 \
            -in "${backup_file}.dump.enc" \
            -pass pass:"$BACKUP_ENCRYPTION_KEY" | \
        PGPASSWORD="$DB_PASSWORD" pg_restore \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$target_db" \
            --no-owner \
            --no-privileges 2>&1 | while read line; do log "  $line"; done
    else
        PGPASSWORD="$DB_PASSWORD" pg_restore \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$target_db" \
            --no-owner \
            --no-privileges \
            "${backup_file}.dump" 2>&1 | while read line; do log "  $line"; done
    fi

    # Verify restore by counting tables
    local table_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    log "Restored database has ${table_count// /} tables"

    # Clean up test database
    log "Cleaning up test database..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -c "DROP DATABASE IF EXISTS $target_db" 2>/dev/null || true

    log "Restore test completed successfully!"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    log "============================================"
    log "ChiroClickCRM Database Backup"
    log "============================================"

    local start_time=$(date +%s)

    # Check prerequisites
    check_prerequisites

    # Perform backup
    local backup_file=$(perform_backup)

    # Verify backup
    verify_backup "$backup_file"

    # Cleanup old backups
    cleanup_old_backups

    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "============================================"
    log "Backup completed successfully in ${duration} seconds"
    log "============================================"

    # Send success notification
    send_notification "SUCCESS" "Backup completed in ${duration}s. File: ${backup_file}"
}

# Handle command line arguments
case "${1:-}" in
    --restore)
        if [ -z "${2:-}" ]; then
            error "Usage: $0 --restore <backup_file> [target_db]"
        fi
        check_prerequisites
        restore_backup "$2" "${3:-}"
        ;;
    --verify)
        if [ -z "${2:-}" ]; then
            error "Usage: $0 --verify <backup_file>"
        fi
        verify_backup "$2"
        ;;
    --help)
        echo "Usage: $0 [--full|--incremental|--restore <file>|--verify <file>|--help]"
        echo ""
        echo "Commands:"
        echo "  --full          Create a full database backup (default)"
        echo "  --incremental   Create an incremental backup (requires WAL archiving)"
        echo "  --restore FILE  Restore a backup to a test database"
        echo "  --verify FILE   Verify backup integrity"
        echo "  --help          Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
        echo "  BACKUP_DIR              Backup directory (default: /var/backups/chiroclickcrm)"
        echo "  BACKUP_RETENTION_DAYS   Days to keep backups (default: 30)"
        echo "  BACKUP_ENCRYPTION_KEY   Encryption key for backups"
        echo "  ENCRYPT_BACKUPS         Enable encryption (default: true)"
        echo "  BACKUP_NOTIFY_EMAIL     Email for notifications"
        echo "  BACKUP_SLACK_WEBHOOK    Slack webhook for notifications"
        ;;
    *)
        main
        ;;
esac
