-- ============================================================================
-- MIGRATION: Neurological Examination Module
-- Version: 2.0
-- Description: Adds structured storage for cluster-based neurological exams
-- ============================================================================

-- ============================================================================
-- 1. NEUROLOGICAL EXAMINATIONS TABLE
-- Stores complete neurological examination sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS neurological_examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  practitioner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Examination metadata
  exam_date TIMESTAMP NOT NULL DEFAULT NOW(),
  exam_type VARCHAR(50) DEFAULT 'COMPREHENSIVE', -- 'COMPREHENSIVE', 'SCREENING', 'FOLLOW_UP'

  -- Raw test results (full checkbox data)
  test_results JSONB NOT NULL DEFAULT '{}',
  -- Structure: {
  --   "test_id": {
  --     "criteria": { "criterion_id": true/false, ... },
  --     "value": "optional_value",
  --     "notes": "optional_notes",
  --     "timestamp": "ISO timestamp"
  --   },
  --   ...
  -- }

  -- Cluster scores (calculated)
  cluster_scores JSONB DEFAULT '{}',
  -- Structure: {
  --   "CEREBELLAR": { "score": 4, "total": 8, "meetsThreshold": true, "interpretation": "..." },
  --   "VESTIBULAR": { "score": 2, "total": 6, "meetsThreshold": false },
  --   ...
  -- }

  -- Red flags detected
  red_flags JSONB DEFAULT '[]',
  -- Structure: [
  --   { "clusterId": "MYELOPATHY", "testId": "hoffmann", "description": "...", "action": "..." },
  --   ...
  -- ]
  has_red_flags BOOLEAN GENERATED ALWAYS AS (jsonb_array_length(red_flags) > 0) STORED,

  -- BPPV specific diagnosis (if applicable)
  bppv_diagnosis JSONB,
  -- Structure: {
  --   "type": "posterior" | "lateral_geotropic" | "lateral_ageotropic" | "anterior",
  --   "affectedSide": "left" | "right",
  --   "confidence": "high" | "moderate" | "low",
  --   "treatment": "Epley maneuver"
  -- }

  -- Generated clinical narrative
  narrative_text TEXT,
  narrative_generated_at TIMESTAMP,

  -- Referral tracking
  referral_recommended BOOLEAN DEFAULT false,
  referral_specialty VARCHAR(100), -- 'Neurology', 'ENT', 'Orthopedics', 'Imaging'
  referral_urgency VARCHAR(20) CHECK (referral_urgency IN ('ROUTINE', 'URGENT', 'EMERGENT')),
  referral_sent_at TIMESTAMP,

  -- Status
  status VARCHAR(20) CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'AMENDED')) DEFAULT 'IN_PROGRESS',
  completed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,

  -- Versioning for audit trail
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES neurological_examinations(id),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. CLUSTER TEST RESULTS TABLE (Normalized)
-- For detailed querying and analytics on individual test results
-- ============================================================================

CREATE TABLE IF NOT EXISTS neuro_exam_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID REFERENCES neurological_examinations(id) ON DELETE CASCADE,

  -- Test identification
  cluster_id VARCHAR(50) NOT NULL, -- 'CEREBELLAR', 'VESTIBULAR', etc.
  test_id VARCHAR(100) NOT NULL,   -- 'finger_nose_finger', 'dix_hallpike_right', etc.

  -- Result
  is_positive BOOLEAN NOT NULL,
  positive_criteria TEXT[], -- List of positive criterion IDs
  measured_value VARCHAR(100), -- For tests with numeric values

  -- Laterality (if applicable)
  side VARCHAR(10) CHECK (side IN ('LEFT', 'RIGHT', 'BILATERAL', 'CENTRAL', 'N/A')),

  -- Flags
  is_red_flag BOOLEAN DEFAULT false,
  requires_referral BOOLEAN DEFAULT false,

  -- Notes
  clinician_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. VESTIBULAR FINDINGS TABLE
-- Specialized table for detailed vestibular/VNG findings
-- ============================================================================

