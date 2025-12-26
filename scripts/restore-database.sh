#!/bin/bash
# ============================================================================
# ChiroClickCRM Database Restore Script
# Restore database from backup with verification
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
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# ============================================================================
# RESTORE FUNCTIONS
# ============================================================================

list_backups() {
    log_info "Available backups:"
    echo ""
    echo "Daily backups:"
    ls -lah "$BACKUP_DIR/daily/" 2>/dev/null | grep -E "\.dump|\.enc" || echo "  (none)"
    echo ""
    echo "Weekly backups:"
    ls -lah "$BACKUP_DIR/weekly/" 2>/dev/null | grep -E "\.dump|\.enc" || echo "  (none)"
    echo ""
    echo "Monthly backups:"
    ls -lah "$BACKUP_DIR/monthly/" 2>/dev/null | grep -E "\.dump|\.enc" || echo "  (none)"
}

decrypt_backup() {
    local backup_file=$1
    local decrypted_file="${backup_file%.enc}"

    if [[ "$backup_file" == *.enc ]]; then
        if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
            log_error "Encrypted backup requires BACKUP_ENCRYPTION_KEY"
            exit 1
        fi

        log_info "Decrypting backup..."
        openssl enc -aes-256-cbc -d \
            -in "$backup_file" \
            -out "$decrypted_file" \
            -pass pass:"$BACKUP_ENCRYPTION_KEY"

        echo "$decrypted_file"
    else
        echo "$backup_file"
    fi
}

verify_backup() {
    local backup_file=$1

    log_info "Verifying backup integrity..."

    if ! pg_restore --list "$backup_file" > /dev/null 2>&1; then
        log_error "Backup verification failed!"
        return 1
    fi

    log_info "Backup verified successfully"
    return 0
}

create_safety_backup() {
    log_info "Creating safety backup of current database..."

    local safety_backup="$BACKUP_DIR/safety_backup_$(date +%Y%m%d_%H%M%S).dump"

    export PGPASSWORD="$DB_PASSWORD"
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -Fc \
        -f "$safety_backup" 2>/dev/null || true
    unset PGPASSWORD

    if [ -f "$safety_backup" ]; then
        log_info "Safety backup created: $safety_backup"
        echo "$safety_backup"
    else
        log_warn "Could not create safety backup (database may not exist)"
        echo ""
    fi
}

drop_database() {
    log_warn "Dropping existing database..."

    export PGPASSWORD="$DB_PASSWORD"

    # Terminate existing connections
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$DB_NAME'
        AND pid <> pg_backend_pid();
    " 2>/dev/null || true

    # Drop database
    dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --if-exists "$DB_NAME"

    unset PGPASSWORD

    log_info "Database dropped"
}

create_database() {
    log_info "Creating new database..."

    export PGPASSWORD="$DB_PASSWORD"
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    unset PGPASSWORD

    log_info "Database created"
}

restore_backup() {
    local backup_file=$1

    log_info "Restoring database from backup..."

    export PGPASSWORD="$DB_PASSWORD"

    pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        "$backup_file"

    unset PGPASSWORD

    log_info "Restore completed"
}

verify_restore() {
    log_info "Verifying restored database..."

    export PGPASSWORD="$DB_PASSWORD"

    # Check table counts
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    ")

    log_info "Tables found: $table_count"

    # Check patient count
    local patient_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM patients;
    " 2>/dev/null || echo "0")

    log_info "Patients found: $patient_count"

    # Check encounter count
    local encounter_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM clinical_encounters;
    " 2>/dev/null || echo "0")

    log_info "Clinical encounters found: $encounter_count"

    unset PGPASSWORD

    echo ""
    log_info "============================================"
    log_info "Restore verification complete"
    log_info "Tables: $table_count"
    log_info "Patients: $patient_count"
    log_info "Encounters: $encounter_count"
    log_info "============================================"
}

cleanup_temp_files() {
    local decrypted_file=$1

    if [[ "$decrypted_file" != *.enc ]] && [[ "$decrypted_file" == *_decrypted* ]]; then
        log_info "Cleaning up temporary decrypted file..."
        rm -f "$decrypted_file"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

usage() {
    echo "Usage: $0 [backup_file] [options]"
    echo ""
    echo "Options:"
    echo "  --list              List available backups"
    echo "  --latest            Restore latest daily backup"
    echo "  --no-drop           Don't drop existing database (merge)"
    echo "  --skip-verify       Skip backup verification"
    echo "  --no-safety         Don't create safety backup before restore"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list"
    echo "  $0 --latest"
    echo "  $0 backups/daily/backup_20250101_020000.dump"
    echo "  $0 backups/daily/backup_20250101_020000.dump.enc"
}

main() {
    local backup_file=""
    local do_list=false
    local use_latest=false
    local do_drop=true
    local do_verify=true
    local do_safety=true

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --list)
                do_list=true
                shift
                ;;
            --latest)
                use_latest=true
                shift
                ;;
            --no-drop)
                do_drop=false
                shift
                ;;
            --skip-verify)
                do_verify=false
                shift
                ;;
            --no-safety)
                do_safety=false
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done

    # List backups
    if [ "$do_list" = true ]; then
        list_backups
        exit 0
    fi

    # Find latest backup
    if [ "$use_latest" = true ]; then
        backup_file=$(ls -t "$BACKUP_DIR/daily/"*.dump* 2>/dev/null | head -1)
        if [ -z "$backup_file" ]; then
            log_error "No backups found in $BACKUP_DIR/daily/"
            exit 1
        fi
        log_info "Using latest backup: $backup_file"
    fi

    # Validate backup file
    if [ -z "$backup_file" ]; then
        log_error "No backup file specified"
        usage
        exit 1
    fi

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    log_info "============================================"
    log_info "ChiroClickCRM Database Restore"
    log_info "Backup file: $backup_file"
    log_info "Target database: $DB_NAME@$DB_HOST:$DB_PORT"
    log_info "============================================"

    # Confirm
    echo ""
    log_warn "⚠️  WARNING: This will replace the current database!"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi

    # Step 1: Decrypt if needed
    log_step "Step 1: Preparing backup file"
    local restore_file=$(decrypt_backup "$backup_file")

    # Step 2: Verify backup
    if [ "$do_verify" = true ]; then
        log_step "Step 2: Verifying backup"
        verify_backup "$restore_file"
    fi

    # Step 3: Create safety backup
    if [ "$do_safety" = true ]; then
        log_step "Step 3: Creating safety backup"
        safety_backup=$(create_safety_backup)
    fi

    # Step 4: Drop and recreate database
    if [ "$do_drop" = true ]; then
        log_step "Step 4: Recreating database"
        drop_database
        create_database
    fi

    # Step 5: Restore
    log_step "Step 5: Restoring database"
    restore_backup "$restore_file"

    # Step 6: Verify restore
    log_step "Step 6: Verifying restore"
    verify_restore

    # Step 7: Cleanup
    log_step "Step 7: Cleanup"
    cleanup_temp_files "$restore_file"

    log_info "============================================"
    log_info "✅ Database restore completed successfully!"
    if [ -n "$safety_backup" ]; then
        log_info "Safety backup: $safety_backup"
    fi
    log_info "============================================"
}

# Run
main "$@"
