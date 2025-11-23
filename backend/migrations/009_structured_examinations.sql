-- Structured Examination System
-- Stores structured orthopedic and neurological examination findings

-- Examination Protocols: Defines the standardized examination items for each body region
CREATE TABLE IF NOT EXISTS examination_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Protocol organization
  body_region VARCHAR(100) NOT NULL, -- 'Cervical', 'Shoulder', 'Elbow', 'Hand_Wrist', 'Thoracic', 'Lumbar', 'Hip', 'Knee'
  category VARCHAR(100) NOT NULL, -- 'Observation', 'Palpation', 'ROM', 'Special_Tests', 'Neurological'
  test_name VARCHAR(255) NOT NULL, -- 'Spurling Test', 'Lachman Test', etc.
  test_name_no VARCHAR(255), -- Norwegian name

  -- Test details
  description TEXT, -- What the test evaluates
  description_no TEXT, -- Norwegian description
  positive_indication TEXT, -- What a positive test indicates
  positive_indication_no TEXT, -- Norwegian positive indication

  -- Test execution
  execution_instructions TEXT, -- How to perform the test
  execution_instructions_no TEXT, -- Norwegian instructions
  normal_findings TEXT, -- What normal looks like
  normal_findings_no TEXT, -- Norwegian normal findings

  -- Metadata
  language VARCHAR(10) DEFAULT 'NO',
  is_system BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0, -- Order to display tests

  -- Red flags
  is_red_flag BOOLEAN DEFAULT false, -- Is this a red flag test?
  red_flag_criteria TEXT, -- What constitutes a red flag

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Structured Examination Findings: Stores actual patient examination results
CREATE TABLE IF NOT EXISTS structured_examination_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to clinical encounter
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,

  -- Link to protocol (optional - can be custom finding)
  protocol_id UUID REFERENCES examination_protocols(id) ON DELETE SET NULL,

  -- Finding details
  body_region VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  test_name VARCHAR(255) NOT NULL,

  -- Results
  result VARCHAR(50), -- 'positive', 'negative', 'equivocal', 'not_tested', 'unable_to_perform'
  laterality VARCHAR(20), -- 'bilateral', 'left', 'right', 'none'
  severity VARCHAR(50), -- 'mild', 'moderate', 'severe'

  -- Detailed findings
  findings_text TEXT, -- Free text description of findings
  clinician_notes TEXT, -- Additional notes from clinician

  -- Measurements (for ROM, strength, etc.)
  measurement_value DECIMAL(10,2), -- Numeric value (degrees, strength grade, etc.)
  measurement_unit VARCHAR(50), -- 'degrees', 'mm', 'grade_0-5', etc.

  -- Pain assessment for this specific test
  pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10), -- NRS 0-10
  pain_location TEXT, -- Where pain was reproduced

  -- Metadata
  examined_by UUID REFERENCES users(id),
  examined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Examination Templates: Pre-configured examination sets for common presentations
CREATE TABLE IF NOT EXISTS examination_template_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template details
  template_name VARCHAR(255) NOT NULL,
  template_name_no VARCHAR(255),
  description TEXT,
  description_no TEXT,

  -- Clinical context
  chief_complaint VARCHAR(255), -- 'Neck Pain', 'Low Back Pain', 'Shoulder Pain'
  chief_complaint_no VARCHAR(255),

  -- Included protocols (array of protocol IDs)
  protocol_ids UUID[] NOT NULL,

  -- Metadata
  language VARCHAR(10) DEFAULT 'NO',
  is_system BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_exam_protocols_region ON examination_protocols(body_region);
CREATE INDEX idx_exam_protocols_category ON examination_protocols(category);
CREATE INDEX idx_exam_protocols_language ON examination_protocols(language);
CREATE INDEX idx_exam_findings_encounter ON structured_examination_findings(encounter_id);
CREATE INDEX idx_exam_findings_region ON structured_examination_findings(body_region);
CREATE INDEX idx_exam_findings_result ON structured_examination_findings(result);
CREATE INDEX idx_exam_template_sets_complaint ON examination_template_sets(chief_complaint);

-- Full text search for examination protocols
CREATE INDEX idx_exam_protocols_search ON examination_protocols
  USING gin(to_tsvector('norwegian',
    COALESCE(test_name, '') || ' ' ||
    COALESCE(test_name_no, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(description_no, '')
  ));

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_examination_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exam_protocol_timestamp
BEFORE UPDATE ON examination_protocols
FOR EACH ROW
EXECUTE FUNCTION update_examination_timestamp();

CREATE TRIGGER trigger_update_exam_finding_timestamp
BEFORE UPDATE ON structured_examination_findings
FOR EACH ROW
EXECUTE FUNCTION update_examination_timestamp();

CREATE TRIGGER trigger_update_exam_template_timestamp
BEFORE UPDATE ON examination_template_sets
FOR EACH ROW
EXECUTE FUNCTION update_examination_timestamp();

-- Function to generate examination summary for SOAP note
CREATE OR REPLACE FUNCTION generate_examination_summary(p_encounter_id UUID)
RETURNS TEXT AS $$
DECLARE
  summary TEXT := '';
  region_summary TEXT;
BEGIN
  -- Loop through each body region with findings
  FOR region_summary IN
    SELECT
      body_region || E':\n' ||
      string_agg(
        '- ' || test_name || ': ' ||
        CASE
          WHEN result = 'positive' THEN 'Positiv'
          WHEN result = 'negative' THEN 'Negativ'
          WHEN result = 'equivocal' THEN 'Uklar'
          ELSE result
        END ||
        COALESCE(' (' || laterality || ')', '') ||
        COALESCE(E'\n  ' || findings_text, ''),
        E'\n'
        ORDER BY category, test_name
      ) as region_text
    FROM structured_examination_findings
    WHERE encounter_id = p_encounter_id
    GROUP BY body_region
    ORDER BY body_region
  LOOP
    summary := summary || region_summary || E'\n\n';
  END LOOP;

  RETURN TRIM(summary);
END;
$$ LANGUAGE plpgsql;

-- Function to check for red flag findings
CREATE OR REPLACE FUNCTION check_examination_red_flags(p_encounter_id UUID)
RETURNS TABLE(
  test_name VARCHAR,
  finding TEXT,
  red_flag_criteria TEXT,
  severity VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.test_name,
    f.findings_text,
    p.red_flag_criteria,
    f.severity
  FROM structured_examination_findings f
  LEFT JOIN examination_protocols p ON f.protocol_id = p.id
  WHERE f.encounter_id = p_encounter_id
    AND f.result = 'positive'
    AND (p.is_red_flag = true OR f.severity = 'severe');
END;
$$ LANGUAGE plpgsql;
