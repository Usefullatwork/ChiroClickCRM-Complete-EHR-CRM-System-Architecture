-- Strategic Enhancements Migration
-- Adds: FHIR API, Telehealth, Advanced Outcomes, Security, Patient Portal
-- Version: 2.0.0
-- Created: 2025-11-20

-- ============================================================================
-- 1. FHIR INTEROPERABILITY (HL7 FHIR R4)
-- ============================================================================

CREATE TABLE fhir_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- FHIR Resource details
  resource_type VARCHAR(50) NOT NULL, -- 'Patient', 'Encounter', 'Observation', 'Appointment', etc.
  resource_id UUID NOT NULL, -- Internal ID (patient_id, encounter_id, etc.)
  fhir_json JSONB NOT NULL, -- Full FHIR resource in JSON format

  -- Versioning
  version_id INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),

  -- Search/indexing
  identifier TEXT, -- External identifier for cross-system lookup
  subject UUID, -- Patient reference

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fhir_resources_org ON fhir_resources(organization_id);
CREATE INDEX idx_fhir_resources_type ON fhir_resources(resource_type);
CREATE INDEX idx_fhir_resources_resource_id ON fhir_resources(resource_id);
CREATE INDEX idx_fhir_resources_identifier ON fhir_resources(identifier);
CREATE INDEX idx_fhir_resources_json ON fhir_resources USING GIN (fhir_json);

-- FHIR Subscriptions for event notifications
CREATE TABLE fhir_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  resource_type VARCHAR(50) NOT NULL,
  criteria TEXT, -- FHIR search criteria
  webhook_url TEXT NOT NULL,
  webhook_headers JSONB,

  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'PAUSED', 'ERROR')),
  last_triggered_at TIMESTAMP,
  error_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. TELEHEALTH INTEGRATION
-- ============================================================================

CREATE TABLE telehealth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Session details
  session_url TEXT, -- Video conference URL
  session_provider VARCHAR(50), -- 'ZOOM', 'TEAMS', 'WHEREBY', 'CUSTOM'
  session_id VARCHAR(255), -- External session ID

  -- Timing
  scheduled_start TIMESTAMP,
  session_started_at TIMESTAMP,
  session_ended_at TIMESTAMP,
  duration_minutes INTEGER,

  -- Quality metrics
  connection_quality VARCHAR(20), -- 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'
  connection_issues TEXT[],

  -- Recording and consent
  recording_url TEXT,
  recording_consent BOOLEAN DEFAULT false,
  recording_deleted_at TIMESTAMP, -- For GDPR compliance

  -- Patient location (for regulatory compliance)
  patient_location JSONB, -- { "city": "Oslo", "country": "Norway" }

  -- Status
  status VARCHAR(20) CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  cancellation_reason TEXT,

  -- Notes
  technical_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_telehealth_sessions_org ON telehealth_sessions(organization_id);
CREATE INDEX idx_telehealth_sessions_patient ON telehealth_sessions(patient_id);
CREATE INDEX idx_telehealth_sessions_practitioner ON telehealth_sessions(practitioner_id);
CREATE INDEX idx_telehealth_sessions_scheduled ON telehealth_sessions(scheduled_start);

-- ============================================================================
-- 3. ADVANCED OUTCOME TRACKING & PREDICTIVE ANALYTICS
-- ============================================================================

CREATE TABLE outcome_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,

  -- Measure details
  measure_type VARCHAR(50) NOT NULL, -- 'NDI', 'OSWESTRY', 'PSFS', 'EQ5D', 'GROC', 'FABQ', 'TAMPA'
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2), -- For percentage calculation

  -- Questionnaire data
  questionnaire_responses JSONB, -- Full questionnaire answers

  -- Collection method
  collection_method VARCHAR(20) CHECK (collection_method IN ('IN_PERSON', 'SMS', 'EMAIL', 'PORTAL', 'PHONE')),

  -- Baseline tracking
  is_baseline BOOLEAN DEFAULT false,
  baseline_measure_id UUID REFERENCES outcome_measures(id),
  baseline_score DECIMAL(5,2),
  change_from_baseline DECIMAL(5,2),
  percent_change DECIMAL(5,2),

  -- Clinical significance
  mcid_threshold DECIMAL(5,2), -- Minimal Clinically Important Difference
  mcid_achieved BOOLEAN,

  -- Follow-up tracking
  days_from_baseline INTEGER,
  visit_number INTEGER,

  -- Metadata
  notes TEXT,
  collected_by UUID REFERENCES users(id),
  collected_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_outcome_measures_patient ON outcome_measures(patient_id);
