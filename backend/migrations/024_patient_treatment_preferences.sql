-- ============================================================================
-- Migration 024: Patient Treatment Preferences
-- Created: 2026-01-29
-- Description: Add treatment preference fields for patient consent tracking
-- ============================================================================

-- ============================================================================
-- TREATMENT PREFERENCE FIELDS
-- Track what treatments patient is comfortable with
-- ============================================================================

-- Patient preference for needle-based treatments (dry needling, acupuncture)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_pref_needles BOOLEAN DEFAULT NULL;

-- Patient preference for general spinal adjustments
ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_pref_adjustments BOOLEAN DEFAULT NULL;

-- Patient preference for cervical/neck adjustments specifically
-- (Some patients are OK with adjustments but not in the neck area)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_pref_neck_adjustments BOOLEAN DEFAULT NULL;

-- Additional notes about treatment preferences
ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_pref_notes TEXT;

-- Date when preferences were last updated/confirmed
ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_pref_updated_at TIMESTAMPTZ;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN patients.treatment_pref_needles IS 'Patient consent for needle-based treatments (dry needling, acupuncture). NULL = not asked, TRUE = OK, FALSE = not OK';
COMMENT ON COLUMN patients.treatment_pref_adjustments IS 'Patient consent for general spinal adjustments. NULL = not asked, TRUE = OK, FALSE = not OK';
COMMENT ON COLUMN patients.treatment_pref_neck_adjustments IS 'Patient consent specifically for cervical/neck adjustments. NULL = not asked, TRUE = OK, FALSE = not OK';
COMMENT ON COLUMN patients.treatment_pref_notes IS 'Additional notes about treatment preferences or restrictions';
COMMENT ON COLUMN patients.treatment_pref_updated_at IS 'Timestamp when treatment preferences were last updated or confirmed';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
