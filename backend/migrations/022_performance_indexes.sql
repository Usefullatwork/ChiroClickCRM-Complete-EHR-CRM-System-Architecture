-- ============================================================================
-- Migration 022: Performance Indexes for Security and Clinical Operations
-- ChiroClickCRM - Norwegian EHR/CRM System
-- Created: 2026-01-03
-- ============================================================================
-- PURPOSE: Additional performance indexes focusing on security queries,
-- full-text search (Norwegian), and JSONB optimization for clinical data.
-- ============================================================================

-- ============================================================================
-- FULL-TEXT SEARCH CONFIGURATION (Norwegian)
-- ============================================================================

-- Create Norwegian text search configuration if not exists
-- Note: Requires Norwegian dictionary to be installed
DO $$
BEGIN
    -- Check if Norwegian configuration exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'norwegian'
    ) THEN
        -- Create configuration based on 'simple' as fallback
        CREATE TEXT SEARCH CONFIGURATION norwegian (COPY = simple);
        RAISE NOTICE 'Created Norwegian text search configuration (simple fallback)';
    END IF;
END $$;

-- ============================================================================
-- PATIENTS TABLE - Full-Text Search (Norwegian)
-- ============================================================================

-- Drop existing patient search index if it exists to recreate with updated config
DROP INDEX IF EXISTS idx_patients_fulltext_search;

-- Comprehensive patient search index including all searchable fields
CREATE INDEX IF NOT EXISTS idx_patients_fulltext_search_norwegian
ON patients USING gin(
    to_tsvector('norwegian',
        COALESCE(first_name, '') || ' ' ||
        COALESCE(last_name, '') || ' ' ||
        COALESCE(phone_number, '') || ' ' ||
        COALESCE(email, '') || ' ' ||
        COALESCE(address, '') || ' ' ||
        COALESCE(city, '') || ' ' ||
        COALESCE(postal_code, '') || ' ' ||
        COALESCE(personal_number, '') -- Norwegian personal ID (fodselsnummer)
    )
);

COMMENT ON INDEX idx_patients_fulltext_search_norwegian
IS 'Full-text search on patients with Norwegian language support';

-- Index for patient name autocomplete (faster than full-text for prefix matching)
CREATE INDEX IF NOT EXISTS idx_patients_name_autocomplete
ON patients (lower(first_name) text_pattern_ops, lower(last_name) text_pattern_ops)
WHERE is_active = true;

COMMENT ON INDEX idx_patients_name_autocomplete
IS 'Fast prefix matching for patient name autocomplete';

-- ============================================================================
-- CLINICAL ENCOUNTERS - Full-Text Search (Norwegian)
-- ============================================================================

-- Drop existing encounter content index to recreate
DROP INDEX IF EXISTS idx_encounters_content_fulltext;

-- Full-text search on SOAP notes with Norwegian language support
CREATE INDEX IF NOT EXISTS idx_encounters_soap_fulltext_norwegian
ON clinical_encounters USING gin(
    to_tsvector('norwegian',
        COALESCE(subjective, '') || ' ' ||
        COALESCE(objective, '') || ' ' ||
        COALESCE(assessment, '') || ' ' ||
        COALESCE(plan, '') || ' ' ||
        COALESCE(evaluation, '')
    )
);

COMMENT ON INDEX idx_encounters_soap_fulltext_norwegian
IS 'Full-text search on SOAP/SOPE notes with Norwegian language support';

-- ============================================================================
-- COMPOUND INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Patient encounters by date range (common query pattern)
CREATE INDEX IF NOT EXISTS idx_encounters_patient_date_range
ON clinical_encounters (patient_id, encounter_date DESC)
INCLUDE (practitioner_id, is_signed, icpc_codes)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_encounters_patient_date_range
IS 'Covering index for patient encounter history with common fields';

-- Organization + date range queries
CREATE INDEX IF NOT EXISTS idx_encounters_org_date_range
ON clinical_encounters (organization_id, encounter_date DESC)
INCLUDE (patient_id, practitioner_id)
WHERE deleted_at IS NULL;

-- Practitioner workload queries
CREATE INDEX IF NOT EXISTS idx_encounters_practitioner_date
ON clinical_encounters (practitioner_id, encounter_date DESC)
INCLUDE (patient_id, is_signed)
WHERE deleted_at IS NULL;