CREATE INDEX idx_outcome_measures_type ON outcome_measures(measure_type);
CREATE INDEX idx_outcome_measures_baseline ON outcome_measures(is_baseline);
CREATE INDEX idx_outcome_measures_date ON outcome_measures(collected_at);

-- Predictive risk models
CREATE TABLE risk_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Prediction type
  prediction_type VARCHAR(50) NOT NULL, -- 'CHRONICITY_RISK', 'DROPOUT_RISK', 'TREATMENT_RESPONSE', 'RECURRENCE_RISK'

  -- Risk scoring
  risk_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH')),
  confidence_level DECIMAL(3,2), -- Model confidence

  -- Risk factors
  risk_factors JSONB, -- { "age": 0.3, "pain_duration": 0.5, "yellow_flags": 0.7 }
  protective_factors JSONB,

  -- Predictions
  prediction_date DATE NOT NULL,
  predicted_outcome TEXT,
  predicted_timeframe VARCHAR(50), -- '3_MONTHS', '6_MONTHS', '1_YEAR'

  -- Actual outcome (for model validation)
  actual_outcome VARCHAR(50),
  outcome_date DATE,
  prediction_accuracy DECIMAL(3,2),

  -- Model info
  model_version VARCHAR(50),
  model_type VARCHAR(50), -- 'LOGISTIC_REGRESSION', 'RANDOM_FOREST', 'NEURAL_NETWORK'

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_risk_predictions_patient ON risk_predictions(patient_id);
CREATE INDEX idx_risk_predictions_type ON risk_predictions(prediction_type);
CREATE INDEX idx_risk_predictions_date ON risk_predictions(prediction_date);

-- ============================================================================
-- 4. AI-ASSISTED DOCUMENTATION
-- ============================================================================

CREATE TABLE clinical_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,

  -- Suggestion details
  suggestion_type VARCHAR(50) NOT NULL, -- 'DIAGNOSIS', 'TREATMENT', 'ALERT', 'DOCUMENTATION', 'BILLING_CODE'
  suggestion_text TEXT NOT NULL,

  -- AI confidence
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  ai_model VARCHAR(50), -- 'GPT-4', 'CLAUDE', 'OLLAMA_GEMMA'

  -- Supporting evidence
  evidence JSONB, -- References, guidelines, similar cases
  suggestion_data JSONB, -- Structured suggestion (e.g., ICD code, treatment plan)

  -- User interaction
  accepted BOOLEAN,
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMP,
  rejection_reason TEXT,

  -- Feedback for model improvement
  user_feedback VARCHAR(20) CHECK (user_feedback IN ('HELPFUL', 'NOT_HELPFUL', 'PARTIALLY_HELPFUL')),
  feedback_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clinical_suggestions_encounter ON clinical_suggestions(encounter_id);
CREATE INDEX idx_clinical_suggestions_type ON clinical_suggestions(suggestion_type);
CREATE INDEX idx_clinical_suggestions_accepted ON clinical_suggestions(accepted);

-- Clinical documentation quality metrics
CREATE TABLE documentation_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Quality scores
  completeness_score INTEGER CHECK (completeness_score BETWEEN 0 AND 100),
  specificity_score INTEGER CHECK (specificity_score BETWEEN 0 AND 100),
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100), -- Overall

  -- Metrics
  documentation_time_minutes INTEGER,
  signed_within_24h BOOLEAN,
  contains_red_flags BOOLEAN,

  -- Missing elements
  missing_elements TEXT[], -- ['objective_findings', 'treatment_plan', etc.]
  quality_flags TEXT[], -- ['vague_diagnosis', 'incomplete_soap', etc.]

  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doc_quality_encounter ON documentation_quality_metrics(encounter_id);
CREATE INDEX idx_doc_quality_practitioner ON documentation_quality_metrics(practitioner_id);

-- ============================================================================
-- 5. PATIENT PORTAL & ENGAGEMENT
-- ============================================================================

CREATE TABLE patient_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Access credentials
  access_token VARCHAR(255) UNIQUE,
  refresh_token VARCHAR(255),
  token_expires_at TIMESTAMP,

  -- MFA (Multi-Factor Authentication)
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_method VARCHAR(20), -- 'SMS', 'EMAIL', 'TOTP', 'BIOMETRIC'
  mfa_secret TEXT, -- Encrypted TOTP secret
  backup_codes TEXT[], -- Encrypted backup codes

  -- Session management
  last_login_at TIMESTAMP,
  last_login_ip INET,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,

  -- Feature access
  features_enabled TEXT[] DEFAULT ARRAY['VIEW_RECORDS', 'VIEW_APPOINTMENTS', 'MESSAGE', 'FORMS'],

  -- Preferences
  notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": false}',
  language_preference VARCHAR(10) DEFAULT 'nb-NO',

  -- Status
  is_active BOOLEAN DEFAULT true,
  activation_code VARCHAR(100),
  activated_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portal_access_patient ON patient_portal_access(patient_id);
