-- AI Feedback and Performance Tracking
-- Tracks AI suggestion quality and provider feedback for continuous improvement

-- ============================================================================
-- AI SUGGESTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Context
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Suggestion details
    suggestion_type VARCHAR(50) NOT NULL, -- 'SOAP_COMPLETION', 'DIAGNOSIS', 'TREATMENT', 'RED_FLAG'
    soap_section VARCHAR(20), -- 'subjective', 'objective', 'assessment', 'plan'
    input_text TEXT, -- Original text that triggered suggestion
    suggested_text TEXT NOT NULL, -- AI-generated suggestion
    model_name VARCHAR(100), -- e.g., 'ollama/mistral:7b', 'claude-3'
    model_version VARCHAR(50),

    -- Validation
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    confidence_level VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH'
    has_red_flags BOOLEAN DEFAULT false,
    red_flags JSONB, -- Array of detected red flags
    requires_review BOOLEAN DEFAULT true,

    -- Provider feedback
    feedback_status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'MODIFIED', 'REJECTED'
    feedback_text TEXT, -- Provider's explanation
    modified_text TEXT, -- If provider modified the suggestion
    feedback_at TIMESTAMP WITH TIME ZONE,
    feedback_by UUID REFERENCES users(id),

    -- Quality metrics
    was_helpful BOOLEAN, -- Simple thumbs up/down
    helpfulness_rating INTEGER CHECK (helpfulness_rating BETWEEN 1 AND 5),
    time_saved_seconds INTEGER, -- Estimated time saved
    accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),

    -- Metadata
    request_duration_ms INTEGER, -- How long the AI took to respond
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AI PERFORMANCE METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY'

    -- Volume metrics
    total_suggestions INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    modified_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,

    -- Quality metrics
    avg_confidence_score DECIMAL(3,2),
    avg_helpfulness_rating DECIMAL(3,2),
    avg_accuracy_rating DECIMAL(3,2),
    total_time_saved_minutes INTEGER DEFAULT 0,

    -- Red flag metrics
    red_flags_detected INTEGER DEFAULT 0,
    red_flags_confirmed INTEGER DEFAULT 0, -- Confirmed by provider
    red_flags_false_positive INTEGER DEFAULT 0,

    -- Model performance breakdown
    metrics_by_model JSONB, -- { "model_name": { ...metrics } }
    metrics_by_type JSONB, -- { "suggestion_type": { ...metrics } }
    metrics_by_provider JSONB, -- { "provider_id": { ...metrics } }

    -- Calculated
    approval_rate DECIMAL(5,2), -- (approved + modified) / total * 100
    accuracy_rate DECIMAL(5,2), -- approved / (approved + rejected) * 100

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AI FEEDBACK CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_feedback_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Category details
    category_name VARCHAR(100) NOT NULL,
    category_type VARCHAR(50) NOT NULL, -- 'POSITIVE', 'NEGATIVE', 'NEUTRAL'
    description TEXT,

    -- For UI display
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    -- Example values:
    -- POSITIVE: 'accurate', 'time_saving', 'comprehensive'
    -- NEGATIVE: 'inaccurate', 'irrelevant', 'too_verbose', 'missed_red_flag'
    -- NEUTRAL: 'partially_helpful', 'needs_customization'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AI SUGGESTION FEEDBACK (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_suggestion_feedback_categories (
    suggestion_id UUID NOT NULL REFERENCES ai_suggestions(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES ai_feedback_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (suggestion_id, category_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookup for pending reviews
CREATE INDEX idx_ai_suggestions_pending ON ai_suggestions(organization_id, feedback_status, created_at DESC)
WHERE feedback_status = 'PENDING';

-- Provider feedback analysis
CREATE INDEX idx_ai_suggestions_provider ON ai_suggestions(provider_id, feedback_status, created_at DESC);

-- Model performance analysis
CREATE INDEX idx_ai_suggestions_model ON ai_suggestions(model_name, feedback_status);

-- Encounter lookup
CREATE INDEX idx_ai_suggestions_encounter ON ai_suggestions(encounter_id);

-- Metrics lookup
CREATE INDEX idx_ai_metrics_org_period ON ai_performance_metrics(organization_id, period_type, period_start DESC);

-- ============================================================================
-- TRIGGER: Update timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ai_suggestion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_suggestion_timestamp
BEFORE UPDATE ON ai_suggestions
FOR EACH ROW
EXECUTE FUNCTION update_ai_suggestion_timestamp();

-- ============================================================================
-- FUNCTION: Calculate daily metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_ai_daily_metrics(
    p_organization_id UUID,
    p_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_metric_id UUID;
    v_stats RECORD;
BEGIN
    -- Calculate statistics for the day
    SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE feedback_status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE feedback_status = 'MODIFIED') as modified,
        COUNT(*) FILTER (WHERE feedback_status = 'REJECTED') as rejected,
        COUNT(*) FILTER (WHERE feedback_status = 'PENDING') as pending,
        AVG(confidence_score) as avg_confidence,
        AVG(helpfulness_rating) as avg_helpfulness,
        AVG(accuracy_rating) as avg_accuracy,
        COALESCE(SUM(time_saved_seconds) / 60, 0) as time_saved_min,
        COUNT(*) FILTER (WHERE has_red_flags = true) as red_flags
    INTO v_stats
    FROM ai_suggestions
    WHERE organization_id = p_organization_id
      AND DATE(created_at) = p_date;

    -- Insert or update metric
    INSERT INTO ai_performance_metrics (
        organization_id,
        period_start,
        period_end,
        period_type,
        total_suggestions,
        approved_count,
        modified_count,
        rejected_count,
        pending_count,
        avg_confidence_score,
        avg_helpfulness_rating,
        avg_accuracy_rating,
        total_time_saved_minutes,
        red_flags_detected,
        approval_rate,
        accuracy_rate
    ) VALUES (
        p_organization_id,
        p_date,
        p_date,
        'DAILY',
        v_stats.total,
        v_stats.approved,
        v_stats.modified,
        v_stats.rejected,
        v_stats.pending,
        v_stats.avg_confidence,
        v_stats.avg_helpfulness,
        v_stats.avg_accuracy,
        v_stats.time_saved_min,
        v_stats.red_flags,
        CASE WHEN v_stats.total > 0
             THEN ((v_stats.approved + v_stats.modified)::DECIMAL / v_stats.total) * 100
             ELSE 0 END,
        CASE WHEN (v_stats.approved + v_stats.rejected) > 0
             THEN (v_stats.approved::DECIMAL / (v_stats.approved + v_stats.rejected)) * 100
             ELSE 0 END
    )
    ON CONFLICT (organization_id, period_start, period_type)
    DO UPDATE SET
        total_suggestions = EXCLUDED.total_suggestions,
        approved_count = EXCLUDED.approved_count,
        modified_count = EXCLUDED.modified_count,
        rejected_count = EXCLUDED.rejected_count,
        pending_count = EXCLUDED.pending_count,
        avg_confidence_score = EXCLUDED.avg_confidence_score,
        avg_helpfulness_rating = EXCLUDED.avg_helpfulness_rating,
        avg_accuracy_rating = EXCLUDED.avg_accuracy_rating,
        total_time_saved_minutes = EXCLUDED.total_time_saved_minutes,
        red_flags_detected = EXCLUDED.red_flags_detected,
        approval_rate = EXCLUDED.approval_rate,
        accuracy_rate = EXCLUDED.accuracy_rate
    RETURNING id INTO v_metric_id;

    RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DEFAULT FEEDBACK CATEGORIES
-- ============================================================================

INSERT INTO ai_feedback_categories (category_name, category_type, description, display_order) VALUES
    ('Nøyaktig', 'POSITIVE', 'AI-forslaget var klinisk nøyaktig', 1),
    ('Tidsbesparende', 'POSITIVE', 'Forslaget sparte tid på dokumentasjon', 2),
    ('Omfattende', 'POSITIVE', 'Forslaget dekket alle relevante punkter', 3),
    ('God formulering', 'POSITIVE', 'Godt formulert og profesjonelt språk', 4),
    ('Unøyaktig', 'NEGATIVE', 'Klinisk unøyaktig eller feil informasjon', 5),
    ('Irrelevant', 'NEGATIVE', 'Ikke relevant for denne pasienten/tilstanden', 6),
    ('For omfattende', 'NEGATIVE', 'For mye tekst, trengte redigering', 7),
    ('Manglet informasjon', 'NEGATIVE', 'Viktig informasjon manglet', 8),
    ('Manglet rødt flagg', 'NEGATIVE', 'AI oppdaget ikke viktige røde flagg', 9),
    ('Delvis nyttig', 'NEUTRAL', 'Noe av forslaget var nyttig', 10),
    ('Trenger tilpasning', 'NEUTRAL', 'Grunnlag godt, men trenger kliniker-tilpasning', 11)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UNIQUE CONSTRAINT FOR METRICS
-- ============================================================================

ALTER TABLE ai_performance_metrics
ADD CONSTRAINT unique_org_period_metrics
UNIQUE (organization_id, period_start, period_type);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_suggestions IS 'Tracks all AI-generated clinical suggestions and provider feedback';
COMMENT ON TABLE ai_performance_metrics IS 'Aggregated AI performance metrics for dashboards and improvement tracking';
COMMENT ON COLUMN ai_suggestions.confidence_score IS 'AI confidence in suggestion, 0.0-1.0';
COMMENT ON COLUMN ai_suggestions.was_helpful IS 'Simple binary feedback from provider';
