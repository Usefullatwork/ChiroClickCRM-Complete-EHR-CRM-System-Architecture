#!/usr/bin/env bash
# console-log-check.sh -- Detect console.log statements added to source files
#
# Hook type: PostToolUse (matcher: Write|Edit)
# Purpose: Warns when console.log is found in source files. Production code should
#          use a structured logger, not console.log. Allows console.warn and
#          console.error, which are often intentional.
#
# How it works:
#   - Receives the edited file path as $1 (from $TOOL_INPUT_FILE)
#   - Only checks files in src/ directory (skips tests, scripts, config)
#   - Only checks .ts, .tsx, .js, .jsx files
#   - Searches for console.log (not console.warn, console.error, console.info)
#   - If found, injects a systemMessage warning
#
# Usage in settings.json:
#   {
#     "hooks": {
#       "PostToolUse": [{
#         "matcher": "Write|Edit",
#         "hooks": [{
#           "type": "command",
#           "command": "bash hooks/scripts/console-log-check.sh \"$TOOL_INPUT_FILE\"",
#           "timeout": 3000
#         }]
#       }]
#     }
#   }

set -euo pipefail

FILE="${1:-}"

# --- Exit silently if no file provided ---
if [ -z "$FILE" ]; then
  exit 0
fi

# --- Only check source files ---
# Skip if not in src/ directory
case "$FILE" in
  */src/*) ;;
  src/*) ;;
  *) exit 0 ;;
esac

# --- Only check JS/TS files ---
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

# --- Check if file exists ---
if [ ! -f "$FILE" ]; then
  exit 0
fi

# --- Search for console.log ---
# Match console.log but not console.warn, console.error, console.info, console.debug
# Also skip commented-out lines
LOG_COUNT=$(grep -c 'console\.log\s*(' "$FILE" 2>/dev/null || true)

if [ -n "$LOG_COUNT" ] && [ "$LOG_COUNT" -gt 0 ]; then
  # Check if any are NOT in comments
  REAL_LOGS=$(grep -n 'console\.log\s*(' "$FILE" 2>/dev/null | grep -v '^\s*//' | grep -v '^\s*\*' | wc -l | tr -d ' ')

  if [ "$REAL_LOGS" -gt 0 ]; then
    echo "{\"systemMessage\":\"CONSOLE.LOG DETECTED: Found ${REAL_LOGS} console.log statement(s) in ${FILE}. Production source files should use the structured logger utility instead of console.log. Please replace with logger.debug(), logger.info(), or remove if it was for debugging.\"}"
  fi
fi
