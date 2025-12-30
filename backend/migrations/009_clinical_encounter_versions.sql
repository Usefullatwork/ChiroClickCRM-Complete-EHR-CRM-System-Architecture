-- Clinical Encounter Version History
-- Norwegian healthcare regulation (Pasientjournalloven) requires complete audit trail
-- for all clinical documentation changes

-- ============================================================================
-- VERSION HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_encounter_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference to original encounter
    encounter_id UUID NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,

    -- Version metadata
    version_number INTEGER NOT NULL,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('CREATE', 'UPDATE', 'ADDENDUM', 'CORRECTION', 'LOCK')),
    change_reason TEXT, -- Required for corrections per Norwegian law

    -- Complete snapshot of encounter data at this version
    encounter_data JSONB NOT NULL,

    -- SOAP sections stored separately for efficient querying
    subjective_text TEXT,
    objective_text TEXT,
    assessment_text TEXT,
    plan_text TEXT,

    -- Clinical metadata snapshot
    encounter_date DATE NOT NULL,
    encounter_type VARCHAR(50),
    provider_id UUID,
    provider_name VARCHAR(255),

    -- AI-related metadata (if AI was used)
    ai_assisted BOOLEAN DEFAULT false,
    ai_suggestions JSONB,
    ai_accepted_suggestions JSONB,

    -- Audit fields
    created_by UUID NOT NULL REFERENCES users(id),
    created_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- IP address for audit compliance
    ip_address INET,
    user_agent TEXT,

    -- Digital signature for tamper-evidence (future: qualified electronic signature)
    signature_hash TEXT,

    -- Organization context for multi-tenant
    organization_id UUID NOT NULL REFERENCES organizations(id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookup by encounter
CREATE INDEX idx_encounter_versions_encounter ON clinical_encounter_versions(encounter_id);

-- Version ordering
CREATE INDEX idx_encounter_versions_order ON clinical_encounter_versions(encounter_id, version_number DESC);

-- Audit queries
CREATE INDEX idx_encounter_versions_created ON clinical_encounter_versions(created_at DESC);
CREATE INDEX idx_encounter_versions_user ON clinical_encounter_versions(created_by);
CREATE INDEX idx_encounter_versions_org ON clinical_encounter_versions(organization_id);

-- Change type filtering
CREATE INDEX idx_encounter_versions_type ON clinical_encounter_versions(change_type);

-- ============================================================================
-- TRIGGER FUNCTION: Auto-create version on encounter changes
-- ============================================================================

CREATE OR REPLACE FUNCTION create_encounter_version()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
    change_type_val VARCHAR(50);
    current_user_name VARCHAR(255);
BEGIN
    -- Determine next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM clinical_encounter_versions
    WHERE encounter_id = COALESCE(NEW.id, OLD.id);

    -- Determine change type
    IF TG_OP = 'INSERT' THEN
        change_type_val := 'CREATE';
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check if this is a correction or regular update
        IF NEW.is_correction IS NOT NULL AND NEW.is_correction = true THEN
            change_type_val := 'CORRECTION';
        ELSIF NEW.is_addendum IS NOT NULL AND NEW.is_addendum = true THEN
            change_type_val := 'ADDENDUM';
        ELSIF NEW.is_locked IS NOT NULL AND NEW.is_locked = true AND (OLD.is_locked IS NULL OR OLD.is_locked = false) THEN
            change_type_val := 'LOCK';
        ELSE
            change_type_val := 'UPDATE';
        END IF;
    END IF;

    -- Get user name for audit
    SELECT CONCAT(first_name, ' ', last_name)
    INTO current_user_name
    FROM users
    WHERE id = COALESCE(NEW.updated_by, NEW.created_by);

    -- Create version record
    INSERT INTO clinical_encounter_versions (
        encounter_id,
        version_number,
        change_type,
        change_reason,
        encounter_data,
        subjective_text,
        objective_text,
        assessment_text,
        plan_text,
        encounter_date,
        encounter_type,
        provider_id,
        provider_name,
        ai_assisted,
        ai_suggestions,
        ai_accepted_suggestions,
        created_by,
        created_by_name,
        organization_id,
        ip_address,
        signature_hash
    ) VALUES (
        NEW.id,
        next_version,
        change_type_val,
        NEW.change_reason,
        to_jsonb(NEW),
        NEW.subjective,
        NEW.objective,
        NEW.assessment,
        NEW.plan,
        NEW.encounter_date,
        NEW.encounter_type,
        NEW.provider_id,
        (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = NEW.provider_id),
        COALESCE(NEW.ai_assisted, false),
        NEW.ai_suggestions,
        NEW.ai_accepted_suggestions,
        COALESCE(NEW.updated_by, NEW.created_by),
        current_user_name,
        NEW.organization_id,
        NEW.last_ip_address,
        -- Create signature hash of critical fields for tamper detection
        encode(
            sha256(
                (NEW.id::text || next_version::text || NEW.subjective || NEW.objective ||
                 NEW.assessment || NEW.plan || CURRENT_TIMESTAMP::text)::bytea
            ),
            'hex'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_encounter_version ON clinical_encounters;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trigger_encounter_version
AFTER INSERT OR UPDATE ON clinical_encounters
FOR EACH ROW
EXECUTE FUNCTION create_encounter_version();

-- ============================================================================
-- ADD MISSING COLUMNS TO CLINICAL_ENCOUNTERS IF NEEDED
-- ============================================================================

-- Add columns for version tracking support
DO $$
BEGIN
    -- Add is_correction flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clinical_encounters' AND column_name = 'is_correction') THEN
        ALTER TABLE clinical_encounters ADD COLUMN is_correction BOOLEAN DEFAULT false;
    END IF;

    -- Add is_addendum flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clinical_encounters' AND column_name = 'is_addendum') THEN
        ALTER TABLE clinical_encounters ADD COLUMN is_addendum BOOLEAN DEFAULT false;
    END IF;

    -- Add is_locked flag (prevent further edits after signing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clinical_encounters' AND column_name = 'is_locked') THEN
        ALTER TABLE clinical_encounters ADD COLUMN is_locked BOOLEAN DEFAULT false;
    END IF;

    -- Add change_reason for corrections
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clinical_encounters' AND column_name = 'change_reason') THEN
        ALTER TABLE clinical_encounters ADD COLUMN change_reason TEXT;
    END IF;

    -- Add last_ip_address for audit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clinical_encounters' AND column_name = 'last_ip_address') THEN
        ALTER TABLE clinical_encounters ADD COLUMN last_ip_address INET;
    END IF;

    -- Add ai_assisted flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clinical_encounters' AND column_name = 'ai_assisted') THEN
        ALTER TABLE clinical_encounters ADD COLUMN ai_assisted BOOLEAN DEFAULT false;
    END IF;

    -- Add ai_suggestions JSONB
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clinical_encounters' AND column_name = 'ai_suggestions') THEN
        ALTER TABLE clinical_encounters ADD COLUMN ai_suggestions JSONB;
    END IF;

    -- Add ai_accepted_suggestions JSONB
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clinical_encounters' AND column_name = 'ai_accepted_suggestions') THEN
        ALTER TABLE clinical_encounters ADD COLUMN ai_accepted_suggestions JSONB;
    END IF;

    -- Add updated_by for tracking who made changes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clinical_encounters' AND column_name = 'updated_by') THEN
        ALTER TABLE clinical_encounters ADD COLUMN updated_by UUID REFERENCES users(id);
    END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get all versions for an encounter
CREATE OR REPLACE FUNCTION get_encounter_versions(p_encounter_id UUID)
RETURNS TABLE (
    version_number INTEGER,
    change_type VARCHAR(50),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by_name VARCHAR(255),
    subjective_text TEXT,
    objective_text TEXT,
    assessment_text TEXT,
    plan_text TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.version_number,
        v.change_type,
        v.change_reason,
        v.created_at,
        v.created_by_name,
        v.subjective_text,
        v.objective_text,
        v.assessment_text,
        v.plan_text
    FROM clinical_encounter_versions v
    WHERE v.encounter_id = p_encounter_id
    ORDER BY v.version_number DESC;
END;
$$ LANGUAGE plpgsql;

-- Compare two versions
CREATE OR REPLACE FUNCTION compare_encounter_versions(
    p_encounter_id UUID,
    p_version_a INTEGER,
    p_version_b INTEGER
)
RETURNS TABLE (
    field_name TEXT,
    version_a_value TEXT,
    version_b_value TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH version_a AS (
        SELECT * FROM clinical_encounter_versions
        WHERE encounter_id = p_encounter_id AND version_number = p_version_a
    ),
    version_b AS (
        SELECT * FROM clinical_encounter_versions
        WHERE encounter_id = p_encounter_id AND version_number = p_version_b
    )
    SELECT
        'subjective'::TEXT as field_name,
        a.subjective_text,
        b.subjective_text
    FROM version_a a, version_b b
    WHERE a.subjective_text IS DISTINCT FROM b.subjective_text
    UNION ALL
    SELECT
        'objective'::TEXT,
        a.objective_text,
        b.objective_text
    FROM version_a a, version_b b
    WHERE a.objective_text IS DISTINCT FROM b.objective_text
    UNION ALL
    SELECT
        'assessment'::TEXT,
        a.assessment_text,
        b.assessment_text
    FROM version_a a, version_b b
    WHERE a.assessment_text IS DISTINCT FROM b.assessment_text
    UNION ALL
    SELECT
        'plan'::TEXT,
        a.plan_text,
        b.plan_text
    FROM version_a a, version_b b
    WHERE a.plan_text IS DISTINCT FROM b.plan_text;
END;
$$ LANGUAGE plpgsql;

-- Get version count for an encounter
CREATE OR REPLACE FUNCTION get_encounter_version_count(p_encounter_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_val INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO count_val
    FROM clinical_encounter_versions
    WHERE encounter_id = p_encounter_id;
    RETURN count_val;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE clinical_encounter_versions IS 'Complete version history for clinical encounters - Norwegian healthcare compliance (Pasientjournalloven)';
COMMENT ON COLUMN clinical_encounter_versions.change_type IS 'Type of change: CREATE, UPDATE, ADDENDUM, CORRECTION, LOCK';
COMMENT ON COLUMN clinical_encounter_versions.change_reason IS 'Required for CORRECTION type per Norwegian law';
COMMENT ON COLUMN clinical_encounter_versions.signature_hash IS 'SHA-256 hash for tamper detection';
