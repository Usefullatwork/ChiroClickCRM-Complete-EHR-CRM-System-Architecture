-- ============================================================================
-- AI Feedback & Learning System
-- Migration: 009_ai_feedback_system.sql
-- Purpose: Create tables for AI feedback loop and continuous learning
-- ============================================================================

-- 1. AI Learning Data - Store outcome feedback for model training
CREATE TABLE IF NOT EXISTS ai_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,

  -- Learning context
  learning_type VARCHAR(50) NOT NULL, -- 'outcome_feedback', 'correction', 'validation'

  -- Original AI suggestion
  ai_suggestion JSONB, -- The original AI-generated content
  ai_model VARCHAR(100), -- Model used (e.g., 'gemini-3-pro-preview:7b')
  ai_confidence DECIMAL(5,4), -- Confidence score 0.0000-1.0000

  -- Outcome data
  outcome_data JSONB NOT NULL, -- Full outcome data
  outcome_success BOOLEAN, -- Was the AI suggestion helpful?

  -- Treatment effectiveness (for clinical learning)
  vas_improvement INTEGER, -- VAS score improvement (-10 to +10)
  treatment_effectiveness VARCHAR(20), -- 'EXCELLENT', 'GOOD', 'MODERATE', 'POOR', 'NONE'

  -- Metadata
  practitioner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure one learning record per encounter
  UNIQUE(encounter_id)
);

-- 2. AI Feedback - Explicit feedback on AI suggestions
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,

  -- Suggestion context
  suggestion_type VARCHAR(50) NOT NULL, -- 'soap_subjective', 'soap_objective', 'soap_assessment', 'soap_plan', 'diagnosis', 'red_flag', 'spell_check'
  soap_section VARCHAR(20), -- 'subjective', 'objective', 'assessment', 'plan'

  -- Original vs corrected
  original_suggestion TEXT NOT NULL,
  user_correction TEXT, -- NULL if accepted without changes

  -- Feedback classification
  accepted BOOLEAN NOT NULL,
  correction_type VARCHAR(30), -- 'none', 'minor_edit', 'major_edit', 'rejected', 'expanded'
  rejection_reason VARCHAR(100), -- 'inaccurate', 'incomplete', 'wrong_context', 'wrong_terminology', 'other'

  -- Quality metrics
  time_to_decision INTEGER, -- Milliseconds to accept/reject
  was_helpful BOOLEAN,

  -- User notes
  feedback_notes TEXT,

  -- Actor
  user_id UUID REFERENCES users(id) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. AI Performance Metrics - Aggregated analytics
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Time period
  metric_date DATE NOT NULL,
  metric_period VARCHAR(10) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'

  -- Suggestion type breakdown
  suggestion_type VARCHAR(50) NOT NULL,

  -- Volume metrics
  total_suggestions INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  modified_count INTEGER DEFAULT 0,

  -- Quality metrics
  acceptance_rate DECIMAL(5,2), -- Percentage 0.00-100.00
  avg_confidence DECIMAL(5,4), -- Average AI confidence
  avg_time_to_decision INTEGER, -- Average milliseconds

  -- Correction analysis
  common_corrections JSONB, -- Array of {pattern, count, example}
  common_rejections JSONB, -- Array of {reason, count}

  -- Model performance
  model_version VARCHAR(100),

  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- One metric per org/date/type combo
  UNIQUE(organization_id, metric_date, suggestion_type, metric_period)
);

-- 4. AI Model Registry - Track trained models
CREATE TABLE IF NOT EXISTS ai_model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Model identification
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  base_model VARCHAR(100), -- Parent model (e.g., 'llama2:7b')

  -- Training metadata
  training_examples_count INTEGER,
  training_started_at TIMESTAMP,
  training_completed_at TIMESTAMP,
  training_duration_seconds INTEGER,

  -- Performance metrics
  validation_accuracy DECIMAL(5,4),
  test_accuracy DECIMAL(5,4),

  -- Deployment
  is_active BOOLEAN DEFAULT false,
  deployed_at TIMESTAMP,
  deprecated_at TIMESTAMP,

  -- Storage
  model_path TEXT,
  model_size_bytes BIGINT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, model_name, model_version)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- AI Learning Data
CREATE INDEX idx_ai_learning_org ON ai_learning_data(organization_id);
CREATE INDEX idx_ai_learning_encounter ON ai_learning_data(encounter_id);
CREATE INDEX idx_ai_learning_type ON ai_learning_data(learning_type);
CREATE INDEX idx_ai_learning_created ON ai_learning_data(created_at);

