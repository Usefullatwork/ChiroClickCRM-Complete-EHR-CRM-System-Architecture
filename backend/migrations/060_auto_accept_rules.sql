-- Migration 060: Auto-Accept Rules and Settings tables
-- Required for auto-accept CRUD endpoints

-- =============================================================================
-- AUTO-ACCEPT SETTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS auto_accept_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE,
  auto_accept_appointments BOOLEAN DEFAULT false,
  appointment_accept_delay_minutes INTEGER DEFAULT 0,
  appointment_types_included TEXT[],
  appointment_types_excluded TEXT[],
  appointment_max_daily_limit INTEGER,
  appointment_business_hours_only BOOLEAN DEFAULT true,
  auto_accept_referrals BOOLEAN DEFAULT false,
  referral_accept_delay_minutes INTEGER DEFAULT 0,
  referral_sources_included TEXT[],
  referral_sources_excluded TEXT[],
  referral_require_complete_info BOOLEAN DEFAULT true,
  notify_on_auto_accept BOOLEAN DEFAULT true,
  notification_email VARCHAR(255),
  notification_sms VARCHAR(20),
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_accept_settings_org
  ON auto_accept_settings(organization_id);

-- =============================================================================
-- AUTO-ACCEPT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS auto_accept_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  reason TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_accept_log_org
  ON auto_accept_log(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_accept_log_resource
  ON auto_accept_log(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_auto_accept_log_daily
  ON auto_accept_log(organization_id, resource_type, action, created_at)
  WHERE action = 'accepted';
