-- ChiroClickCRM: Complete EHR-CRM Database Schema
-- Norwegian-compliant practice management system
-- Version: 1.0
-- Created: 2025-11-18

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE CLINICAL TABLES (EHR)
-- ============================================================================

-- 1. Organizations (Multi-tenant foundation)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  org_number VARCHAR(20), -- Norwegian Orgnummer
  subscription_tier VARCHAR(20) CHECK (subscription_tier IN ('BASIC', 'PRO', 'ENTERPRISE')),

  -- Contact information
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB,

  -- Settings
  settings JSONB DEFAULT '{}',
  timezone VARCHAR(50) DEFAULT 'Europe/Oslo',

  -- Status
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Users (Practitioners and staff)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Authentication (Clerk.com integration)
  clerk_user_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,

  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,

  -- Role and credentials
  role VARCHAR(20) CHECK (role IN ('ADMIN', 'PRACTITIONER', 'ASSISTANT')) NOT NULL,
  password_hash VARCHAR(255),
  hpr_number VARCHAR(20), -- Norwegian Health Personnel Registry

  -- Auth tokens
  email_verified BOOLEAN DEFAULT false,
  email_verify_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,

  -- Professional info
  specializations TEXT[],
  license_valid_until DATE,

  -- Preferences
  preferred_language VARCHAR(5) DEFAULT 'NO',
  notification_preferences JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Patients (Master record)
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- External system integration
  solvit_id VARCHAR(50) UNIQUE NOT NULL, -- External EHR system ID

  -- Personal information (GDPR protected)
  encrypted_personal_number VARCHAR(255), -- Encrypted Norwegian fødselsnummer
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),

  -- Contact information
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB,
  emergency_contact JSONB,

  -- Clinical flags and history
  red_flags TEXT[], -- ['Osteoporosis', 'Anticoagulants', 'Cancer', 'Cardiovascular disease']
  contraindications TEXT[],
  allergies TEXT[],
  current_medications TEXT[],
  medical_history TEXT,

  -- Patient status and category
  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE', 'FINISHED', 'DECEASED')) DEFAULT 'ACTIVE',
  category VARCHAR(30) CHECK (category IN ('OSLO', 'OUTSIDE_OSLO', 'TRAVELING', 'REFERRED')),

  -- Referral tracking
  referral_source VARCHAR(100),
  referring_doctor VARCHAR(255),

  -- Insurance and payment
  insurance_type VARCHAR(50),
  insurance_number VARCHAR(50),
  has_nav_rights BOOLEAN DEFAULT false,

  -- Consent management (GDPR Article 7)
  consent_sms BOOLEAN DEFAULT false,
  consent_email BOOLEAN DEFAULT false,
  consent_data_storage BOOLEAN DEFAULT true,
  consent_marketing BOOLEAN DEFAULT false,
  consent_date TIMESTAMP,
  consent_withdrawn_at TIMESTAMP,

  -- Patient lifecycle
  first_visit_date DATE,
  last_visit_date DATE,
  total_visits INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0,

  -- CRM follow-up tracking
  should_be_followed_up DATE, -- Date when patient should be contacted for follow-up
  main_problem TEXT, -- Primary complaint or diagnosis
  preferred_contact_method VARCHAR(10) CHECK (preferred_contact_method IN ('SMS', 'EMAIL', 'PHONE')),
  needs_feedback BOOLEAN DEFAULT false, -- Flag for patients needing outcome feedback
  preferred_therapist_id UUID REFERENCES users(id), -- Preferred practitioner

  -- Notes
  internal_notes TEXT, -- Staff-only notes

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Clinical Encounters (The actual journal/record)
CREATE TABLE clinical_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Visit metadata
  encounter_date TIMESTAMP NOT NULL,
  encounter_type VARCHAR(20) CHECK (encounter_type IN ('INITIAL', 'FOLLOWUP', 'REEXAM', 'EMERGENCY')) NOT NULL,
  duration_minutes INTEGER DEFAULT 30,

  -- Clinical documentation (SOAP format)
  -- S: Subjective
  subjective JSONB DEFAULT '{}', -- {chief_complaint, history, pain_description, onset, aggravating_factors, relieving_factors}

  -- O: Objective
  objective JSONB DEFAULT '{}',  -- {observation, palpation, ROM, ortho_tests, neuro_tests, posture}

  -- A: Assessment
  assessment JSONB DEFAULT '{}', -- {clinical_reasoning, differential_diagnosis, prognosis, red_flags_checked}

  -- P: Plan
  plan JSONB DEFAULT '{}',       -- {treatment, exercises, advice, follow_up, referrals}

  -- Diagnosis coding (Norwegian standard)
  icpc_codes TEXT[], -- ICPC-2: ['L03', 'L86'] (Primary in Norway)
  icd10_codes TEXT[], -- ICD-10: ['M54.5']

  -- Treatment performed
  treatments JSONB DEFAULT '[]', -- [{type: 'manipulation', region: 'lumbar', technique: 'HVLA', side: 'bilateral'}]

  -- The polished note for external systems (SolvIt, GP letters)
  generated_note TEXT,

  -- Clinical outcome measures
  vas_pain_start INTEGER CHECK (vas_pain_start >= 0 AND vas_pain_start <= 10),
  vas_pain_end INTEGER CHECK (vas_pain_end >= 0 AND vas_pain_end <= 10),

  -- NAV/HELFO tracking (Norwegian insurance)
  nav_series_number INTEGER CHECK (nav_series_number >= 1 AND nav_series_number <= 14),
  nav_diagnosis_date DATE,

  -- Versioning (for legal compliance - journals are immutable after signing)
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  signed_at TIMESTAMP,
  signed_by UUID REFERENCES users(id),

  -- Amendments (if corrections needed after signing)
  amended_from UUID REFERENCES clinical_encounters(id),
  amendment_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Clinical Measurements & Tests
