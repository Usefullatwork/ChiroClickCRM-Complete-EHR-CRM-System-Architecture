-- Performance Indexes for ChiroClickCRM
-- Optimizes common query patterns for Norwegian chiropractic practices

-- ============================================================================
-- PATIENT SEARCH INDEXES
-- ============================================================================

-- Full-text search on patient names (Norwegian language support)
DROP INDEX IF EXISTS idx_patients_fulltext;
CREATE INDEX idx_patients_fulltext ON patients
USING GIN (to_tsvector('norwegian', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));

-- Phone number lookup (common for appointment confirmations)
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_mobile ON patients(mobile) WHERE mobile IS NOT NULL;

-- Email lookup
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email) WHERE email IS NOT NULL;

-- Date of birth (for patient verification)
CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients(date_of_birth);

-- Active patients filter (most queries filter by status)
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(organization_id, status) WHERE status = 'ACTIVE';

-- Recently updated patients
CREATE INDEX IF NOT EXISTS idx_patients_updated ON patients(organization_id, updated_at DESC);

-- ============================================================================
-- CLINICAL ENCOUNTERS INDEXES
-- ============================================================================

-- Patient encounter history (most common query)
DROP INDEX IF EXISTS idx_encounters_patient_date;
CREATE INDEX idx_encounters_patient_date ON clinical_encounters(patient_id, encounter_date DESC);

-- Provider schedule/workload analysis
CREATE INDEX IF NOT EXISTS idx_encounters_provider_date ON clinical_encounters(provider_id, encounter_date DESC);

-- Organization reporting
CREATE INDEX IF NOT EXISTS idx_encounters_org_date ON clinical_encounters(organization_id, encounter_date DESC);

-- Encounter type filtering
CREATE INDEX IF NOT EXISTS idx_encounters_type ON clinical_encounters(encounter_type);

-- Unsigned encounters (requires attention)
CREATE INDEX IF NOT EXISTS idx_encounters_unsigned ON clinical_encounters(organization_id, is_locked)
WHERE is_locked = false OR is_locked IS NULL;

-- Full-text search on SOAP notes
CREATE INDEX IF NOT EXISTS idx_encounters_soap_search ON clinical_encounters
USING GIN (to_tsvector('norwegian',
    COALESCE(subjective, '') || ' ' ||
    COALESCE(objective, '') || ' ' ||
    COALESCE(assessment, '') || ' ' ||
    COALESCE(plan, '')
));

-- ============================================================================
-- APPOINTMENT INDEXES
-- ============================================================================

-- Daily schedule lookup (most common)
CREATE INDEX IF NOT EXISTS idx_appointments_schedule ON appointments(provider_id, appointment_date, start_time);

-- Patient appointment history
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id, appointment_date DESC);

-- Status filtering (upcoming, completed, cancelled)
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status, appointment_date);

-- Availability search
CREATE INDEX IF NOT EXISTS idx_appointments_available ON appointments(provider_id, appointment_date, status)
WHERE status NOT IN ('CANCELLED', 'NO_SHOW');

-- Today's appointments (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_appointments_today ON appointments(organization_id, appointment_date)
WHERE appointment_date = CURRENT_DATE;

-- ============================================================================
-- COMMUNICATION INDEXES
-- ============================================================================

-- Patient communication history
CREATE INDEX IF NOT EXISTS idx_communications_patient ON communications(patient_id, sent_at DESC);

-- Unsent/pending messages
CREATE INDEX IF NOT EXISTS idx_communications_pending ON communications(organization_id, status, scheduled_at)
WHERE status = 'PENDING';

-- Communication type filtering
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(communication_type);

-- ============================================================================
-- DIAGNOSIS INDEXES
-- ============================================================================

-- ICD-10 code lookup
CREATE INDEX IF NOT EXISTS idx_diagnoses_icd10 ON diagnoses(icd10_code);

-- ICPC-2 code lookup (Norwegian primary care)
CREATE INDEX IF NOT EXISTS idx_diagnoses_icpc2 ON diagnoses(icpc2_code) WHERE icpc2_code IS NOT NULL;

