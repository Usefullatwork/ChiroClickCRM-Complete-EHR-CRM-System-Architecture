-- Migration: Smart Communication Scheduler
-- Appointment-aware automation with conflict detection and user confirmation

-- Scheduled communications (texts/emails planned to go out)
CREATE TABLE IF NOT EXISTS scheduled_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    patient_id UUID NOT NULL REFERENCES patients(id),

    -- What to send
    communication_type VARCHAR(20) NOT NULL DEFAULT 'sms', -- sms, email
    template_id UUID REFERENCES communication_templates(id),
    custom_message TEXT,

    -- When to send
    scheduled_date DATE NOT NULL,
    scheduled_time TIME DEFAULT '10:00:00',

    -- Why (trigger reason)
    trigger_type VARCHAR(50) NOT NULL, -- follow_up, no_show_check, reactivation, recall, birthday
    trigger_appointment_id UUID REFERENCES appointments(id),
    trigger_days_after INT, -- e.g., 21 days after last visit

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, cancelled, rescheduled, conflict

    -- Conflict handling
    conflict_detected_at TIMESTAMPTZ,
    conflict_appointment_id UUID REFERENCES appointments(id), -- The new appointment that caused conflict
    conflict_resolution VARCHAR(30), -- extended, cancelled, sent_anyway, user_cancelled
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,

    -- Tracking
    sent_at TIMESTAMPTZ,
    sent_communication_id UUID REFERENCES communications(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Communication rules (configurable automation triggers)
CREATE TABLE IF NOT EXISTS communication_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Trigger conditions
    trigger_type VARCHAR(50) NOT NULL, -- after_visit, no_visit_in_days, missed_appointment, birthday
    trigger_days INT, -- Days after/before trigger event

    -- Conditions
    condition_no_appointment_scheduled BOOLEAN DEFAULT true, -- Only if no future appointment
    condition_patient_status VARCHAR(50)[], -- active, inactive, etc.
    condition_visit_types VARCHAR(50)[], -- Only for certain visit types

    -- Action
    communication_type VARCHAR(20) NOT NULL DEFAULT 'sms',
    template_id UUID REFERENCES communication_templates(id),
    default_message TEXT,

    -- Conflict behavior
    on_new_appointment VARCHAR(30) DEFAULT 'ask', -- ask, auto_extend, auto_cancel, ignore
    extend_days INT DEFAULT 7, -- How many days to extend when patient returns

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending decisions queue (conflicts needing user approval)
CREATE TABLE IF NOT EXISTS scheduler_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    scheduled_communication_id UUID NOT NULL REFERENCES scheduled_communications(id),
    patient_id UUID NOT NULL REFERENCES patients(id),

    -- The conflict
    decision_type VARCHAR(30) NOT NULL, -- reschedule_conflict, send_confirmation, rule_exception

    -- Context
    original_date DATE NOT NULL,
    suggested_new_date DATE,
    conflict_reason TEXT,
    new_appointment_date DATE,

    -- Decision
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, auto_resolved
    decision VARCHAR(30), -- extend, cancel, send_anyway
    decided_by UUID REFERENCES users(id),
    decided_at TIMESTAMPTZ,
    decision_note TEXT,

    -- Notification
    notified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    priority INT DEFAULT 5 -- 1=urgent, 10=low priority
);

-- Appointment imports (track imported appointment batches)
CREATE TABLE IF NOT EXISTS appointment_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    source VARCHAR(50) NOT NULL, -- solvitjournal, excel, manual
    import_date TIMESTAMPTZ DEFAULT NOW(),

    -- Stats
    total_rows INT,
    appointments_created INT,
    appointments_updated INT,
    patients_created INT,
    errors INT,

    -- Data
    raw_data JSONB, -- Original import data
    error_log JSONB,

    imported_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scheduled_comms_org_status ON scheduled_communications(organization_id, status);
