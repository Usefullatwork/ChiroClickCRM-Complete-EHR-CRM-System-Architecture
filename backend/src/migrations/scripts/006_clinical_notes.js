/**
 * Migration: Clinical Notes and Vestibular Assessments
 * Adds SOAP notes and specialized vestibular assessment tracking
 */

export const up = async (client) => {
  await client.query(`
    -- Create clinical notes table
    CREATE TABLE IF NOT EXISTS clinical_notes (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      provider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      appointment_id INTEGER,
      note_type VARCHAR(50) NOT NULL,
      subjective TEXT,
      objective JSONB,
      assessment TEXT,
      plan TEXT,
      icd_codes TEXT[],
      is_signed BOOLEAN DEFAULT false,
      signed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),

      CONSTRAINT valid_note_type CHECK (
        note_type IN ('soap', 'initial', 'followup', 'vestibular', 'discharge')
      )
    );

    -- Indexes for clinical notes queries
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient
    ON clinical_notes(patient_id);

    CREATE INDEX IF NOT EXISTS idx_clinical_notes_provider
    ON clinical_notes(provider_id);

    CREATE INDEX IF NOT EXISTS idx_clinical_notes_appointment
    ON clinical_notes(appointment_id) WHERE appointment_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_clinical_notes_type
    ON clinical_notes(note_type);

    CREATE INDEX IF NOT EXISTS idx_clinical_notes_signed
    ON clinical_notes(is_signed, signed_at);

    CREATE INDEX IF NOT EXISTS idx_clinical_notes_created
    ON clinical_notes(created_at DESC);

    -- GIN index for JSONB objective data
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_objective
    ON clinical_notes USING GIN(objective);

    -- GIN index for ICD codes array
    CREATE INDEX IF NOT EXISTS idx_clinical_notes_icd_codes
    ON clinical_notes USING GIN(icd_codes);

    -- Create vestibular assessments table
    CREATE TABLE IF NOT EXISTS vestibular_assessments (
      id SERIAL PRIMARY KEY,
      note_id INTEGER REFERENCES clinical_notes(id) ON DELETE CASCADE,
      dix_hallpike_right VARCHAR(50),
      dix_hallpike_left VARCHAR(50),
      head_impulse_right VARCHAR(50),
      head_impulse_left VARCHAR(50),
      nystagmus_type VARCHAR(100),
      nystagmus_direction VARCHAR(50),
      romberg_result VARCHAR(50),
      tandem_gait VARCHAR(50),
      vhi_score INTEGER,
      additional_tests JSONB
    );

    -- Indexes for vestibular assessments
    CREATE INDEX IF NOT EXISTS idx_vestibular_note
    ON vestibular_assessments(note_id);

    CREATE INDEX IF NOT EXISTS idx_vestibular_vhi_score
    ON vestibular_assessments(vhi_score) WHERE vhi_score IS NOT NULL;

    -- GIN index for additional tests JSONB
    CREATE INDEX IF NOT EXISTS idx_vestibular_additional_tests
    ON vestibular_assessments USING GIN(additional_tests);

    -- Create trigger for updated_at timestamp
    CREATE OR REPLACE FUNCTION update_clinical_notes_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS clinical_notes_updated_at ON clinical_notes;
    CREATE TRIGGER clinical_notes_updated_at
      BEFORE UPDATE ON clinical_notes
      FOR EACH ROW EXECUTE FUNCTION update_clinical_notes_timestamp();

    -- Comments for documentation
    COMMENT ON TABLE clinical_notes IS 'SOAP and other clinical documentation notes';
    COMMENT ON TABLE vestibular_assessments IS 'Specialized vestibular/balance assessment data';
    COMMENT ON COLUMN clinical_notes.note_type IS 'Type: soap, initial, followup, vestibular, discharge';
    COMMENT ON COLUMN clinical_notes.objective IS 'Structured objective findings in JSON format';
    COMMENT ON COLUMN vestibular_assessments.vhi_score IS 'Vestibular Handicap Inventory score (0-100)';
  `);
};

export const down = async (client) => {
  await client.query(`
    -- Drop trigger and function
    DROP TRIGGER IF EXISTS clinical_notes_updated_at ON clinical_notes;
    DROP FUNCTION IF EXISTS update_clinical_notes_timestamp();

    -- Drop tables in reverse order
    DROP TABLE IF EXISTS vestibular_assessments;
    DROP TABLE IF EXISTS clinical_notes;
  `);
};