-- Unsigned encounters by practitioner (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_encounters_unsigned_by_practitioner
ON clinical_encounters (practitioner_id, encounter_date DESC)
WHERE is_signed = false AND deleted_at IS NULL;

COMMENT ON INDEX idx_encounters_unsigned_by_practitioner
IS 'Fast lookup for unsigned encounters - practitioner dashboard';

-- ============================================================================
-- JSONB GIN INDEXES ON CLINICAL_ENCOUNTERS
-- ============================================================================

-- Index for examination_data JSONB (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clinical_encounters' AND column_name = 'examination_data'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_encounters_examination_data_gin
        ON clinical_encounters USING gin(examination_data jsonb_path_ops)
        WHERE examination_data IS NOT NULL;

        COMMENT ON INDEX idx_encounters_examination_data_gin
        IS 'GIN index for querying within examination_data JSONB';
    END IF;
END $$;

-- Index for vital_signs JSONB (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clinical_encounters' AND column_name = 'vital_signs'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_encounters_vital_signs_gin
        ON clinical_encounters USING gin(vital_signs jsonb_path_ops)
        WHERE vital_signs IS NOT NULL;
    END IF;
END $$;

-- Index for structured_findings JSONB (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clinical_encounters' AND column_name = 'structured_findings'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_encounters_findings_gin
        ON clinical_encounters USING gin(structured_findings jsonb_path_ops)
        WHERE structured_findings IS NOT NULL;
    END IF;
END $$;

-- Index for metadata JSONB
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clinical_encounters' AND column_name = 'metadata'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_encounters_metadata_gin_ops
        ON clinical_encounters USING gin(metadata jsonb_path_ops)
        WHERE metadata IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- DIAGNOSIS CODE ARRAY INDEXES
-- ============================================================================

-- GIN index for ICPC-2 code searches
CREATE INDEX IF NOT EXISTS idx_encounters_icpc_gin
ON clinical_encounters USING gin(icpc_codes)
WHERE icpc_codes IS NOT NULL AND array_length(icpc_codes, 1) > 0;

-- GIN index for ICD-10 code searches
CREATE INDEX IF NOT EXISTS idx_encounters_icd10_gin
ON clinical_encounters USING gin(icd10_codes)
WHERE icd10_codes IS NOT NULL AND array_length(icd10_codes, 1) > 0;

-- GIN index for treatment codes
CREATE INDEX IF NOT EXISTS idx_encounters_treatment_codes_gin
ON clinical_encounters USING gin(treatment_codes)
WHERE treatment_codes IS NOT NULL AND array_length(treatment_codes, 1) > 0;

-- ============================================================================
-- AUDIT LOG PERFORMANCE INDEXES
-- ============================================================================

-- Fast security investigation queries
CREATE INDEX IF NOT EXISTS idx_audit_security_investigation
ON audit_log (user_id, action_type, created_at DESC)
INCLUDE (ip_address, success, resource_type, resource_id);

-- Patient audit trail (GDPR compliance)
CREATE INDEX IF NOT EXISTS idx_audit_patient_trail
ON audit_log (patient_id, created_at DESC)
INCLUDE (user_id, action_type, data_category)
WHERE patient_id IS NOT NULL;

-- Failed actions by IP (security monitoring)
CREATE INDEX IF NOT EXISTS idx_audit_failed_by_ip
ON audit_log (ip_address, created_at DESC)
WHERE success = false;

-- GDPR relevant actions
CREATE INDEX IF NOT EXISTS idx_audit_gdpr_actions
ON audit_log (created_at DESC)
INCLUDE (user_id, patient_id, action_type, data_category)
WHERE gdpr_relevant = true;

-- ============================================================================
-- CLINICAL ENCOUNTER VERSIONS INDEXES
-- ============================================================================

-- Version history with content
CREATE INDEX IF NOT EXISTS idx_versions_encounter_history
ON clinical_encounter_versions (encounter_id, version_number DESC)
INCLUDE (changed_by, changed_at, change_type, change_reason);

-- Changes by user (for supervision/training)
CREATE INDEX IF NOT EXISTS idx_versions_by_user
ON clinical_encounter_versions (changed_by, changed_at DESC)
INCLUDE (encounter_id, change_type);

-- Amendments tracking
CREATE INDEX IF NOT EXISTS idx_versions_amendments
ON clinical_encounter_versions (amendment_to_version, changed_at DESC)
WHERE amendment_to_version IS NOT NULL;

-- Full-text search on historical content
CREATE INDEX IF NOT EXISTS idx_versions_content_fulltext
ON clinical_encounter_versions USING gin(
    to_tsvector('norwegian',
        COALESCE(subjective, '') || ' ' ||
        COALESCE(objective, '') || ' ' ||
        COALESCE(assessment, '') || ' ' ||
        COALESCE(plan, '')
    )
);

-- ============================================================================
-- APPOINTMENTS PERFORMANCE INDEXES
-- ============================================================================

-- Create indexes only if appointments table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
        -- Calendar view queries
        CREATE INDEX IF NOT EXISTS idx_appointments_calendar
        ON appointments (organization_id, practitioner_id, start_time, end_time)
        WHERE cancelled_at IS NULL;

        -- Patient appointment history
        CREATE INDEX IF NOT EXISTS idx_appointments_patient_history
        ON appointments (patient_id, start_time DESC)
        INCLUDE (practitioner_id, status, appointment_type)
        WHERE cancelled_at IS NULL;

        -- Upcoming appointments (common dashboard query)
        CREATE INDEX IF NOT EXISTS idx_appointments_upcoming
        ON appointments (organization_id, start_time)
        WHERE start_time > CURRENT_TIMESTAMP AND cancelled_at IS NULL;

        -- No-show tracking
        CREATE INDEX IF NOT EXISTS idx_appointments_noshow
        ON appointments (organization_id, start_time)
        WHERE status = 'no_show';
    END IF;
END $$;

-- ============================================================================
-- CLINICAL TEMPLATES PERFORMANCE INDEXES
-- ============================================================================

-- Template search with Norwegian full-text
CREATE INDEX IF NOT EXISTS idx_templates_search_norwegian
ON clinical_templates USING gin(
    to_tsvector('norwegian',
        COALESCE(name, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(template_text, '') || ' ' ||
        COALESCE(content, '')
    )
);

-- Popular templates by category
CREATE INDEX IF NOT EXISTS idx_templates_popular_by_category
ON clinical_templates (template_category, usage_count DESC, quality_score DESC)
WHERE review_status = 'approved' AND is_active = true;

-- User's templates
CREATE INDEX IF NOT EXISTS idx_templates_by_user
ON clinical_templates (created_by, template_category, usage_count DESC)
WHERE is_active = true;

-- ============================================================================
-- VNG/VESTIBULAR PERFORMANCE INDEXES (if tables exist)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vng_test_results') THEN
        -- Patient VNG history
        CREATE INDEX IF NOT EXISTS idx_vng_patient_history
        ON vng_test_results (patient_id, test_date DESC)
        INCLUDE (primary_finding, hints_plus_result);

        -- HINTS+ result queries
        CREATE INDEX IF NOT EXISTS idx_vng_hints_results
        ON vng_test_results (hints_plus_result, test_date DESC)
        WHERE hints_plus_result IS NOT NULL;

        -- Central signs detection
        CREATE INDEX IF NOT EXISTS idx_vng_central_signs
        ON vng_test_results (test_date DESC)
        WHERE central_signs_present = true;
    END IF;
END $$;

-- ============================================================================
-- PARTIAL INDEXES FOR ACTIVE/CURRENT DATA
-- ============================================================================

-- Active patients only
CREATE INDEX IF NOT EXISTS idx_patients_active_search
ON patients (organization_id, last_name, first_name)
WHERE is_active = true AND deleted_at IS NULL;

-- Recent encounters (last 30 days - most frequently accessed)
CREATE INDEX IF NOT EXISTS idx_encounters_last_30_days
ON clinical_encounters (organization_id, patient_id, encounter_date DESC)
WHERE encounter_date > CURRENT_DATE - INTERVAL '30 days' AND deleted_at IS NULL;

-- Encounters needing signature
CREATE INDEX IF NOT EXISTS idx_encounters_needs_signature
ON clinical_encounters (organization_id, practitioner_id, encounter_date DESC)
WHERE is_signed = false AND deleted_at IS NULL;

-- ============================================================================
-- EXPRESSION INDEXES FOR COMPUTED VALUES
-- ============================================================================

-- Lowercase email for case-insensitive login
CREATE INDEX IF NOT EXISTS idx_users_email_lower
ON users (lower(email))
WHERE is_active = true;

-- Normalized phone number search
CREATE INDEX IF NOT EXISTS idx_patients_phone_normalized
ON patients (regexp_replace(phone_number, '[^0-9]', '', 'g'))
WHERE phone_number IS NOT NULL;

-- ============================================================================
-- BRIN INDEXES FOR TIME-SERIES DATA
-- ============================================================================

-- BRIN index for audit log (very large table, append-only)
CREATE INDEX IF NOT EXISTS idx_audit_log_brin
ON audit_log USING brin(created_at)
WITH (pages_per_range = 128);

COMMENT ON INDEX idx_audit_log_brin
IS 'BRIN index for time-based audit log queries - efficient for large tables';

-- BRIN for clinical encounters by date
CREATE INDEX IF NOT EXISTS idx_encounters_date_brin
ON clinical_encounters USING brin(encounter_date)
WITH (pages_per_range = 128);

-- ============================================================================
-- STATISTICS UPDATE
-- ============================================================================

-- Update statistics for query planner
ANALYZE patients;
ANALYZE clinical_encounters;
ANALYZE clinical_encounter_versions;
ANALYZE clinical_templates;
ANALYZE audit_log;
ANALYZE users;

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- Index efficiency report
CREATE OR REPLACE VIEW index_efficiency_report AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE
        WHEN idx_scan = 0 THEN 0
        ELSE ROUND((idx_tup_fetch::numeric / idx_scan), 2)
    END as avg_tuples_per_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC, pg_relation_size(indexrelid) DESC;

COMMENT ON VIEW index_efficiency_report
IS 'Monitor index usage and efficiency';

-- Slow query candidates (tables with sequential scans)
CREATE OR REPLACE VIEW slow_query_candidates AS
SELECT
    schemaname,
    relname as tablename,
    seq_scan as sequential_scans,
    seq_tup_read as seq_tuples_read,
    idx_scan as index_scans,
    idx_tup_fetch as idx_tuples_fetched,
    CASE
        WHEN (seq_scan + idx_scan) = 0 THEN 0
        ELSE ROUND((seq_scan::numeric / (seq_scan + idx_scan) * 100), 2)
    END as seq_scan_percentage,
    pg_size_pretty(pg_relation_size(relid)) as table_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > 100
ORDER BY seq_scan DESC;

COMMENT ON VIEW slow_query_candidates
IS 'Tables with high sequential scan ratio - may need additional indexes';

-- ============================================================================
-- MAINTENANCE FUNCTION: Rebuild bloated indexes
-- ============================================================================

CREATE OR REPLACE FUNCTION rebuild_bloated_indexes(p_threshold_ratio NUMERIC DEFAULT 0.3)
RETURNS TABLE (
    index_name TEXT,
    table_name TEXT,
    bloat_ratio NUMERIC,
    action_taken TEXT
) AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT
            indexrelname,
            relname,
            pg_relation_size(indexrelid) as index_size,
            pg_relation_size(relid) as table_size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND pg_relation_size(indexrelid) > 10000000 -- Only indexes > 10MB
    LOOP
        -- Simplified bloat detection (real bloat detection is more complex)
        IF r.index_size > (r.table_size * 0.5) THEN
            index_name := r.indexrelname;
            table_name := r.relname;
            bloat_ratio := ROUND((r.index_size::numeric / NULLIF(r.table_size, 0)), 2);
            action_taken := 'Recommended: REINDEX INDEX ' || r.indexrelname;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rebuild_bloated_indexes
IS 'Identify potentially bloated indexes that may need rebuilding';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_patients_fulltext_search_norwegian IS 'Full-text patient search with Norwegian dictionary';
COMMENT ON INDEX idx_encounters_soap_fulltext_norwegian IS 'Full-text SOAP notes search with Norwegian dictionary';
COMMENT ON INDEX idx_encounters_patient_date_range IS 'Covering index for patient encounter history';
COMMENT ON INDEX idx_audit_security_investigation IS 'Fast security investigation queries';
COMMENT ON INDEX idx_audit_patient_trail IS 'GDPR compliant patient access trail';

-- ============================================================================
-- GRANT PERMISSIONS (uncomment for production)
-- ============================================================================

-- GRANT SELECT ON index_efficiency_report TO chiroclickcrm_admin;
-- GRANT SELECT ON slow_query_candidates TO chiroclickcrm_admin;
-- GRANT EXECUTE ON FUNCTION rebuild_bloated_indexes TO chiroclickcrm_admin;

COMMENT ON SCHEMA public IS 'ChiroClickCRM v4.3 - Added Performance Indexes (Norwegian Full-Text, Security)';
