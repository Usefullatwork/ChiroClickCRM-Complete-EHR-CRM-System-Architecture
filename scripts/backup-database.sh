#!/bin/bash
# ============================================================================
# ChiroClickCRM Database Backup Script
# Automated backup with encryption and cloud upload support
# ============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-chiroclickcrm}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
S3_BUCKET="${S3_BUCKET:-}"
AZURE_CONTAINER="${AZURE_CONTAINER:-}"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/monthly"

# ============================================================================
# BACKUP FUNCTIONS
# ============================================================================

create_backup() {
    local backup_type=$1
    local backup_file="$BACKUP_DIR/${backup_type}/backup_${TIMESTAMP}.dump"

    log_info "Creating $backup_type backup: $backup_file"

    # Set password for pg_dump
    export PGPASSWORD="$DB_PASSWORD"

    # Create backup with custom format (allows parallel restore)
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -Fc \
        --no-owner \
        --no-privileges \
        -f "$backup_file"

    unset PGPASSWORD

    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "Backup created successfully: $size"
        echo "$backup_file"
    else
        log_error "Backup file was not created"
        exit 1
    fi
}

encrypt_backup() {
    local backup_file=$1
    local encrypted_file="${backup_file}.enc"

    if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
        log_info "Encrypting backup..."
        openssl enc -aes-256-cbc -salt \
            -in "$backup_file" \
            -out "$encrypted_file" \
            -pass pass:"$BACKUP_ENCRYPTION_KEY"

        # Remove unencrypted file
        rm "$backup_file"
        log_info "Backup encrypted: $encrypted_file"
        echo "$encrypted_file"
    else
        log_warn "No encryption key set, backup is unencrypted"
        echo "$backup_file"
    fi
}

upload_to_s3() {
    local backup_file=$1

    if [ -n "$S3_BUCKET" ]; then
        log_info "Uploading to S3: s3://$S3_BUCKET/backups/"
        aws s3 cp "$backup_file" "s3://$S3_BUCKET/backups/$(basename "$backup_file")"
        log_info "Upload to S3 complete"
    fi
}

upload_to_azure() {
    local backup_file=$1

    if [ -n "$AZURE_CONTAINER" ]; then
        log_info "Uploading to Azure: $AZURE_CONTAINER"
        az storage blob upload \
            --container-name "$AZURE_CONTAINER" \
            --file "$backup_file" \
            --name "backups/$(basename "$backup_file")"
        log_info "Upload to Azure complete"
    fi
}

cleanup_old_backups() {
    local backup_type=$1
    local retention_days=$2

    log_info "Cleaning up $backup_type backups older than $retention_days days..."

    find "$BACKUP_DIR/$backup_type" -name "backup_*.dump*" -mtime +$retention_days -delete

    local remaining=$(ls -1 "$BACKUP_DIR/$backup_type" 2>/dev/null | wc -l)
    log_info "Remaining $backup_type backups: $remaining"
}

create_wal_archive_config() {
    log_info "WAL archiving configuration (add to postgresql.conf):"
    cat << 'EOF'
# ============================================================================
# WAL ARCHIVING CONFIGURATION FOR POINT-IN-TIME RECOVERY
# Add these settings to postgresql.conf
# ============================================================================

wal_level = replica
archive_mode = on
archive_command = 'cp %p /path/to/wal_archive/%f'
archive_timeout = 300  # Archive every 5 minutes

# For continuous archiving to S3:
# archive_command = 'aws s3 cp %p s3://your-bucket/wal/%f'
EOF
}

verify_backup() {
    local backup_file=$1

    log_info "Verifying backup integrity..."

    # For encrypted files, we can only check file exists and has size
    if [[ "$backup_file" == *.enc ]]; then
        if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
            log_info "Encrypted backup file exists and has content"
            return 0
        fi
    else
        # For unencrypted pg_dump files, verify with pg_restore
        if pg_restore --list "$backup_file" > /dev/null 2>&1; then
            log_info "Backup verified successfully"
            return 0
        else
            log_error "Backup verification failed!"
            return 1
        fi
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    local backup_type="${1:-daily}"

    log_info "============================================"
    log_info "ChiroClickCRM Database Backup"
    log_info "Type: $backup_type"
    log_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    log_info "============================================"

    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump not found. Please install PostgreSQL client tools."
        exit 1
    fi

    # Create backup
    backup_file=$(create_backup "$backup_type")

    # Encrypt if key is set
    final_file=$(encrypt_backup "$backup_file")

    # Verify backup
    verify_backup "$final_file"

    # Upload to cloud storage
    upload_to_s3 "$final_file"
    upload_to_azure "$final_file"

    # Cleanup old backups based on type
    case $backup_type in
        daily)
            cleanup_old_backups "daily" 7
            ;;
        weekly)
            cleanup_old_backups "weekly" 30
            ;;
        monthly)
            cleanup_old_backups "monthly" 365
            ;;
    esac

    log_info "============================================"
    log_info "Backup complete: $final_file"
    log_info "============================================"
}

# Run with argument (daily, weekly, monthly)
main "$@"
