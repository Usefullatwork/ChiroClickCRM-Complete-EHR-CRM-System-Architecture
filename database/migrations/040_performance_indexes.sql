-- Performance Indexes Migration
-- Adds indexes for all high-traffic query patterns identified in service layer
-- All indexes use IF NOT EXISTS for idempotent re-runs

-- =============================================================================
-- PATIENTS TABLE
-- =============================================================================

-- Multi-tenant: every patient query filters by organization_id
CREATE INDEX IF NOT EXISTS idx_patients_org_id
  ON patients (organization_id);

-- Patient list with status filter + sort by last_name
CREATE INDEX IF NOT EXISTS idx_patients_org_status
  ON patients (organization_id, status);

-- Patient search (ILIKE on name, email, phone, solvit_id)
CREATE INDEX IF NOT EXISTS idx_patients_org_last_name
  ON patients (organization_id, last_name);

CREATE INDEX IF NOT EXISTS idx_patients_org_email
  ON patients (organization_id, email);

-- Follow-up queries filter by last_visit_date
CREATE INDEX IF NOT EXISTS idx_patients_org_last_visit
  ON patients (organization_id, last_visit_date);

-- CRM lifecycle queries
CREATE INDEX IF NOT EXISTS idx_patients_org_lifecycle
  ON patients (organization_id, lifecycle_stage);

-- First visit date for cohort analysis
CREATE INDEX IF NOT EXISTS idx_patients_first_visit
  ON patients (organization_id, first_visit_date);

-- =============================================================================
-- CLINICAL_ENCOUNTERS TABLE
-- =============================================================================

-- Every encounter query joins on patient_id
CREATE INDEX IF NOT EXISTS idx_encounters_patient_id
  ON clinical_encounters (patient_id);

-- Multi-tenant filter
CREATE INDEX IF NOT EXISTS idx_encounters_org_id
  ON clinical_encounters (organization_id);

-- Encounter list: org + patient + date (covering most common query)
CREATE INDEX IF NOT EXISTS idx_encounters_org_patient_date
  ON clinical_encounters (organization_id, patient_id, encounter_date DESC);

-- Practitioner filter
CREATE INDEX IF NOT EXISTS idx_encounters_practitioner
  ON clinical_encounters (practitioner_id);

-- Signed encounter queries
CREATE INDEX IF NOT EXISTS idx_encounters_signed
  ON clinical_encounters (organization_id, signed_at)
  WHERE signed_at IS NOT NULL;

-- =============================================================================
-- APPOINTMENTS TABLE
-- =============================================================================

-- Patient's appointments (JOIN target from patient queries)
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id
  ON appointments (patient_id);

-- Multi-tenant + date range (calendar view)
CREATE INDEX IF NOT EXISTS idx_appointments_org_start
  ON appointments (organization_id, start_time);

-- Practitioner schedule
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner_start
  ON appointments (practitioner_id, start_time);

-- Status filter
CREATE INDEX IF NOT EXISTS idx_appointments_org_status
  ON appointments (organization_id, status);

-- Upcoming appointments (used in patient list aggregation)
CREATE INDEX IF NOT EXISTS idx_appointments_patient_upcoming
  ON appointments (patient_id, start_time)
  WHERE start_time >= NOW();

-- =============================================================================
-- FINANCIAL_METRICS TABLE
-- =============================================================================

-- Patient financial stats (JOIN target)
CREATE INDEX IF NOT EXISTS idx_financial_patient_id
  ON financial_metrics (patient_id);

-- Multi-tenant
CREATE INDEX IF NOT EXISTS idx_financial_org_id
  ON financial_metrics (organization_id);

-- Combined: org + patient (for patient stats query)
CREATE INDEX IF NOT EXISTS idx_financial_org_patient
  ON financial_metrics (organization_id, patient_id);

-- =============================================================================
-- INVOICES TABLE
-- =============================================================================

-- Invoice list with date filter
CREATE INDEX IF NOT EXISTS idx_invoices_org_date
  ON invoices (organization_id, invoice_date DESC);

-- Invoice by patient
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id
  ON invoices (patient_id);

-- Invoice status filter
CREATE INDEX IF NOT EXISTS idx_invoices_org_status
  ON invoices (organization_id, status);

-- Invoice number lookup (for HELFO reports)
CREATE INDEX IF NOT EXISTS idx_invoices_number
  ON invoices (organization_id, invoice_number);

-- =============================================================================
-- INVOICE_PAYMENTS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice
  ON invoice_payments (invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_org
  ON invoice_payments (organization_id);

-- =============================================================================
-- LEADS TABLE (CRM)
-- =============================================================================

-- Lead list with status filter
CREATE INDEX IF NOT EXISTS idx_leads_org_status
  ON leads (organization_id, status);

-- Lead search
CREATE INDEX IF NOT EXISTS idx_leads_org_created
  ON leads (organization_id, created_at DESC);

-- Assigned to filter
CREATE INDEX IF NOT EXISTS idx_leads_assigned
  ON leads (assigned_to)
  WHERE assigned_to IS NOT NULL;

-- =============================================================================
-- LEAD_ACTIVITIES TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead
  ON lead_activities (lead_id, created_at DESC);

-- =============================================================================
-- SESSIONS TABLE
-- =============================================================================

-- Session lookup by user
CREATE INDEX IF NOT EXISTS idx_sessions_user_id
  ON sessions (user_id);

-- Session expiry cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_expires
  ON sessions (expires_at);

-- =============================================================================
-- AUDIT_LOG TABLE
-- =============================================================================

-- Audit log queries by org + timestamp
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created
  ON audit_log (organization_id, created_at DESC);

-- Audit log by patient (GDPR access requests)
CREATE INDEX IF NOT EXISTS idx_audit_log_patient
  ON audit_log (patient_id)
  WHERE patient_id IS NOT NULL;

-- Audit log by user
CREATE INDEX IF NOT EXISTS idx_audit_log_user
  ON audit_log (user_id);

-- =============================================================================
-- FOLLOW_UPS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_followups_patient
  ON follow_ups (patient_id);

CREATE INDEX IF NOT EXISTS idx_followups_org_status
  ON follow_ups (organization_id, status);

-- =============================================================================
-- COMMUNICATIONS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_communications_patient
  ON communications (patient_id);

CREATE INDEX IF NOT EXISTS idx_communications_org
  ON communications (organization_id, created_at DESC);

-- =============================================================================
-- REFERRALS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_referrals_org_status
  ON referrals (organization_id, status);

-- =============================================================================
-- SURVEYS / RESPONSES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_surveys_org
  ON surveys (organization_id);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey
  ON survey_responses (survey_id);

-- =============================================================================
-- CAMPAIGNS / RECIPIENTS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_org
  ON campaigns (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign
  ON campaign_recipients (campaign_id, status);

-- =============================================================================
-- WORKFLOWS / EXECUTIONS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_workflows_org
  ON workflows (organization_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow
  ON workflow_executions (workflow_id, status);

-- =============================================================================
-- WAITLIST TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_waitlist_org_status
  ON waitlist (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_waitlist_patient
  ON waitlist (patient_id);

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_org
  ON notifications (organization_id);

-- Unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id)
  WHERE read_at IS NULL;
