-- Migration 072: Encounter Anatomy Findings
-- Persists anatomy findings per encounter for SALT carry-forward

CREATE TABLE IF NOT EXISTS encounter_anatomy_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  body_region VARCHAR(50) NOT NULL,
  finding_type VARCHAR(30) NOT NULL DEFAULT 'palpation',
  laterality VARCHAR(10) DEFAULT 'bilateral',
  severity VARCHAR(20) DEFAULT 'moderate',
  direction VARCHAR(20),
  note_text TEXT,
  is_positive BOOLEAN DEFAULT true,
  source VARCHAR(20) DEFAULT 'manual',
  confirmed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eaf_encounter_id ON encounter_anatomy_findings(encounter_id);
CREATE INDEX IF NOT EXISTS idx_eaf_body_region ON encounter_anatomy_findings(body_region);

-- For carry-forward lookup: latest findings per patient
CREATE INDEX IF NOT EXISTS idx_eaf_carry_forward
  ON encounter_anatomy_findings(encounter_id, confirmed, created_at DESC);
