-- Migration 070: System Health Log
-- System health monitoring log table
-- Stores periodic health check results for trend analysis and alerting

CREATE TABLE IF NOT EXISTS system_health_log (
  id SERIAL PRIMARY KEY,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  db_healthy BOOLEAN NOT NULL DEFAULT false,
  redis_healthy BOOLEAN DEFAULT NULL,
  ollama_healthy BOOLEAN DEFAULT NULL,
  response_time_ms INTEGER,
  disk_usage_percent NUMERIC(5,2),
  memory_usage_mb INTEGER,
  active_connections INTEGER,
  details JSONB DEFAULT '{}',
  alert_sent BOOLEAN DEFAULT false
);

-- Primary lookup index: most recent checks first
CREATE INDEX IF NOT EXISTS idx_system_health_log_checked_at
  ON system_health_log(checked_at DESC);

-- Partition-friendly: auto-cleanup older than 90 days via scheduler
CREATE INDEX IF NOT EXISTS idx_system_health_log_cleanup
  ON system_health_log(checked_at) WHERE checked_at < NOW() - INTERVAL '90 days';

-- Consecutive failure tracking view
CREATE OR REPLACE VIEW system_health_consecutive_failures AS
SELECT
  checked_at,
  db_healthy,
  redis_healthy,
  ollama_healthy,
  ROW_NUMBER() OVER (ORDER BY checked_at DESC) as check_number
FROM system_health_log
WHERE checked_at > NOW() - INTERVAL '2 hours'
ORDER BY checked_at DESC;

COMMENT ON TABLE system_health_log IS 'Stores periodic health check results for trend analysis and alerting. Rows older than 90 days can be purged via the cleanup index.';
