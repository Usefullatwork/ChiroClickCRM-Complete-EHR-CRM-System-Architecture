#!/bin/bash
# ============================================================
# ChiroClickCRM Database Setup Script for Unix/Linux/macOS
# ============================================================
# Prerequisites:
#   - PostgreSQL 14+ installed
#   - psql and createdb commands available
#   - PostgreSQL service running
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (can be overridden by environment variables)
DB_NAME="${POSTGRES_DB:-chiroclickcrm}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print header
echo ""
echo "============================================================"
echo "ChiroClickCRM Database Setup"
echo "============================================================"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST:$DB_PORT"
echo "============================================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    log_error "PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL and ensure psql is in your PATH"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" &> /dev/null; then
    log_warning "PostgreSQL may not be running on $DB_HOST:$DB_PORT"
    echo "Attempting to continue anyway..."
fi

# Step 1: Check if database exists
log_info "[1/5] Checking if database exists..."
if psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Database '$DB_NAME' already exists."
    read -p "Do you want to drop and recreate it? (y/N): " CONFIRM
    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        log_info "Dropping existing database..."
        dropdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
        log_success "Database dropped."
    else
        echo "Skipping database creation, running migrations only..."
        SKIP_SCHEMA=true
    fi
fi

# Step 2: Create database
if [[ -z "$SKIP_SCHEMA" ]]; then
    log_info "[2/5] Creating database '$DB_NAME'..."
    createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
    log_success "Database created successfully."
fi

# Step 3: Run schema
if [[ -z "$SKIP_SCHEMA" ]]; then
    log_info "[3/5] Running schema..."
    if [[ -f "$PROJECT_ROOT/database/schema.sql" ]]; then
        psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$PROJECT_ROOT/database/schema.sql"
        log_success "Schema applied successfully."
    else
        log_warning "schema.sql not found at $PROJECT_ROOT/database/schema.sql"
    fi
fi

# Step 4: Run migrations
log_info "[4/5] Running migrations..."
MIGRATION_COUNT=0

# Run database/migrations first
if [[ -d "$PROJECT_ROOT/database/migrations" ]]; then
    for migration in "$PROJECT_ROOT/database/migrations"/*.sql; do
        if [[ -f "$migration" ]]; then
            echo "  Running $(basename "$migration")..."
            psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$migration"
            ((MIGRATION_COUNT++))
        fi
    done
fi

# Run backend/migrations
if [[ -d "$PROJECT_ROOT/backend/migrations" ]]; then
    for migration in "$PROJECT_ROOT/backend/migrations"/*.sql; do
        if [[ -f "$migration" ]]; then
            echo "  Running $(basename "$migration")..."
            psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$migration"
            ((MIGRATION_COUNT++))
        fi
    done
fi

if [[ $MIGRATION_COUNT -eq 0 ]]; then
    echo "  No migrations found."
else
    log_success "$MIGRATION_COUNT migrations applied successfully."
fi

# Step 5: Run seeds
log_info "[5/5] Running seeds..."
SEED_COUNT=0

if [[ -d "$PROJECT_ROOT/database/seeds" ]]; then
    for seed in "$PROJECT_ROOT/database/seeds"/*.sql; do
        if [[ -f "$seed" ]]; then
            echo "  Running $(basename "$seed")..."
            if ! psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$seed" 2>/dev/null; then
                log_warning "Seed file $(basename "$seed") had errors (continuing anyway)"
            fi
            ((SEED_COUNT++))
        fi
    done
fi

if [[ $SEED_COUNT -eq 0 ]]; then
    echo "  No seed files found."
else
    log_success "$SEED_COUNT seed files applied."
fi

echo ""
echo "============================================================"
log_success "Database setup complete!"
echo "============================================================"
echo ""
echo "To verify the setup, run:"
echo "  psql -U $DB_USER -d $DB_NAME -c \"\\dt\""
echo ""
echo "To connect to the database:"
echo "  psql -U $DB_USER -d $DB_NAME"
echo ""

exit 0
