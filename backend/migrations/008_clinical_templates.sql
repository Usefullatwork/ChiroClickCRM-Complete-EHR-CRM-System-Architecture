-- Clinical Templates System
-- Stores reusable clinical text snippets for SOAP documentation

CREATE TABLE IF NOT EXISTS clinical_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template organization
  category VARCHAR(100) NOT NULL, -- 'Vitals', 'Cervical', 'Shoulder', 'Neurological', etc.
  subcategory VARCHAR(100), -- 'ROM', 'Special Tests', 'Palpation', 'Observation', etc.
  template_name VARCHAR(255) NOT NULL,
  template_text TEXT NOT NULL,

  -- Metadata
  language VARCHAR(10) DEFAULT 'NO', -- 'NO' or 'EN'
  soap_section VARCHAR(50), -- 'subjective', 'objective', 'assessment', 'plan'
  is_system BOOLEAN DEFAULT false, -- System templates vs user-created
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast searching
CREATE INDEX idx_templates_category ON clinical_templates(category);
CREATE INDEX idx_templates_org ON clinical_templates(organization_id);
CREATE INDEX idx_templates_soap ON clinical_templates(soap_section);
CREATE INDEX idx_templates_language ON clinical_templates(language);
CREATE INDEX idx_templates_favorite ON clinical_templates(is_favorite) WHERE is_favorite = true;

-- Full text search index
CREATE INDEX idx_templates_search ON clinical_templates USING gin(to_tsvector('norwegian', template_name || ' ' || template_text));

-- Function to update usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE clinical_templates
  SET usage_count = usage_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_clinical_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clinical_template_timestamp
BEFORE UPDATE ON clinical_templates
FOR EACH ROW
EXECUTE FUNCTION update_clinical_template_timestamp();

-- Insert system templates (Norwegian examination protocols)
-- We'll populate these via the seed script
