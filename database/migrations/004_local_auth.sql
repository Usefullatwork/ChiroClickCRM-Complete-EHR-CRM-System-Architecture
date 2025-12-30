-- ============================================================================
-- Migration 004: Local Authentication Support
--
-- Adds password-based authentication for local development/self-hosting
-- Works alongside Clerk (if configured) for hybrid auth
-- ============================================================================

-- Add password hash to users table (for local auth)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;

-- Make clerk_user_id nullable (not required for local auth)
ALTER TABLE users ALTER COLUMN clerk_user_id DROP NOT NULL;

-- Add index for email lookups (already unique, but ensure it's indexed)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- ============================================================================
-- REFRESH TOKENS TABLE (For JWT refresh flow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  replaced_by UUID REFERENCES refresh_tokens(id),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================================================
-- API KEYS TABLE (For programmatic access)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL, -- First 10 chars for identification
  key_hash VARCHAR(255) NOT NULL,  -- Hashed full key

  scopes TEXT[] DEFAULT ARRAY['read'], -- ['read', 'write', 'admin']

  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY api_keys_tenant_isolation ON api_keys
  USING (organization_id = current_tenant_id());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

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

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for token rotation';
COMMENT ON TABLE api_keys IS 'API keys for programmatic access';
COMMENT ON FUNCTION cleanup_auth_tokens IS 'Cleanup expired auth tokens - run periodically';
COMMENT ON FUNCTION record_failed_login IS 'Records failed login and locks account after 5 attempts';
