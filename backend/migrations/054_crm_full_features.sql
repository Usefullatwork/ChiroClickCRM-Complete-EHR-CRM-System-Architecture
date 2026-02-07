-- Migration: Full CRM Feature Set
-- Date: 2026-01-05
-- Features: Lead Management, Patient Lifecycle, Referrals, NPS, Communication Log,
--           Campaign Analytics, Patient Value, Automated Workflows, Retention, Waitlist

-- =============================================================================
-- 1. PATIENT LIFECYCLE & SEGMENTATION
-- =============================================================================

-- Add lifecycle stage to patients
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(30)
    CHECK (lifecycle_stage IN ('NEW', 'ONBOARDING', 'ACTIVE', 'AT_RISK', 'INACTIVE', 'LOST', 'REACTIVATED'))
    DEFAULT 'NEW';

-- Add engagement score (1-100)
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 50 CHECK (engagement_score >= 0 AND engagement_score <= 100);

-- Add VIP status
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;

-- Add patient tags (JSON array for flexibility)
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add last contact date
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP;

-- Add acquisition source
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS acquisition_source VARCHAR(50);

-- Add acquisition campaign
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS acquisition_campaign VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_patients_lifecycle ON patients(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_patients_engagement ON patients(engagement_score);
CREATE INDEX IF NOT EXISTS idx_patients_vip ON patients(is_vip) WHERE is_vip = true;
CREATE INDEX IF NOT EXISTS idx_patients_tags ON patients USING GIN(tags);

-- =============================================================================
-- 2. LEAD MANAGEMENT
-- =============================================================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Contact info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Lead details
    source VARCHAR(50) NOT NULL CHECK (source IN (
        'WEBSITE', 'GOOGLE_ADS', 'FACEBOOK', 'INSTAGRAM', 'REFERRAL',
        'WALK_IN', 'PHONE_CALL', 'EMAIL', 'EVENT', 'PARTNER', 'OTHER'
    )),
    source_detail VARCHAR(255), -- e.g., specific campaign name

    -- Status tracking
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (status IN (
        'NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT_BOOKED',
        'SHOWED', 'CONVERTED', 'LOST', 'NURTURING'
    )),

    -- Lead scoring
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    temperature VARCHAR(10) CHECK (temperature IN ('HOT', 'WARM', 'COLD')),

    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Interest/Notes
    primary_interest VARCHAR(255), -- What they're interested in
    chief_complaint TEXT,
    notes TEXT,

    -- Conversion tracking
    converted_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    converted_at TIMESTAMP,
    lost_reason VARCHAR(255),

    -- Follow-up
    next_follow_up_date TIMESTAMP,
    follow_up_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT leads_contact_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX idx_leads_clinic ON leads(clinic_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_follow_up ON leads(next_follow_up_date) WHERE next_follow_up_date IS NOT NULL;

-- Lead activity log
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'CREATED', 'STATUS_CHANGED', 'NOTE_ADDED', 'CALL_MADE', 'EMAIL_SENT',
        'SMS_SENT', 'APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED',
        'SHOWED', 'NO_SHOW', 'CONVERTED', 'LOST', 'ASSIGNED', 'SCORE_CHANGED'
    )),

    description TEXT,
    old_value VARCHAR(255),
    new_value VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);

