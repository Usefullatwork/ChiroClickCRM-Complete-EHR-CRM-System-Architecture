#!/usr/bin/env bash
# verify-build-artifacts.sh — Validate Electron build output
# Run after: npx electron-builder --win portable
#
# Usage: bash scripts/verify-build-artifacts.sh
# Exit code: 0 = all pass, 1 = failures

set -euo pipefail

PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="$PROJECT/release"
PASS=0
FAIL=0

check_exists() {
  local name="$1"
  local path="$2"

  if [ -e "$path" ]; then
    echo "  PASS  $name exists"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $name missing: $path"
    FAIL=$((FAIL + 1))
  fi
}

check_size() {
  local name="$1"
  local path="$2"
  local min_bytes="$3"

  if [ ! -f "$path" ]; then
    echo "  FAIL  $name missing"
    FAIL=$((FAIL + 1))
    return
  fi

  local size
  size=$(wc -c < "$path" | tr -d ' ')

  if [ "$size" -ge "$min_bytes" ]; then
    local mb=$((size / 1024 / 1024))
    echo "  PASS  $name: ${mb}MB (>= $((min_bytes / 1024 / 1024))MB)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $name too small: ${size} bytes (expected >= $min_bytes)"
    FAIL=$((FAIL + 1))
  fi
}

check_no_secrets() {
  local dir="$1"
  local found=0

  for pattern in ".env" ".env.local" ".env.production" "credentials.json" "secrets.json"; do
    if find "$dir" -name "$pattern" -type f 2>/dev/null | grep -q .; then
      echo "  FAIL  Secret file found: $pattern"
      found=1
    fi
  done

  if [ "$found" -eq 0 ]; then
    echo "  PASS  No secret files in release/"
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi
}

echo "ChiroClickEHR Build Artifact Verification"
echo "=========================================="
echo "Release dir: $RELEASE"
echo ""

echo "1. Directory structure"
check_exists "release/ directory" "$RELEASE"
check_exists "win-unpacked/" "$RELEASE/win-unpacked"
check_exists "Backend server.js" "$RELEASE/win-unpacked/resources/backend/src/server.js"
check_exists "Frontend dist/index.html" "$RELEASE/win-unpacked/resources/frontend/dist/index.html"
check_exists "Backend package.json" "$RELEASE/win-unpacked/resources/backend/package.json"

echo ""
echo "2. Portable executable"
# Match any .exe file in release/
EXE=$(find "$RELEASE" -maxdepth 1 -name "*.exe" -type f 2>/dev/null | head -1)
if [ -n "$EXE" ]; then
  check_size "Portable exe" "$EXE" 52428800  # 50MB minimum
else
  echo "  FAIL  No .exe found in release/"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "3. Backend package.json checks"
BACKEND_PKG="$RELEASE/win-unpacked/resources/backend/package.json"
if [ -f "$BACKEND_PKG" ]; then
  if grep -q '"type": "module"' "$BACKEND_PKG"; then
    echo "  PASS  Backend has \"type\": \"module\""
    PASS=$((PASS + 1))
  else
    echo "  FAIL  Backend missing \"type\": \"module\""
    FAIL=$((FAIL + 1))
  fi
fi

echo ""
echo "4. No secrets leaked"
check_no_secrets "$RELEASE"

echo ""
echo "5. No source maps in frontend dist"
MAP_COUNT=$(find "$RELEASE/win-unpacked/resources/frontend/dist" -name "*.map" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$MAP_COUNT" -eq 0 ]; then
  echo "  PASS  No .map files in frontend dist"
  PASS=$((PASS + 1))
else
  echo "  WARN  $MAP_COUNT .map files found (source maps enabled)"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All build artifact checks passed."
