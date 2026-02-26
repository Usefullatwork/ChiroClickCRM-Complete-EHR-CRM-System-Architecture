#!/bin/bash
# check-health.sh — Check if backend + frontend are responding
# Usage: scripts/check-health.sh

BACKEND_PORT="${BACKEND_PORT:-3000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

echo "=== ChiroClickCRM Health Check ==="

# Backend
backend_resp=$(curl -s -m 3 "http://localhost:${BACKEND_PORT}/health" 2>/dev/null)
if [ $? -eq 0 ] && echo "$backend_resp" | grep -q '"status"'; then
  backend_status=$(echo "$backend_resp" | grep -o '"status":"[^"]*"' | head -1)
  echo "Backend:  OK ($backend_status) on port $BACKEND_PORT"
else
  echo "Backend:  NOT RUNNING on port $BACKEND_PORT"
fi

# Frontend
frontend_code=$(curl -s -o /dev/null -w "%{http_code}" -m 3 "http://localhost:${FRONTEND_PORT}" 2>/dev/null)
if [ "$frontend_code" = "200" ]; then
  echo "Frontend: OK on port $FRONTEND_PORT"
else
  echo "Frontend: NOT RUNNING on port $FRONTEND_PORT (HTTP $frontend_code)"
fi

# Ollama (optional)
ollama_resp=$(curl -s -m 3 "http://localhost:11434/api/tags" 2>/dev/null)
if [ $? -eq 0 ] && echo "$ollama_resp" | grep -q '"models"'; then
  model_count=$(echo "$ollama_resp" | grep -o '"name"' | wc -l)
  echo "Ollama:   OK ($model_count models loaded)"
else
  echo "Ollama:   NOT RUNNING (optional)"
fi

echo "=================================="
