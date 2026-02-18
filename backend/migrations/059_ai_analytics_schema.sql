-- AI Analytics Schema Enhancements
-- Adds missing columns needed by the aiAnalytics controller for per-model metrics

-- Add model_name to ai_performance_metrics (enables GROUP BY model_name queries)
ALTER TABLE ai_performance_metrics ADD COLUMN IF NOT EXISTS model_name VARCHAR(100);

-- Add avg_latency_ms to ai_performance_metrics (tracks response time per model)
ALTER TABLE ai_performance_metrics ADD COLUMN IF NOT EXISTS avg_latency_ms NUMERIC;

-- Indexes for analytics dashboard queries
CREATE INDEX IF NOT EXISTS idx_ai_perf_model_period ON ai_performance_metrics(model_name, period_start);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_model_created ON ai_suggestions(model_name, created_at);
