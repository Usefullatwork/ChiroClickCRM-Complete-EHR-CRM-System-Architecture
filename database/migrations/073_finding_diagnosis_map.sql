-- Migration 073: Finding-Diagnosis Mapping
-- Maps diagnoses to expected anatomy findings for assessment-first workflow

CREATE TABLE IF NOT EXISTS finding_diagnosis_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_code VARCHAR(10) NOT NULL,
  diagnosis_name VARCHAR(255) NOT NULL,
  body_region VARCHAR(50) NOT NULL,
  expected_findings JSONB DEFAULT '[]',
  suggested_ortho_tests TEXT[] DEFAULT '{}',
  confidence DECIMAL(3,2) DEFAULT 0.80,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fdm_diagnosis_code ON finding_diagnosis_map(diagnosis_code);
CREATE INDEX IF NOT EXISTS idx_fdm_body_region ON finding_diagnosis_map(body_region);
CREATE INDEX IF NOT EXISTS idx_fdm_active ON finding_diagnosis_map(is_active) WHERE is_active = true;
