-- Test Batteries, Questionnaires, and Normative Data System
-- Adds comprehensive assessment tools with auto-scoring and normative comparisons

-- ============================================================================
-- QUESTIONNAIRE DEFINITIONS
-- ============================================================================

-- Standardized questionnaire templates (NDI, Oswestry, PSFS, EQ5D, etc.)
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Questionnaire metadata
  code VARCHAR(50) NOT NULL UNIQUE, -- 'NDI', 'OSWESTRY', 'PSFS', 'EQ5D', 'LEFS', 'DASH', etc.
  name VARCHAR(255) NOT NULL,
  full_name TEXT,
  description TEXT,

  -- Configuration
  language VARCHAR(10) DEFAULT 'NO', -- 'NO' or 'EN'
  version VARCHAR(20), -- Version tracking for updated questionnaires

  -- Question structure
  questions JSONB NOT NULL, -- [{id, text, type: 'scale'|'multiple_choice'|'text', options: [], scoring: {}}]

  -- Scoring configuration
  scoring_method VARCHAR(50), -- 'SUM', 'AVERAGE', 'WEIGHTED', 'CUSTOM'
  min_score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  score_interpretation JSONB, -- {ranges: [{min, max, severity: 'None', 'Mild', 'Moderate', 'Severe'}]}

  -- Metadata
  target_body_region VARCHAR(100), -- 'Neck', 'Lower back', 'Upper extremity', 'Lower extremity', 'General'
  estimated_minutes INTEGER DEFAULT 5,

  -- Clinical context
  indicated_for TEXT[], -- ['Cervical radiculopathy', 'Neck pain', 'Whiplash']
  clinical_cutoff_scores JSONB, -- {minimal_clinically_important_difference: 5, substantial_improvement: 7.5}

  -- Validity and reliability data
  psychometric_properties JSONB, -- {reliability: {test_retest: 0.92, cronbach_alpha: 0.89}, validity: {...}}

  -- References and education
  reference_citation TEXT,
  educational_link VARCHAR(500), -- Link to theBackROM.com or Physio-pedia

  -- System flags
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questionnaires_code ON questionnaires(code);
CREATE INDEX idx_questionnaires_org ON questionnaires(organization_id);
CREATE INDEX idx_questionnaires_region ON questionnaires(target_body_region);

