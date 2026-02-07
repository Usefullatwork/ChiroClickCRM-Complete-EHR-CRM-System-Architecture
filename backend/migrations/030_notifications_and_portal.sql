-- Migration 030: Notifications and Patient Portal tables
-- Required for Phase 2.4 (Notifications) and Phase 2.5 (Patient Portal)

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500),
  metadata JSONB,
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_org_user
  ON notifications(organization_id, user_id, created_at DESC);

-- =============================================================================
-- PORTAL SESSIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_token ON portal_sessions(token);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_patient ON portal_sessions(patient_id);

-- Add portal PIN column to patients table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'portal_pin_hash'
  ) THEN
    ALTER TABLE patients ADD COLUMN portal_pin_hash VARCHAR(255);
  END IF;
END $$;

-- Clean up expired portal sessions (can be run periodically)
-- DELETE FROM portal_sessions WHERE expires_at < NOW();
