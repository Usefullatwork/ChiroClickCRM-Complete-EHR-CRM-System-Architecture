#!/bin/bash
# check-pglite.sh — Check PGlite data directory health
# Usage: scripts/check-pglite.sh

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGLITE_DIR="$PROJECT_ROOT/data/pglite"

echo "=== PGlite Data Check ==="

# Does data dir exist?
if [ ! -d "$PGLITE_DIR" ]; then
  echo "Status:    NO DATA DIR (first run — db-init.js will create it)"
  echo "Path:      $PGLITE_DIR"
  echo "Action:    Start backend to auto-initialize"
  exit 0
fi

# Is it empty?
file_count=$(ls -1 "$PGLITE_DIR" 2>/dev/null | wc -l)
if [ "$file_count" -eq 0 ]; then
  echo "Status:    EMPTY DIR (will auto-initialize on start)"
  echo "Path:      $PGLITE_DIR"
  exit 0
fi

# Check PG_VERSION (key health indicator)
if [ -f "$PGLITE_DIR/PG_VERSION" ]; then
  pg_ver=$(cat "$PGLITE_DIR/PG_VERSION")
  echo "Status:    OK"
  echo "PG_VERSION: $pg_ver"
else
  echo "Status:    CORRUPTED (no PG_VERSION file)"
  echo "Path:      $PGLITE_DIR"
  echo "Action:    Delete dir and restart backend (db-init.js auto-recreates)"
  echo "Command:   rm -rf '$PGLITE_DIR' && cd backend && npm run dev"
  exit 1
fi

# Size info
dir_size=$(du -sh "$PGLITE_DIR" 2>/dev/null | cut -f1)
echo "Size:      $dir_size"
echo "Files:     $file_count"
echo "Path:      $PGLITE_DIR"

# Check for lock files (sign of unclean shutdown)
if ls "$PGLITE_DIR"/postmaster.pid 2>/dev/null >/dev/null; then
  echo "WARNING:   postmaster.pid exists (stale lock?)"
fi

echo "==========================="
