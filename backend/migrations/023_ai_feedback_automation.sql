-- Migration: 023_ai_feedback_automation.sql
-- Description: Create AI feedback tables for continuous learning and automation workflows
-- Created: 2026-01-16

-- =====================================================
-- AI FEEDBACK TABLE
-- Stores user feedback on AI suggestions for learning
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Suggestion details
  suggestion_type VARCHAR(50) NOT NULL,
  -- Types: 'soap_subjective', 'soap_objective', 'soap_assessment', 'soap_plan',
  --        'diagnosis_code', 'treatment_suggestion', 'red_flag', 'communication',
  --        'spelling', 'template'

  original_suggestion TEXT NOT NULL,
  user_correction TEXT,
  accepted BOOLEAN NOT NULL DEFAULT false,

  -- Correction classification
  correction_type VARCHAR(20),
  -- Types: 'accepted_as_is', 'minor_edit', 'major_edit', 'rejected', 'ignored'

  -- AI confidence when suggestion was made
  confidence_score DECIMAL(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback_notes TEXT,

  -- Context for learning
  template_id UUID,
  context_data JSONB,

  -- Metrics
  time_to_decision INTEGER, -- milliseconds from display to accept/reject
  session_id VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_feedback_org ON ai_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created ON ai_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_accepted ON ai_feedback(accepted);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(user_rating);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_correction_type ON ai_feedback(correction_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_encounter ON ai_feedback(encounter_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_analytics ON ai_feedback(suggestion_type, created_at, accepted);

-- =====================================================
-- AI DAILY METRICS TABLE
-- Aggregated daily statistics for performance monitoring
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  suggestion_type VARCHAR(50) NOT NULL,

  -- Counts
  total_suggestions INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  modified_count INTEGER DEFAULT 0,
  ignored_count INTEGER DEFAULT 0,

  -- Averages
  avg_confidence DECIMAL(4,3),
  avg_rating DECIMAL(3,2),
  avg_decision_time_ms INTEGER,

  -- Quality metrics
  acceptance_rate DECIMAL(5,2),
  modification_rate DECIMAL(5,2),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint per org/date/type
  UNIQUE(organization_id, date, suggestion_type)
);

CREATE INDEX IF NOT EXISTS idx_ai_metrics_org_date ON ai_daily_metrics(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_type ON ai_daily_metrics(suggestion_type);

-- =====================================================
-- AI RETRAINING EVENTS TABLE
-- Track when model retraining is triggered
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_retraining_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Trigger information
  trigger_type VARCHAR(50) NOT NULL,
  trigger_reason TEXT,
  suggestion_types_affected TEXT[],

  -- Training data info
  training_samples_count INTEGER,
  feedback_samples_used INTEGER,
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,

  -- Model info
  previous_model_version VARCHAR(100),
  new_model_version VARCHAR(100),

  -- Results
  status VARCHAR(20) DEFAULT 'pending',
  test_results JSONB,
  error_message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retraining_org ON ai_retraining_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_retraining_status ON ai_retraining_events(status);
CREATE INDEX IF NOT EXISTS idx_retraining_created ON ai_retraining_events(created_at);

-- =====================================================
-- AI MODEL VERSIONS TABLE
-- Track deployed model versions
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(100) NOT NULL,
  base_model VARCHAR(100),

  -- Model metadata
  training_data_hash VARCHAR(64),
  training_samples_count INTEGER,
  parameters JSONB,

  -- Performance baseline at deployment
  baseline_metrics JSONB,

  -- Status
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,

  -- Deployment info
  deployed_at TIMESTAMP WITH TIME ZONE,
  deployed_by UUID REFERENCES users(id),
  retired_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_versions_org ON ai_model_versions(organization_id);
CREATE INDEX IF NOT EXISTS idx_model_versions_active ON ai_model_versions(is_active);

-- =====================================================
-- COMMUNICATION QUEUE TABLE
-- Queue for bulk communications
-- =====================================================
CREATE TABLE IF NOT EXISTS communication_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Communication details
  communication_type VARCHAR(20) NOT NULL,
  template_id UUID,

  -- Content
  subject TEXT,
  content TEXT NOT NULL,
  personalized_content TEXT,

  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INTEGER DEFAULT 5,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Results
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  external_message_id VARCHAR(255),

  -- Metadata
  batch_id UUID,
  created_by UUID REFERENCES users(id),
  campaign_id UUID,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_queue_org ON communication_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_comm_queue_status ON communication_queue(status);
CREATE INDEX IF NOT EXISTS idx_comm_queue_scheduled ON communication_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_comm_queue_patient ON communication_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_comm_queue_batch ON communication_queue(batch_id);

-- =====================================================
-- AUTOMATION WORKFLOWS TABLE
-- Define automated communication triggers
-- =====================================================
CREATE TABLE IF NOT EXISTS automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Trigger configuration
  trigger_type VARCHAR(50) NOT NULL,
  trigger_config JSONB,

  -- Condition filters
  conditions JSONB,

  -- Actions
  actions JSONB NOT NULL,

  -- Scheduling
  run_at_time TIME,
  run_days INTEGER[],
  timezone VARCHAR(50) DEFAULT 'Europe/Oslo',

  -- Limits
  max_per_day INTEGER DEFAULT 100,
  min_interval_hours INTEGER DEFAULT 24,

  -- Statistics
  total_triggered INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_org ON automation_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_active ON automation_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_trigger ON automation_workflows(trigger_type);

-- =====================================================
-- AUTOMATION EXECUTION LOG
-- Track workflow executions
-- =====================================================
CREATE TABLE IF NOT EXISTS automation_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES automation_workflows(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  -- Trigger info
  trigger_event VARCHAR(100),
  trigger_data JSONB,

  -- Execution results
  status VARCHAR(20) NOT NULL,
  actions_executed JSONB,
  skip_reason TEXT,
  error_message TEXT,

  -- Timestamps
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_log_workflow ON automation_execution_log(workflow_id);
CREATE INDEX IF NOT EXISTS idx_auto_log_patient ON automation_execution_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_auto_log_executed ON automation_execution_log(executed_at);

-- =====================================================
-- FUNCTION: Update daily AI metrics
-- =====================================================
CREATE OR REPLACE FUNCTION update_daily_ai_metrics(target_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_daily_metrics (
    organization_id, date, suggestion_type, total_suggestions,
    accepted_count, rejected_count, modified_count, ignored_count,
    avg_confidence, avg_rating, avg_decision_time_ms,
    acceptance_rate, modification_rate
  )
  SELECT
    organization_id, target_date, suggestion_type,
    COUNT(*) as total_suggestions,
    SUM(CASE WHEN correction_type = 'accepted_as_is' THEN 1 ELSE 0 END) as accepted_count,
    SUM(CASE WHEN correction_type = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
    SUM(CASE WHEN correction_type IN ('minor_edit', 'major_edit') THEN 1 ELSE 0 END) as modified_count,
    SUM(CASE WHEN correction_type = 'ignored' THEN 1 ELSE 0 END) as ignored_count,
    ROUND(AVG(confidence_score)::numeric, 3) as avg_confidence,
    ROUND(AVG(user_rating)::numeric, 2) as avg_rating,
    AVG(time_to_decision)::integer as avg_decision_time_ms,
    ROUND((SUM(CASE WHEN accepted THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0) * 100), 2) as acceptance_rate,
    ROUND((SUM(CASE WHEN correction_type IN ('minor_edit', 'major_edit') THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0) * 100), 2) as modification_rate
  FROM ai_feedback
  WHERE DATE(created_at) = target_date
  GROUP BY organization_id, suggestion_type
  ON CONFLICT (organization_id, date, suggestion_type) DO UPDATE SET
    total_suggestions = EXCLUDED.total_suggestions,
    accepted_count = EXCLUDED.accepted_count,
    rejected_count = EXCLUDED.rejected_count,
    modified_count = EXCLUDED.modified_count,
    ignored_count = EXCLUDED.ignored_count,
    avg_confidence = EXCLUDED.avg_confidence,
    avg_rating = EXCLUDED.avg_rating,
    avg_decision_time_ms = EXCLUDED.avg_decision_time_ms,
    acceptance_rate = EXCLUDED.acceptance_rate,
    modification_rate = EXCLUDED.modification_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Check retraining threshold
-- =====================================================
CREATE OR REPLACE FUNCTION check_retraining_threshold(
  feedback_threshold INTEGER DEFAULT 50,
  rejection_threshold INTEGER DEFAULT 20,
  days_window INTEGER DEFAULT 7
)
RETURNS TABLE (
  suggestion_type VARCHAR(50),
  feedback_count BIGINT,
  rejection_count BIGINT,
  avg_rating NUMERIC,
  needs_retraining BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    af.suggestion_type,
    COUNT(*) as feedback_count,
    SUM(CASE WHEN af.accepted = false THEN 1 ELSE 0 END) as rejection_count,
    ROUND(AVG(af.user_rating)::numeric, 2) as avg_rating,
    (COUNT(*) >= feedback_threshold OR
     SUM(CASE WHEN af.accepted = false THEN 1 ELSE 0 END) >= rejection_threshold) as needs_retraining
  FROM ai_feedback af
  WHERE af.created_at > NOW() - (days_window || ' days')::interval
  GROUP BY af.suggestion_type
  HAVING COUNT(*) >= feedback_threshold
     OR SUM(CASE WHEN af.accepted = false THEN 1 ELSE 0 END) >= rejection_threshold;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Add updated_at triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_feedback_updated_at') THEN
    CREATE TRIGGER update_ai_feedback_updated_at BEFORE UPDATE ON ai_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_daily_metrics_updated_at') THEN
    CREATE TRIGGER update_ai_daily_metrics_updated_at BEFORE UPDATE ON ai_daily_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_retraining_events_updated_at') THEN
    CREATE TRIGGER update_retraining_events_updated_at BEFORE UPDATE ON ai_retraining_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comm_queue_updated_at') THEN
    CREATE TRIGGER update_comm_queue_updated_at BEFORE UPDATE ON communication_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_automation_workflows_updated_at') THEN
    CREATE TRIGGER update_automation_workflows_updated_at BEFORE UPDATE ON automation_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
