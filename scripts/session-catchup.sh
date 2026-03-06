#!/usr/bin/env bash
# Session catchup script — prints current state for context recovery
# Used by /reboot and /resume commands

echo "=== SESSION CATCHUP ==="
echo ""

# Git state
echo "--- GIT STATE ---"
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "Branch: $BRANCH"
git log --oneline -5 2>/dev/null || echo "No git history"
echo ""
CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
echo "Uncommitted changes: $CHANGES"
if [ "$CHANGES" -gt 0 ]; then
  git status --short 2>/dev/null
fi
echo ""

# Active plan
echo "--- ACTIVE PLAN ---"
if [ -f .planning/task_plan.md ]; then
  head -30 .planning/task_plan.md
else
  echo "No active plan (.planning/task_plan.md not found)"
fi
echo ""

# Recent progress
echo "--- RECENT PROGRESS ---"
if [ -f .planning/progress.md ]; then
  tail -20 .planning/progress.md
else
  echo "No progress log (.planning/progress.md not found)"
fi
echo ""

# Test health (quick check — don't run full suites)
echo "--- TEST HEALTH ---"
if [ -f backend/package.json ]; then
  BACKEND_TESTS=$(grep -c '"test"' backend/package.json 2>/dev/null)
  echo "Backend test script: $([ "$BACKEND_TESTS" -gt 0 ] && echo 'configured' || echo 'missing')"
fi
if [ -f frontend/package.json ]; then
  FRONTEND_TESTS=$(grep -c '"test"' frontend/package.json 2>/dev/null)
  echo "Frontend test script: $([ "$FRONTEND_TESTS" -gt 0 ] && echo 'configured' || echo 'missing')"
fi
echo ""

# Tool call counter
echo "--- SESSION METRICS ---"
if [ -f /tmp/claude_tc ]; then
  echo "Tool calls this session: $(cat /tmp/claude_tc)"
else
  echo "Tool call counter: not started"
fi
echo ""
echo "=== END CATCHUP ==="