CREATE TABLE clinical_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Orthopedic tests
  ortho_tests JSONB DEFAULT '[]', -- [{name: 'SLR', side: 'left', result: 'positive', angle: 45, notes: ''}]

  -- Neurological tests
  neuro_tests JSONB DEFAULT '{}', -- {reflexes, sensation, motor_strength, coordination}

  -- Range of motion measurements
  rom_measurements JSONB DEFAULT '{}', -- {cervical: {flexion: 45, extension: 30}, lumbar: {...}}

  -- Pain assessment
  pain_location TEXT[], -- ['Lower back', 'Left leg']
  pain_quality TEXT[], -- ['Sharp', 'Radiating', 'Constant']
  pain_intensity INTEGER CHECK (pain_intensity >= 0 AND pain_intensity <= 10),

  -- Functional outcome measures
  outcome_measure_type VARCHAR(50), -- 'OSWESTRY', 'NDI', 'PSFS', 'EQ5D'
  outcome_score DECIMAL(5,2),
  outcome_data JSONB, -- Full questionnaire responses

  -- Postural assessment
  postural_findings JSONB,

  -- Gait analysis
  gait_analysis TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CRM & BUSINESS TABLES
-- ============================================================================

-- 6. Communication History
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Message details
  type VARCHAR(10) CHECK (type IN ('SMS', 'EMAIL', 'PHONE', 'LETTER')) NOT NULL,
  direction VARCHAR(10) CHECK (direction IN ('OUTBOUND', 'INBOUND')) NOT NULL,
  template_id UUID,

  -- Content
  subject VARCHAR(255),
  content TEXT NOT NULL,

  -- Sender/recipient
  sent_by UUID REFERENCES users(id),
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),

  -- Delivery tracking
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,

  -- Response tracking
  response_received BOOLEAN DEFAULT false,
  response_text TEXT,
  resulted_in_booking BOOLEAN DEFAULT false,
  days_to_response INTEGER,

  -- External service tracking
  external_id VARCHAR(100), -- Telnyx message ID, etc.
  cost_amount DECIMAL(10,4), -- Cost per message

  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Appointments & Scheduling
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Scheduling
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  appointment_type VARCHAR(50) NOT NULL, -- 'INITIAL', 'FOLLOWUP', 'MAINTENANCE', 'EMERGENCY'

  -- Status tracking
  status VARCHAR(20) CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED')) DEFAULT 'SCHEDULED',

  -- Cancellation tracking
  cancelled_at TIMESTAMP,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  cancellation_notice_hours INTEGER, -- For analytics

  -- Reminder system
  reminder_sent_at TIMESTAMP,
  reminder_method VARCHAR(10), -- 'SMS', 'EMAIL'
  confirmed_at TIMESTAMP,
  confirmation_method VARCHAR(10),

  -- Recurring appointments
  recurring_pattern VARCHAR(50), -- 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'
  recurring_end_date DATE,
  parent_appointment_id UUID REFERENCES appointments(id),

  -- Notes
  internal_notes TEXT,
  patient_notes TEXT, -- From online booking

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Follow-up Management (Automated CRM tasks)
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,

  -- Task details
  follow_up_type VARCHAR(30) CHECK (follow_up_type IN ('RECALL_3M', 'RECALL_6M', 'BIRTHDAY', 'CHECK_IN', 'INSURANCE_EXPIRING', 'OUTCOME_MEASURE', 'APPOINTMENT', 'CUSTOM')) NOT NULL,
  reason TEXT,
  priority VARCHAR(10) CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')) DEFAULT 'MEDIUM',
  due_date DATE NOT NULL,

  -- Automation
  auto_generated BOOLEAN DEFAULT false,
  trigger_rule VARCHAR(100), -- Description of what triggered this

  -- Assignment
  assigned_to UUID REFERENCES users(id),

  -- Completion tracking
  status VARCHAR(20) CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')) DEFAULT 'PENDING',
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES users(id),

  -- Communication
  communication_sent BOOLEAN DEFAULT false,
  communication_id UUID REFERENCES communications(id),

  -- Notes
  notes TEXT,
  completion_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Financial Metrics & Transactions
