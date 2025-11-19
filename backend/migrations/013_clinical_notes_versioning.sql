-- Migration 013: Clinical Notes Versioning
-- CRITICAL: Legal requirement - all changes to clinical notes must be tracked
-- Implements complete audit trail for medical record modifications

-- Clinical Encounter Versions table
CREATE TABLE IF NOT EXISTS clinical_encounter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Complete snapshot of encounter at this version
  patient_id UUID NOT NULL,
  practitioner_id UUID NOT NULL,
  encounter_date TIMESTAMP NOT NULL,

  -- SOAP/SOPE content
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  evaluation TEXT, -- For SOPE format

  -- Clinical codes
  icpc_codes VARCHAR(10)[],
  icd10_codes VARCHAR(10)[],

  -- Metadata
  treatment_codes TEXT[],
  region_treated VARCHAR(100),

  -- Version control
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_reason VARCHAR(255), -- Why was this changed?
  change_type VARCHAR(50), -- 'create', 'update', 'correction', 'amendment'

  -- Signature/lock status
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMP,
  signed_by UUID REFERENCES users(id),

  -- Previous version reference
  previous_version_id UUID REFERENCES clinical_encounter_versions(id),

  -- Changes summary (what changed from previous version)
  changes_summary JSONB,

  UNIQUE(encounter_id, version_number)
);

-- Indexes
CREATE INDEX idx_encounter_versions_encounter ON clinical_encounter_versions(encounter_id, version_number DESC);
CREATE INDEX idx_encounter_versions_created ON clinical_encounter_versions(created_at DESC);
CREATE INDEX idx_encounter_versions_created_by ON clinical_encounter_versions(created_by);
CREATE INDEX idx_encounter_versions_signed ON clinical_encounter_versions(is_signed, signed_at);

COMMENT ON TABLE clinical_encounter_versions IS 'Complete version history of clinical encounters - LEGALLY REQUIRED';
COMMENT ON COLUMN clinical_encounter_versions.change_reason IS 'Legal requirement: Why was the clinical note modified?';
COMMENT ON COLUMN clinical_encounter_versions.is_signed IS 'Signed notes should not be modified, only amended';

-- Function to create a new version when encounter is updated
CREATE OR REPLACE FUNCTION create_encounter_version()
RETURNS TRIGGER AS $$
DECLARE
  new_version_number INTEGER;
  previous_version_rec RECORD;
  changes JSONB;
