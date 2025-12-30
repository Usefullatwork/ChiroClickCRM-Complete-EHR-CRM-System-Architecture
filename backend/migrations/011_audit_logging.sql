-- Migration 011: Audit Logging System
-- CRITICAL: Required for GDPR compliance and medical record keeping
-- Logs all clinical and system actions for legal and security purposes

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_action_type ON audit_log(action_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_ip_address ON audit_log(ip_address) WHERE success = false;

-- Composite index for common queries
CREATE INDEX idx_audit_log_resource_created ON audit_log(resource_type, resource_id, created_at DESC);

-- Comment on table
COMMENT ON TABLE audit_log IS 'Audit trail for all clinical and system actions - REQUIRED FOR GDPR/LEGAL COMPLIANCE';
COMMENT ON COLUMN audit_log.action_type IS 'Type of action (e.g., encounter.create, patient.read)';
COMMENT ON COLUMN audit_log.changes IS 'JSON object containing before/after state for modifications';
COMMENT ON COLUMN audit_log.metadata IS 'Additional context (method, path, query params, etc.)';
COMMENT ON COLUMN audit_log.ip_address IS 'IP address of user - required for security monitoring';
COMMENT ON COLUMN audit_log.success IS 'Whether action succeeded - false indicates potential security incident';

-- Partition table by year for performance (optional but recommended for large deployments)
-- This helps with the 10-year retention requirement
-- Uncomment if using PostgreSQL 10+
/*
CREATE TABLE audit_log_2024 PARTITION OF audit_log
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE audit_log_2025 PARTITION OF audit_log
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
*/

-- Create function to automatically clean old logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_years INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - (retention_years || ' years')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Clean up audit logs older than specified years (default 10 for Norwegian medical records law)';

-- Create view for recent suspicious activity
CREATE OR REPLACE VIEW suspicious_activity AS
SELECT
  ip_address,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt,
  array_agg(DISTINCT action_type) as attempted_actions,
  array_agg(DISTINCT metadata->>'username') FILTER (WHERE metadata->>'username' IS NOT NULL) as usernames_tried
FROM audit_log
WHERE success = false
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) >= 3
ORDER BY failed_attempts DESC;

COMMENT ON VIEW suspicious_activity IS 'Real-time view of potential security threats (3+ failed attempts in last hour)';

-- Grant permissions
-- GRANT SELECT ON audit_log TO readonly_role;
-- GRANT INSERT ON audit_log TO app_role;
-- GRANT SELECT ON suspicious_activity TO security_role;