CREATE TABLE IF NOT EXISTS vestibular_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID REFERENCES neurological_examinations(id) ON DELETE CASCADE,

  -- Spontaneous Nystagmus
  spontaneous_nystagmus_present BOOLEAN,
  spontaneous_nystagmus_direction VARCHAR(20), -- 'RIGHT', 'LEFT', 'UP', 'DOWN', 'TORSIONAL'
  spontaneous_nystagmus_velocity DECIMAL(5,2), -- degrees/second
  fixation_suppression BOOLEAN, -- Does fixation reduce nystagmus?

  -- Gaze Testing
  gaze_evoked_horizontal JSONB, -- { "right": true, "left": false }
  gaze_evoked_vertical JSONB,   -- { "up": false, "down": true }
  rebound_nystagmus BOOLEAN,

  -- Saccades
  saccade_accuracy_horizontal VARCHAR(20), -- 'NORMAL', 'HYPOMETRIC', 'HYPERMETRIC'
  saccade_accuracy_vertical VARCHAR(20),
  saccade_latency_ms INTEGER,

  -- Smooth Pursuit
  pursuit_gain_horizontal DECIMAL(3,2), -- 0.0 to 1.0
  pursuit_gain_vertical DECIMAL(3,2),
  saccadic_pursuit BOOLEAN,

  -- Head Impulse Test
  hit_right_positive BOOLEAN,
  hit_left_positive BOOLEAN,
  catch_up_saccades TEXT[], -- 'OVERT', 'COVERT'

  -- Caloric Testing (if performed)
  caloric_performed BOOLEAN DEFAULT false,
  caloric_unilateral_weakness DECIMAL(5,2), -- percentage
  caloric_affected_side VARCHAR(10),
  caloric_directional_preponderance DECIMAL(5,2),

  -- Dynamic Visual Acuity
  dva_lines_lost INTEGER,
  dva_affected_side VARCHAR(10),

  -- HINTS+ Result
  hints_result VARCHAR(20), -- 'PERIPHERAL', 'CENTRAL', 'INDETERMINATE'
  hints_hearing_loss_ipsilateral BOOLEAN,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. BPPV TREATMENT LOG
-- Tracks BPPV treatments and their outcomes
-- ============================================================================

CREATE TABLE IF NOT EXISTS bppv_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID REFERENCES neurological_examinations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Diagnosis
  canal_affected VARCHAR(30) NOT NULL, -- 'POSTERIOR', 'LATERAL', 'ANTERIOR'
  side_affected VARCHAR(10) NOT NULL,  -- 'LEFT', 'RIGHT'
  variant VARCHAR(30),                  -- 'CANALOLITHIASIS', 'CUPULOLITHIASIS'

  -- Treatment performed
  treatment_maneuver VARCHAR(50) NOT NULL, -- 'EPLEY', 'SEMONT', 'GUFONI', 'BBQ', 'YACOVINO'
  repetitions INTEGER DEFAULT 1,
  treatment_date TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Pre/Post assessment
  pre_treatment_nystagmus BOOLEAN,
  post_treatment_nystagmus BOOLEAN,
  pre_treatment_vertigo_vas INTEGER CHECK (pre_treatment_vertigo_vas >= 0 AND pre_treatment_vertigo_vas <= 10),
  post_treatment_vertigo_vas INTEGER CHECK (post_treatment_vertigo_vas >= 0 AND post_treatment_vertigo_vas <= 10),

  -- Outcome
  immediate_resolution BOOLEAN,
  follow_up_required BOOLEAN DEFAULT true,
  follow_up_date DATE,

  -- Home exercises prescribed
  home_exercises_prescribed BOOLEAN,
  brandt_daroff_prescribed BOOLEAN,
  sleeping_position_instructions TEXT,

  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

-- Neurological examinations
CREATE INDEX idx_neuro_exam_organization ON neurological_examinations(organization_id);
CREATE INDEX idx_neuro_exam_patient ON neurological_examinations(patient_id);
CREATE INDEX idx_neuro_exam_encounter ON neurological_examinations(encounter_id);
CREATE INDEX idx_neuro_exam_date ON neurological_examinations(exam_date);
CREATE INDEX idx_neuro_exam_red_flags ON neurological_examinations(has_red_flags) WHERE has_red_flags = true;
CREATE INDEX idx_neuro_exam_status ON neurological_examinations(status);

-- Test results
CREATE INDEX idx_neuro_test_exam ON neuro_exam_test_results(examination_id);
CREATE INDEX idx_neuro_test_cluster ON neuro_exam_test_results(cluster_id);
CREATE INDEX idx_neuro_test_positive ON neuro_exam_test_results(is_positive) WHERE is_positive = true;
CREATE INDEX idx_neuro_test_red_flag ON neuro_exam_test_results(is_red_flag) WHERE is_red_flag = true;

-- Vestibular findings
CREATE INDEX idx_vestibular_exam ON vestibular_findings(examination_id);
CREATE INDEX idx_vestibular_hints ON vestibular_findings(hints_result);

-- BPPV treatments
CREATE INDEX idx_bppv_patient ON bppv_treatments(patient_id);
CREATE INDEX idx_bppv_date ON bppv_treatments(treatment_date);
CREATE INDEX idx_bppv_canal ON bppv_treatments(canal_affected, side_affected);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Auto-update timestamp
CREATE TRIGGER update_neuro_exam_updated_at
  BEFORE UPDATE ON neurological_examinations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. VIEWS
-- ============================================================================

-- Summary view for patients with recent neurological exams
CREATE OR REPLACE VIEW patient_neuro_exam_summary AS
SELECT
  p.id as patient_id,
  p.first_name,
  p.last_name,
  ne.id as exam_id,
  ne.exam_date,
  ne.status,
  ne.has_red_flags,
  ne.cluster_scores,
  ne.bppv_diagnosis,
  ne.referral_recommended,
  ne.referral_urgency,
  u.first_name || ' ' || u.last_name as examiner_name
