/**
 * Migration: Enhanced consent tracking for GDPR
 * Adds detailed consent history and preferences
 */

export const up = async (client) => {
  await client.query(`
    -- Create consent history table
    CREATE TABLE IF NOT EXISTS consent_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      consent_type VARCHAR(50) NOT NULL,
      consent_given BOOLEAN NOT NULL,
      consent_method VARCHAR(50) NOT NULL DEFAULT 'WRITTEN',
      ip_address INET,
      user_agent TEXT,
      notes TEXT,
      recorded_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),

      CONSTRAINT valid_consent_type CHECK (
        consent_type IN ('DATA_STORAGE', 'SMS', 'EMAIL', 'MARKETING', 'RESEARCH', 'THIRD_PARTY')
      ),
      CONSTRAINT valid_consent_method CHECK (
        consent_method IN ('WRITTEN', 'VERBAL', 'DIGITAL', 'IMPLICIT')
      )
    );

    -- Index for patient consent queries
    CREATE INDEX IF NOT EXISTS idx_consent_history_patient
    ON consent_history(patient_id, created_at DESC);

    -- Index for consent type reporting
    CREATE INDEX IF NOT EXISTS idx_consent_history_type
    ON consent_history(consent_type, consent_given);

    -- Add preferred contact method to patients if not exists
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'preferred_contact_method'
      ) THEN
        ALTER TABLE patients
        ADD COLUMN preferred_contact_method VARCHAR(20) DEFAULT 'SMS'
        CHECK (preferred_contact_method IN ('SMS', 'EMAIL', 'PHONE', 'POST'));
      END IF;
    END $$;

    -- Add consent withdrawal date
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'consent_withdrawn_at'
      ) THEN
        ALTER TABLE patients
        ADD COLUMN consent_withdrawn_at TIMESTAMP;
      END IF;
    END $$;

    COMMENT ON TABLE consent_history IS 'Tracks all consent changes for GDPR Article 7 compliance';
  `);
};

export const down = async (client) => {
  await client.query(`
    DROP TABLE IF EXISTS consent_history;
    ALTER TABLE patients DROP COLUMN IF EXISTS preferred_contact_method;
    ALTER TABLE patients DROP COLUMN IF EXISTS consent_withdrawn_at;
  `);
};