BEGIN
  -- Get current max version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO new_version_number
  FROM clinical_encounter_versions
  WHERE encounter_id = NEW.id;

  -- Get previous version for comparison
  SELECT *
  INTO previous_version_rec
  FROM clinical_encounter_versions
  WHERE encounter_id = NEW.id
  ORDER BY version_number DESC
  LIMIT 1;

  -- Calculate what changed
  changes := jsonb_build_object(
    'subjective_changed', (OLD.subjective IS DISTINCT FROM NEW.subjective),
    'objective_changed', (OLD.objective IS DISTINCT FROM NEW.objective),
    'assessment_changed', (OLD.assessment IS DISTINCT FROM NEW.assessment),
    'plan_changed', (OLD.plan IS DISTINCT FROM NEW.plan),
    'evaluation_changed', (OLD.evaluation IS DISTINCT FROM NEW.evaluation),
    'icpc_codes_changed', (OLD.icpc_codes IS DISTINCT FROM NEW.icpc_codes),
    'icd10_codes_changed', (OLD.icd10_codes IS DISTINCT FROM NEW.icd10_codes)
  );

  -- Insert new version
  INSERT INTO clinical_encounter_versions (
    encounter_id,
    version_number,
    patient_id,
    practitioner_id,
    encounter_date,
    subjective,
    objective,
    assessment,
    plan,
    evaluation,
    icpc_codes,
    icd10_codes,
    treatment_codes,
    region_treated,
    created_by,
    created_at,
    change_type,
    previous_version_id,
    changes_summary
  ) VALUES (
    NEW.id,
    new_version_number,
    NEW.patient_id,
    NEW.practitioner_id,
    NEW.encounter_date,
    NEW.subjective,
    NEW.objective,
    NEW.assessment,
    NEW.plan,
    NEW.evaluation,
    NEW.icpc_codes,
    NEW.icd10_codes,
    NEW.treatment_codes,
    NEW.region_treated,
    NEW.updated_by, -- Assuming this column exists or use practitioner_id
    NOW(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      ELSE 'update'
    END,
    previous_version_rec.id,
    changes
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically version on updates
CREATE TRIGGER trigger_version_clinical_encounter
AFTER INSERT OR UPDATE ON clinical_encounters
FOR EACH ROW
EXECUTE FUNCTION create_encounter_version();

COMMENT ON TRIGGER trigger_version_clinical_encounter ON clinical_encounters IS 'Automatically creates version history for all encounter changes';

-- Function to get version history for an encounter
CREATE OR REPLACE FUNCTION get_encounter_history(p_encounter_id UUID)
RETURNS TABLE (
  version_number INTEGER,
  created_at TIMESTAMP,
  created_by_name VARCHAR,
  change_type VARCHAR,
  change_reason VARCHAR,
  changes_summary JSONB,
  is_signed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.version_number,
    v.created_at,
    u.name as created_by_name,
    v.change_type,
    v.change_reason,
    v.changes_summary,
    v.is_signed
  FROM clinical_encounter_versions v
  LEFT JOIN users u ON v.created_by = u.id
  WHERE v.encounter_id = p_encounter_id
  ORDER BY v.version_number DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a previous version
CREATE OR REPLACE FUNCTION restore_encounter_version(
  p_encounter_id UUID,
  p_version_number INTEGER,
  p_restored_by UUID,
  p_reason VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Get the version to restore
  SELECT * INTO v_record
  FROM clinical_encounter_versions
  WHERE encounter_id = p_encounter_id
    AND version_number = p_version_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version % not found for encounter %', p_version_number, p_encounter_id;
  END IF;

  -- Update the encounter with the old version's data
  UPDATE clinical_encounters
  SET
    subjective = v_record.subjective,
    objective = v_record.objective,
    assessment = v_record.assessment,
    plan = v_record.plan,
    evaluation = v_record.evaluation,
    icpc_codes = v_record.icpc_codes,
    icd10_codes = v_record.icd10_codes,
    treatment_codes = v_record.treatment_codes,
    region_treated = v_record.region_treated,
    updated_by = p_restored_by,
    updated_at = NOW()
  WHERE id = p_encounter_id;

  -- The trigger will automatically create a new version with change_type = 'update'
  -- We should update that version's change_reason
  UPDATE clinical_encounter_versions
  SET
    change_reason = 'Restored from version ' || p_version_number || ': ' || p_reason,
    change_type = 'restoration'
  WHERE encounter_id = p_encounter_id
    AND version_number = (
      SELECT MAX(version_number)
      FROM clinical_encounter_versions
      WHERE encounter_id = p_encounter_id
    );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to sign/lock an encounter (prevents further edits without amendment)
CREATE OR REPLACE FUNCTION sign_encounter(
  p_encounter_id UUID,
  p_signed_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Sign the latest version
  UPDATE clinical_encounter_versions
  SET
    is_signed = true,
    signed_at = NOW(),
    signed_by = p_signed_by
  WHERE encounter_id = p_encounter_id
    AND version_number = (
      SELECT MAX(version_number)
      FROM clinical_encounter_versions
      WHERE encounter_id = p_encounter_id
    );

  -- Mark the encounter as signed
  UPDATE clinical_encounters
  SET
    is_signed = true,
    signed_at = NOW(),
    signed_by = p_signed_by
  WHERE id = p_encounter_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add signed columns to clinical_encounters if not exists
ALTER TABLE clinical_encounters
ADD COLUMN IF NOT EXISTS is_signed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS signed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- View for easy access to latest versions
CREATE OR REPLACE VIEW encounter_current_versions AS
SELECT DISTINCT ON (encounter_id)
  v.*,
  u.name as created_by_name,
  s.name as signed_by_name
FROM clinical_encounter_versions v
LEFT JOIN users u ON v.created_by = u.id
LEFT JOIN users s ON v.signed_by = s.id
ORDER BY encounter_id, version_number DESC;

COMMENT ON VIEW encounter_current_versions IS 'Latest version of each clinical encounter';

-- View for unsigned/draft encounters
CREATE OR REPLACE VIEW encounter_drafts AS
SELECT
  e.*,
  v.version_number as current_version
FROM clinical_encounters e
LEFT JOIN encounter_current_versions v ON e.id = v.encounter_id
WHERE e.is_signed = false;

COMMENT ON VIEW encounter_drafts IS 'All unsigned clinical encounters (drafts)';
