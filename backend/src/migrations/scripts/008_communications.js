/**
 * Migration: Communications System
 * Adds message templates and sent message tracking
 */

export const up = async (client) => {
  await client.query(`
    -- Create message templates table
    CREATE TABLE IF NOT EXISTS message_templates (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER,
      name VARCHAR(255) NOT NULL,
      template_type VARCHAR(50),
      subject VARCHAR(255),
      body TEXT,
      variables JSONB,
      is_active BOOLEAN DEFAULT true,

      CONSTRAINT valid_template_type CHECK (
        template_type IN ('email', 'sms')
      )
    );

    -- Indexes for message templates
    CREATE INDEX IF NOT EXISTS idx_message_templates_org
    ON message_templates(organization_id);

    CREATE INDEX IF NOT EXISTS idx_message_templates_type
    ON message_templates(template_type);

    CREATE INDEX IF NOT EXISTS idx_message_templates_active
    ON message_templates(is_active) WHERE is_active = true;

    -- GIN index for template variables
    CREATE INDEX IF NOT EXISTS idx_message_templates_variables
    ON message_templates USING GIN(variables);

    -- Create sent messages table
    CREATE TABLE IF NOT EXISTS sent_messages (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
      template_id INTEGER REFERENCES message_templates(id) ON DELETE SET NULL,
      message_type VARCHAR(50),
      recipient VARCHAR(255),
      subject VARCHAR(255),
      body TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      sent_at TIMESTAMP,
      error_message TEXT,

      CONSTRAINT valid_message_type CHECK (
        message_type IN ('email', 'sms')
      ),
      CONSTRAINT valid_message_status CHECK (
        status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')
      )
    );

    -- Indexes for sent messages
    CREATE INDEX IF NOT EXISTS idx_sent_messages_patient
    ON sent_messages(patient_id);

    CREATE INDEX IF NOT EXISTS idx_sent_messages_template
    ON sent_messages(template_id);

    CREATE INDEX IF NOT EXISTS idx_sent_messages_status
    ON sent_messages(status);

    CREATE INDEX IF NOT EXISTS idx_sent_messages_type
    ON sent_messages(message_type);

    CREATE INDEX IF NOT EXISTS idx_sent_messages_sent_at
    ON sent_messages(sent_at DESC) WHERE sent_at IS NOT NULL;

    -- Composite index for message delivery reports
    CREATE INDEX IF NOT EXISTS idx_sent_messages_patient_status
    ON sent_messages(patient_id, status, sent_at DESC);

    -- Index for failed messages requiring retry
    CREATE INDEX IF NOT EXISTS idx_sent_messages_failed
    ON sent_messages(status, message_type)
    WHERE status = 'failed';

    -- Comments for documentation
    COMMENT ON TABLE message_templates IS 'Email and SMS message templates';
    COMMENT ON TABLE sent_messages IS 'History of sent patient communications';
    COMMENT ON COLUMN message_templates.variables IS 'JSON object defining template variables like {{patient_name}}';
    COMMENT ON COLUMN sent_messages.status IS 'pending, sent, delivered, failed, bounced, opened, clicked';
  `);
};

export const down = async (client) => {
  await client.query(`
    -- Drop tables in reverse order
    DROP TABLE IF EXISTS sent_messages;
    DROP TABLE IF EXISTS message_templates;
  `);
};