-- =============================================================================
-- 3. REFERRAL PROGRAM
-- =============================================================================

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Who referred
    referrer_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    referrer_name VARCHAR(200), -- If not a patient
    referrer_email VARCHAR(255),
    referrer_phone VARCHAR(50),

    -- Who was referred
    referred_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    referred_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    referred_name VARCHAR(200),
    referred_email VARCHAR(255),
    referred_phone VARCHAR(50),

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'CONTACTED', 'BOOKED', 'SHOWED', 'CONVERTED', 'EXPIRED', 'CANCELLED'
    )),

    -- Rewards
    reward_type VARCHAR(30) CHECK (reward_type IN ('DISCOUNT', 'CREDIT', 'GIFT', 'NONE')),
    reward_amount DECIMAL(10,2),
    reward_description VARCHAR(255),
    reward_issued BOOLEAN DEFAULT false,
    reward_issued_at TIMESTAMP,

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    converted_at TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_referrals_clinic ON referrals(clinic_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_patient_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_patient_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Update patient referral count
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS referred_by_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

-- =============================================================================
-- 4. NPS / SATISFACTION SURVEYS
-- =============================================================================

CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    description TEXT,
    survey_type VARCHAR(30) NOT NULL CHECK (survey_type IN (
        'NPS', 'CSAT', 'POST_VISIT', 'TREATMENT_COMPLETE', 'CUSTOM'
    )),

    -- Questions stored as JSON for flexibility
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Settings
    is_active BOOLEAN DEFAULT true,
    auto_send BOOLEAN DEFAULT false,
    send_after_days INTEGER DEFAULT 1, -- Days after visit to send
    send_time TIME DEFAULT '10:00:00',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

    -- NPS specific
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    nps_category VARCHAR(10) CHECK (nps_category IN ('PROMOTER', 'PASSIVE', 'DETRACTOR')),

    -- CSAT specific
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),

    -- All responses as JSON
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Feedback
    feedback_text TEXT,
    would_recommend BOOLEAN,

    -- Follow-up
    requires_follow_up BOOLEAN DEFAULT false,
    follow_up_completed BOOLEAN DEFAULT false,
    follow_up_notes TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'OPENED', 'COMPLETED', 'EXPIRED')),
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_patient ON survey_responses(patient_id);
CREATE INDEX idx_survey_responses_nps ON survey_responses(nps_score) WHERE nps_score IS NOT NULL;
CREATE INDEX idx_survey_responses_follow_up ON survey_responses(requires_follow_up) WHERE requires_follow_up = true;

-- =============================================================================
-- 5. COMMUNICATION HISTORY
-- =============================================================================

CREATE TABLE IF NOT EXISTS communication_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Who
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Staff who sent/received

    -- Communication details
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('SMS', 'EMAIL', 'PHONE', 'IN_PERSON', 'PORTAL', 'WHATSAPP')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),

    -- Content
    subject VARCHAR(255),
    message TEXT,
    template_used VARCHAR(100),

    -- Contact info used
    contact_value VARCHAR(255), -- Phone number or email used

    -- Status
    status VARCHAR(20) DEFAULT 'SENT' CHECK (status IN (
        'PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED',
        'BOUNCED', 'FAILED', 'BLOCKED', 'UNSUBSCRIBED'
    )),

    -- Tracking
    external_id VARCHAR(255), -- ID from SMS/Email provider
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    replied_at TIMESTAMP,

    -- Call specific
    call_duration_seconds INTEGER,
    call_outcome VARCHAR(50),
    call_recording_url VARCHAR(500),

    -- Campaign tracking
    campaign_id UUID,
    campaign_name VARCHAR(200),

    -- Notes
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comm_log_clinic ON communication_log(clinic_id);
CREATE INDEX idx_comm_log_patient ON communication_log(patient_id);
CREATE INDEX idx_comm_log_lead ON communication_log(lead_id);
CREATE INDEX idx_comm_log_channel ON communication_log(channel);
CREATE INDEX idx_comm_log_created ON communication_log(created_at DESC);
CREATE INDEX idx_comm_log_campaign ON communication_log(campaign_id) WHERE campaign_id IS NOT NULL;

-- =============================================================================
-- 6. CAMPAIGN ANALYTICS
-- =============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    description TEXT,

    campaign_type VARCHAR(30) NOT NULL CHECK (campaign_type IN (
        'RECALL', 'REACTIVATION', 'BIRTHDAY', 'WELCOME', 'NEWSLETTER',
        'PROMOTION', 'EVENT', 'REVIEW_REQUEST', 'REFERRAL', 'CUSTOM'
    )),

    -- Channels
    channels JSONB DEFAULT '["SMS"]'::jsonb, -- Array of channels

    -- Targeting
    target_segment JSONB, -- Criteria for patient selection
    target_count INTEGER DEFAULT 0,

    -- Content
    sms_template TEXT,
    email_subject VARCHAR(255),
    email_template TEXT,

    -- Schedule
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'
    )),
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- A/B Testing
    is_ab_test BOOLEAN DEFAULT false,
    ab_variant VARCHAR(1), -- 'A' or 'B'
    ab_parent_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

    -- Stats (updated in real-time)
    stats JSONB DEFAULT '{
        "sent": 0,
        "delivered": 0,
        "opened": 0,
        "clicked": 0,
        "replied": 0,
        "converted": 0,
        "unsubscribed": 0,
        "bounced": 0
    }'::jsonb,

    -- Cost tracking
    cost_per_message DECIMAL(10,4),
    total_cost DECIMAL(10,2),

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_clinic ON campaigns(clinic_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(campaign_type);

-- Campaign recipients tracking
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'REPLIED',
        'CONVERTED', 'BOUNCED', 'FAILED', 'UNSUBSCRIBED', 'SKIPPED'
    )),

    -- Tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    replied_at TIMESTAMP,
    converted_at TIMESTAMP,

    -- Conversion details
    conversion_type VARCHAR(50),
    conversion_value DECIMAL(10,2),

    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_camp_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_camp_recipients_patient ON campaign_recipients(patient_id);