-- ============================================================================
-- QUESTIONNAIRE RESPONSES (Patient answers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE,

  -- Response data
  responses JSONB NOT NULL, -- {question_id: answer_value}

  -- Calculated scores
  total_score DECIMAL(5,2),
  percentage_score DECIMAL(5,2), -- Normalized to 0-100%
  severity_level VARCHAR(50), -- 'None', 'Mild', 'Moderate', 'Severe'

  -- Comparison to previous assessments
  previous_score DECIMAL(5,2),
  score_change DECIMAL(5,2),
  change_percentage DECIMAL(5,2),
  clinically_significant_change BOOLEAN DEFAULT false,

  -- Administration metadata
  administered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  administered_by UUID REFERENCES users(id),
  completion_time_seconds INTEGER,

  -- Patient context
  days_since_onset INTEGER,
  treatment_phase VARCHAR(50), -- 'Pre-treatment', 'Mid-treatment', 'Post-treatment', 'Follow-up'

  -- Notes
  clinician_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_responses_patient ON questionnaire_responses(patient_id);
CREATE INDEX idx_responses_encounter ON questionnaire_responses(encounter_id);
CREATE INDEX idx_responses_questionnaire ON questionnaire_responses(questionnaire_id);
CREATE INDEX idx_responses_date ON questionnaire_responses(administered_date);

-- ============================================================================
-- TEST BATTERIES (Custom assessment protocols)
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_batteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Battery metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(50) UNIQUE, -- 'SPPB', '9TSB', 'CERVICAL_COMPREHENSIVE', etc.

  -- Configuration
  target_population VARCHAR(100), -- 'Elderly (>65)', 'Athletes', 'Post-surgical', 'General adult'
  target_body_region VARCHAR(100), -- 'Cervical', 'Lumbar', 'Shoulder', 'Full body', 'Balance'
  estimated_minutes INTEGER DEFAULT 15,

  -- Test components
  tests JSONB NOT NULL, -- [{test_id, test_name, test_type: 'special_test'|'rom'|'strength'|'functional', order: 1, required: true, scoring: {}}]

  -- Scoring and interpretation
  scoring_method VARCHAR(50), -- 'COMPOSITE', 'PASS_FAIL', 'INDIVIDUAL', 'WEIGHTED'
  composite_score_calculation JSONB, -- {formula: 'SUM', weights: {}, interpretation: {}}

  -- Clinical utility
  indicated_for TEXT[], -- ['Balance disorders', 'Fall risk', 'Post-stroke rehab']
  contraindications TEXT[],

  -- Evidence base
  psychometric_properties JSONB,
  reference_citation TEXT,
  educational_link VARCHAR(500),

  -- System flags
  is_system BOOLEAN DEFAULT false, -- System-defined vs user-created
  is_template BOOLEAN DEFAULT true, -- Can be used as template for custom batteries
  is_active BOOLEAN DEFAULT true,

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_batteries_org ON test_batteries(organization_id);
CREATE INDEX idx_batteries_code ON test_batteries(code);
CREATE INDEX idx_batteries_region ON test_batteries(target_body_region);
CREATE INDEX idx_batteries_population ON test_batteries(target_population);

-- ============================================================================
-- TEST BATTERY RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_battery_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  battery_id UUID REFERENCES test_batteries(id) ON DELETE CASCADE,

  -- Individual test results
  test_results JSONB NOT NULL, -- [{test_id, result, score, notes, normative_comparison: {}}]

  -- Composite scoring
  composite_score DECIMAL(5,2),
  composite_interpretation VARCHAR(100), -- 'Excellent', 'Good', 'Fair', 'Poor'

  -- Comparison data
  normative_percentile INTEGER, -- Patient's percentile compared to age/gender norms
  previous_score DECIMAL(5,2),
  score_change DECIMAL(5,2),

  -- Clinical context
  administered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  administered_by UUID REFERENCES users(id),
  test_duration_minutes INTEGER,

  -- Clinical interpretation
  clinical_findings TEXT,
  recommendations TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_battery_results_patient ON test_battery_results(patient_id);
CREATE INDEX idx_battery_results_encounter ON test_battery_results(encounter_id);
CREATE INDEX idx_battery_results_battery ON test_battery_results(battery_id);
CREATE INDEX idx_battery_results_date ON test_battery_results(administered_date);

-- ============================================================================
-- NORMATIVE DATA (Age/gender norms for ROM, strength, functional tests)
-- ============================================================================

CREATE TABLE IF NOT EXISTS normative_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Test identification
  test_category VARCHAR(50) NOT NULL, -- 'ROM', 'STRENGTH', 'BALANCE', 'FUNCTIONAL', 'GAIT'
  test_name VARCHAR(255) NOT NULL, -- 'Cervical flexion ROM', 'Shoulder ER strength', 'TUG test'
  body_region VARCHAR(100), -- 'Cervical', 'Shoulder', 'Lumbar', etc.
  measurement_unit VARCHAR(20), -- 'degrees', 'kg', 'seconds', 'repetitions'

  -- Population characteristics
  age_min INTEGER,
  age_max INTEGER,
  gender VARCHAR(10), -- 'MALE', 'FEMALE', 'ALL'
  population_description TEXT, -- 'Healthy adults', 'Asymptomatic elderly', etc.

  -- Normative values
  mean_value DECIMAL(7,2),
  std_deviation DECIMAL(7,2),
  percentile_5 DECIMAL(7,2),
  percentile_25 DECIMAL(7,2),
  percentile_50 DECIMAL(7,2), -- Median
  percentile_75 DECIMAL(7,2),
  percentile_95 DECIMAL(7,2),

  -- Range values
  normal_min DECIMAL(7,2), -- Lower bound of normal
  normal_max DECIMAL(7,2), -- Upper bound of normal

  -- Clinical cutoffs
  clinical_cutoffs JSONB, -- {below_normal: <value>, above_normal: >value, severe: <value}

  -- Study metadata
  sample_size INTEGER,
  study_reference TEXT,
  year_published INTEGER,

  -- Data quality
  evidence_level VARCHAR(10), -- 'HIGH', 'MODERATE', 'LOW'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_normative_test_name ON normative_data(test_name);
CREATE INDEX idx_normative_category ON normative_data(test_category);
CREATE INDEX idx_normative_region ON normative_data(body_region);
CREATE INDEX idx_normative_age_gender ON normative_data(age_min, age_max, gender);

-- ============================================================================
-- EDUCATIONAL RESOURCES (Links to theBackROM.com)
-- ============================================================================

CREATE TABLE IF NOT EXISTS educational_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Resource identification
  resource_type VARCHAR(50) NOT NULL, -- 'TEST', 'QUESTIONNAIRE', 'BATTERY', 'CONDITION', 'TREATMENT'
  resource_code VARCHAR(100) NOT NULL, -- Links to test name, questionnaire code, etc.

  -- Content metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- External links
  backrom_url VARCHAR(500), -- www.theBackROM.com/education/Clickup/[resource]
  physiopedia_url VARCHAR(500),
  pubmed_reference VARCHAR(500),
  video_url VARCHAR(500),

  -- Content details
  content_type VARCHAR(50), -- 'VIDEO', 'ARTICLE', 'PROTOCOL', 'REFERENCE'
  estimated_read_time_minutes INTEGER,

  -- Educational value
  skill_level VARCHAR(20), -- 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'
  topics TEXT[], -- ['Cervical assessment', 'Special tests', 'Differential diagnosis']

  -- Quality indicators
  evidence_level VARCHAR(10), -- 'HIGH', 'MODERATE', 'LOW'
  last_reviewed_date DATE,

  -- Engagement tracking
  view_count INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_type ON educational_resources(resource_type);
CREATE INDEX idx_resources_code ON educational_resources(resource_code);
CREATE INDEX idx_resources_skill ON educational_resources(skill_level);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_questionnaire_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_questionnaire_timestamp
BEFORE UPDATE ON questionnaires
FOR EACH ROW
EXECUTE FUNCTION update_questionnaire_timestamp();

CREATE TRIGGER trigger_update_battery_timestamp
BEFORE UPDATE ON test_batteries
FOR EACH ROW
EXECUTE FUNCTION update_questionnaire_timestamp();

CREATE TRIGGER trigger_update_resource_timestamp
BEFORE UPDATE ON educational_resources
FOR EACH ROW
EXECUTE FUNCTION update_questionnaire_timestamp();

-- Increment battery usage count
CREATE OR REPLACE FUNCTION increment_battery_usage(battery_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE test_batteries
  SET usage_count = usage_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = battery_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate questionnaire score
CREATE OR REPLACE FUNCTION calculate_questionnaire_score(
  p_questionnaire_id UUID,
  p_responses JSONB
)
RETURNS TABLE(
  total_score DECIMAL(5,2),
  percentage_score DECIMAL(5,2),
  severity_level VARCHAR(50)
) AS $$
DECLARE
  v_questionnaire RECORD;
  v_calculated_score DECIMAL(5,2);
  v_percentage DECIMAL(5,2);
  v_severity VARCHAR(50);
BEGIN
  -- Get questionnaire configuration
  SELECT * INTO v_questionnaire
  FROM questionnaires
  WHERE id = p_questionnaire_id;

  -- Calculate score based on scoring method
  -- This is a simplified version - actual implementation would vary by questionnaire
  IF v_questionnaire.scoring_method = 'SUM' THEN
    -- Sum all numeric responses
    SELECT SUM((value->>'score')::DECIMAL) INTO v_calculated_score
    FROM jsonb_each(p_responses);
  END IF;

  -- Calculate percentage
  IF v_questionnaire.max_score > 0 THEN
    v_percentage := (v_calculated_score / v_questionnaire.max_score) * 100;
  END IF;

  -- Determine severity based on score interpretation ranges
  -- Simplified - would use actual interpretation logic
  IF v_percentage < 20 THEN
    v_severity := 'None';
  ELSIF v_percentage < 40 THEN
    v_severity := 'Mild';
  ELSIF v_percentage < 60 THEN
    v_severity := 'Moderate';
  ELSE
    v_severity := 'Severe';
  END IF;

  RETURN QUERY SELECT v_calculated_score, v_percentage, v_severity;
END;
$$ LANGUAGE plpgsql;

-- Find normative data for patient
CREATE OR REPLACE FUNCTION get_normative_comparison(
  p_test_name VARCHAR(255),
  p_patient_value DECIMAL(7,2),
  p_patient_age INTEGER,
  p_patient_gender VARCHAR(10)
)
RETURNS TABLE(
  percentile INTEGER,
  comparison_text VARCHAR(100),
  is_within_normal BOOLEAN
) AS $$
DECLARE
  v_norm RECORD;
  v_percentile INTEGER;
  v_comparison VARCHAR(100);
  v_is_normal BOOLEAN;
BEGIN
  -- Find matching normative data
  SELECT * INTO v_norm
  FROM normative_data
  WHERE test_name = p_test_name
    AND (gender = p_patient_gender OR gender = 'ALL')
    AND p_patient_age BETWEEN COALESCE(age_min, 0) AND COALESCE(age_max, 999)
  ORDER BY evidence_level DESC, year_published DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::INTEGER, 'No normative data available'::VARCHAR, NULL::BOOLEAN;
    RETURN;
  END IF;

  -- Determine percentile
  IF p_patient_value <= v_norm.percentile_5 THEN
    v_percentile := 5;
  ELSIF p_patient_value <= v_norm.percentile_25 THEN
    v_percentile := 25;
  ELSIF p_patient_value <= v_norm.percentile_50 THEN
    v_percentile := 50;
  ELSIF p_patient_value <= v_norm.percentile_75 THEN
    v_percentile := 75;
  ELSE
    v_percentile := 95;
  END IF;

  -- Determine if within normal range
  v_is_normal := p_patient_value BETWEEN v_norm.normal_min AND v_norm.normal_max;

  -- Generate comparison text
  IF v_is_normal THEN
    v_comparison := 'Within normal range';
  ELSIF p_patient_value < v_norm.normal_min THEN
    v_comparison := 'Below normal range';
  ELSE
    v_comparison := 'Above normal range';
  END IF;

  RETURN QUERY SELECT v_percentile, v_comparison, v_is_normal;
END;
$$ LANGUAGE plpgsql;