CREATE TABLE financial_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

  -- Transaction type
  transaction_type VARCHAR(30) CHECK (transaction_type IN ('VISIT_FEE', 'PACKAGE_PURCHASE', 'PRODUCT_SALE', 'REFUND', 'ADJUSTMENT')),

  -- Service codes (Norwegian system)
  service_codes TEXT[], -- ['L214', 'L215'] - Takster

  -- Financial breakdown
  gross_amount DECIMAL(10,2) NOT NULL,
  insurance_amount DECIMAL(10,2) DEFAULT 0,
  patient_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,

  -- Package tracking
  package_type VARCHAR(50), -- '10_VISIT_PACKAGE', '5_VISIT_PACKAGE'
  package_visits_total INTEGER,
  package_visits_remaining INTEGER,
  package_expires_at DATE,

  -- NAV/HELFO (Norwegian public insurance)
  nav_series_number INTEGER,
  helfo_claim_id VARCHAR(50),
  reimbursement_status VARCHAR(20) CHECK (reimbursement_status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID')),
  reimbursement_amount DECIMAL(10,2),
  reimbursement_date DATE,

  -- Payment tracking
  payment_method VARCHAR(30), -- 'CARD', 'CASH', 'INVOICE', 'VIPPS', 'INSURANCE'
  payment_status VARCHAR(20) CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED')) DEFAULT 'PENDING',
  paid_at TIMESTAMP,

  -- Invoice
  invoice_number VARCHAR(50),
  invoice_sent_at TIMESTAMP,

  -- Notes
  notes TEXT, -- Additional notes for this financial transaction

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. Message Templates (CRM automation)
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template info
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('SMS', 'EMAIL', 'LETTER')) NOT NULL,
  category VARCHAR(50), -- 'RECALL', 'BIRTHDAY', 'FOLLOW_UP', 'REMINDER', 'MARKETING'
  language VARCHAR(5) DEFAULT 'NO',

  -- Content (supports variables like {{patient_name}}, {{last_visit}})
  subject VARCHAR(255), -- For email
  body TEXT NOT NULL,

  -- Variables available
  available_variables TEXT[], -- ['patient_name', 'last_visit', 'practitioner_name']

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2), -- % that result in bookings or responses
  last_used_at TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default template for this category

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CLINICAL REFERENCE TABLES
-- ============================================================================

