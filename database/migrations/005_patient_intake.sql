-- Migration: Add patient_intake table for self-check-in kiosk
-- Version: 005
-- Description: Stores patient-entered data during self-check-in for SOAP note pre-population

-- ============================================================================
-- PATIENT INTAKE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Check-in timestamp
  checked_in_at TIMESTAMP DEFAULT NOW(),

  -- Chief complaint capture
  chief_complaint TEXT,                    -- Free text or generated narrative
  complaint_categories TEXT[],             -- ['low_back', 'neck', 'headache', etc.]
  pain_location TEXT[],                    -- ['lower_back', 'left_leg', 'neck']
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  pain_duration VARCHAR(50),               -- 'today', '2_3_days', 'week', 'month', 'chronic'
  pain_type TEXT[],                        -- ['sharp', 'dull', 'radiating', 'constant']

  -- Quick screening (follow-up visits)
  is_first_visit BOOLEAN DEFAULT false,
  compared_to_last VARCHAR(20) CHECK (compared_to_last IN ('better', 'same', 'worse')),
  new_symptoms BOOLEAN DEFAULT false,
  new_symptoms_description TEXT,

  -- Optional: aggravating/relieving factors
  aggravating_factors TEXT[],              -- ['sitting', 'bending', 'lifting']
  relieving_factors TEXT[],                -- ['rest', 'ice', 'movement']

  -- Consent confirmations at kiosk
  confirmed_identity BOOLEAN DEFAULT false,
  confirmed_info_accurate BOOLEAN DEFAULT false,

  -- Generated SOAP narrative (ready for provider)
  generated_subjective TEXT,

  -- Tracking
  intake_completed BOOLEAN DEFAULT false,
  intake_duration_seconds INTEGER,         -- How long patient took to complete
  kiosk_device_id VARCHAR(100),            -- Optional: which kiosk was used

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_intake_appointment ON patient_intake(appointment_id);
CREATE INDEX IF NOT EXISTS idx_intake_patient ON patient_intake(patient_id);
CREATE INDEX IF NOT EXISTS idx_intake_organization ON patient_intake(organization_id);
CREATE INDEX IF NOT EXISTS idx_intake_date ON patient_intake(checked_in_at);

-- Trigger for updated_at
CREATE TRIGGER update_patient_intake_updated_at
  BEFORE UPDATE ON patient_intake
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE patient_intake IS 'Patient self-check-in data from kiosk for SOAP note pre-population';
COMMENT ON COLUMN patient_intake.chief_complaint IS 'Patient-entered chief complaint text or generated narrative';
COMMENT ON COLUMN patient_intake.pain_level IS 'VAS pain scale 0-10 entered by patient';
COMMENT ON COLUMN patient_intake.generated_subjective IS 'Auto-generated SOAP subjective text from intake data';
COMMENT ON COLUMN patient_intake.intake_duration_seconds IS 'Time patient spent completing check-in (for UX analytics)';
