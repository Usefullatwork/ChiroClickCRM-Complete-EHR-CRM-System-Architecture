#!/bin/bash
# check-seeds.sh — Verify seed data is loaded in the running backend
# Usage: scripts/check-seeds.sh
# Requires: backend running on localhost:3000, DEV_SKIP_AUTH=true

BACKEND_PORT="${BACKEND_PORT:-3000}"
BASE_URL="http://localhost:${BACKEND_PORT}/api/v1"

echo "=== Seed Data Check ==="

# Check backend is up first
if ! curl -s -m 3 "http://localhost:${BACKEND_PORT}/health" >/dev/null 2>&1; then
  echo "ERROR: Backend not running on port $BACKEND_PORT"
  echo "Start it first: cd backend && npm run dev"
  exit 1
fi

# Check users (demo accounts)
users_resp=$(curl -s -m 5 "${BASE_URL}/patients?limit=1" 2>/dev/null)
if echo "$users_resp" | grep -q '"total"'; then
  total=$(echo "$users_resp" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
  echo "Patients:        $total records"
else
  echo "Patients:        UNKNOWN (auth required?)"
fi

# Check spine templates
spine_resp=$(curl -s -m 5 "${BASE_URL}/spine-templates/segments" 2>/dev/null)
if echo "$spine_resp" | grep -q 'C2\|T1\|L1'; then
  segment_count=$(echo "$spine_resp" | grep -o '"' | wc -l)
  echo "Spine templates: loaded"
else
  echo "Spine templates: NOT LOADED or endpoint unavailable"
fi

# Check exercises
exercises_resp=$(curl -s -m 5 "${BASE_URL}/exercises?limit=1" 2>/dev/null)
if echo "$exercises_resp" | grep -q '"total"\|"exercises"'; then
  echo "Exercises:       loaded"
else
  echo "Exercises:       NOT LOADED or endpoint unavailable"
fi

echo "========================"
