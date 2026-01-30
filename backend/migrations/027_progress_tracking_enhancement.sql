-- Progress Tracking Enhancement Migration
-- Adds additional fields for better progress tracking and compliance analytics
-- Norwegian healthcare compliance (Pasientjournalloven)

-- ============================================================================
-- ADD HOLD_SECONDS_COMPLETED TO EXERCISE_PROGRESS
-- ============================================================================

-- Add hold_seconds_completed column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'exercise_progress'
        AND column_name = 'hold_seconds_completed'
    ) THEN
        ALTER TABLE exercise_progress ADD COLUMN hold_seconds_completed INTEGER;
    END IF;
END
$$;

-- ============================================================================
-- PATIENT EXERCISE LOGS TABLE (Referenced in requirements)
-- Maps to patient_exercise_logs for compliance tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES exercise_prescriptions(id) ON DELETE SET NULL,
    exercise_id UUID REFERENCES exercise_library(id) ON DELETE SET NULL,

    -- Log details
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN DEFAULT false,
    skipped BOOLEAN DEFAULT false,
    skip_reason TEXT,

    -- Metrics
    sets_completed INTEGER DEFAULT 0,
    reps_completed INTEGER DEFAULT 0,
    hold_seconds INTEGER DEFAULT 0,
    duration_minutes INTEGER,

    -- Feedback
    pain_before INTEGER CHECK (pain_before BETWEEN 0 AND 10),
    pain_after INTEGER CHECK (pain_after BETWEEN 0 AND 10),
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    notes TEXT,

    -- Source tracking
    source VARCHAR(20) DEFAULT 'portal', -- 'portal', 'clinician', 'app', 'sms'
    logged_by UUID REFERENCES users(id),

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one log per exercise per day per patient
    UNIQUE(patient_id, exercise_id, log_date)
);

-- ============================================================================
-- DAILY COMPLIANCE SUMMARY VIEW
-- Pre-aggregated view for faster compliance queries
-- ============================================================================

CREATE OR REPLACE VIEW daily_compliance_summary AS
SELECT
    pr.organization_id,
    ep.patient_id,
    DATE(ep.completed_at) as log_date,
    pr.id as prescription_id,
    COUNT(DISTINCT ep.exercise_id) as exercises_completed,
    (SELECT COUNT(*) FROM prescribed_exercises pe WHERE pe.prescription_id = pr.id) as total_prescribed,
    AVG(ep.pain_rating) as avg_pain,
    AVG(ep.difficulty_rating) as avg_difficulty,
    SUM(ep.sets_completed) as total_sets,
    SUM(ep.reps_completed) as total_reps
FROM exercise_progress ep
JOIN exercise_prescriptions pr ON pr.id = ep.prescription_id
GROUP BY pr.organization_id, ep.patient_id, DATE(ep.completed_at), pr.id;

-- ============================================================================
-- INDEXES FOR PROGRESS TRACKING
-- ============================================================================

-- Patient exercise logs indexes
CREATE INDEX IF NOT EXISTS idx_exercise_logs_patient_date ON patient_exercise_logs(patient_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_org_date ON patient_exercise_logs(organization_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_prescription ON patient_exercise_logs(prescription_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_completed ON patient_exercise_logs(patient_id, log_date) WHERE completed = true;

-- Additional indexes for progress tracking service queries
CREATE INDEX IF NOT EXISTS idx_progress_patient_date ON exercise_progress(patient_id, DATE(completed_at));
CREATE INDEX IF NOT EXISTS idx_progress_prescription_date ON exercise_progress(prescription_id, DATE(completed_at));
CREATE INDEX IF NOT EXISTS idx_progress_pain ON exercise_progress(patient_id, completed_at) WHERE pain_rating IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for patient_exercise_logs
CREATE OR REPLACE FUNCTION update_exercise_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_exercise_log_timestamp ON patient_exercise_logs;
CREATE TRIGGER trigger_exercise_log_timestamp
BEFORE UPDATE ON patient_exercise_logs
FOR EACH ROW
EXECUTE FUNCTION update_exercise_log_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE patient_exercise_logs IS 'Daily exercise completion logs for compliance tracking';
COMMENT ON VIEW daily_compliance_summary IS 'Pre-aggregated daily compliance data for faster analytics';
COMMENT ON COLUMN exercise_progress.hold_seconds_completed IS 'Duration in seconds the patient held the exercise position';
