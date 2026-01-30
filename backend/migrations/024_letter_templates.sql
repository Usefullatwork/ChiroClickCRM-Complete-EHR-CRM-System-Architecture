-- Migration: 024_letter_templates.sql
-- Description: Letter templates and generated letters tables for AI letter generation
-- Created: 2026-01-16

-- =============================================================================
-- LETTER TEMPLATES TABLE
-- Stores reusable letter templates with variable placeholders
-- =============================================================================

CREATE TABLE IF NOT EXISTS letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template identification
  template_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  template_name_en VARCHAR(100),

  -- Template content with {{variable}} placeholders
  template_content TEXT NOT NULL,

  -- Available variables as JSONB array
  -- Example: [{"name": "patient_name", "label": "Pasientnavn", "required": true}]
  variables JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  language VARCHAR(5) DEFAULT 'NO',
  category VARCHAR(50), -- VESTIBULAR, HEADACHE, SPINE, GENERAL, etc.
  description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- System templates cannot be deleted

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT unique_org_template_name UNIQUE (organization_id, template_type, template_name)
);

-- Index for fast template lookups
CREATE INDEX idx_letter_templates_org_type ON letter_templates(organization_id, template_type);
CREATE INDEX idx_letter_templates_category ON letter_templates(category);
CREATE INDEX idx_letter_templates_active ON letter_templates(is_active) WHERE is_active = true;

-- =============================================================================
-- GENERATED LETTERS TABLE
-- Stores all generated letters with full content and metadata
-- =============================================================================

CREATE TABLE IF NOT EXISTS generated_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,

  -- Letter details
  letter_type VARCHAR(50) NOT NULL,
  letter_title VARCHAR(200),
  content TEXT NOT NULL,

  -- Template reference (if used)
  template_id UUID REFERENCES letter_templates(id) ON DELETE SET NULL,

  -- Metadata about generation
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Example: {"model": "llama3.1", "generatedAt": "...", "variables_used": {...}}

  -- Recipient information
  recipient_name VARCHAR(200),
  recipient_institution VARCHAR(200),
  recipient_address TEXT,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, FINALIZED, SENT, ARCHIVED
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_method VARCHAR(50), -- EMAIL, PRINT, FAX, PORTAL

  -- Digital signature
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by UUID REFERENCES users(id),
  signature_data JSONB,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for generated letters
CREATE INDEX idx_generated_letters_org ON generated_letters(organization_id);
CREATE INDEX idx_generated_letters_patient ON generated_letters(patient_id);
CREATE INDEX idx_generated_letters_type ON generated_letters(letter_type);
CREATE INDEX idx_generated_letters_status ON generated_letters(status);
CREATE INDEX idx_generated_letters_created ON generated_letters(created_at DESC);

-- =============================================================================
-- LETTER TEMPLATE VARIABLES REFERENCE
-- Static reference table for standardized variable names
-- =============================================================================

CREATE TABLE IF NOT EXISTS letter_variable_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_name VARCHAR(50) NOT NULL UNIQUE,
  variable_label_no VARCHAR(100) NOT NULL,
  variable_label_en VARCHAR(100),
  description TEXT,
  data_type VARCHAR(20) DEFAULT 'TEXT', -- TEXT, DATE, NUMBER, BOOLEAN
  default_value TEXT,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard variable definitions
