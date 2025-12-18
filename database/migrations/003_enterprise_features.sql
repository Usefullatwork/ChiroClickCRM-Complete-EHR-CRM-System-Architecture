-- ============================================================================
-- Migration 003: Enterprise Features
--
-- Adds:
-- 1. Row-Level Security (RLS) for multi-tenant isolation
-- 2. Care Episodes (Active vs Maintenance tracking for billing)
-- 3. Claims/Billing table with EDI 837/835 support
-- 4. Session management for authentication
-- 5. Billing modifier logic (AT/GA/GZ for Medicare-style billing)
-- 6. ABN (Advance Beneficiary Notice) tracking
-- ============================================================================

-- Enable RLS on tenant-specific tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- These ensure data isolation between tenants (organizations)
-- The app must SET app.current_tenant before queries
-- ============================================================================

-- Helper function to get current tenant
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Patients RLS
CREATE POLICY patients_tenant_isolation ON patients
  USING (organization_id = current_tenant_id());

CREATE POLICY patients_tenant_insert ON patients
  FOR INSERT WITH CHECK (organization_id = current_tenant_id());

-- Clinical Encounters RLS
CREATE POLICY encounters_tenant_isolation ON clinical_encounters
  USING (organization_id = current_tenant_id());

CREATE POLICY encounters_tenant_insert ON clinical_encounters
  FOR INSERT WITH CHECK (organization_id = current_tenant_id());

-- Appointments RLS
CREATE POLICY appointments_tenant_isolation ON appointments
  USING (organization_id = current_tenant_id());

CREATE POLICY appointments_tenant_insert ON appointments
  FOR INSERT WITH CHECK (organization_id = current_tenant_id());

-- Communications RLS
CREATE POLICY communications_tenant_isolation ON communications
  USING (organization_id = current_tenant_id());

-- Follow-ups RLS
CREATE POLICY followups_tenant_isolation ON follow_ups
  USING (organization_id = current_tenant_id());

-- Financial Metrics RLS
CREATE POLICY financial_tenant_isolation ON financial_metrics
  USING (organization_id = current_tenant_id());

-- Message Templates RLS
CREATE POLICY templates_tenant_isolation ON message_templates
  USING (organization_id = current_tenant_id());

-- Audit Logs RLS (INSERT ONLY - no updates/deletes)
CREATE POLICY audit_tenant_isolation ON audit_logs
  FOR SELECT USING (organization_id = current_tenant_id());

CREATE POLICY audit_insert ON audit_logs
  FOR INSERT WITH CHECK (organization_id = current_tenant_id());

-- Users RLS
CREATE POLICY users_tenant_isolation ON users
  USING (organization_id = current_tenant_id());

-- ============================================================================
-- CARE EPISODES TABLE
-- Tracks active vs maintenance care status (critical for billing)
-- ============================================================================

CREATE TABLE care_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  -- Episode details
  chief_complaint TEXT NOT NULL,
  body_region VARCHAR(50), -- 'CERVICAL', 'THORACIC', 'LUMBAR', 'SACRAL', 'EXTREMITY'
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,

  -- Clinical status (drives billing logic)
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'DISCHARGED', 'INACTIVE')),

  -- For Medicare/Insurance: When did patient reach MMI (Maximum Medical Improvement)?
  mmi_date DATE,
  mmi_determined_by UUID REFERENCES users(id),

  -- Diagnosis at episode start
  primary_diagnosis_icpc VARCHAR(10) REFERENCES diagnosis_codes(code),
  primary_diagnosis_icd10 VARCHAR(10),
  secondary_diagnoses TEXT[],

  -- Treatment plan reference
  initial_visit_frequency VARCHAR(50), -- '3x/week', '2x/week'
  estimated_duration_weeks INTEGER,
  total_visits_planned INTEGER,

  -- Re-evaluation tracking
  last_reeval_date DATE,
  next_reeval_due DATE,
  visits_since_last_reeval INTEGER DEFAULT 0,

  -- Progress notes
  baseline_pain_level INTEGER CHECK (baseline_pain_level >= 0 AND baseline_pain_level <= 10),
  baseline_function_score DECIMAL(5,2), -- ODI/NDI percentage
  current_pain_level INTEGER CHECK (current_pain_level >= 0 AND current_pain_level <= 10),
  current_function_score DECIMAL(5,2),
  improvement_percentage DECIMAL(5,2), -- Calculated

  -- ABN (Advance Beneficiary Notice) for maintenance care
  abn_on_file BOOLEAN DEFAULT false,
  abn_signed_date DATE,
  abn_document_id UUID, -- Reference to document storage

  -- Notes
  clinical_notes TEXT,
  discharge_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on care_episodes
ALTER TABLE care_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY episodes_tenant_isolation ON care_episodes
  USING (organization_id = current_tenant_id());

-- Indexes
CREATE INDEX idx_episodes_organization ON care_episodes(organization_id);
CREATE INDEX idx_episodes_patient ON care_episodes(patient_id);
CREATE INDEX idx_episodes_status ON care_episodes(status);
CREATE INDEX idx_episodes_dates ON care_episodes(start_date, end_date);

