-- Migration 078: Link mobile_users to patients + push preference
-- Bridges mobile auth (phone-based) to patient records (UUID-based)

ALTER TABLE mobile_users ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
ALTER TABLE mobile_users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_mobile_users_patient ON mobile_users(patient_id);
CREATE INDEX IF NOT EXISTS idx_mobile_users_org ON mobile_users(organization_id);

-- Backfill from phone match (handles +47 prefix normalization)
UPDATE mobile_users mu
SET patient_id = p.id, organization_id = p.organization_id
FROM patients p
WHERE mu.patient_id IS NULL
  AND (mu.phone_number = p.phone OR mu.phone_number = '+47' || p.phone);

-- Push preference toggle
ALTER TABLE patient_communication_preferences
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true;
