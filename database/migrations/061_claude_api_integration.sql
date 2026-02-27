-- Migration 061: Claude API Integration
-- Adds ai_api_usage table for tracking Claude API costs and usage

CREATE TABLE IF NOT EXISTS ai_api_usage (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(20) NOT NULL DEFAULT 'claude',    -- 'ollama' or 'claude'
  model VARCHAR(100) NOT NULL,                        -- e.g., 'claude-sonnet-4-6'
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,        -- Cost in USD (6 decimal places)
  task_type VARCHAR(50),                              -- Clinical task type (soap_notes, red_flag_analysis, etc.)
  duration_ms INTEGER,                                -- Request duration in milliseconds
  organization_id UUID,                               -- Tenant organization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for cost analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_provider ON ai_api_usage(provider);
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_created_at ON ai_api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_org ON ai_api_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_daily ON ai_api_usage(provider, created_at)
  WHERE provider = 'claude';

-- Composite index for daily/monthly budget queries
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_budget ON ai_api_usage(provider, created_at, cost_usd);

-- Composite index for task-level cost breakdown
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_task ON ai_api_usage(provider, task_type, created_at);

COMMENT ON TABLE ai_api_usage IS 'Tracks all AI API calls for cost monitoring and analytics. Used by budgetTracker.js for daily/monthly spend enforcement.';
