-- Migration 014: Template Quality and Governance System
-- Adds quality control and review workflow for clinical templates

-- Add quality and review columns to clinical_templates
ALTER TABLE clinical_templates
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Add constraints
ALTER TABLE clinical_templates
ADD CONSTRAINT check_quality_score CHECK (quality_score >= 0 AND quality_score <= 1),
ADD CONSTRAINT check_review_status CHECK (
  review_status IN ('pending', 'approved', 'rejected', 'needs_improvement', 'review')
);

-- Create template reviews table
CREATE TABLE IF NOT EXISTS template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES clinical_templates(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  old_version INTEGER,
  new_version INTEGER,
  changes JSONB,
  review_notes TEXT,
  approved BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_templates_quality ON clinical_templates(quality_score);
CREATE INDEX idx_templates_review_status ON clinical_templates(review_status);
CREATE INDEX idx_templates_reviewed_by ON clinical_templates(reviewed_by);
CREATE INDEX idx_template_reviews_template ON template_reviews(template_id, created_at DESC);
CREATE INDEX idx_template_reviews_reviewer ON template_reviews(reviewer_id);

-- Composite index for filtering
CREATE INDEX idx_templates_quality_status ON clinical_templates(review_status, quality_score);

COMMENT ON COLUMN clinical_templates.quality_score IS 'Automated quality score (0-1) based on content analysis';
COMMENT ON COLUMN clinical_templates.review_status IS 'Manual review status: pending, approved, rejected, needs_improvement, review';
COMMENT ON COLUMN clinical_templates.version IS 'Version number - incremented on each approval';
COMMENT ON COLUMN clinical_templates.usage_count IS 'Number of times template has been used';

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE clinical_templates
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Add last_used_at column
ALTER TABLE clinical_templates
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- View for high quality, approved templates
CREATE OR REPLACE VIEW approved_templates AS
SELECT *
FROM clinical_templates
WHERE review_status = 'approved'
  AND quality_score >= 0.6
ORDER BY quality_score DESC, usage_count DESC;

COMMENT ON VIEW approved_templates IS 'High-quality, approved templates ready for AI training';

-- View for templates needing attention
CREATE OR REPLACE VIEW templates_need_review AS
SELECT
  t.*,
  u.name as creator_name,
  r.name as reviewer_name,
  (SELECT COUNT(*) FROM template_reviews WHERE template_id = t.id) as review_count
FROM clinical_templates t
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN users r ON t.reviewed_by = r.id
WHERE t.review_status IN ('pending', 'needs_improvement', 'review')
   OR t.quality_score < 0.6
ORDER BY t.quality_score ASC, t.created_at ASC;

COMMENT ON VIEW templates_need_review IS 'Templates requiring manual review';

-- Function to get template statistics
CREATE OR REPLACE FUNCTION get_template_stats()
RETURNS TABLE (
  total_templates BIGINT,
  approved_count BIGINT,
  pending_count BIGINT,
  rejected_count BIGINT,
  avg_quality_score DECIMAL,
  total_usage BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_templates,
    SUM(CASE WHEN review_status = 'approved' THEN 1 ELSE 0 END) as approved_count,
    SUM(CASE WHEN review_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN review_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
    ROUND(AVG(quality_score), 2) as avg_quality_score,
    SUM(usage_count) as total_usage
  FROM clinical_templates;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_template_stats IS 'Get overall template quality and usage statistics';