CREATE INDEX idx_portal_access_token ON patient_portal_access(access_token);

-- Patient exercise programs
CREATE TABLE patient_exercise_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  prescribed_by UUID REFERENCES users(id),

  -- Program details
  program_name VARCHAR(100) NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL, -- [{ "name": "Cat-Cow", "sets": 3, "reps": 10, "video_url": "...", "instructions": "..." }]

  -- Schedule
  frequency VARCHAR(50), -- 'DAILY', 'TWICE_DAILY', 'THREE_TIMES_WEEKLY', etc.
  duration_weeks INTEGER,
  start_date DATE,
  end_date DATE,

  -- Compliance tracking
  compliance_tracking BOOLEAN DEFAULT true,
  target_sessions_per_week INTEGER,

  -- Status
  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'COMPLETED', 'DISCONTINUED')),
  discontinuation_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exercise_programs_patient ON patient_exercise_programs(patient_id);
CREATE INDEX idx_exercise_programs_status ON patient_exercise_programs(status);

-- Exercise compliance logs
CREATE TABLE patient_exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES patient_exercise_programs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Exercise details
  exercise_name VARCHAR(100) NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),

  -- Performance
  sets_completed INTEGER,
  reps_completed INTEGER,
  duration_minutes INTEGER,

  -- Patient feedback
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 10),
  pain_during INTEGER CHECK (pain_during BETWEEN 0 AND 10), -- VAS scale
  pain_after INTEGER CHECK (pain_after BETWEEN 0 AND 10),
  notes TEXT,

  -- Location
  performed_at VARCHAR(50), -- 'HOME', 'CLINIC', 'GYM', 'WORK'

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exercise_logs_program ON patient_exercise_logs(program_id);
CREATE INDEX idx_exercise_logs_patient ON patient_exercise_logs(patient_id);
CREATE INDEX idx_exercise_logs_date ON patient_exercise_logs(completed_at);

-- ============================================================================
-- 6. ENHANCED SECURITY & COMPLIANCE
-- ============================================================================

-- Security incidents tracking
CREATE TABLE security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Incident details
  incident_type VARCHAR(50) NOT NULL, -- 'UNAUTHORIZED_ACCESS', 'DATA_BREACH', 'ANOMALY', 'BRUTE_FORCE', 'SQL_INJECTION_ATTEMPT'
  severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

  -- User/source
  user_id UUID REFERENCES users(id),
  source_ip INET,
  user_agent TEXT,

  -- Description
  description TEXT NOT NULL,
  affected_resources TEXT[], -- Resource IDs affected
  affected_patients UUID[], -- Patient IDs affected

  -- Timeline
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,

  -- Actions taken
  actions_taken TEXT[],
  mitigated BOOLEAN DEFAULT false,

  -- Reporting
  reported_to_authorities BOOLEAN DEFAULT false,
  reported_at TIMESTAMP,
  report_reference VARCHAR(100),

  -- Investigation
  investigated_by UUID REFERENCES users(id),
  investigation_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_incidents_org ON security_incidents(organization_id);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_detected ON security_incidents(detected_at);

-- Session management for enhanced security
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Session details
  session_token VARCHAR(255) UNIQUE NOT NULL,
  session_id VARCHAR(255) UNIQUE,

  -- Location and device
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  geolocation POINT, -- PostGIS point (lat, lon)
  city VARCHAR(100),
  country VARCHAR(100),

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  ended_at TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,
  termination_reason VARCHAR(50), -- 'LOGOUT', 'TIMEOUT', 'FORCED', 'SUSPICIOUS'

  -- Risk assessment
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  anomaly_flags TEXT[],

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);

-- ============================================================================
-- 7. ENHANCED AUDIT LOGS (Add columns to existing table)
-- ============================================================================

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS session_id UUID,
  ADD COLUMN IF NOT EXISTS geolocation POINT,
  ADD COLUMN IF NOT EXISTS risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS anomaly_flags TEXT[];

-- ============================================================================
-- 8. DOCUMENTATION TEMPLATES & MACROS
-- ============================================================================

