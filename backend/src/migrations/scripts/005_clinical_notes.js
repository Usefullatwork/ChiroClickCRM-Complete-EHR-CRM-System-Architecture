/**
 * Migration: Clinical Notes
 * Adds clinical_notes table for SOAP documentation with template support
 */

export const up = async (client) => {
  await client.query(`
    -- Clinical Notes Table
    CREATE TABLE IF NOT EXISTS clinical_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      practitioner_id UUID REFERENCES users(id),

      -- Note metadata
      note_type VARCHAR(50) NOT NULL DEFAULT 'SOAP',
      template_type VARCHAR(50) DEFAULT 'standard',
      note_date TIMESTAMP NOT NULL DEFAULT NOW(),
      status VARCHAR(20) NOT NULL DEFAULT 'draft',

      -- SOAP Content (stored as JSONB for flexibility)
      subjective JSONB DEFAULT '{}',
      objective JSONB DEFAULT '{}',
      assessment JSONB DEFAULT '{}',
      plan JSONB DEFAULT '{}',

      -- Diagnosis codes
      icd10_codes TEXT[] DEFAULT '{}',
      icpc_codes TEXT[] DEFAULT '{}',

      -- Vestibular assessment data (for vestibular template)
      vestibular_data JSONB DEFAULT NULL,

      -- Additional metadata
      duration_minutes INTEGER DEFAULT 30,
      vas_pain_start INTEGER,
      vas_pain_end INTEGER,

      -- Exercise prescriptions
      prescribed_exercises JSONB DEFAULT '[]',

      -- Generated note text for export/print
      generated_note TEXT,

      -- Signing
      signed_at TIMESTAMP,
      signed_by UUID REFERENCES users(id),
      signature_hash TEXT,

      -- Draft/autosave support
      is_draft BOOLEAN DEFAULT true,
      draft_saved_at TIMESTAMP,
      auto_save_data JSONB,

      -- Linked encounter (optional - for notes created from encounters)
      encounter_id UUID REFERENCES clinical_encounters(id),

      -- Audit
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      created_by UUID REFERENCES users(id),
      updated_by UUID REFERENCES users(id)
    );

    -- Indexes for clinical_notes
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_org ON clinical_notes(organization_id);
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient ON clinical_notes(patient_id);
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_practitioner ON clinical_notes(practitioner_id);
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_date ON clinical_notes(note_date DESC);
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_status ON clinical_notes(status);
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_type ON clinical_notes(note_type);
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_template ON clinical_notes(template_type);
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_draft ON clinical_notes(is_draft) WHERE is_draft = true;

    -- Full-text search vector for notes
    ALTER TABLE clinical_notes
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

    -- Create function to generate clinical notes search vector
    CREATE OR REPLACE FUNCTION clinical_notes_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.subjective->>'chief_complaint', '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.subjective->>'history', '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.objective->>'findings', '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.assessment->>'clinical_reasoning', '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.plan->>'treatment', '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.icd10_codes, ' '), '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.icpc_codes, ' '), '')), 'A');
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;

    -- Create trigger for automatic search vector updates
    DROP TRIGGER IF EXISTS clinical_notes_search_vector_trigger ON clinical_notes;
    CREATE TRIGGER clinical_notes_search_vector_trigger
      BEFORE INSERT OR UPDATE ON clinical_notes
      FOR EACH ROW EXECUTE FUNCTION clinical_notes_search_vector_update();

    -- Create GIN index for fast full-text search
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_search_vector
    ON clinical_notes USING GIN(search_vector);

    -- Note Templates Table (for custom templates)
    CREATE TABLE IF NOT EXISTS clinical_note_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

      name VARCHAR(100) NOT NULL,
      description TEXT,
      template_type VARCHAR(50) NOT NULL,
      category VARCHAR(50),

      -- Template structure
      subjective_template JSONB DEFAULT '{}',
      objective_template JSONB DEFAULT '{}',
      assessment_template JSONB DEFAULT '{}',
      plan_template JSONB DEFAULT '{}',

      -- Default values
      default_duration INTEGER DEFAULT 30,
      default_codes TEXT[] DEFAULT '{}',

      -- Metadata
      is_active BOOLEAN DEFAULT true,
      is_system_template BOOLEAN DEFAULT false,
      usage_count INTEGER DEFAULT 0,

      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      created_by UUID REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_note_templates_org ON clinical_note_templates(organization_id);
    CREATE INDEX IF NOT EXISTS idx_note_templates_type ON clinical_note_templates(template_type);
    CREATE INDEX IF NOT EXISTS idx_note_templates_active ON clinical_note_templates(is_active) WHERE is_active = true;

    -- Insert default system templates
    INSERT INTO clinical_note_templates (
      organization_id, name, description, template_type, category, is_system_template,
      subjective_template, objective_template, assessment_template, plan_template
    ) VALUES
    (
      (SELECT id FROM organizations LIMIT 1),
      'Standard SOAP',
      'Standard SOAP note template for chiropractic visits',
      'SOAP',
      'general',
      true,
      '{"fields": ["chief_complaint", "history", "onset", "pain_description", "aggravating_factors", "relieving_factors"]}',
      '{"fields": ["observation", "palpation", "rom", "ortho_tests", "neuro_tests", "vital_signs"]}',
      '{"fields": ["clinical_reasoning", "diagnosis", "prognosis"]}',
      '{"fields": ["treatment", "exercises", "advice", "follow_up"]}'
    ),
    (
      (SELECT id FROM organizations LIMIT 1),
      'Initial Visit',
      'Comprehensive initial visit template',
      'INITIAL',
      'general',
      true,
      '{"fields": ["chief_complaint", "history", "onset", "mechanism", "pain_description", "previous_treatment", "medical_history", "medications", "allergies"]}',
      '{"fields": ["observation", "posture", "gait", "palpation", "rom", "ortho_tests", "neuro_tests", "vital_signs"]}',
      '{"fields": ["clinical_reasoning", "diagnosis", "differential_diagnosis", "prognosis", "red_flags"]}',
      '{"fields": ["treatment_plan", "goals", "exercises", "advice", "follow_up", "referral"]}'
    ),
    (
      (SELECT id FROM organizations LIMIT 1),
      'Follow-up Visit',
      'Quick follow-up visit template',
      'FOLLOWUP',
      'general',
      true,
      '{"fields": ["progress", "current_symptoms", "compliance"]}',
      '{"fields": ["findings", "rom", "reassessment"]}',
      '{"fields": ["response_to_treatment", "updated_assessment"]}',
      '{"fields": ["continued_treatment", "modified_exercises", "next_visit"]}'
    ),
    (
      (SELECT id FROM organizations LIMIT 1),
      'Vestibular Assessment',
      'Specialized vestibular/BPPV assessment template',
      'VESTIBULAR',
      'specialized',
      true,
      '{"fields": ["dizziness_type", "dizziness_description", "onset", "triggers", "associated_symptoms", "ear_symptoms"]}',
      '{"fields": ["bppv_tests", "balance_tests", "oculomotor_tests", "hit_test", "fukuda_test", "rhomberg_test"]}',
      '{"fields": ["diagnosis", "bppv_details", "dhi_score", "referral_needed"]}',
      '{"fields": ["maneuvers_performed", "vrt_exercises", "home_exercises", "follow_up_plan"]}'
    )
    ON CONFLICT DO NOTHING;

    COMMENT ON TABLE clinical_notes IS 'Clinical documentation with SOAP format and template support';
    COMMENT ON TABLE clinical_note_templates IS 'Customizable templates for clinical notes';
  `);
};

export const down = async (client) => {
  await client.query(`
    -- Remove triggers
    DROP TRIGGER IF EXISTS clinical_notes_search_vector_trigger ON clinical_notes;

    -- Remove functions
    DROP FUNCTION IF EXISTS clinical_notes_search_vector_update();

    -- Remove tables
    DROP TABLE IF EXISTS clinical_note_templates CASCADE;
    DROP TABLE IF EXISTS clinical_notes CASCADE;
  `);
};