CREATE INDEX idx_camp_recipients_status ON campaign_recipients(status);

-- =============================================================================
-- 7. PATIENT VALUE METRICS
-- =============================================================================

-- Add value metrics to patients
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(12,2) DEFAULT 0;

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0;

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12,2) DEFAULT 0;

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS avg_visit_value DECIMAL(10,2) DEFAULT 0;

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS visit_frequency_days INTEGER; -- Average days between visits

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS last_visit_date DATE;

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS first_visit_date DATE;

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS treatment_completion_rate DECIMAL(5,2); -- Percentage

-- Patient value history (for trending)
CREATE TABLE IF NOT EXISTS patient_value_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    visits INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    engagement_score INTEGER,
    lifecycle_stage VARCHAR(30),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patient_value_patient ON patient_value_history(patient_id);
CREATE INDEX idx_patient_value_period ON patient_value_history(period_start, period_end);

-- =============================================================================
-- 8. AUTOMATED WORKFLOWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Trigger
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN (
        'NEW_PATIENT', 'APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED',
        'APPOINTMENT_CANCELLED', 'APPOINTMENT_NO_SHOW', 'DAYS_SINCE_VISIT',
        'BIRTHDAY', 'LIFECYCLE_CHANGE', 'SURVEY_COMPLETED', 'LEAD_CREATED',
        'REFERRAL_RECEIVED', 'MANUAL'
    )),
    trigger_config JSONB DEFAULT '{}'::jsonb, -- e.g., {"days_since": 30}

    -- Actions (array of action steps)
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    /*
    Example actions:
    [
        {"type": "SEND_SMS", "template": "welcome_sms", "delay_hours": 0},
        {"type": "SEND_EMAIL", "template": "welcome_email", "delay_hours": 24},
        {"type": "CREATE_TASK", "task_type": "CALL", "delay_hours": 72},
        {"type": "UPDATE_PATIENT", "field": "lifecycle_stage", "value": "ONBOARDING"}
    ]
    */

    -- Conditions (when to run)
    conditions JSONB DEFAULT '[]'::jsonb,
    /*
    Example conditions:
    [
        {"field": "lifecycle_stage", "operator": "equals", "value": "NEW"},
        {"field": "preferred_contact_method", "operator": "not_equals", "value": "NO_CONTACT"}
    ]
    */

    -- Settings
    is_active BOOLEAN DEFAULT true,
    max_runs_per_patient INTEGER DEFAULT 1, -- 0 = unlimited

    -- Stats
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflows_clinic ON workflows(clinic_id);
CREATE INDEX idx_workflows_trigger ON workflows(trigger_type);
CREATE INDEX idx_workflows_active ON workflows(is_active) WHERE is_active = true;

-- Workflow execution log
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

    -- Trigger info
    trigger_type VARCHAR(50),
    trigger_data JSONB,

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED'
    )),

    -- Progress
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,

    -- Results
    actions_completed JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_exec_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_exec_patient ON workflow_executions(patient_id);
CREATE INDEX idx_workflow_exec_status ON workflow_executions(status);

-- Scheduled workflow actions (for delayed actions)
CREATE TABLE IF NOT EXISTS workflow_scheduled_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,

    action_type VARCHAR(50) NOT NULL,
    action_config JSONB NOT NULL,

    scheduled_for TIMESTAMP NOT NULL,

    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),

    completed_at TIMESTAMP,
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_actions_time ON workflow_scheduled_actions(scheduled_for) WHERE status = 'PENDING';