CREATE TABLE documentation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template details
  template_name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- 'SOAP', 'LETTER', 'SICK_LEAVE', 'REFERRAL', 'CONSENT', 'TREATMENT_PLAN'
  category VARCHAR(50), -- 'MUSCULOSKELETAL', 'NEUROLOGICAL', 'GENERAL'

  -- Applicability
  condition_codes TEXT[], -- ICPC-2 codes this applies to
  specialty VARCHAR(50),

  -- Template structure
  template_structure JSONB NOT NULL, -- { "sections": { "subjective": "...", "objective": "..." } }
  variables JSONB, -- { "patient_name": "string", "diagnosis": "icpc2", ... }
  macros JSONB, -- { ".slr": "Positive straight leg raise at 45°...", ... }

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,

  -- Permissions
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false, -- Shared within organization
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doc_templates_org ON documentation_templates(organization_id);
CREATE INDEX idx_doc_templates_type ON documentation_templates(template_type);
CREATE INDEX idx_doc_templates_active ON documentation_templates(is_active);

-- ============================================================================
-- 9. INSURANCE & CLAIMS MANAGEMENT
-- ============================================================================

CREATE TABLE insurance_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Insurance details
  insurance_type VARCHAR(50) NOT NULL, -- 'NAV', 'HELFO', 'PRIVATE', 'INTERNATIONAL'
  insurance_provider VARCHAR(100),
  policy_number VARCHAR(100),

  -- Verification
  verification_date DATE NOT NULL,
  verified_by UUID REFERENCES users(id),
  verification_method VARCHAR(50), -- 'ONLINE', 'PHONE', 'EMAIL', 'FAX'

  -- Coverage status
  coverage_status VARCHAR(20) CHECK (coverage_status IN ('ACTIVE', 'EXPIRED', 'PENDING', 'DENIED')),
  coverage_start_date DATE,
  coverage_end_date DATE,

  -- Benefits
  remaining_visits INTEGER,
  max_visits_per_series INTEGER,
  copay_amount DECIMAL(10,2),
  patient_responsibility_percent DECIMAL(5,2),

  -- Alerts
  expiration_alert_sent BOOLEAN DEFAULT false,
  near_limit_alert_sent BOOLEAN DEFAULT false,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_insurance_verif_patient ON insurance_verifications(patient_id);
CREATE INDEX idx_insurance_verif_status ON insurance_verifications(coverage_status);
CREATE INDEX idx_insurance_verif_expiration ON insurance_verifications(coverage_end_date);

-- ============================================================================
-- 10. BUSINESS INTELLIGENCE METRICS
-- ============================================================================

CREATE TABLE business_intelligence_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Metric details
  metric_date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- 'REVENUE', 'PATIENT_COUNT', 'RETENTION', 'CONVERSION', 'EFFICIENCY'
  metric_category VARCHAR(50), -- 'FINANCIAL', 'CLINICAL', 'OPERATIONAL', 'MARKETING'

  -- Values
  metric_value DECIMAL(12,2) NOT NULL,
  metric_unit VARCHAR(20), -- 'NOK', 'PERCENT', 'COUNT', 'MINUTES'

  -- Comparison
  previous_period_value DECIMAL(12,2),
  change_percent DECIMAL(5,2),
  trend VARCHAR(20) CHECK (trend IN ('IMPROVING', 'DECLINING', 'STABLE')),

  -- Metadata
  metric_metadata JSONB, -- Additional context
  calculation_method TEXT,

  -- Target tracking
  target_value DECIMAL(12,2),
  target_met BOOLEAN,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bi_metrics_org ON business_intelligence_metrics(organization_id);
CREATE INDEX idx_bi_metrics_date ON business_intelligence_metrics(metric_date);
CREATE INDEX idx_bi_metrics_type ON business_intelligence_metrics(metric_type);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_telehealth_sessions_updated_at BEFORE UPDATE ON telehealth_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_portal_access_updated_at BEFORE UPDATE ON patient_portal_access FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_exercise_programs_updated_at BEFORE UPDATE ON patient_exercise_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documentation_templates_updated_at BEFORE UPDATE ON documentation_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_verifications_updated_at BEFORE UPDATE ON insurance_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE fhir_resources IS 'HL7 FHIR R4 resources for interoperability with external systems';
COMMENT ON TABLE telehealth_sessions IS 'Video consultation sessions with quality and compliance tracking';
COMMENT ON TABLE outcome_measures IS 'Validated outcome measures (NDI, Oswestry, PSFS, etc.) with MCID tracking';
COMMENT ON TABLE risk_predictions IS 'ML-based risk predictions for patient outcomes and retention';
COMMENT ON TABLE clinical_suggestions IS 'AI-generated clinical suggestions with acceptance tracking';
COMMENT ON TABLE patient_portal_access IS 'Patient portal authentication and feature access control';
COMMENT ON TABLE security_incidents IS 'Security incident tracking and breach management';
