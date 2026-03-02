#!/bin/bash
# Weekly sweep runner for ChiroClickCRM
# Schedule with Windows Task Scheduler: bash scripts/weekly-sweep.sh
# Requires ANTHROPIC_API_KEY in environment

set -e

REPORT_DIR="./reports/weekly"
DATE=$(date +%Y-%m-%d)
REPORT_FILE="$REPORT_DIR/sweep-$DATE.md"
mkdir -p "$REPORT_DIR"

echo "Starting weekly sweep — $DATE"
echo "Report will be saved to: $REPORT_FILE"

# Use Claude Code headless mode to run the overnight-sweep skill
claude -p "Run /overnight-sweep now. Write the full report to reports/weekly/sweep-$DATE.md. Execute every pass. Do not skip anything. Do not ask questions." \
  --dangerously-skip-permissions \
  --output-format text \
  2>&1 | tee "$REPORT_FILE.log"

echo ""
echo "Sweep complete. Report: $REPORT_FILE"
echo "Review this report and act on CRITICAL items immediately."
