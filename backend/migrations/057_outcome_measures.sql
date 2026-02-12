-- Migration 057: Outcome Measures (ODI, NDI, VAS, DASH, NPRS)
-- Questionnaire responses with scoring and trend tracking

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  encounter_id UUID,
  practitioner_id UUID,
  questionnaire_type VARCHAR(20) NOT NULL CHECK (questionnaire_type IN ('ODI', 'NDI', 'VAS', 'DASH', 'NPRS')),
  raw_answers JSONB NOT NULL,
  calculated_score NUMERIC(5,2) NOT NULL,
  max_possible_score NUMERIC(5,2) NOT NULL,
  percentage_score NUMERIC(5,2),
  severity_category VARCHAR(50),
  notes TEXT,
  completed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_patient ON questionnaire_responses(patient_id);
CREATE INDEX IF NOT EXISTS idx_qr_org ON questionnaire_responses(organization_id);
CREATE INDEX IF NOT EXISTS idx_qr_type ON questionnaire_responses(questionnaire_type);
CREATE INDEX IF NOT EXISTS idx_qr_completed ON questionnaire_responses(completed_at);
CREATE INDEX IF NOT EXISTS idx_qr_patient_type ON questionnaire_responses(patient_id, questionnaire_type, completed_at);