-- AI Feedback
CREATE INDEX idx_ai_feedback_org ON ai_feedback(organization_id);
CREATE INDEX idx_ai_feedback_encounter ON ai_feedback(encounter_id);
CREATE INDEX idx_ai_feedback_type ON ai_feedback(suggestion_type);
CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_created ON ai_feedback(created_at);
CREATE INDEX idx_ai_feedback_accepted ON ai_feedback(accepted);

-- AI Performance Metrics
CREATE INDEX idx_ai_metrics_org ON ai_performance_metrics(organization_id);
CREATE INDEX idx_ai_metrics_date ON ai_performance_metrics(metric_date);
CREATE INDEX idx_ai_metrics_type ON ai_performance_metrics(suggestion_type);

-- AI Model Registry
CREATE INDEX idx_ai_models_org ON ai_model_registry(organization_id);
CREATE INDEX idx_ai_models_active ON ai_model_registry(is_active) WHERE is_active = true;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to record AI feedback and update metrics
CREATE OR REPLACE FUNCTION record_ai_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert daily metrics
  INSERT INTO ai_performance_metrics (
    organization_id,
    metric_date,
    suggestion_type,
    total_suggestions,
    accepted_count,
    rejected_count,
    modified_count,
    acceptance_rate
  )
  VALUES (
    NEW.organization_id,
    CURRENT_DATE,
    NEW.suggestion_type,
    1,
    CASE WHEN NEW.accepted AND NEW.correction_type = 'none' THEN 1 ELSE 0 END,
    CASE WHEN NOT NEW.accepted THEN 1 ELSE 0 END,
    CASE WHEN NEW.accepted AND NEW.correction_type != 'none' THEN 1 ELSE 0 END,
    CASE WHEN NEW.accepted THEN 100.00 ELSE 0.00 END
  )
  ON CONFLICT (organization_id, metric_date, suggestion_type, metric_period) DO UPDATE SET
    total_suggestions = ai_performance_metrics.total_suggestions + 1,
    accepted_count = ai_performance_metrics.accepted_count +
      CASE WHEN NEW.accepted AND NEW.correction_type = 'none' THEN 1 ELSE 0 END,
    rejected_count = ai_performance_metrics.rejected_count +
      CASE WHEN NOT NEW.accepted THEN 1 ELSE 0 END,
    modified_count = ai_performance_metrics.modified_count +
      CASE WHEN NEW.accepted AND NEW.correction_type != 'none' THEN 1 ELSE 0 END,
    acceptance_rate = (
      (ai_performance_metrics.accepted_count + ai_performance_metrics.modified_count +
        CASE WHEN NEW.accepted THEN 1 ELSE 0 END)::DECIMAL /
      (ai_performance_metrics.total_suggestions + 1) * 100
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update metrics on feedback
CREATE TRIGGER trigger_ai_feedback_metrics
AFTER INSERT ON ai_feedback
FOR EACH ROW
EXECUTE FUNCTION record_ai_feedback();

-- Function to check if retraining is needed
CREATE OR REPLACE FUNCTION check_retraining_threshold(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recent_acceptance_rate DECIMAL;
  feedback_count INTEGER;
BEGIN
  -- Get recent acceptance rate (last 7 days)
  SELECT
    AVG(acceptance_rate),
    SUM(total_suggestions)
  INTO recent_acceptance_rate, feedback_count
  FROM ai_performance_metrics
  WHERE organization_id = org_id
    AND metric_date >= CURRENT_DATE - INTERVAL '7 days';

  -- Trigger retraining if:
  -- 1. At least 100 feedback items
  -- 2. Acceptance rate below 70%
  RETURN (feedback_count >= 100 AND recent_acceptance_rate < 70.0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_learning_data IS 'Stores outcome feedback from clinical encounters for AI model training';
COMMENT ON TABLE ai_feedback IS 'Explicit user feedback on AI suggestions for quality tracking';
COMMENT ON TABLE ai_performance_metrics IS 'Aggregated AI performance metrics by day and suggestion type';
COMMENT ON TABLE ai_model_registry IS 'Registry of trained AI models with version tracking';

COMMENT ON FUNCTION record_ai_feedback() IS 'Automatically updates performance metrics when feedback is recorded';
COMMENT ON FUNCTION check_retraining_threshold(UUID) IS 'Checks if an organization needs AI model retraining based on feedback';
