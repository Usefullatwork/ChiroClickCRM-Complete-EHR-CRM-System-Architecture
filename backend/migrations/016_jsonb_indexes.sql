/**
 * Migration 016: JSONB Indexes for Performance
 * Add JSONB indexes for searching within structured data
 * Improves search performance for SOAP notes, patient data, and metadata
 */

-- ============================================================================
-- CLINICAL ENCOUNTERS - JSONB Indexes
-- ============================================================================

-- Index for searching within SOAP notes (if using JSONB storage)
-- Note: Currently SOAP notes are in TEXT columns, but if migrated to JSONB:
CREATE INDEX IF NOT EXISTS idx_encounters_soap_jsonb
ON clinical_encounters USING gin(
  (
    to_tsvector('norwegian',
      COALESCE(subjective, '') || ' ' ||
      COALESCE(objective, '') || ' ' ||
      COALESCE(assessment, '') || ' ' ||
      COALESCE(plan, '')
    )
  )
);

-- Index for metadata JSONB column (if exists)
CREATE INDEX IF NOT EXISTS idx_encounters_metadata_gin
ON clinical_encounters USING gin(metadata)
WHERE metadata IS NOT NULL;

-- ============================================================================
-- PATIENTS - JSONB Indexes
-- ============================================================================

-- Index for patient search (name + Norwegian full-text)
CREATE INDEX IF NOT EXISTS idx_patients_fulltext_norwegian
ON patients USING gin(
  to_tsvector('norwegian',
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(address, '') || ' ' ||
    COALESCE(city, '')
  )
);

-- Index for patient metadata (if using JSONB for custom fields)
CREATE INDEX IF NOT EXISTS idx_patients_metadata_gin
ON patients USING gin(metadata)
WHERE metadata IS NOT NULL;

-- Index for red flags (JSONB array)
CREATE INDEX IF NOT EXISTS idx_patients_red_flags
ON patients USING gin(red_flags)
WHERE red_flags IS NOT NULL AND jsonb_array_length(red_flags) > 0;

-- Index for allergies (JSONB array)
CREATE INDEX IF NOT EXISTS idx_patients_allergies
ON patients USING gin(allergies)
WHERE allergies IS NOT NULL AND jsonb_array_length(allergies) > 0;

-- ============================================================================
-- AI FEEDBACK - JSONB Indexes
-- ============================================================================

-- Index for AI suggestion metadata
CREATE INDEX IF NOT EXISTS idx_ai_feedback_metadata_gin
ON ai_feedback USING gin(metadata)
WHERE metadata IS NOT NULL;

-- Index for searching AI suggestions by content
CREATE INDEX IF NOT EXISTS idx_ai_feedback_content
ON ai_feedback USING gin(
  to_tsvector('norwegian',
    COALESCE(original_suggestion, '') || ' ' ||
    COALESCE(user_correction, '')
  )
);

-- ============================================================================
-- AUDIT LOG - JSONB Indexes
-- ============================================================================

-- Index for audit log changes (JSONB)
CREATE INDEX IF NOT EXISTS idx_audit_log_changes_gin
ON audit_log USING gin(changes)
WHERE changes IS NOT NULL;

-- Index for audit log metadata (JSONB)
CREATE INDEX IF NOT EXISTS idx_audit_log_metadata_gin
ON audit_log USING gin(metadata)
WHERE metadata IS NOT NULL;

-- Index for searching audit actions by resource type and ID
CREATE INDEX IF NOT EXISTS idx_audit_log_resource
ON audit_log (resource_type, resource_id)
WHERE resource_type IS NOT NULL AND resource_id IS NOT NULL;

