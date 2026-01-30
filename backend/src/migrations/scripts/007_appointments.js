/**
 * Migration: Appointments System
 * Adds appointment scheduling and appointment types
 */

export const up = async (client) => {
  await client.query(`
    -- Create appointment types table first (referenced by appointments)
    CREATE TABLE IF NOT EXISTS appointment_types (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER,
      name VARCHAR(100) NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      color VARCHAR(20),
      is_active BOOLEAN DEFAULT true
    );

    -- Indexes for appointment types
    CREATE INDEX IF NOT EXISTS idx_appointment_types_org
    ON appointment_types(organization_id);

    CREATE INDEX IF NOT EXISTS idx_appointment_types_active
    ON appointment_types(is_active) WHERE is_active = true;

    -- Create appointments table
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      provider_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      appointment_type VARCHAR(50) NOT NULL,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      status VARCHAR(50) DEFAULT 'scheduled',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),

      CONSTRAINT valid_appointment_status CHECK (
        status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')
      ),
      CONSTRAINT valid_time_range CHECK (end_time > start_time)
    );

    -- Indexes for appointment queries
    CREATE INDEX IF NOT EXISTS idx_appointments_patient
    ON appointments(patient_id);

    CREATE INDEX IF NOT EXISTS idx_appointments_provider
    ON appointments(provider_id);

    CREATE INDEX IF NOT EXISTS idx_appointments_start_time
    ON appointments(start_time);

    CREATE INDEX IF NOT EXISTS idx_appointments_status
    ON appointments(status);

    -- Composite index for calendar view queries
    CREATE INDEX IF NOT EXISTS idx_appointments_provider_date
    ON appointments(provider_id, start_time);

    -- Index for date range queries
    CREATE INDEX IF NOT EXISTS idx_appointments_time_range
    ON appointments(start_time, end_time);

    -- Index for patient upcoming appointments
    CREATE INDEX IF NOT EXISTS idx_appointments_patient_future
    ON appointments(patient_id, start_time)
    WHERE status IN ('scheduled', 'confirmed');

    -- Add foreign key constraint to clinical_notes for appointment_id if not exists
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'clinical_notes'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'clinical_notes_appointment_id_fkey'
      ) THEN
        ALTER TABLE clinical_notes
        ADD CONSTRAINT clinical_notes_appointment_id_fkey
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;
      END IF;
    END $$;

    -- Comments for documentation
    COMMENT ON TABLE appointments IS 'Patient appointment scheduling';
    COMMENT ON TABLE appointment_types IS 'Configurable appointment types per organization';
    COMMENT ON COLUMN appointments.status IS 'scheduled, confirmed, checked_in, in_progress, completed, cancelled, no_show';
  `);
};

export const down = async (client) => {
  await client.query(`
    -- Remove foreign key constraint from clinical_notes if exists
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'clinical_notes_appointment_id_fkey'
      ) THEN
        ALTER TABLE clinical_notes
        DROP CONSTRAINT clinical_notes_appointment_id_fkey;
      END IF;
    END $$;

    -- Drop tables
    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS appointment_types;
  `);
};