CREATE INDEX idx_scheduled_comms_patient ON scheduled_communications(patient_id);
CREATE INDEX idx_scheduled_comms_date ON scheduled_communications(scheduled_date) WHERE status = 'pending';
CREATE INDEX idx_scheduler_decisions_pending ON scheduler_decisions(organization_id, status) WHERE status = 'pending';
CREATE INDEX idx_comm_rules_org ON communication_rules(organization_id, is_active);

-- Insert default communication rules
INSERT INTO communication_rules (organization_id, name, description, trigger_type, trigger_days, communication_type, default_message, on_new_appointment, extend_days)
SELECT
    o.id,
    '3-ukers oppfølging',
    'Send oppfølgingstekst 3 uker etter besøk hvis pasienten ikke har time',
    'after_visit',
    21,
    'sms',
    'Hei {fornavn}! Det er 3 uker siden sist. Hvordan går det? Book gjerne en ny time på {booking_url} eller ring oss på {telefon}. Mvh {klinikk}',
    'ask',
    7
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM communication_rules cr
    WHERE cr.organization_id = o.id AND cr.trigger_type = 'after_visit'
);

INSERT INTO communication_rules (organization_id, name, description, trigger_type, trigger_days, communication_type, default_message, on_new_appointment, extend_days)
SELECT
    o.id,
    'Reaktivering 3 måneder',
    'Send reaktiveringstekst etter 3 måneder uten besøk',
    'no_visit_in_days',
    90,
    'sms',
    'Hei {fornavn}! Vi har ikke sett deg på en stund. Husk at regelmessig behandling gir best resultat. Book time på {booking_url}. Mvh {klinikk}',
    'auto_cancel',
    0
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM communication_rules cr
    WHERE cr.organization_id = o.id AND cr.trigger_type = 'no_visit_in_days'
);

-- Function to check for conflicts when new appointment is created
CREATE OR REPLACE FUNCTION check_scheduled_communication_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Find any pending scheduled communications for this patient
    -- that are scheduled AFTER this new appointment date
    UPDATE scheduled_communications
    SET
        status = 'conflict',
        conflict_detected_at = NOW(),
        conflict_appointment_id = NEW.id,
        updated_at = NOW()
    WHERE
        patient_id = NEW.patient_id
        AND status = 'pending'
        AND scheduled_date > NEW.appointment_date;

    -- Create decision records for conflicts
    INSERT INTO scheduler_decisions (
        organization_id,
        scheduled_communication_id,
        patient_id,
        decision_type,
        original_date,
        suggested_new_date,
        conflict_reason,
        new_appointment_date,
        status,
        priority
    )
    SELECT
        sc.organization_id,
        sc.id,
        sc.patient_id,
        'reschedule_conflict',
        sc.scheduled_date,
        NEW.appointment_date + (cr.extend_days || ' days')::INTERVAL,
        'Pasienten har booket ny time før planlagt oppfølging',
        NEW.appointment_date,
        'pending',
        3
    FROM scheduled_communications sc
    LEFT JOIN communication_rules cr ON cr.id = (
        SELECT id FROM communication_rules
        WHERE organization_id = sc.organization_id
        AND trigger_type = sc.trigger_type
        LIMIT 1
    )
    WHERE
        sc.patient_id = NEW.patient_id
        AND sc.status = 'conflict'
        AND sc.conflict_appointment_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on appointment creation
DROP TRIGGER IF EXISTS trg_check_comm_conflicts ON appointments;
CREATE TRIGGER trg_check_comm_conflicts
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION check_scheduled_communication_conflicts();

COMMENT ON TABLE scheduled_communications IS 'Planned outgoing communications with appointment-aware scheduling';
COMMENT ON TABLE communication_rules IS 'Configurable rules for automatic communication scheduling';
COMMENT ON TABLE scheduler_decisions IS 'Queue of decisions needing user approval for communication conflicts';
