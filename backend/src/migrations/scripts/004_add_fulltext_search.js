/**
 * Migration: Add Full-Text Search Support
 * Implements PostgreSQL tsvector for patient and diagnosis search
 */

export const up = async (client) => {
  await client.query(`
    -- Add Norwegian text search configuration if not exists
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'norwegian'
      ) THEN
        -- Create Norwegian configuration based on simple
        CREATE TEXT SEARCH CONFIGURATION norwegian (COPY = simple);
      END IF;
    END $$;

    -- Add search vector column to patients table
    ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

    -- Create function to generate patient search vector
    CREATE OR REPLACE FUNCTION patients_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.first_name, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.last_name, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.email, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.phone, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.solvit_id, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.category, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(NEW.internal_notes, '')), 'D');
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;

    -- Create trigger for automatic search vector updates
    DROP TRIGGER IF EXISTS patients_search_vector_trigger ON patients;
    CREATE TRIGGER patients_search_vector_trigger
      BEFORE INSERT OR UPDATE ON patients
      FOR EACH ROW EXECUTE FUNCTION patients_search_vector_update();

    -- Create GIN index for fast full-text search
    CREATE INDEX IF NOT EXISTS idx_patients_search_vector
    ON patients USING GIN(search_vector);

    -- Update existing patients with search vectors
    UPDATE patients SET search_vector =
      setweight(to_tsvector('simple', COALESCE(first_name, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(last_name, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(email, '')), 'B') ||
      setweight(to_tsvector('simple', COALESCE(phone, '')), 'B') ||
      setweight(to_tsvector('simple', COALESCE(solvit_id, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(category, '')), 'C') ||
      setweight(to_tsvector('simple', COALESCE(internal_notes, '')), 'D');

    -- Add search vector to diagnosis_codes table
    ALTER TABLE diagnosis_codes
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

    -- Create function to generate diagnosis search vector
    CREATE OR REPLACE FUNCTION diagnosis_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.code, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description_no, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description_en, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.category, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(NEW.keywords, '')), 'B');
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;

    -- Create trigger for diagnosis codes
    DROP TRIGGER IF EXISTS diagnosis_search_vector_trigger ON diagnosis_codes;
    CREATE TRIGGER diagnosis_search_vector_trigger
      BEFORE INSERT OR UPDATE ON diagnosis_codes
      FOR EACH ROW EXECUTE FUNCTION diagnosis_search_vector_update();

    -- Create GIN index for diagnosis search
    CREATE INDEX IF NOT EXISTS idx_diagnosis_search_vector
    ON diagnosis_codes USING GIN(search_vector);

    -- Add keywords column if not exists (for synonym support)
    ALTER TABLE diagnosis_codes
    ADD COLUMN IF NOT EXISTS keywords TEXT;

    -- Update existing diagnosis codes with search vectors
    UPDATE diagnosis_codes SET search_vector =
      setweight(to_tsvector('simple', COALESCE(code, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(description_no, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(description_en, '')), 'B') ||
      setweight(to_tsvector('simple', COALESCE(category, '')), 'C') ||
      setweight(to_tsvector('simple', COALESCE(keywords, '')), 'B');

    -- Add search vector to clinical_encounters for SOAP note search
    ALTER TABLE clinical_encounters
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

    -- Create function to generate encounter search vector
    CREATE OR REPLACE FUNCTION encounters_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.subjective::text, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.objective::text, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.assessment::text, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.plan::text, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.icpc_codes, ' '), '')), 'B');
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;

    -- Create trigger for encounters
    DROP TRIGGER IF EXISTS encounters_search_vector_trigger ON clinical_encounters;
    CREATE TRIGGER encounters_search_vector_trigger
      BEFORE INSERT OR UPDATE ON clinical_encounters
      FOR EACH ROW EXECUTE FUNCTION encounters_search_vector_update();

    -- Create GIN index for encounter search
    CREATE INDEX IF NOT EXISTS idx_encounters_search_vector
    ON clinical_encounters USING GIN(search_vector);

    -- Update existing encounters with search vectors
    UPDATE clinical_encounters SET search_vector =
      setweight(to_tsvector('simple', COALESCE(subjective::text, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(objective::text, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(assessment::text, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(plan::text, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(array_to_string(icpc_codes, ' '), '')), 'B');

    COMMENT ON COLUMN patients.search_vector IS 'Full-text search vector for patient data';
    COMMENT ON COLUMN diagnosis_codes.search_vector IS 'Full-text search vector for diagnosis codes';
    COMMENT ON COLUMN clinical_encounters.search_vector IS 'Full-text search vector for SOAP notes';
  `);
};

export const down = async (client) => {
  await client.query(`
    -- Remove triggers
    DROP TRIGGER IF EXISTS patients_search_vector_trigger ON patients;
    DROP TRIGGER IF EXISTS diagnosis_search_vector_trigger ON diagnosis_codes;
    DROP TRIGGER IF EXISTS encounters_search_vector_trigger ON clinical_encounters;

    -- Remove functions
    DROP FUNCTION IF EXISTS patients_search_vector_update();
    DROP FUNCTION IF EXISTS diagnosis_search_vector_update();
    DROP FUNCTION IF EXISTS encounters_search_vector_update();

    -- Remove indexes
    DROP INDEX IF EXISTS idx_patients_search_vector;
    DROP INDEX IF EXISTS idx_diagnosis_search_vector;
    DROP INDEX IF EXISTS idx_encounters_search_vector;

    -- Remove columns
    ALTER TABLE patients DROP COLUMN IF EXISTS search_vector;
    ALTER TABLE diagnosis_codes DROP COLUMN IF EXISTS search_vector;
    ALTER TABLE diagnosis_codes DROP COLUMN IF EXISTS keywords;
    ALTER TABLE clinical_encounters DROP COLUMN IF EXISTS search_vector;
  `);
};