-- =============================================================================
-- 9. RETENTION TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS retention_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    snapshot_date DATE NOT NULL,
    period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),

    -- Patient counts by lifecycle
    total_patients INTEGER DEFAULT 0,
    new_patients INTEGER DEFAULT 0,
    active_patients INTEGER DEFAULT 0,
    at_risk_patients INTEGER DEFAULT 0,
    inactive_patients INTEGER DEFAULT 0,
    lost_patients INTEGER DEFAULT 0,
    reactivated_patients INTEGER DEFAULT 0,

    -- Churn metrics
    churned_count INTEGER DEFAULT 0,
    churn_rate DECIMAL(5,2),

    -- Retention metrics
    retention_rate DECIMAL(5,2),

    -- Revenue metrics
    total_revenue DECIMAL(12,2),
    avg_patient_value DECIMAL(10,2),

    -- Visit metrics
    total_visits INTEGER DEFAULT 0,
    avg_visits_per_patient DECIMAL(5,2),

    -- NPS
    avg_nps_score DECIMAL(4,2),
    promoter_count INTEGER DEFAULT 0,
    detractor_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(clinic_id, snapshot_date, period_type)
);

CREATE INDEX idx_retention_clinic_date ON retention_snapshots(clinic_id, snapshot_date DESC);

-- =============================================================================
-- 10. WAITLIST MANAGEMENT
-- =============================================================================

CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Preferences
    preferred_practitioner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    preferred_days JSONB DEFAULT '[]'::jsonb, -- ["MONDAY", "TUESDAY"]
    preferred_time_start TIME,
    preferred_time_end TIME,

    -- Service requested
    service_type VARCHAR(100),
    duration_minutes INTEGER DEFAULT 30,

    -- Priority
    priority VARCHAR(10) DEFAULT 'NORMAL' CHECK (priority IN ('HIGH', 'NORMAL', 'LOW')),

    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'NOTIFIED', 'BOOKED', 'EXPIRED', 'CANCELLED')),

    -- Notification tracking
    last_notified_at TIMESTAMP,
    notification_count INTEGER DEFAULT 0,

    -- Result
    booked_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

    -- Notes
    notes TEXT,

    -- Dates
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,

    UNIQUE(clinic_id, patient_id, status) -- Only one active waitlist entry per patient
);

CREATE INDEX idx_waitlist_clinic ON waitlist(clinic_id);
CREATE INDEX idx_waitlist_patient ON waitlist(patient_id);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_practitioner ON waitlist(preferred_practitioner_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate patient lifecycle stage
CREATE OR REPLACE FUNCTION calculate_lifecycle_stage(
    p_last_visit_date DATE,
    p_total_visits INTEGER,
    p_days_since_last_visit INTEGER
) RETURNS VARCHAR(30) AS $$
BEGIN
    IF p_total_visits = 0 OR p_last_visit_date IS NULL THEN
        RETURN 'NEW';
    ELSIF p_total_visits <= 2 AND p_days_since_last_visit <= 30 THEN
        RETURN 'ONBOARDING';
    ELSIF p_days_since_last_visit <= 42 THEN -- 6 weeks
        RETURN 'ACTIVE';
    ELSIF p_days_since_last_visit <= 90 THEN -- 3 months
        RETURN 'AT_RISK';
    ELSIF p_days_since_last_visit <= 180 THEN -- 6 months
        RETURN 'INACTIVE';
    ELSE
        RETURN 'LOST';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate NPS category
CREATE OR REPLACE FUNCTION calculate_nps_category(score INTEGER) RETURNS VARCHAR(10) AS $$
BEGIN
    IF score >= 9 THEN
        RETURN 'PROMOTER';
    ELSIF score >= 7 THEN
        RETURN 'PASSIVE';
    ELSE
        RETURN 'DETRACTOR';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate NPS category
CREATE OR REPLACE FUNCTION trigger_calculate_nps_category()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nps_score IS NOT NULL THEN
        NEW.nps_category := calculate_nps_category(NEW.nps_score);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS survey_response_nps_trigger ON survey_responses;
CREATE TRIGGER survey_response_nps_trigger
    BEFORE INSERT OR UPDATE ON survey_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_nps_category();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE leads IS 'Potential patients/prospects before conversion';
COMMENT ON TABLE referrals IS 'Patient referral tracking and rewards';
COMMENT ON TABLE surveys IS 'NPS and satisfaction survey definitions';
COMMENT ON TABLE survey_responses IS 'Individual survey responses from patients';
COMMENT ON TABLE communication_log IS 'Complete history of all patient communications';
COMMENT ON TABLE campaigns IS 'Marketing and recall campaign management';
COMMENT ON TABLE workflows IS 'Automated workflow definitions';
COMMENT ON TABLE workflow_executions IS 'Workflow execution history';
COMMENT ON TABLE retention_snapshots IS 'Historical retention metrics for reporting';
COMMENT ON TABLE waitlist IS 'Cancellation waitlist management';
