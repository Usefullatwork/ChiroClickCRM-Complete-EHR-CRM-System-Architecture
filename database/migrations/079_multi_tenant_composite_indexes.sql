-- Migration 079: Multi-tenant composite indexes for org-based queries
-- Improves query performance for organization-scoped date-range lookups

-- Clinical encounters: org + date is the most common query pattern
CREATE INDEX IF NOT EXISTS idx_encounters_org_date
  ON clinical_encounters (organization_id, encounter_date DESC);

-- Appointments: org + date for schedule views
CREATE INDEX IF NOT EXISTS idx_appointments_org_date
  ON appointments (organization_id, start_time DESC);

-- Patients: org + active status for patient lists
CREATE INDEX IF NOT EXISTS idx_patients_org_active
  ON patients (organization_id, is_active)
  WHERE is_active = true;

-- Communications: org + date for message history
CREATE INDEX IF NOT EXISTS idx_communications_org_date
  ON communications (organization_id, created_at DESC);

-- Audit logs: org + date for compliance reporting
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_date
  ON audit_logs (organization_id, created_at DESC);

-- Update statistics for new indexes
ANALYZE clinical_encounters;
ANALYZE appointments;
ANALYZE patients;
ANALYZE communications;
ANALYZE audit_logs;
