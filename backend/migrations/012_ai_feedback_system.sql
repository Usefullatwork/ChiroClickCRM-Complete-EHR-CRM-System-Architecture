-- Migration 012: AI Feedback and Learning System
-- Captures user corrections to AI suggestions for continuous improvement
-- CRITICAL for improving AI accuracy over time

-- AI Feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  suggestion_type VARCHAR(50) NOT NULL, -- 'soap_suggestion', 'diagnosis', 'treatment', etc.
  original_suggestion TEXT NOT NULL,
  user_correction TEXT,
  accepted BOOLEAN NOT NULL,
  correction_type VARCHAR(50), -- 'minor', 'major', 'rejected', 'accepted_as_is'
  confidence_score DECIMAL(3,2), -- AI confidence at time of suggestion
  feedback_notes TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Metadata for analysis
  template_id UUID REFERENCES clinical_templates(id) ON DELETE SET NULL,
  context_data JSONB, -- Patient context, symptoms, etc.

  -- Quality metrics
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  time_to_decision INTEGER, -- Milliseconds taken to accept/reject

  CONSTRAINT valid_correction_type CHECK (
    correction_type IN ('minor', 'major', 'rejected', 'accepted_as_is')
  )
);

-- Indexes
CREATE INDEX idx_ai_feedback_encounter ON ai_feedback(encounter_id);
CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_type ON ai_feedback(suggestion_type);
CREATE INDEX idx_ai_feedback_accepted ON ai_feedback(accepted);
CREATE INDEX idx_ai_feedback_created ON ai_feedback(created_at DESC);
CREATE INDEX idx_ai_feedback_template ON ai_feedback(template_id) WHERE template_id IS NOT NULL;

-- Composite index for analytics
CREATE INDEX idx_ai_feedback_analytics ON ai_feedback(suggestion_type, accepted, created_at DESC);

-- AI Performance Metrics (aggregated daily)
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  suggestion_type VARCHAR(50) NOT NULL,
  total_suggestions INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  modified_count INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2),
  avg_confidence DECIMAL(5,2),
  avg_user_rating DECIMAL(3,2),
  avg_time_to_decision INTEGER,
  common_corrections JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(metric_date, suggestion_type)
);

-- Index for metrics
CREATE INDEX idx_ai_metrics_date ON ai_performance_metrics(metric_date DESC);
CREATE INDEX idx_ai_metrics_type ON ai_performance_metrics(suggestion_type);

COMMENT ON TABLE ai_feedback IS 'User feedback on AI suggestions for continuous learning';
COMMENT ON TABLE ai_performance_metrics IS 'Daily aggregated AI performance metrics';
COMMENT ON COLUMN ai_feedback.correction_type IS 'Severity of correction needed';
COMMENT ON COLUMN ai_feedback.time_to_decision IS 'Time in milliseconds user took to decide - fast acceptance indicates good suggestion';

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION update_daily_ai_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_performance_metrics (
    metric_date,
    suggestion_type,
    total_suggestions,
    accepted_count,
    rejected_count,
    modified_count,
    acceptance_rate,
    avg_confidence,
    avg_user_rating,
    avg_time_to_decision,
    common_corrections,
    updated_at
  )
  SELECT
    target_date,
    suggestion_type,
    COUNT(*) as total_suggestions,
    SUM(CASE WHEN accepted = true AND correction_type = 'accepted_as_is' THEN 1 ELSE 0 END) as accepted_count,
    SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END) as rejected_count,
    SUM(CASE WHEN correction_type IN ('minor', 'major') THEN 1 ELSE 0 END) as modified_count,
    ROUND(
      (SUM(CASE WHEN accepted = true THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
      2
    ) as acceptance_rate,
    ROUND(AVG(confidence_score), 2) as avg_confidence,
    ROUND(AVG(user_rating), 2) as avg_user_rating,
    ROUND(AVG(time_to_decision))::INTEGER as avg_time_to_decision,
    jsonb_agg(
      jsonb_build_object(
        'original', SUBSTRING(original_suggestion, 1, 100),
        'corrected', SUBSTRING(user_correction, 1, 100),
        'type', correction_type
      )
    ) FILTER (WHERE correction_type IN ('minor', 'major')) as common_corrections,
    NOW()
  FROM ai_feedback
  WHERE DATE(created_at) = target_date
  GROUP BY suggestion_type
  ON CONFLICT (metric_date, suggestion_type)
  DO UPDATE SET
    total_suggestions = EXCLUDED.total_suggestions,
    accepted_count = EXCLUDED.accepted_count,
    rejected_count = EXCLUDED.rejected_count,
    modified_count = EXCLUDED.modified_count,
    acceptance_rate = EXCLUDED.acceptance_rate,
    avg_confidence = EXCLUDED.avg_confidence,
    avg_user_rating = EXCLUDED.avg_user_rating,
    avg_time_to_decision = EXCLUDED.avg_time_to_decision,
    common_corrections = EXCLUDED.common_corrections,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_daily_ai_metrics IS 'Aggregate daily AI performance metrics from feedback data';

-- View for real-time AI performance
CREATE OR REPLACE VIEW ai_performance_realtime AS
SELECT
  suggestion_type,
  COUNT(*) as total,
  SUM(CASE WHEN accepted = true THEN 1 ELSE 0 END) as accepted,
  SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END) as rejected,
  ROUND(
    (SUM(CASE WHEN accepted = true THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
    2
  ) as acceptance_rate_pct,
  ROUND(AVG(confidence_score), 2) as avg_confidence,
  ROUND(AVG(user_rating), 2) as avg_rating
FROM ai_feedback
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY suggestion_type
ORDER BY total DESC;

COMMENT ON VIEW ai_performance_realtime IS 'Real-time AI performance over last 7 days';

-- View for low-performing suggestions (need retraining)
CREATE OR REPLACE VIEW ai_needs_improvement AS
SELECT
  suggestion_type,
  COUNT(*) as sample_size,
  ROUND(
    (SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
    2
  ) as rejection_rate_pct,
  array_agg(
    DISTINCT SUBSTRING(user_correction, 1, 200)
  ) FILTER (WHERE user_correction IS NOT NULL) as common_corrections_sample
FROM ai_feedback
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY suggestion_type
HAVING (SUM(CASE WHEN accepted = false THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) > 0.3
ORDER BY rejection_rate_pct DESC;

COMMENT ON VIEW ai_needs_improvement IS 'AI suggestion types with >30% rejection rate in last 30 days - NEEDS RETRAINING';

-- Trigger to automatically update metrics nightly
-- CREATE EXTENSION IF NOT EXISTS pg_cron; -- Requires pg_cron extension
-- SELECT cron.schedule('update-ai-metrics', '0 2 * * *', 'SELECT update_daily_ai_metrics(CURRENT_DATE - 1)');