INSERT INTO letter_variable_definitions (variable_name, variable_label_no, variable_label_en, description, data_type) VALUES
  ('patient_name', 'Pasientnavn', 'Patient Name', 'Pasientens fulle navn', 'TEXT'),
  ('patient_fnr', 'Fødselsnummer', 'National ID', 'Pasientens 11-sifrede fødselsnummer', 'TEXT'),
  ('patient_dob', 'Fødselsdato', 'Date of Birth', 'Pasientens fødselsdato', 'DATE'),
  ('patient_address', 'Adresse', 'Address', 'Pasientens adresse', 'TEXT'),
  ('patient_phone', 'Telefon', 'Phone', 'Pasientens telefonnummer', 'TEXT'),
  ('current_date', 'Dagens dato', 'Current Date', 'Dagens dato', 'DATE'),
  ('treatment_start', 'Behandlingsstart', 'Treatment Start', 'Dato for første behandling', 'DATE'),
  ('treatment_end', 'Behandlingsslutt', 'Treatment End', 'Dato for siste behandling', 'DATE'),
  ('diagnosis', 'Diagnose', 'Diagnosis', 'Primærdiagnose', 'TEXT'),
  ('diagnosis_icd', 'ICD-10 kode', 'ICD-10 Code', 'ICD-10 diagnosekode', 'TEXT'),
  ('diagnosis_icpc', 'ICPC-2 kode', 'ICPC-2 Code', 'ICPC-2 diagnosekode', 'TEXT'),
  ('clinical_findings', 'Kliniske funn', 'Clinical Findings', 'Undersøkelsesfunn', 'TEXT'),
  ('functional_status', 'Funksjonsstatus', 'Functional Status', 'Arbeids-/studieevne', 'TEXT'),
  ('recommendations', 'Anbefalinger', 'Recommendations', 'Behandlingsanbefalinger', 'TEXT'),
  ('prognosis', 'Prognose', 'Prognosis', 'Forventet utvikling', 'TEXT'),
  ('provider_name', 'Behandler', 'Provider Name', 'Behandlers navn', 'TEXT'),
  ('provider_hpr', 'HPR-nummer', 'HPR Number', 'Behandlers HPR-nummer', 'TEXT'),
  ('provider_title', 'Tittel', 'Title', 'Behandlers tittel (f.eks. Kiropraktor)', 'TEXT'),
  ('clinic_name', 'Klinikknavn', 'Clinic Name', 'Klinikkens navn', 'TEXT'),
  ('clinic_address', 'Klinikkadresse', 'Clinic Address', 'Klinikkens adresse', 'TEXT'),
  ('clinic_phone', 'Klinikktelefon', 'Clinic Phone', 'Klinikkens telefon', 'TEXT'),
  ('clinic_org_nr', 'Org.nummer', 'Org Number', 'Klinikkens organisasjonsnummer', 'TEXT'),
  ('recipient', 'Mottaker', 'Recipient', 'Brevets mottaker', 'TEXT'),
  ('recipient_institution', 'Institusjon', 'Institution', 'Mottakers institusjon', 'TEXT'),
  ('vas_score_start', 'VAS start', 'VAS Start', 'VAS smerteskala ved start', 'NUMBER'),
  ('vas_score_end', 'VAS slutt', 'VAS End', 'VAS smerteskala ved slutt', 'NUMBER'),
  ('treatment_count', 'Antall behandlinger', 'Treatment Count', 'Totalt antall behandlinger', 'NUMBER')
ON CONFLICT (variable_name) DO NOTHING;

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_letter_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_letter_templates_updated_at
  BEFORE UPDATE ON letter_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_letter_templates_updated_at();

CREATE TRIGGER trigger_generated_letters_updated_at
  BEFORE UPDATE ON generated_letters
  FOR EACH ROW
  EXECUTE FUNCTION update_letter_templates_updated_at();

-- Increment usage count function
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    UPDATE letter_templates
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_template_usage
  AFTER INSERT ON generated_letters
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_usage();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_letters ENABLE ROW LEVEL SECURITY;

-- Templates: organization members can view, admins can modify
CREATE POLICY letter_templates_select_policy ON letter_templates
  FOR SELECT USING (
    organization_id IS NULL OR -- System templates visible to all
    organization_id IN (
      SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::uuid
    )
  );

CREATE POLICY letter_templates_insert_policy ON letter_templates
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = current_setting('app.current_user_id')::uuid
      AND role IN ('ADMIN', 'PRACTITIONER')
    )
  );

CREATE POLICY letter_templates_update_policy ON letter_templates
  FOR UPDATE USING (
    is_system = false AND
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = current_setting('app.current_user_id')::uuid
      AND role = 'ADMIN'
    )
  );

-- Generated letters: organization members can access
CREATE POLICY generated_letters_org_policy ON generated_letters
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = current_setting('app.current_user_id')::uuid
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE letter_templates IS 'Reusable letter templates with variable placeholders for clinical documentation';
COMMENT ON TABLE generated_letters IS 'All generated clinical letters stored with full content and metadata';
COMMENT ON TABLE letter_variable_definitions IS 'Standard variable definitions for letter template placeholders';
COMMENT ON COLUMN letter_templates.variables IS 'JSONB array of variable definitions: [{name, label, required, default}]';
COMMENT ON COLUMN generated_letters.metadata IS 'AI generation metadata: model used, timestamp, variables substituted';
