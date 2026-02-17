-- Migration: 013_ai_training_module.sql
-- Description: Add training curation columns to ai_feedback table
-- Created: 2026-02-17

-- =====================================================
-- ADD CURATION COLUMNS TO ai_feedback
-- =====================================================

-- Track whether feedback has been processed into training data
ALTER TABLE ai_feedback ADD COLUMN IF NOT EXISTS processed_for_training BOOLEAN DEFAULT false;

-- Track which model produced the suggestion
ALTER TABLE ai_feedback ADD COLUMN IF NOT EXISTS model_name VARCHAR(100);

-- Curation workflow status: pending -> approved/rejected -> exported
ALTER TABLE ai_feedback ADD COLUMN IF NOT EXISTS training_status VARCHAR(20) DEFAULT 'pending';
-- Values: 'pending', 'approved', 'rejected', 'exported'

-- Composite index for curation queries (filter by status + training flag)
CREATE INDEX IF NOT EXISTS idx_ai_feedback_training_status
  ON ai_feedback(training_status, processed_for_training);
