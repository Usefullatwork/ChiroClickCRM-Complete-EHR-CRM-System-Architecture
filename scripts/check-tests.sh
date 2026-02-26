#!/bin/bash
# check-tests.sh — Run tests and report summary
# Usage: scripts/check-tests.sh [backend|frontend|all]

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}"

echo "=== Test Runner ==="

run_backend() {
  echo "--- Backend Tests ---"
  cd "$PROJECT_ROOT/backend" || { echo "ERROR: backend/ not found"; return 1; }
  npm test -- --forceExit --silent 2>&1 | tail -20
  echo ""
}

run_frontend() {
  echo "--- Frontend Tests ---"
  cd "$PROJECT_ROOT/frontend" || { echo "ERROR: frontend/ not found"; return 1; }
  npm test -- --run 2>&1 | tail -20
  echo ""
}

case "$TARGET" in
  backend)
    run_backend
    ;;
  frontend)
    run_frontend
    ;;
  all)
    run_backend
    run_frontend
    ;;
  *)
    echo "Usage: check-tests.sh [backend|frontend|all]"
    exit 1
    ;;
esac

echo "==================="
