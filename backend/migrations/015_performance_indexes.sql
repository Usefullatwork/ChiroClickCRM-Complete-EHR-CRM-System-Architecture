-- Migration 015: Performance Optimization Indexes
-- Comprehensive indexing strategy for optimal query performance
-- CRITICAL for production deployment

-- ============================================================================
-- PATIENTS TABLE INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_birth_date ON patients(birth_date);

-- Full-text search on patient names
CREATE INDEX IF NOT EXISTS idx_patients_name_gin ON patients USING gin(
  to_tsvector('norwegian', COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
);

-- Composite index for active patient searches
CREATE INDEX IF NOT EXISTS idx_patients_active_created ON patients(is_active, created_at DESC)
  WHERE is_active = true;

COMMENT ON INDEX idx_patients_name_gin IS 'Full-text search for patient names in Norwegian';

-- ============================================================================
-- CLINICAL ENCOUNTERS INDEXES
-- ============================================================================

-- Primary foreign keys (if not already indexed)
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON clinical_encounters(patient_id, encounter_date DESC);
CREATE INDEX IF NOT EXISTS idx_encounters_practitioner ON clinical_encounters(practitioner_id, encounter_date DESC);
CREATE INDEX IF NOT EXISTS idx_encounters_date ON clinical_encounters(encounter_date DESC);

-- Composite for common queries
CREATE INDEX IF NOT EXISTS idx_encounters_patient_date ON clinical_encounters(patient_id, encounter_date DESC);

-- Signed/unsigned encounters
CREATE INDEX IF NOT EXISTS idx_encounters_signed ON clinical_encounters(is_signed, signed_at)
  WHERE is_signed = true;

CREATE INDEX IF NOT EXISTS idx_encounters_unsigned ON clinical_encounters(practitioner_id)
  WHERE is_signed = false;

-- ICPC/ICD-10 code searches (using GIN for array searches)
CREATE INDEX IF NOT EXISTS idx_encounters_icpc_codes ON clinical_encounters USING gin(icpc_codes)
  WHERE icpc_codes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_encounters_icd10_codes ON clinical_encounters USING gin(icd10_codes)
  WHERE icd10_codes IS NOT NULL;

-- Full-text search on clinical content
CREATE INDEX IF NOT EXISTS idx_encounters_content_gin ON clinical_encounters USING gin(
  to_tsvector('norwegian',
    COALESCE(subjective, '') || ' ' ||
    COALESCE(objective, '') || ' ' ||
    COALESCE(assessment, '') || ' ' ||
    COALESCE(plan, '')
  )
);

COMMENT ON INDEX idx_encounters_content_gin IS 'Full-text search across all SOAP fields in Norwegian';

-- ============================================================================
-- CLINICAL TEMPLATES INDEXES
-- ============================================================================

-- Already have: template_category, created_by
-- Add:
CREATE INDEX IF NOT EXISTS idx_templates_category_quality ON clinical_templates(template_category, quality_score DESC)
  WHERE review_status = 'approved';

-- Full-text search on template content
CREATE INDEX IF NOT EXISTS idx_templates_content_gin ON clinical_templates USING gin(
  to_tsvector('norwegian', template_text)
);

-- Popular templates
CREATE INDEX IF NOT EXISTS idx_templates_usage ON clinical_templates(usage_count DESC, quality_score DESC)
  WHERE review_status = 'approved';

-- ============================================================================
-- AI FEEDBACK INDEXES (from migration 012, but ensuring coverage)
-- ============================================================================

-- Performance for analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type_accepted_date ON ai_feedback(
  suggestion_type,
  accepted,
  created_at DESC
);

-- ============================================================================
-- USERS/PRACTITIONERS INDEXES
-- ============================================================================

-- Email login lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE is_active = true;

-- Role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE is_active = true;

-- ============================================================================
-- APPOINTMENTS (if table exists)
-- ============================================================================

-- CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id, appointment_date DESC);
-- CREATE INDEX IF NOT EXISTS idx_appointments_practitioner ON appointments(practitioner_id, appointment_date);
-- CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
-- CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status, appointment_date);

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Recent encounters (last 90 days) - frequently accessed
CREATE INDEX IF NOT EXISTS idx_encounters_recent ON clinical_encounters(patient_id, encounter_date DESC)
  WHERE encounter_date > CURRENT_DATE - INTERVAL '90 days';

-- Templates by popular categories
CREATE INDEX IF NOT EXISTS idx_templates_subjective ON clinical_templates(quality_score DESC)
  WHERE template_category = 'subjective' AND review_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_templates_objective ON clinical_templates(quality_score DESC)
  WHERE template_category = 'objective' AND review_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_templates_assessment ON clinical_templates(quality_score DESC)
  WHERE template_category = 'assessment' AND review_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_templates_plan ON clinical_templates(quality_score DESC)
  WHERE template_category = 'plan' AND review_status = 'approved';

-- ============================================================================
-- COVERING INDEXES (include additional columns to avoid table lookups)
-- ============================================================================

-- Patient lookup with commonly needed fields
CREATE INDEX IF NOT EXISTS idx_patients_lookup_covering ON patients(id)
  INCLUDE (first_name, last_name, phone_number, email, birth_date);

-- Encounter summary covering index
CREATE INDEX IF NOT EXISTS idx_encounters_summary_covering ON clinical_encounters(patient_id, encounter_date DESC)
  INCLUDE (practitioner_id, is_signed, region_treated);

-- ============================================================================
-- STATISTICS UPDATE
-- ============================================================================

-- Analyze all tables to update query planner statistics
ANALYZE patients;
ANALYZE clinical_encounters;
ANALYZE clinical_templates;
ANALYZE ai_feedback;
ANALYZE audit_log;
ANALYZE users;

-- ============================================================================
-- MAINTENANCE COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_patients_name_gin IS 'Enables fast full-text search on patient names - Norwegian optimized';
COMMENT ON INDEX idx_encounters_content_gin IS 'Enables search across all SOAP notes - Norwegian optimized';
COMMENT ON INDEX idx_encounters_recent IS 'Partial index for recent encounters - most frequently queried';
COMMENT ON INDEX idx_templates_content_gin IS 'Enables template content search - Norwegian optimized';

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View to identify missing indexes (requires pg_stat_statements extension)
CREATE OR REPLACE VIEW missing_indexes AS
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1
ORDER BY n_distinct DESC;

COMMENT ON VIEW missing_indexes IS 'Potential candidates for new indexes based on column statistics';

-- View to monitor index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

COMMENT ON VIEW index_usage_stats IS 'Monitor which indexes are actually being used';

-- View to find unused indexes (candidates for removal)
CREATE OR REPLACE VIEW unused_indexes AS
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey' -- Keep primary keys
ORDER BY pg_relation_size(indexrelid) DESC;

COMMENT ON VIEW unused_indexes IS 'Indexes that are never used - consider removing to improve write performance';

-- ============================================================================
-- VACUUM AND ANALYZE SCHEDULE RECOMMENDATIONS
-- ============================================================================

-- For production, set up automatic vacuuming in postgresql.conf:
-- autovacuum = on
-- autovacuum_vacuum_scale_factor = 0.1
-- autovacuum_analyze_scale_factor = 0.05

-- Or create a cron job (requires pg_cron extension):
-- SELECT cron.schedule('vacuum-analyze', '0 3 * * *', 'VACUUM ANALYZE');

COMMENT ON DATABASE CURRENT_DATABASE() IS 'Remember to run VACUUM ANALYZE regularly, especially after bulk imports';