-- Patient diagnosis history
CREATE INDEX IF NOT EXISTS idx_diagnoses_patient ON diagnoses(patient_id, created_at DESC);

-- Active diagnoses
CREATE INDEX IF NOT EXISTS idx_diagnoses_active ON diagnoses(patient_id, status)
WHERE status = 'ACTIVE';

-- ============================================================================
-- TREATMENT INDEXES
-- ============================================================================

-- Patient treatment history
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatments(patient_id, treatment_date DESC);

-- Treatment type analysis
CREATE INDEX IF NOT EXISTS idx_treatments_type ON treatments(treatment_type);

-- Provider treatment analysis
CREATE INDEX IF NOT EXISTS idx_treatments_provider ON treatments(provider_id, treatment_date DESC);

-- ============================================================================
-- FINANCIAL INDEXES
-- ============================================================================

-- Invoice lookup by patient
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id, invoice_date DESC);

-- Unpaid invoices
CREATE INDEX IF NOT EXISTS idx_invoices_unpaid ON invoices(organization_id, status, due_date)
WHERE status IN ('PENDING', 'OVERDUE');

-- Payment reconciliation
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);

-- ============================================================================
-- FOLLOW-UP INDEXES
-- ============================================================================

-- Due follow-ups (daily task list)
CREATE INDEX IF NOT EXISTS idx_followups_due ON follow_ups(organization_id, due_date, status)
WHERE status = 'PENDING';

-- Patient follow-up history
CREATE INDEX IF NOT EXISTS idx_followups_patient ON follow_ups(patient_id, due_date DESC);

-- ============================================================================
-- AUDIT LOG INDEXES
-- ============================================================================

-- Audit by user (compliance queries)
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at DESC);

-- Audit by patient (data access history)
CREATE INDEX IF NOT EXISTS idx_audit_patient ON audit_logs(patient_id, created_at DESC);

-- Audit by action type
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type, created_at DESC);

-- ============================================================================
-- OUTCOME MEASURES INDEXES
-- ============================================================================

-- Patient outcome tracking
CREATE INDEX IF NOT EXISTS idx_outcomes_patient ON outcome_measures(patient_id, measure_date DESC);

-- Measure type analysis
CREATE INDEX IF NOT EXISTS idx_outcomes_type ON outcome_measures(measure_type);

-- ============================================================================
-- TEMPLATE INDEXES
-- ============================================================================

-- Template search by category
CREATE INDEX IF NOT EXISTS idx_templates_category_search ON clinical_templates(organization_id, category, subcategory);

-- Most used templates
CREATE INDEX IF NOT EXISTS idx_templates_usage ON clinical_templates(organization_id, usage_count DESC);

-- ============================================================================
-- PARTIAL INDEXES FOR SOFT DELETES
-- ============================================================================

-- Only index non-deleted records for common tables
CREATE INDEX IF NOT EXISTS idx_patients_not_deleted ON patients(organization_id)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_not_deleted ON appointments(organization_id, appointment_date)
WHERE deleted_at IS NULL;

-- ============================================================================
-- COMPOSITE INDEXES FOR MULTI-TENANT QUERIES
-- ============================================================================

-- All major tables should have organization_id as leading column for multi-tenant isolation
CREATE INDEX IF NOT EXISTS idx_patients_org_name ON patients(organization_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_encounters_org_patient ON clinical_encounters(organization_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org_provider ON appointments(organization_id, provider_id, appointment_date);

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

-- Update statistics for query planner
ANALYZE patients;
ANALYZE clinical_encounters;
ANALYZE appointments;
ANALYZE communications;
ANALYZE diagnoses;
ANALYZE treatments;
ANALYZE follow_ups;
ANALYZE clinical_templates;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_patients_fulltext IS 'Norwegian full-text search on patient names';
COMMENT ON INDEX idx_encounters_patient_date IS 'Optimized for patient encounter history lookup';
COMMENT ON INDEX idx_appointments_schedule IS 'Daily schedule lookup by provider';
