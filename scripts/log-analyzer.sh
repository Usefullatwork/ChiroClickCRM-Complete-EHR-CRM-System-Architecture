#!/bin/bash
#
# ChiroClickCRM Weekly Log Analyzer
# Parses application logs from the last 7 days and generates a summary report.
#
# Usage:
#   ./scripts/log-analyzer.sh [log_dir]
#
# Optionally set ADMIN_EMAIL to send the report via mail.

set -u

# ============================================================================
# CONFIGURATION
# ============================================================================

LOG_DIR="${1:-/app/logs}"
DAYS=7
CUTOFF_DATE=$(date -d "-${DAYS} days" '+%Y-%m-%d' 2>/dev/null || date -v-${DAYS}d '+%Y-%m-%d' 2>/dev/null || date '+%Y-%m-%d')
ADMIN_EMAIL="${ADMIN_EMAIL:-}"

# ============================================================================
# COLLECT LOG FILES FROM LAST 7 DAYS
# ============================================================================

if [ ! -d "$LOG_DIR" ]; then
  echo "ERROR: Log directory not found: ${LOG_DIR}"
  exit 1
fi

LOG_FILES=$(find "$LOG_DIR" -type f -name "*.log" -mtime -${DAYS} 2>/dev/null)

if [ -z "$LOG_FILES" ]; then
  echo "No log files modified in the last ${DAYS} days in ${LOG_DIR}"
  exit 0
fi

# ============================================================================
# ANALYSIS
# ============================================================================

# Count 5xx error lines
ERROR_5XX=$(echo "$LOG_FILES" | xargs grep -chE '"statusCode":\s*5[0-9]{2}|HTTP/[0-9.]+" 5[0-9]{2}| 5[0-9]{2} ' 2>/dev/null | awk -F: '{sum+=$NF} END {print sum+0}')

# Top 5 errored endpoints
TOP_ENDPOINTS=$(echo "$LOG_FILES" | xargs grep -ohE '(GET|POST|PUT|PATCH|DELETE) /[^ "]+' 2>/dev/null | sort | uniq -c | sort -rn | head -5)

# Connection error patterns
ECONNREFUSED=$(echo "$LOG_FILES" | xargs grep -c 'ECONNREFUSED' 2>/dev/null | awk -F: '{sum+=$NF} END {print sum+0}')
ETIMEDOUT=$(echo "$LOG_FILES" | xargs grep -c 'ETIMEDOUT' 2>/dev/null | awk -F: '{sum+=$NF} END {print sum+0}')
ECONNRESET=$(echo "$LOG_FILES" | xargs grep -c 'ECONNRESET' 2>/dev/null | awk -F: '{sum+=$NF} END {print sum+0}')

# Unique client IPs
UNIQUE_IPS=$(echo "$LOG_FILES" | xargs grep -ohE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' 2>/dev/null | sort -u | wc -l)

# ============================================================================
# REPORT
# ============================================================================

REPORT="================================================================
ChiroClickCRM - Weekly Log Analysis Report
Period: ${CUTOFF_DATE} to $(date '+%Y-%m-%d')
Log directory: ${LOG_DIR}
================================================================

5xx Errors:          ${ERROR_5XX}
ECONNREFUSED:        ${ECONNREFUSED}
ETIMEDOUT:           ${ETIMEDOUT}
ECONNRESET:          ${ECONNRESET}
Unique Client IPs:   ${UNIQUE_IPS}

--- Top 5 Endpoints (by frequency) ---
${TOP_ENDPOINTS:-  (none found)}

================================================================
Generated: $(date '+%Y-%m-%d %H:%M:%S')
================================================================"

# Always output to stdout
echo "$REPORT"

# Send via email if configured
if [ -n "$ADMIN_EMAIL" ] && command -v mail &>/dev/null; then
  echo "$REPORT" | mail -s "ChiroClickCRM Weekly Log Report ($(date '+%Y-%m-%d'))" "$ADMIN_EMAIL"
  echo "Report emailed to ${ADMIN_EMAIL}"
fi
