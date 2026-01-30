-- ============================================================================
-- Seed File: 09_patient_data_import.sql
-- Description: Patient data import from V2 CRM system
-- Source: F:\PROGAMMVARE - EHR - Øvelse - Behandling\EHR --- CMR\V2 CRM Data\import_patients.sql
-- ============================================================================
--
-- IMPORTANT: This is a wrapper/reference file.
-- The actual patient data is in the source file referenced above.
--
-- To import patients, run ONE of these options:
--
-- Option 1: Direct import from source
--   psql -U postgres -d chiroclickcrm -f "F:\PROGAMMVARE - EHR - Øvelse - Behandling\EHR  --- CMR\V2 CRM Data\import_patients.sql"
--
-- Option 2: Copy the import file to this directory and run
--   copy "F:\PROGAMMVARE - EHR - Øvelse - Behandling\EHR  --- CMR\V2 CRM Data\import_patients.sql" database\seeds\09_patient_data_import_data.sql
--   psql -U postgres -d chiroclickcrm -f database/seeds/09_patient_data_import_data.sql
--
-- ============================================================================
-- DATA NOTES:
-- - Contains 100+ patient records
-- - All birth dates are placeholder '1980-01-01' (needs manual correction)
-- - Norwegian phone numbers (+47 format)
-- - Status: INACTIVE, FINISHED, etc.
-- - Categories: OSLO
-- - Main problems include: Nakke, Rygg, Svimmelhet, Kjeve, Hofte
-- - Internal notes contain clinical observations in Norwegian
-- ============================================================================

-- Ensure organization exists before import
INSERT INTO organizations (id, name, org_number, created_at)
SELECT
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Oslo Kiropraktorklinikk',
    '000000000',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Add missing columns to patients table if they don't exist
DO $$
BEGIN
    -- solvit_id for legacy CRM reference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'solvit_id') THEN
        ALTER TABLE patients ADD COLUMN solvit_id VARCHAR(50);
        CREATE INDEX IF NOT EXISTS idx_patients_solvit_id ON patients(solvit_id);
    END IF;

    -- category for patient grouping
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'category') THEN
        ALTER TABLE patients ADD COLUMN category VARCHAR(50);
    END IF;

    -- main_problem for quick reference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'main_problem') THEN
        ALTER TABLE patients ADD COLUMN main_problem VARCHAR(255);
    END IF;

    -- internal_notes for clinical observations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'internal_notes') THEN
        ALTER TABLE patients ADD COLUMN internal_notes TEXT;
    END IF;

    -- total_visits counter
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'total_visits') THEN
        ALTER TABLE patients ADD COLUMN total_visits INTEGER DEFAULT 0;
    END IF;

    -- last_visit_date for tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'last_visit_date') THEN
        ALTER TABLE patients ADD COLUMN last_visit_date DATE;
    END IF;

    -- should_be_followed_up for reactivation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'should_be_followed_up') THEN
        ALTER TABLE patients ADD COLUMN should_be_followed_up DATE;
    END IF;

    -- consent_data_storage for GDPR
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'consent_data_storage') THEN
        ALTER TABLE patients ADD COLUMN consent_data_storage BOOLEAN DEFAULT false;
    END IF;

    -- preferred_contact_method
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'preferred_contact_method') THEN
        ALTER TABLE patients ADD COLUMN preferred_contact_method VARCHAR(20);
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_patients_category ON patients(category);
CREATE INDEX IF NOT EXISTS idx_patients_main_problem ON patients(main_problem);
CREATE INDEX IF NOT EXISTS idx_patients_last_visit ON patients(last_visit_date);
CREATE INDEX IF NOT EXISTS idx_patients_follow_up ON patients(should_be_followed_up)
    WHERE should_be_followed_up IS NOT NULL;

-- Log import instruction
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Patient data schema prepared.';
    RAISE NOTICE 'To import patient data, run:';
    RAISE NOTICE '  psql -U postgres -d chiroclickcrm -f "F:\PROGAMMVARE - EHR - Øvelse - Behandling\EHR  --- CMR\V2 CRM Data\import_patients.sql"';
    RAISE NOTICE '============================================================';
END $$;

COMMENT ON COLUMN patients.solvit_id IS 'Legacy CRM system ID for patient matching';
COMMENT ON COLUMN patients.category IS 'Patient category (e.g., OSLO, location-based)';
COMMENT ON COLUMN patients.main_problem IS 'Primary complaint (Nakke, Rygg, Svimmelhet, etc.)';
COMMENT ON COLUMN patients.internal_notes IS 'Clinical observations and notes in Norwegian';
COMMENT ON COLUMN patients.total_visits IS 'Total number of visits to the clinic';
COMMENT ON COLUMN patients.last_visit_date IS 'Date of most recent visit';
COMMENT ON COLUMN patients.should_be_followed_up IS 'Date for follow-up contact';
COMMENT ON COLUMN patients.consent_data_storage IS 'GDPR: Patient consent for data storage';
COMMENT ON COLUMN patients.preferred_contact_method IS 'Preferred contact: SMS, Email, Phone';
