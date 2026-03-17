-- Migration 074: Slash Commands table
-- Custom user-defined slash commands for clinical text expansion

CREATE TABLE IF NOT EXISTS slash_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  command_trigger VARCHAR(50) NOT NULL,
  output_text TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (organization_id, command_trigger) WHERE deleted_at IS NULL
);

CREATE INDEX idx_slash_commands_org ON slash_commands(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_slash_commands_user ON slash_commands(user_id) WHERE deleted_at IS NULL;

INSERT INTO schema_migrations (version, name) VALUES ('074', 'slash_commands') ON CONFLICT DO NOTHING;
