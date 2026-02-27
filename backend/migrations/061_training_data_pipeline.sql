-- Migration 061: Training Data Pipeline
-- Stores training examples from multiple sources for LoRA fine-tuning

CREATE TABLE IF NOT EXISTS ai_training_data (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,  -- 'production_feedback', 'claude_generated', 'distilled', 'manual'
  category VARCHAR(50) NOT NULL,
  instruction TEXT NOT NULL,
  input TEXT,
  output TEXT NOT NULL,
  quality_score NUMERIC(3,2),
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_data_source ON ai_training_data(source);
CREATE INDEX IF NOT EXISTS idx_training_data_category ON ai_training_data(category);
CREATE INDEX IF NOT EXISTS idx_training_data_approved ON ai_training_data(approved);
