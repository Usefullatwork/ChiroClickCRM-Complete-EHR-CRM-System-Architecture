#!/bin/bash
set -euo pipefail
# ChiroClickCRM Remote Smoke Test
# Usage: smoke-test-remote.sh <base_url>

BASE_URL="${1:?Usage: smoke-test-remote.sh <base_url>}"
PASSED=0
FAILED=0
TOTAL=4

fail() {
  echo "  FAIL: $1"
  FAILED=$((FAILED + 1))
}

pass() {
  echo "  PASS: $1"
  PASSED=$((PASSED + 1))
}

echo "=== Smoke Tests: $BASE_URL ==="
echo ""

# ---------------------------------------------------
# Test 1: Root health endpoint
# ---------------------------------------------------
echo "Test 1/4: Root health endpoint"
if curl -sf "$BASE_URL/health" > /dev/null 2>&1; then
  pass "GET /health returned 200"
else
  fail "GET /health did not return 200"
fi

# ---------------------------------------------------
# Test 2: Backend API health endpoint (JSON)
# ---------------------------------------------------
echo "Test 2/4: Backend API health"
API_RESPONSE=$(curl -sf "$BASE_URL/api/v1/health" 2>/dev/null || echo "")
if echo "$API_RESPONSE" | grep -q '"healthy"\|"ok"\|"status"'; then
  pass "GET /api/v1/health returned valid JSON"
else
  fail "GET /api/v1/health did not return expected JSON"
fi

# ---------------------------------------------------
# Test 3: Frontend serves HTML
# ---------------------------------------------------
echo "Test 3/4: Frontend serves content"
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE_URL/" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  pass "GET / returned HTTP 200"
else
  fail "GET / returned HTTP $HTTP_CODE (expected 200)"
fi

# ---------------------------------------------------
# Test 4: Database connectivity
# ---------------------------------------------------
echo "Test 4/4: Database connectivity"
DB_RESPONSE=$(curl -sf "$BASE_URL/api/v1/health/detailed" 2>/dev/null || echo "")
if echo "$DB_RESPONSE" | jq -e '.database == true' > /dev/null 2>&1; then
  pass "Database is connected"
else
  fail "Database connectivity check failed"
fi

# ---------------------------------------------------
# Summary
# ---------------------------------------------------
echo ""
echo "=== Results: $PASSED/$TOTAL tests passed ==="

if [ "$FAILED" -gt 0 ]; then
  echo "SMOKE TESTS FAILED"
  exit 1
fi

echo "All smoke tests passed"
exit 0
