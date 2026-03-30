-- Migration 077: Align appointment_reminders schema with service code + communication preferences
-- Fix: migration 076 created scheduled_at, channel, reminder_type IN ('24H_BEFORE','1H_BEFORE','CUSTOM')
-- Service code uses: scheduled_send_at, hours_before, reminder_type IN ('SMS','EMAIL','PUSH')

ALTER TABLE appointment_reminders ADD COLUMN IF NOT EXISTS hours_before INTEGER;
ALTER TABLE appointment_reminders ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMP;
UPDATE appointment_reminders SET scheduled_send_at = scheduled_at WHERE scheduled_send_at IS NULL;

-- Widen reminder_type CHECK to accept service-layer values
ALTER TABLE appointment_reminders DROP CONSTRAINT IF EXISTS appointment_reminders_reminder_type_check;
ALTER TABLE appointment_reminders ADD CONSTRAINT appointment_reminders_reminder_type_check
  CHECK (reminder_type IN ('SMS', 'EMAIL', 'PUSH', '24H_BEFORE', '1H_BEFORE', 'CUSTOM'));

-- Unique constraint for idempotent scheduling (used by ON CONFLICT in service code)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reminders_apt_hours
  ON appointment_reminders(appointment_id, hours_before);

-- Patient communication preferences (referenced by scheduler.js processCommunicationQueue)
CREATE TABLE IF NOT EXISTS patient_communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  sms_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  reminder_enabled BOOLEAN DEFAULT true,
  exercise_reminder_enabled BOOLEAN DEFAULT true,
  recall_enabled BOOLEAN DEFAULT true,
  marketing_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(patient_id)
);
CREATE INDEX IF NOT EXISTS idx_comm_prefs_patient ON patient_communication_preferences(patient_id);
