#!/usr/bin/env bash
#
# backup-pglite.sh
# Creates a timestamped backup of the PGlite data directory.
# Keeps a maximum of 5 backups, deleting the oldest when exceeded.
#
# Usage:
#   ./scripts/backup-pglite.sh
#
# The script is idempotent — safe to run multiple times.

set -euo pipefail

# Resolve paths relative to the project root (one level up from scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PGLITE_DIR="$PROJECT_ROOT/data/pglite"
BACKUP_BASE="$PROJECT_ROOT/data/backups"
MAX_BACKUPS=5

# 1. Check if PGlite data directory exists and is non-empty
if [ ! -d "$PGLITE_DIR" ]; then
  echo "ERROR: PGlite data directory does not exist: $PGLITE_DIR"
  echo "Nothing to back up."
  exit 1
fi

if [ -z "$(ls -A "$PGLITE_DIR" 2>/dev/null)" ]; then
  echo "WARNING: PGlite data directory is empty: $PGLITE_DIR"
  echo "Nothing to back up."
  exit 0
fi

# 2. Ensure backup base directory exists
mkdir -p "$BACKUP_BASE"

# 3. Create timestamped backup
TIMESTAMP=$(date +"%Y-%m-%d-%H%M")
BACKUP_DEST="$BACKUP_BASE/pglite-$TIMESTAMP"

# Avoid overwriting if run multiple times in the same minute
if [ -d "$BACKUP_DEST" ]; then
  echo "Backup already exists for this timestamp: $BACKUP_DEST"
  echo "Skipping."
  exit 0
fi

echo "Backing up PGlite data..."
echo "  Source: $PGLITE_DIR"
echo "  Dest:   $BACKUP_DEST"

cp -r "$PGLITE_DIR" "$BACKUP_DEST"

# 4. Report backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DEST" 2>/dev/null | cut -f1)
echo "Backup complete: $BACKUP_DEST ($BACKUP_SIZE)"

# 5. Prune old backups — keep only the newest MAX_BACKUPS
# List pglite-* dirs sorted oldest first, delete excess
EXISTING_BACKUPS=$(ls -1dt "$BACKUP_BASE"/pglite-* 2>/dev/null || true)
BACKUP_COUNT=$(echo "$EXISTING_BACKUPS" | grep -c . 2>/dev/null || echo 0)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
  echo "Pruning old backups (keeping newest $MAX_BACKUPS of $BACKUP_COUNT)..."
  echo "$EXISTING_BACKUPS" | tail -n +"$((MAX_BACKUPS + 1))" | while IFS= read -r old_backup; do
    if [ -n "$old_backup" ] && [ -d "$old_backup" ]; then
      echo "  Deleting: $old_backup"
      rm -rf "$old_backup"
    fi
  done
fi

echo "Done. Current backups:"
ls -1dt "$BACKUP_BASE"/pglite-* 2>/dev/null | while IFS= read -r b; do
  size=$(du -sh "$b" 2>/dev/null | cut -f1)
  echo "  $(basename "$b") ($size)"
done
