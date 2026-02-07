-- ============================================================================
-- Template Quality & Versioning System
-- Migration: 010_template_versioning.sql
-- Purpose: Add version control and quality scoring to clinical templates
-- ============================================================================

-- Add versioning and quality columns to clinical_templates
ALTER TABLE clinical_templates
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS times_modified INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_template_id UUID REFERENCES clinical_templates(id),
ADD COLUMN IF NOT EXISTS is_deprecated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deprecated_reason TEXT;

-- Template version history table
CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES clinical_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Snapshot of template at this version
  template_name VARCHAR(255) NOT NULL,
  template_text TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  soap_section VARCHAR(50),

  -- Quality metrics at this version
  quality_score DECIMAL(3,2),
  usage_count INTEGER DEFAULT 0,

  -- Change tracking
  changes_description TEXT,
  changed_by UUID REFERENCES users(id),
  change_type VARCHAR(20) CHECK (change_type IN ('create', 'update', 'review', 'deprecate')),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(template_id, version_number)
);

-- Template reviews table
CREATE TABLE IF NOT EXISTS template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES clinical_templates(id) ON DELETE CASCADE,
  version_reviewed INTEGER NOT NULL,

  -- Review details
  reviewer_id UUID NOT NULL REFERENCES users(id),
  review_type VARCHAR(30) CHECK (review_type IN ('initial', 'periodic', 'user_request', 'quality_check')),
  review_status VARCHAR(20) NOT NULL CHECK (review_status IN ('approved', 'rejected', 'needs_revision')),

  -- Scores
  accuracy_score DECIMAL(3,2), -- Medical accuracy 0-1
  clarity_score DECIMAL(3,2), -- Clarity of language 0-1
  completeness_score DECIMAL(3,2), -- Completeness 0-1
  relevance_score DECIMAL(3,2), -- Relevance to category 0-1

  -- Feedback
  review_notes TEXT,
  suggested_changes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Template usage feedback