-- Index for audit log by user and date (common query pattern)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_date
ON audit_log (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- ============================================================================
-- CLINICAL TEMPLATES - JSONB Indexes
-- ============================================================================

-- Index for template content (JSONB or text)
CREATE INDEX IF NOT EXISTS idx_templates_content
ON clinical_templates USING gin(
  to_tsvector('norwegian', COALESCE(content, ''))
);

-- Index for template metadata
CREATE INDEX IF NOT EXISTS idx_templates_metadata_gin
ON clinical_templates USING gin(metadata)
WHERE metadata IS NOT NULL;

-- Index for template search by tags (if using JSONB array)
-- CREATE INDEX IF NOT EXISTS idx_templates_tags_gin
-- ON clinical_templates USING gin(tags)
-- WHERE tags IS NOT NULL;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION - Composite Indexes
-- ============================================================================

-- Composite index for common encounter queries
CREATE INDEX IF NOT EXISTS idx_encounters_patient_date
ON clinical_encounters (patient_id, encounter_date DESC)
WHERE deleted_at IS NULL;

-- Composite index for organization + patient queries
CREATE INDEX IF NOT EXISTS idx_encounters_org_patient
ON clinical_encounters (organization_id, patient_id, encounter_date DESC)
WHERE deleted_at IS NULL;

-- Composite index for organization + practitioner queries
CREATE INDEX IF NOT EXISTS idx_encounters_org_practitioner
ON clinical_encounters (organization_id, practitioner_id, encounter_date DESC)
WHERE deleted_at IS NOT NULL;

-- Composite index for signed encounters
CREATE INDEX IF NOT EXISTS idx_encounters_signed
ON clinical_encounters (organization_id, signed_at DESC)
WHERE signed_at IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- APPOINTMENTS - Optimizations
-- ============================================================================

-- Index for appointment search by date range
CREATE INDEX IF NOT EXISTS idx_appointments_date_range
ON appointments (organization_id, start_time, end_time)
WHERE cancelled_at IS NULL;

-- Index for patient appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient
ON appointments (patient_id, start_time DESC)
WHERE cancelled_at IS NULL;

-- Index for practitioner schedule
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner
ON appointments (practitioner_id, start_time)
WHERE cancelled_at IS NULL;

-- ============================================================================
-- FOLLOW-UPS - Optimizations
-- ============================================================================

-- Index for pending follow-ups
CREATE INDEX IF NOT EXISTS idx_followups_pending
ON follow_ups (organization_id, due_date)
WHERE completed_at IS NULL AND cancelled_at IS NULL;

-- Index for patient follow-ups
CREATE INDEX IF NOT EXISTS idx_followups_patient
ON follow_ups (patient_id, due_date DESC)
WHERE deleted_at IS NULL;

-- ============================================================================
-- COMMUNICATIONS - Optimizations
-- ============================================================================

-- Index for recent communications
CREATE INDEX IF NOT EXISTS idx_communications_recent
ON communications (organization_id, sent_at DESC)
WHERE sent_at IS NOT NULL;

-- Index for patient communications
CREATE INDEX IF NOT EXISTS idx_communications_patient
ON communications (patient_id, sent_at DESC);

-- Index for failed communications (retry queue)
CREATE INDEX IF NOT EXISTS idx_communications_failed
ON communications (status, created_at)
WHERE status IN ('failed', 'pending');

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

-- Update statistics for query planner
ANALYZE clinical_encounters;
ANALYZE patients;
ANALYZE audit_log;
ANALYZE ai_feedback;
ANALYZE clinical_templates;
ANALYZE appointments;
ANALYZE follow_ups;
ANALYZE communications;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_encounters_soap_jsonb IS 'Full-text search index for SOAP notes (Norwegian language)';
COMMENT ON INDEX idx_patients_fulltext_norwegian IS 'Full-text search for patient names and addresses';
COMMENT ON INDEX idx_audit_log_changes_gin IS 'GIN index for searching within audit log changes (JSONB)';
COMMENT ON INDEX idx_encounters_patient_date IS 'Composite index for patient encounter history queries';
COMMENT ON INDEX idx_appointments_date_range IS 'Index for appointment calendar queries';

-- ============================================================================
-- MONITORING QUERIES
-- ============================================================================

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- To check index sizes:
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- To check slow queries (requires pg_stat_statements extension):
-- SELECT query, calls, total_time, mean_time, max_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%clinical_encounters%'
-- ORDER BY mean_time DESC
-- LIMIT 20;