-- ============================================================================
-- CLAIMS TABLE (EDI 837/835 Support)
-- Tracks insurance claims through their lifecycle
-- ============================================================================

CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  episode_id UUID REFERENCES care_episodes(id) ON DELETE SET NULL,

  -- Claim identification
  claim_number VARCHAR(50) UNIQUE, -- Internal claim number
  edi_control_number VARCHAR(50), -- EDI 837 ISA control number
  payer_claim_number VARCHAR(50), -- Assigned by payer

  -- Claim type and status
  claim_type VARCHAR(20) DEFAULT 'PROFESSIONAL'
    CHECK (claim_type IN ('PROFESSIONAL', 'INSTITUTIONAL')),
  submission_type VARCHAR(20) DEFAULT 'ORIGINAL'
    CHECK (submission_type IN ('ORIGINAL', 'CORRECTED', 'REPLACEMENT', 'VOID')),

  status VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT',           -- Being prepared
    'READY',           -- Ready for submission
    'SUBMITTED',       -- Sent to clearinghouse
    'ACCEPTED',        -- Acknowledged by payer
    'REJECTED',        -- Rejected by clearinghouse
    'DENIED',          -- Denied by payer
    'PENDING',         -- Awaiting payer decision
    'PAID',            -- Fully paid
    'PARTIAL',         -- Partially paid
    'APPEALED',        -- Under appeal
    'WRITTEN_OFF'      -- Written off
  )),

  -- Service information
  service_date DATE NOT NULL,
  place_of_service VARCHAR(2) DEFAULT '11', -- 11 = Office

  -- Provider information
  rendering_provider_id UUID REFERENCES users(id),
  rendering_npi VARCHAR(10),

  -- Payer information
  payer_name VARCHAR(255),
  payer_id VARCHAR(50), -- Payer ID for EDI
  subscriber_id VARCHAR(50), -- Patient's insurance ID
  group_number VARCHAR(50),

  -- Diagnosis codes (pointers to line items)
  diagnosis_codes JSONB DEFAULT '[]', -- [{sequence: 1, code: "M54.5", type: "ICD10"}]

  -- Line items (procedures)
  line_items JSONB DEFAULT '[]', -- See structure below
  /*
    [{
      line_number: 1,
      cpt_code: "98941",
      modifiers: ["AT", "GP"],
      diagnosis_pointers: [1, 2],
      units: 1,
      charge_amount: 75.00,
      allowed_amount: 50.00,
      paid_amount: 40.00,
      adjustment_amount: 25.00,
      adjustment_reason_codes: ["CO-45"]
    }]
  */

  -- Financial summary
  total_charge DECIMAL(10,2) NOT NULL,
  total_allowed DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  total_adjustment DECIMAL(10,2) DEFAULT 0,
  patient_responsibility DECIMAL(10,2) DEFAULT 0,

  -- Billing modifiers (Critical for Medicare)
  primary_modifier VARCHAR(2), -- 'AT' (Active Treatment), 'GA' (ABN on file), 'GZ' (No ABN)

  -- Submission tracking
  submitted_at TIMESTAMP,
  submitted_by UUID REFERENCES users(id),
  clearinghouse_batch_id VARCHAR(50),

  -- Response tracking (EDI 835)
  response_received_at TIMESTAMP,
  remittance_advice_id VARCHAR(50),
  check_eft_number VARCHAR(50),
  payment_date DATE,

  -- Denial/Rejection handling
  denial_reason_codes TEXT[], -- CARC codes
  denial_notes TEXT,

  -- Appeal tracking
  appeal_deadline DATE,
  appeal_submitted_at TIMESTAMP,
  appeal_notes TEXT,

  -- EDI data storage
  edi_837_data TEXT, -- Raw 837 file content
  edi_835_data TEXT, -- Raw 835 file content

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY claims_tenant_isolation ON claims
  USING (organization_id = current_tenant_id());