-- 11. Diagnosis Codes (ICPC-2 & ICD-10)
CREATE TABLE diagnosis_codes (
  code VARCHAR(10) PRIMARY KEY,
  system VARCHAR(10) CHECK (system IN ('ICPC2', 'ICD10')) NOT NULL,
  chapter VARCHAR(5), -- 'L' for Musculoskeletal, 'N' for Neurological

  -- Descriptions
  description_no VARCHAR(255) NOT NULL,
  description_en VARCHAR(255),

  -- Mapping
  icd10_mapping VARCHAR(10), -- For ICPC codes, which ICD-10 code maps
  icpc2_mapping VARCHAR(10), -- For ICD-10 codes, which ICPC-2 code maps

  -- Usage
  commonly_used BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  -- Metadata
  requires_specification BOOLEAN DEFAULT false, -- Needs anatomical location
  valid_from DATE,
  valid_until DATE,

  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Treatment Codes (Norwegian Takster)
CREATE TABLE treatment_codes (
  code VARCHAR(10) PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  description_en VARCHAR(255),

  -- Pricing
  default_price DECIMAL(10,2),
  insurance_reimbursement DECIMAL(10,2),

  -- Scheduling
  default_duration INTEGER, -- minutes

  -- Requirements
  requires_special_training BOOLEAN DEFAULT false,
  certification_required VARCHAR(100),

  -- Restrictions
  max_per_day INTEGER,
  max_per_series INTEGER, -- For NAV series

  -- Usage
  usage_count INTEGER DEFAULT 0,
  commonly_used BOOLEAN DEFAULT false,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- AUDIT & COMPLIANCE TABLES
-- ============================================================================

-- 13. Audit Trail (GDPR Article 30 - Record of processing activities)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Actor
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  user_role VARCHAR(20),

  -- Action
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN'
  resource_type VARCHAR(50) NOT NULL, -- 'PATIENT', 'ENCOUNTER', 'APPOINTMENT'
  resource_id UUID,

  -- Details
  changes JSONB, -- {old_values, new_values}
  reason TEXT, -- For sensitive operations

  -- Technical details
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- 14. GDPR Data Requests
CREATE TABLE gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

  -- Request details
  request_type VARCHAR(30) CHECK (request_type IN ('ACCESS', 'RECTIFICATION', 'ERASURE', 'PORTABILITY', 'RESTRICTION')) NOT NULL,
  requested_by VARCHAR(255), -- Email or name
  request_date DATE NOT NULL,

  -- Processing
  status VARCHAR(20) CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')) DEFAULT 'PENDING',
  assigned_to UUID REFERENCES users(id),
  completed_at TIMESTAMP,

  -- Response
  response_method VARCHAR(20), -- 'EMAIL', 'LETTER', 'IN_PERSON'
  response_sent_at TIMESTAMP,
  response_notes TEXT,

  -- Data export (for portability requests)
  export_file_path TEXT,
  export_generated_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organizations
CREATE INDEX idx_organizations_org_number ON organizations(org_number);

-- Users
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);

-- Patients
CREATE INDEX idx_patients_organization_id ON patients(organization_id);
CREATE INDEX idx_patients_solvit_id ON patients(solvit_id);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_category ON patients(category);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_last_visit ON patients(last_visit_date);
CREATE INDEX idx_patients_should_be_followed_up ON patients(should_be_followed_up) WHERE should_be_followed_up IS NOT NULL;
CREATE INDEX idx_patients_preferred_therapist_id ON patients(preferred_therapist_id);

-- Clinical Encounters
CREATE INDEX idx_encounters_organization_id ON clinical_encounters(organization_id);
CREATE INDEX idx_encounters_patient_id ON clinical_encounters(patient_id);
CREATE INDEX idx_encounters_practitioner_id ON clinical_encounters(practitioner_id);
CREATE INDEX idx_encounters_date ON clinical_encounters(encounter_date);
CREATE INDEX idx_encounters_signed ON clinical_encounters(signed_at);

-- Appointments
CREATE INDEX idx_appointments_organization_id ON appointments(organization_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_practitioner_id ON appointments(practitioner_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Communications
CREATE INDEX idx_communications_organization_id ON communications(organization_id);
CREATE INDEX idx_communications_patient_id ON communications(patient_id);
CREATE INDEX idx_communications_sent_at ON communications(sent_at);
CREATE INDEX idx_communications_type ON communications(type);

-- Follow-ups
CREATE INDEX idx_followups_organization_id ON follow_ups(organization_id);
CREATE INDEX idx_followups_patient_id ON follow_ups(patient_id);
CREATE INDEX idx_followups_due_date ON follow_ups(due_date);
CREATE INDEX idx_followups_status ON follow_ups(status);

-- Financial
CREATE INDEX idx_financial_organization_id ON financial_metrics(organization_id);
CREATE INDEX idx_financial_patient_id ON financial_metrics(patient_id);
CREATE INDEX idx_financial_created_at ON financial_metrics(created_at);

-- Audit logs
CREATE INDEX idx_audit_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinical_encounters_updated_at BEFORE UPDATE ON clinical_encounters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON follow_ups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_metrics_updated_at BEFORE UPDATE ON financial_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Patient statistics update trigger
CREATE OR REPLACE FUNCTION update_patient_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update patient's last visit date and total visits
    UPDATE patients
    SET
        last_visit_date = NEW.encounter_date::DATE,
        total_visits = (SELECT COUNT(*) FROM clinical_encounters WHERE patient_id = NEW.patient_id),
        updated_at = NOW()
    WHERE id = NEW.patient_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_stats_on_encounter
AFTER INSERT ON clinical_encounters
FOR EACH ROW EXECUTE FUNCTION update_patient_statistics();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active patients with recent visit info
CREATE VIEW active_patients_summary AS
SELECT
    p.id,
    p.organization_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.status,
    p.category,
    p.total_visits,
    p.last_visit_date,
    p.lifetime_value,
    EXTRACT(DAY FROM NOW() - p.last_visit_date) as days_since_last_visit,
    u.first_name || ' ' || u.last_name as last_practitioner
FROM patients p
LEFT JOIN clinical_encounters ce ON ce.patient_id = p.id AND ce.encounter_date = (
    SELECT MAX(encounter_date) FROM clinical_encounters WHERE patient_id = p.id
)
LEFT JOIN users u ON u.id = ce.practitioner_id
WHERE p.status = 'ACTIVE';

-- Upcoming appointments with patient info
CREATE VIEW upcoming_appointments_view AS
SELECT
    a.id,
    a.organization_id,
    a.start_time,
    a.end_time,
    a.appointment_type,
    a.status,
    p.first_name || ' ' || p.last_name as patient_name,
    p.phone as patient_phone,
    p.email as patient_email,
    u.first_name || ' ' || u.last_name as practitioner_name,
    a.confirmed_at IS NOT NULL as is_confirmed
FROM appointments a
JOIN patients p ON p.id = a.patient_id
JOIN users u ON u.id = a.practitioner_id
WHERE a.start_time >= NOW()
  AND a.status IN ('SCHEDULED', 'CONFIRMED')
ORDER BY a.start_time;

-- ============================================================================
-- SEED DATA - Common diagnosis codes
-- ============================================================================

-- Insert common ICPC-2 codes for chiropractic practice
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, icd10_mapping, commonly_used) VALUES
('L01', 'ICPC2', 'L', 'Nakke symptom/plage', 'Neck symptom/complaint', 'M54.2', true),
('L02', 'ICPC2', 'L', 'Rygg symptom/plage', 'Back symptom/complaint', 'M54.9', true),
('L03', 'ICPC2', 'L', 'Korsrygg symptom/plage', 'Low back symptom/complaint', 'M54.5', true),
('L08', 'ICPC2', 'L', 'Skulder symptom/plage', 'Shoulder symptom/complaint', 'M75.9', true),
('L86', 'ICPC2', 'L', 'Ryggkveise', 'Back sprain/strain', 'S13.4', true),
('L84', 'ICPC2', 'L', 'Rygg syndrom u/radikulopati', 'Back syndrome without radiculopathy', 'M54.9', true),
('L85', 'ICPC2', 'L', 'Nervrotaffeksjon', 'Nerve root syndrome', 'M54.1', true),
('L14', 'ICPC2', 'L', 'Smerter i ben/lår', 'Leg/thigh symptom/complaint', 'M79.6', true),
('L92', 'ICPC2', 'L', 'Skulder syndrom', 'Shoulder syndrome', 'M75.9', true),
('N01', 'ICPC2', 'N', 'Hodepine', 'Headache', 'R51', true),
('N89', 'ICPC2', 'N', 'Migrene', 'Migraine', 'G43.9', true);

-- Insert corresponding ICD-10 codes
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, icpc2_mapping, commonly_used) VALUES
('M54.2', 'ICD10', 'M', 'Cervikalgi', 'Cervicalgia', 'L01', true),
('M54.5', 'ICD10', 'M', 'Korsryggsmerter', 'Low back pain', 'L03', true),
('M54.9', 'ICD10', 'M', 'Ryggsmerter uspesifisert', 'Dorsalgia, unspecified', 'L02', true),
('M75.9', 'ICD10', 'M', 'Skulderlidelse uspesifisert', 'Shoulder lesion, unspecified', 'L08', true),
('S13.4', 'ICD10', 'S', 'Distorsjon i nakke', 'Sprain and strain of cervical spine', 'L86', true),
('M54.1', 'ICD10', 'M', 'Radikulopati', 'Radiculopathy', 'L85', true),
('G43.9', 'ICD10', 'G', 'Migrene uspesifisert', 'Migraine, unspecified', 'N89', true),
('R51', 'ICD10', 'R', 'Hodepine', 'Headache', 'N01', true);

-- ============================================================================
-- SEED DATA - Norwegian treatment codes (Takster)
-- ============================================================================

INSERT INTO treatment_codes (code, description, description_en, default_price, insurance_reimbursement, default_duration, commonly_used) VALUES
('L214', 'Konsultasjon kiropraktor første', 'Initial chiropractic consultation', 990.00, 491.00, 45, true),
('L215', 'Konsultasjon kiropraktor ny', 'Follow-up chiropractic consultation', 750.00, 371.00, 30, true),
('L216', 'Undersøkelse og enkel behandling', 'Examination and simple treatment', 550.00, 0, 20, true),
('L217', 'Undersøkelse kompleks', 'Complex examination', 1200.00, 491.00, 60, false);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE organizations IS 'Multi-tenant foundation - each clinic/practice';
COMMENT ON TABLE users IS 'Practitioners and staff with role-based access';
COMMENT ON TABLE patients IS 'Master patient record with GDPR compliance';
COMMENT ON TABLE clinical_encounters IS 'SOAP notes and clinical documentation (immutable after signing)';
COMMENT ON TABLE clinical_measurements IS 'Detailed test results and outcome measures';
COMMENT ON TABLE communications IS 'All patient communications with delivery tracking';
COMMENT ON TABLE appointments IS 'Scheduling with recurring appointment support';
COMMENT ON TABLE follow_ups IS 'CRM tasks and automated recalls';
COMMENT ON TABLE financial_metrics IS 'Transaction tracking with Norwegian insurance integration';
COMMENT ON TABLE message_templates IS 'Reusable templates for patient communications';
COMMENT ON TABLE diagnosis_codes IS 'ICPC-2 and ICD-10 reference data';
COMMENT ON TABLE treatment_codes IS 'Norwegian treatment codes (Takster)';
COMMENT ON TABLE audit_logs IS 'Complete audit trail for GDPR Article 30 compliance';
COMMENT ON TABLE gdpr_requests IS 'Patient data requests (access, erasure, portability)';

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Grant permissions (adjust as needed for your deployment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chiroclickcrm_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chiroclickcrm_app;

-- ============================================================================
-- SPINE TEXT TEMPLATES (Quick-Click Palpation Documentation)
-- ============================================================================

-- Spine text templates for quick palpation documentation
CREATE TABLE spine_text_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  segment VARCHAR(10) NOT NULL,           -- C0, C1, C2, T1, L5, SI-L, SI-R, etc.
  direction VARCHAR(20) NOT NULL,         -- left, right, bilateral, posterior, anterior, superior, inferior
  finding_type VARCHAR(30) DEFAULT 'palpation', -- palpation, restriction, subluxation, adjustment
  text_template TEXT NOT NULL,            -- The text to insert
  language VARCHAR(5) DEFAULT 'NO',       -- NO, EN
  is_default BOOLEAN DEFAULT false,       -- System default vs user custom
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, segment, direction, finding_type, language)
);

-- Index for quick lookups
CREATE INDEX idx_spine_templates_org ON spine_text_templates(organization_id);
CREATE INDEX idx_spine_templates_segment ON spine_text_templates(segment);
CREATE INDEX idx_spine_templates_default ON spine_text_templates(is_default) WHERE is_default = true;

-- Update timestamp trigger
CREATE TRIGGER update_spine_text_templates_updated_at
  BEFORE UPDATE ON spine_text_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE spine_text_templates IS 'Pre-programmed text templates for quick spine palpation documentation';

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON SCHEMA public IS 'ChiroClickCRM v1.0 - Complete EHR-CRM Schema - Norwegian-compliant';