CREATE TABLE IF NOT EXISTS template_usage_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES clinical_templates(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Usage context
  usage_type VARCHAR(30) CHECK (usage_type IN ('inserted', 'modified', 'rejected', 'favorited', 'unfavorited')),
  soap_section VARCHAR(50),

  -- Modification tracking
  was_modified BOOLEAN DEFAULT false,
  modification_type VARCHAR(30), -- 'minor', 'major', 'complete_rewrite'
  original_text TEXT,
  modified_text TEXT,

  -- Feedback
  helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
  feedback_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_templates_quality ON clinical_templates(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_templates_review_status ON clinical_templates(review_status);
CREATE INDEX IF NOT EXISTS idx_templates_version ON clinical_templates(version);
CREATE INDEX IF NOT EXISTS idx_templates_deprecated ON clinical_templates(is_deprecated) WHERE is_deprecated = false;

CREATE INDEX IF NOT EXISTS idx_template_versions_template ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_version ON template_versions(template_id, version_number);

CREATE INDEX IF NOT EXISTS idx_template_reviews_template ON template_reviews(template_id);
CREATE INDEX IF NOT EXISTS idx_template_reviews_reviewer ON template_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_template_reviews_status ON template_reviews(review_status);

CREATE INDEX IF NOT EXISTS idx_template_feedback_template ON template_usage_feedback(template_id);
CREATE INDEX IF NOT EXISTS idx_template_feedback_user ON template_usage_feedback(user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate template quality score
CREATE OR REPLACE FUNCTION calculate_template_quality(p_template_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL := 0;
  v_usage_count INTEGER;
  v_avg_rating DECIMAL;
  v_modification_rate DECIMAL;
  v_rejection_rate DECIMAL;
  v_text_length INTEGER;
  v_has_medical_terms BOOLEAN;
BEGIN
  -- Get template usage stats
  SELECT
    t.usage_count,
    (SELECT AVG(helpful_rating) FROM template_usage_feedback WHERE template_id = p_template_id),
    (SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(*) FILTER (WHERE was_modified = false), 0)
     FROM template_usage_feedback WHERE template_id = p_template_id),
    (SELECT COUNT(*) FILTER (WHERE usage_type = 'rejected')::DECIMAL / NULLIF(COUNT(*), 0)
     FROM template_usage_feedback WHERE template_id = p_template_id),
    LENGTH(t.template_text)
  INTO v_usage_count, v_avg_rating, v_modification_rate, v_rejection_rate, v_text_length
  FROM clinical_templates t
  WHERE t.id = p_template_id;

  -- Base score from usage (max 0.2)
  v_score := v_score + LEAST(v_usage_count / 100.0, 0.2);

  -- Rating score (max 0.3)
  IF v_avg_rating IS NOT NULL THEN
    v_score := v_score + (v_avg_rating / 5.0) * 0.3;
  END IF;

  -- Low modification rate is good (max 0.2)
  IF v_modification_rate IS NOT NULL AND v_modification_rate > 0 THEN
    v_score := v_score + (1.0 / v_modification_rate) * 0.1;
  ELSE
    v_score := v_score + 0.1;
  END IF;

  -- Low rejection rate is good (max 0.2)
  IF v_rejection_rate IS NOT NULL THEN
    v_score := v_score + (1.0 - v_rejection_rate) * 0.2;
  ELSE
    v_score := v_score + 0.2;
  END IF;

  -- Text length score (optimal 50-500 chars) (max 0.1)
  IF v_text_length >= 50 AND v_text_length <= 500 THEN
    v_score := v_score + 0.1;
  ELSIF v_text_length >= 20 AND v_text_length <= 1000 THEN
    v_score := v_score + 0.05;
  END IF;

  RETURN LEAST(v_score, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Function to save template version before update
CREATE OR REPLACE FUNCTION save_template_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only save version if content actually changed
  IF OLD.template_text IS DISTINCT FROM NEW.template_text
     OR OLD.template_name IS DISTINCT FROM NEW.template_name THEN

    -- Increment version
    NEW.version := OLD.version + 1;
    NEW.times_modified := OLD.times_modified + 1;

    -- Save old version
    INSERT INTO template_versions (
      template_id, version_number, template_name, template_text,
      category, subcategory, soap_section, quality_score, usage_count,
      changes_description, changed_by, change_type
    ) VALUES (
      OLD.id, OLD.version, OLD.template_name, OLD.template_text,
      OLD.category, OLD.subcategory, OLD.soap_section, OLD.quality_score, OLD.usage_count,
      'Version saved before update', NEW.created_by, 'update'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for versioning
DROP TRIGGER IF EXISTS trigger_template_versioning ON clinical_templates;
CREATE TRIGGER trigger_template_versioning
BEFORE UPDATE ON clinical_templates
FOR EACH ROW
EXECUTE FUNCTION save_template_version();

-- Function to update quality scores periodically
CREATE OR REPLACE FUNCTION update_all_template_quality_scores()
RETURNS void AS $$
DECLARE
  template_record RECORD;
BEGIN
  FOR template_record IN SELECT id FROM clinical_templates WHERE is_deprecated = false
  LOOP
    UPDATE clinical_templates
    SET quality_score = calculate_template_quality(template_record.id),
        updated_at = NOW()
    WHERE id = template_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check if template needs review
CREATE OR REPLACE FUNCTION template_needs_review(p_template_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_quality_score DECIMAL;
  v_last_review TIMESTAMP;
  v_usage_count INTEGER;
BEGIN
  SELECT quality_score, reviewed_at, usage_count
  INTO v_quality_score, v_last_review, v_usage_count
  FROM clinical_templates
  WHERE id = p_template_id;

  -- Needs review if:
  -- 1. Quality score below 0.5
  -- 2. No review in last 90 days
  -- 3. High usage (>50) but never reviewed
  RETURN (
    v_quality_score < 0.5
    OR v_last_review IS NULL
    OR v_last_review < NOW() - INTERVAL '90 days'
    OR (v_usage_count > 50 AND v_last_review IS NULL)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View of templates needing review
CREATE OR REPLACE VIEW templates_needing_review AS
SELECT
  t.id,
  t.organization_id,
  t.template_name,
  t.category,
  t.quality_score,
  t.usage_count,
  t.review_status,
  t.reviewed_at,
  template_needs_review(t.id) as needs_review,
  CASE
    WHEN t.quality_score < 0.3 THEN 'HIGH'
    WHEN t.quality_score < 0.5 THEN 'MEDIUM'
    ELSE 'LOW'
  END as review_priority
FROM clinical_templates t
WHERE t.is_deprecated = false
  AND template_needs_review(t.id) = true
ORDER BY t.quality_score ASC, t.usage_count DESC;

-- View of top performing templates
CREATE OR REPLACE VIEW top_performing_templates AS
SELECT
  t.id,
  t.organization_id,
  t.template_name,
  t.category,
  t.soap_section,
  t.quality_score,
  t.usage_count,
  t.version,
  (SELECT AVG(helpful_rating) FROM template_usage_feedback WHERE template_id = t.id) as avg_rating,
  (SELECT COUNT(*) FROM template_usage_feedback WHERE template_id = t.id AND usage_type = 'inserted') as times_used
FROM clinical_templates t
WHERE t.is_deprecated = false
  AND t.review_status = 'approved'
  AND t.quality_score >= 0.7
ORDER BY t.quality_score DESC, t.usage_count DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE template_versions IS 'Version history for clinical templates';
COMMENT ON TABLE template_reviews IS 'Review records for template quality control';
COMMENT ON TABLE template_usage_feedback IS 'User feedback on template usage and modifications';

COMMENT ON FUNCTION calculate_template_quality(UUID) IS 'Calculate quality score based on usage, ratings, and modification patterns';
COMMENT ON FUNCTION save_template_version() IS 'Automatically save template version before updates';
COMMENT ON FUNCTION template_needs_review(UUID) IS 'Check if template needs quality review';
