-- Migration: Enhanced Shoulder, Arm, Elbow & Forearm Clinical Templates
-- This migration adds comprehensive clinical templates for upper extremity assessment
-- Based on orthopedic examination protocols

-- Helper function to insert templates (idempotent)
CREATE OR REPLACE FUNCTION insert_template(
  p_category VARCHAR,
  p_subcategory VARCHAR,
  p_name VARCHAR,
  p_text TEXT,
  p_soap_section VARCHAR DEFAULT 'objective',
  p_language VARCHAR DEFAULT 'NO'
) RETURNS void AS $$
BEGIN
  INSERT INTO clinical_templates (
    organization_id,
    category,
    subcategory,
    template_name,
    template_text,
    language,
    soap_section,
    is_system
  ) VALUES (
    NULL,  -- System template
    p_category,
    p_subcategory,
    p_name,
    p_text,
    p_language,
    p_soap_section,
    true
  )
  ON CONFLICT DO NOTHING; -- Skip if template already exists
END;
$$ LANGUAGE plpgsql;

-- Add index for English templates
CREATE INDEX IF NOT EXISTS idx_templates_language_en ON clinical_templates(language) WHERE language = 'EN';

-- Add index for template subcategory
CREATE INDEX IF NOT EXISTS idx_templates_subcategory ON clinical_templates(subcategory);

-- Add composite index for category + subcategory lookups
CREATE INDEX IF NOT EXISTS idx_templates_cat_subcat ON clinical_templates(category, subcategory);

-- Note: The actual template data is loaded via seed files:
-- - backend/seeds/shoulder_arm_clinical_templates.sql
-- - backend/seeds/elbow_forearm_clinical_templates.sql

-- Create a view for template categories (for frontend dropdown)
CREATE OR REPLACE VIEW template_categories AS
SELECT DISTINCT
  category,
  subcategory,
  language,
  COUNT(*) as template_count
FROM clinical_templates
WHERE is_system = true OR organization_id IS NOT NULL
GROUP BY category, subcategory, language
ORDER BY category, subcategory;

-- Add comment to table for documentation
COMMENT ON TABLE clinical_templates IS 'Reusable clinical text templates for SOAP documentation. Includes comprehensive shoulder, arm, elbow, and forearm examination protocols.';

-- Cleanup helper function (optional - keep for future use)
-- DROP FUNCTION IF EXISTS insert_template(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);
