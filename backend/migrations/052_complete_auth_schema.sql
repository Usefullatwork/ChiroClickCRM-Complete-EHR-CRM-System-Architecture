-- ============================================================================
-- Migration 005: Complete Authentication Schema
--
-- This migration ensures all authentication tables and functions exist
-- Run after 004_local_auth.sql to complete the auth setup
-- ============================================================================

-- ============================================
-- Sessions table (for session-based auth)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  fresh BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- Scheduled job logs (for job scheduler)
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  job_id VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  duration_ms INTEGER,
  result JSONB,
  error_message TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_job_logs_name ON scheduled_job_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_scheduled_job_logs_executed ON scheduled_job_logs(executed_at);

-- ============================================
-- Auth functions
-- ============================================

-- Function to reset login attempts on successful login
CREATE OR REPLACE FUNCTION record_successful_login(p_user_id UUID) RETURNS void AS $$
BEGIN
  UPDATE users
  SET
    failed_login_attempts = 0,
    locked_until = NULL,
    last_login_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION record_failed_login(p_user_id UUID) RETURNS void AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE users
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE id = p_user_id
  RETURNING failed_login_attempts INTO v_attempts;

  -- Lock account after 5 failed attempts
  IF v_attempts >= 5 THEN
    UPDATE users
    SET locked_until = NOW() + INTERVAL '1 hour'
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions and tokens
CREATE OR REPLACE FUNCTION cleanup_auth_tokens() RETURNS void AS $$
BEGIN
  -- Clean expired sessions
  DELETE FROM sessions WHERE expires_at < NOW();

  -- Clean expired refresh tokens
  DELETE FROM refresh_tokens WHERE expires_at < NOW();

  -- Clean expired password reset tokens
  UPDATE users
  SET password_reset_token = NULL, password_reset_expires = NULL
  WHERE password_reset_expires < NOW();

  -- Reset failed login attempts after lockout period (1 hour)
  UPDATE users
  SET failed_login_attempts = 0, locked_until = NULL
  WHERE locked_until IS NOT NULL AND locked_until < NOW();

  -- Clean old scheduled job logs (keep last 7 days)
  DELETE FROM scheduled_job_logs WHERE executed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE sessions IS 'User sessions for cookie-based authentication';
COMMENT ON TABLE scheduled_job_logs IS 'Logs for scheduled background jobs';
COMMENT ON FUNCTION record_successful_login IS 'Resets login attempts and updates last_login_at';
COMMENT ON FUNCTION record_failed_login IS 'Records failed login and locks account after 5 attempts';
COMMENT ON FUNCTION cleanup_auth_tokens IS 'Cleans up expired sessions, tokens, and old job logs';
