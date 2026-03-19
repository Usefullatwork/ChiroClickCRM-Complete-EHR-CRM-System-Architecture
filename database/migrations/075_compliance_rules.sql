-- Migration 075: Compliance Rules table
-- Data-driven compliance rules configurable via Settings UI

CREATE TABLE IF NOT EXISTS compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL, -- 'treatment_qualifier', 'diagnosis_treatment', 'red_flag', 'time_requirement'
  rule_key VARCHAR(100) NOT NULL, -- e.g. 'adjustment', 'M99.01', pattern text
  rule_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  severity VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, rule_type, rule_key)
);

CREATE INDEX idx_compliance_rules_org_active ON compliance_rules(organization_id, is_active)
  WHERE is_active = true;

INSERT INTO schema_migrations (version, name) VALUES ('075', 'compliance_rules') ON CONFLICT DO NOTHING;