FROM patients p
JOIN neurological_examinations ne ON ne.patient_id = p.id
LEFT JOIN users u ON u.id = ne.practitioner_id
WHERE ne.exam_date = (
  SELECT MAX(exam_date) FROM neurological_examinations WHERE patient_id = p.id
);

-- Red flag alerts view
CREATE OR REPLACE VIEW neuro_red_flag_alerts AS
SELECT
  ne.id as exam_id,
  ne.organization_id,
  ne.patient_id,
  p.first_name || ' ' || p.last_name as patient_name,
  ne.exam_date,
  ne.red_flags,
  ne.referral_urgency,
  ne.referral_sent_at IS NULL as referral_pending,
  u.first_name || ' ' || u.last_name as examiner_name
FROM neurological_examinations ne
JOIN patients p ON p.id = ne.patient_id
LEFT JOIN users u ON u.id = ne.practitioner_id
WHERE ne.has_red_flags = true
ORDER BY
  CASE ne.referral_urgency
    WHEN 'EMERGENT' THEN 1
    WHEN 'URGENT' THEN 2
    ELSE 3
  END,
  ne.exam_date DESC;

-- BPPV treatment outcomes view
CREATE OR REPLACE VIEW bppv_treatment_outcomes AS
SELECT
  bt.patient_id,
  p.first_name || ' ' || p.last_name as patient_name,
  bt.canal_affected,
  bt.side_affected,
  bt.treatment_maneuver,
  bt.treatment_date,
  bt.immediate_resolution,
  bt.pre_treatment_vertigo_vas,
  bt.post_treatment_vertigo_vas,
  (bt.pre_treatment_vertigo_vas - bt.post_treatment_vertigo_vas) as vas_improvement,
  bt.follow_up_required,
  bt.follow_up_date
FROM bppv_treatments bt
JOIN patients p ON p.id = bt.patient_id
ORDER BY bt.treatment_date DESC;

-- ============================================================================
-- 8. FUNCTIONS
-- ============================================================================

-- Function to check if referral is overdue
CREATE OR REPLACE FUNCTION check_overdue_neuro_referrals()
RETURNS TABLE(
  exam_id UUID,
  patient_id UUID,
  patient_name TEXT,
  exam_date TIMESTAMP,
  urgency VARCHAR(20),
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ne.id,
    ne.patient_id,
    p.first_name || ' ' || p.last_name,
    ne.exam_date,
    ne.referral_urgency,
    CASE
      WHEN ne.referral_urgency = 'EMERGENT' THEN
        EXTRACT(DAY FROM NOW() - ne.exam_date)::INTEGER
      WHEN ne.referral_urgency = 'URGENT' THEN
        GREATEST(0, EXTRACT(DAY FROM NOW() - ne.exam_date)::INTEGER - 7)
      ELSE
        GREATEST(0, EXTRACT(DAY FROM NOW() - ne.exam_date)::INTEGER - 30)
    END as days_overdue
  FROM neurological_examinations ne
  JOIN patients p ON p.id = ne.patient_id
  WHERE ne.referral_recommended = true
    AND ne.referral_sent_at IS NULL
    AND ne.status = 'COMPLETED'
    AND (
      (ne.referral_urgency = 'EMERGENT' AND ne.exam_date < NOW() - INTERVAL '1 day')
      OR (ne.referral_urgency = 'URGENT' AND ne.exam_date < NOW() - INTERVAL '7 days')
      OR (ne.referral_urgency = 'ROUTINE' AND ne.exam_date < NOW() - INTERVAL '30 days')
    )
  ORDER BY
    CASE ne.referral_urgency WHEN 'EMERGENT' THEN 1 WHEN 'URGENT' THEN 2 ELSE 3 END,
    ne.exam_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE neurological_examinations IS 'Stores complete cluster-based neurological examination sessions';
COMMENT ON TABLE neuro_exam_test_results IS 'Normalized storage of individual test results for analytics';
COMMENT ON TABLE vestibular_findings IS 'Detailed vestibular/VNG examination findings';
COMMENT ON TABLE bppv_treatments IS 'BPPV repositioning maneuver treatments and outcomes';

COMMENT ON COLUMN neurological_examinations.test_results IS 'Full JSONB of all checkbox/form data from exam';
COMMENT ON COLUMN neurological_examinations.cluster_scores IS 'Calculated scores for each diagnostic cluster';
COMMENT ON COLUMN neurological_examinations.red_flags IS 'Array of detected red flag findings';
COMMENT ON COLUMN neurological_examinations.has_red_flags IS 'Generated column - true if any red flags present';

-- ============================================================================
-- 10. SAMPLE DATA (for development)
-- ============================================================================

-- Insert sample cluster definitions for reference
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, commonly_used)
VALUES
  ('N17', 'ICPC2', 'N', 'Svimmelhet/vertigo', 'Vertigo/dizziness', true),
  ('N18', 'ICPC2', 'N', 'Hjernefunksjon nedsatt', 'Impaired brain function', false),
  ('H82', 'ICPC2', 'H', 'Benign paroksysmal posisjonsvertigo', 'Benign paroxysmal positional vertigo', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
