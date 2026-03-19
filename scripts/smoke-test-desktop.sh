#!/usr/bin/env bash
# smoke-test-desktop.sh — Post-build desktop smoke test
# Requires: the Electron app to be running (backend on port 3000)
#
# Usage: bash scripts/smoke-test-desktop.sh
# Exit code: 0 = all pass, 1 = failures

set -euo pipefail

PORT=3000
BASE="http://localhost:${PORT}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expect="$3"

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")

  if [ "$status" = "$expect" ]; then
    echo "  PASS  $name (HTTP $status)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $name (expected $expect, got $status)"
    FAIL=$((FAIL + 1))
  fi
}

check_body() {
  local name="$1"
  local url="$2"
  local pattern="$3"

  local body
  body=$(curl -s --max-time 5 "$url" 2>/dev/null || echo "")

  if echo "$body" | grep -q "$pattern"; then
    echo "  PASS  $name (pattern found)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $name (pattern '$pattern' not found)"
    FAIL=$((FAIL + 1))
  fi
}

echo "ChiroClickEHR Desktop Smoke Test"
echo "================================"
echo "Target: $BASE"
echo ""

echo "1. Endpoint checks"
check "Health endpoint" "$BASE/health" "200"
check "Frontend serves HTML" "$BASE/" "200"
check "API base responds" "$BASE/api/v1/auth/setup-status" "200"
check "Swagger docs" "$BASE/api-docs/" "200"
check "404 for invalid route" "$BASE/api/v1/nonexistent" "404"

echo ""
echo "2. Content checks"
check_body "Frontend has React root" "$BASE/" "id=\"root\""
check_body "Health returns JSON" "$BASE/health" "status"

echo ""
echo "3. Process check"
NODE_COUNT=$(tasklist 2>/dev/null | grep -c "node.exe" || echo "0")
if [ "$NODE_COUNT" -le 2 ]; then
  echo "  PASS  Node.js processes: $NODE_COUNT (expected <= 2)"
  PASS=$((PASS + 1))
else
  echo "  WARN  Node.js processes: $NODE_COUNT (expected <= 2, may have orphans)"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "================================"
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All smoke tests passed."