-- Indexes
CREATE INDEX idx_claims_organization ON claims(organization_id);
CREATE INDEX idx_claims_patient ON claims(patient_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_service_date ON claims(service_date);
CREATE INDEX idx_claims_payer ON claims(payer_id);

-- ============================================================================
-- SESSION MANAGEMENT (For Lucia Auth / custom auth)
-- ============================================================================

CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session metadata
  expires_at TIMESTAMP NOT NULL,

  -- Security
  ip_address INET,
  user_agent TEXT,

  -- Fresh session flag (for sensitive operations)
  fresh BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BILLING MODIFIER LOGIC FUNCTION
-- Automatically determines the correct modifier based on episode status
-- ============================================================================

CREATE OR REPLACE FUNCTION determine_billing_modifier(
  p_episode_id UUID,
  p_patient_id UUID
) RETURNS VARCHAR(2) AS $$
DECLARE
  v_episode_status VARCHAR(20);
  v_abn_on_file BOOLEAN;
BEGIN
  -- Get episode status and ABN status
  SELECT status, abn_on_file
  INTO v_episode_status, v_abn_on_file
  FROM care_episodes
  WHERE id = p_episode_id;

  -- If no episode found, check patient's most recent episode
  IF v_episode_status IS NULL THEN
    SELECT status, abn_on_file
    INTO v_episode_status, v_abn_on_file
    FROM care_episodes
    WHERE patient_id = p_patient_id
    ORDER BY start_date DESC
    LIMIT 1;
  END IF;

  -- Default to active if no episode
  IF v_episode_status IS NULL THEN
    RETURN 'AT';
  END IF;

  -- Determine modifier based on status
  CASE v_episode_status
    WHEN 'ACTIVE' THEN
      RETURN 'AT'; -- Active Treatment
    WHEN 'MAINTENANCE' THEN
      IF v_abn_on_file THEN
        RETURN 'GA'; -- ABN on file, can bill patient
      ELSE
        RETURN 'GZ'; -- No ABN, expect denial, cannot bill patient
      END IF;
    ELSE
      RETURN 'AT'; -- Default to active
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CPT CODE SUGGESTION FUNCTION
-- Automatically suggests CMT code based on regions treated
-- ============================================================================

CREATE OR REPLACE FUNCTION suggest_cmt_code(
  p_regions_count INTEGER
) RETURNS VARCHAR(5) AS $$
BEGIN
  CASE
    WHEN p_regions_count <= 2 THEN RETURN '98940'; -- 1-2 regions
    WHEN p_regions_count <= 4 THEN RETURN '98941'; -- 3-4 regions
    WHEN p_regions_count >= 5 THEN RETURN '98942'; -- 5 regions
    ELSE RETURN '98940';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTO-SET MODIFIER ON CLAIM INSERT/UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_set_claim_modifier()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-set if modifier is not already specified
  IF NEW.primary_modifier IS NULL THEN
    NEW.primary_modifier := determine_billing_modifier(NEW.episode_id, NEW.patient_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER claims_auto_modifier
BEFORE INSERT OR UPDATE ON claims
FOR EACH ROW
EXECUTE FUNCTION auto_set_claim_modifier();

-- ============================================================================
-- EPISODE IMPROVEMENT CALCULATION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_episode_improvement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.baseline_pain_level > 0 AND NEW.current_pain_level IS NOT NULL THEN
    NEW.improvement_percentage :=
      ((NEW.baseline_pain_level - NEW.current_pain_level)::DECIMAL / NEW.baseline_pain_level) * 100;
  ELSIF NEW.baseline_function_score > 0 AND NEW.current_function_score IS NOT NULL THEN
    NEW.improvement_percentage :=
      ((NEW.baseline_function_score - NEW.current_function_score) / NEW.baseline_function_score) * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER episodes_calc_improvement
BEFORE INSERT OR UPDATE ON care_episodes
FOR EACH ROW
EXECUTE FUNCTION calculate_episode_improvement();

-- ============================================================================
-- LINK ENCOUNTERS TO EPISODES
-- ============================================================================

ALTER TABLE clinical_encounters
ADD COLUMN IF NOT EXISTS episode_id UUID REFERENCES care_episodes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_encounters_episode ON clinical_encounters(episode_id);

-- ============================================================================
-- VIEWS FOR BILLING DASHBOARD
-- ============================================================================

-- Claims summary by status
CREATE OR REPLACE VIEW claims_summary AS
SELECT
  organization_id,
  status,
  COUNT(*) as claim_count,
  SUM(total_charge) as total_charges,
  SUM(total_paid) as total_paid,
  SUM(total_adjustment) as total_adjustments,
  SUM(patient_responsibility) as total_patient_responsibility
FROM claims
GROUP BY organization_id, status;

-- Outstanding claims (need attention)
CREATE OR REPLACE VIEW outstanding_claims AS
SELECT
  c.*,
  p.first_name || ' ' || p.last_name as patient_name,
  EXTRACT(DAY FROM NOW() - c.submitted_at) as days_outstanding
FROM claims c
JOIN patients p ON p.id = c.patient_id
WHERE c.status IN ('SUBMITTED', 'PENDING', 'PARTIAL')
  AND c.submitted_at < NOW() - INTERVAL '30 days';

-- Episodes needing re-evaluation
CREATE OR REPLACE VIEW episodes_needing_reeval AS
SELECT
  e.*,
  p.first_name || ' ' || p.last_name as patient_name,
  p.phone as patient_phone
FROM care_episodes e
JOIN patients p ON p.id = e.patient_id
WHERE e.status = 'ACTIVE'
  AND (
    e.next_reeval_due <= CURRENT_DATE
    OR e.visits_since_last_reeval >= 12
  );

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_care_episodes_updated_at
BEFORE UPDATE ON care_episodes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at
BEFORE UPDATE ON claims
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE care_episodes IS 'Tracks care episodes for active vs maintenance billing determination';
COMMENT ON TABLE claims IS 'Insurance claims with EDI 837/835 support and modifier logic';
COMMENT ON TABLE sessions IS 'User session management for authentication';
COMMENT ON FUNCTION determine_billing_modifier IS 'Returns AT/GA/GZ modifier based on episode status and ABN';
COMMENT ON FUNCTION suggest_cmt_code IS 'Suggests CMT code (98940/98941/98942) based on regions treated';
