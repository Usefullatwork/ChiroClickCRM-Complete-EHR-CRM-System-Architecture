-- ============================================================================
-- Migration 020: Enhanced Clinical Note Versioning for Legal Compliance
-- ChiroClickCRM - Norwegian EHR/CRM System
-- Created: 2026-01-03
-- ============================================================================
-- PURPOSE: Enhanced versioning for Pasientjournalloven (Norwegian Patient Records Act)
-- compliance. All clinical note changes must be tracked with complete audit trail.
-- This migration enhances the existing clinical_encounter_versions table.
-- ============================================================================

-- ============================================================================
-- ENHANCED CLINICAL ENCOUNTER VERSIONS TABLE
-- ============================================================================

-- Add additional columns for enhanced tracking if they don't exist
ALTER TABLE clinical_encounter_versions
ADD COLUMN IF NOT EXISTS old_subjective TEXT,
ADD COLUMN IF NOT EXISTS old_objective TEXT,
ADD COLUMN IF NOT EXISTS old_assessment TEXT,
ADD COLUMN IF NOT EXISTS old_plan TEXT,
ADD COLUMN IF NOT EXISTS old_evaluation TEXT,
ADD COLUMN IF NOT EXISTS changed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS amendment_to_version INTEGER,
ADD COLUMN IF NOT EXISTS requires_cosign BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cosigned_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS cosigned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS legal_hold_reason TEXT,
ADD COLUMN IF NOT EXISTS legal_hold_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS legal_hold_at TIMESTAMP;

-- Create index on old values for searching historical content
CREATE INDEX IF NOT EXISTS idx_encounter_versions_old_content
ON clinical_encounter_versions USING gin(
    to_tsvector('norwegian',
        COALESCE(old_subjective, '') || ' ' ||
        COALESCE(old_objective, '') || ' ' ||
        COALESCE(old_assessment, '') || ' ' ||
        COALESCE(old_plan, '') || ' ' ||
        COALESCE(old_evaluation, '')
    )
);

-- Index for legal hold searches
CREATE INDEX IF NOT EXISTS idx_encounter_versions_legal_hold
ON clinical_encounter_versions(legal_hold, legal_hold_at)
WHERE legal_hold = true;

-- Index for changes by user
CREATE INDEX IF NOT EXISTS idx_encounter_versions_changed_by
ON clinical_encounter_versions(changed_by, changed_at DESC);

-- Index for amendment tracking
CREATE INDEX IF NOT EXISTS idx_encounter_versions_amendment
ON clinical_encounter_versions(encounter_id, amendment_to_version)
WHERE amendment_to_version IS NOT NULL;

-- ============================================================================
-- ENHANCED TRIGGER: Save old values on UPDATE
-- ============================================================================

-- Drop existing trigger to replace with enhanced version
DROP TRIGGER IF EXISTS trigger_version_clinical_encounter ON clinical_encounters;
DROP FUNCTION IF EXISTS create_encounter_version();

-- Create enhanced function to automatically version on updates
CREATE OR REPLACE FUNCTION create_encounter_version_enhanced()
RETURNS TRIGGER AS $$
DECLARE
    new_version_number INTEGER;
    previous_version_rec RECORD;
    changes JSONB;
    v_changed_by UUID;
    v_change_type VARCHAR(50);
    v_change_reason VARCHAR(255);
BEGIN
    -- Get current max version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO new_version_number
    FROM clinical_encounter_versions
    WHERE encounter_id = NEW.id;

    -- Get previous version for comparison
    SELECT *
    INTO previous_version_rec
    FROM clinical_encounter_versions
    WHERE encounter_id = NEW.id
    ORDER BY version_number DESC
    LIMIT 1;

    -- Determine who made the change
    v_changed_by := COALESCE(NEW.updated_by, NEW.practitioner_id);

    -- Determine change type
    IF TG_OP = 'INSERT' THEN
        v_change_type := 'create';
        v_change_reason := 'Initial creation';
    ELSIF previous_version_rec.is_signed = true THEN
        v_change_type := 'amendment';
        v_change_reason := 'Amendment to signed note - requires documentation';
    ELSE
        v_change_type := 'update';
    END IF;

    -- Build detailed changes summary
    changes := jsonb_build_object(
        'subjective_changed', (OLD.subjective IS DISTINCT FROM NEW.subjective),
        'objective_changed', (OLD.objective IS DISTINCT FROM NEW.objective),
        'assessment_changed', (OLD.assessment IS DISTINCT FROM NEW.assessment),
        'plan_changed', (OLD.plan IS DISTINCT FROM NEW.plan),
        'evaluation_changed', (OLD.evaluation IS DISTINCT FROM NEW.evaluation),
        'icpc_codes_changed', (OLD.icpc_codes IS DISTINCT FROM NEW.icpc_codes),
        'icd10_codes_changed', (OLD.icd10_codes IS DISTINCT FROM NEW.icd10_codes),
        'treatment_codes_changed', (OLD.treatment_codes IS DISTINCT FROM NEW.treatment_codes),
        'region_treated_changed', (OLD.region_treated IS DISTINCT FROM NEW.region_treated),
        'change_timestamp', NOW(),
        'change_operation', TG_OP
    );

    -- Insert new version with old values preserved
    INSERT INTO clinical_encounter_versions (
        encounter_id,
        version_number,
        patient_id,
        practitioner_id,
        encounter_date,
        -- Current values
        subjective,
        objective,
        assessment,
        plan,
        evaluation,
        -- Old values (for UPDATE only)
        old_subjective,
        old_objective,
        old_assessment,
        old_plan,
        old_evaluation,
        -- Codes
        icpc_codes,
        icd10_codes,
        treatment_codes,
        region_treated,
        -- Version control
        created_by,
        created_at,
        changed_by,
        changed_at,
        change_type,
        change_reason,
        previous_version_id,
        changes_summary,
        -- Amendment tracking
        amendment_to_version,
        -- Signature status
        is_signed,
        signed_at,
        signed_by
    ) VALUES (
        NEW.id,
        new_version_number,
        NEW.patient_id,
        NEW.practitioner_id,
        NEW.encounter_date,
        -- Current values
        NEW.subjective,
        NEW.objective,
        NEW.assessment,
        NEW.plan,
        NEW.evaluation,
        -- Old values (NULL for INSERT, OLD values for UPDATE)
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.subjective ELSE NULL END,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.objective ELSE NULL END,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.assessment ELSE NULL END,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.plan ELSE NULL END,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.evaluation ELSE NULL END,
        -- Codes
        NEW.icpc_codes,
        NEW.icd10_codes,
        NEW.treatment_codes,
        NEW.region_treated,
        -- Version control
        v_changed_by,
        NOW(),
        v_changed_by,
        NOW(),
        v_change_type,
        v_change_reason,
        previous_version_rec.id,
        changes,
        -- Amendment tracking (link to signed version if amending)
        CASE WHEN previous_version_rec.is_signed = true THEN previous_version_rec.version_number ELSE NULL END,
        -- Signature status (inherit from encounter)
        NEW.is_signed,
        NEW.signed_at,
        NEW.signed_by
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enhanced trigger
CREATE TRIGGER trigger_version_clinical_encounter_enhanced
AFTER INSERT OR UPDATE ON clinical_encounters
FOR EACH ROW
EXECUTE FUNCTION create_encounter_version_enhanced();

COMMENT ON TRIGGER trigger_version_clinical_encounter_enhanced ON clinical_encounters
IS 'Pasientjournalloven compliant: Creates complete version history with old values preserved';

-- ============================================================================
-- FUNCTION: Get detailed change history between versions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_encounter_version_diff(
    p_encounter_id UUID,
    p_version_from INTEGER,
    p_version_to INTEGER
)
RETURNS TABLE (
    field_name VARCHAR,
    old_value TEXT,
    new_value TEXT,
    changed_by_name VARCHAR,
    changed_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    WITH v_from AS (
        SELECT * FROM clinical_encounter_versions
        WHERE encounter_id = p_encounter_id AND version_number = p_version_from
    ),
    v_to AS (
        SELECT * FROM clinical_encounter_versions
        WHERE encounter_id = p_encounter_id AND version_number = p_version_to
    )
    SELECT
        field::VARCHAR,
        old_val::TEXT,
        new_val::TEXT,
        u.name::VARCHAR,
        v_to.changed_at
    FROM v_from, v_to
    LEFT JOIN users u ON v_to.changed_by = u.id
    CROSS JOIN LATERAL (
        VALUES
            ('subjective', v_from.subjective, v_to.subjective),
            ('objective', v_from.objective, v_to.objective),
            ('assessment', v_from.assessment, v_to.assessment),
            ('plan', v_from.plan, v_to.plan),
            ('evaluation', v_from.evaluation, v_to.evaluation)
    ) AS changes(field, old_val, new_val)
    WHERE old_val IS DISTINCT FROM new_val;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_encounter_version_diff
IS 'Compare two versions of a clinical encounter and return field-by-field differences';

-- ============================================================================
-- FUNCTION: Place encounter under legal hold
-- ============================================================================

CREATE OR REPLACE FUNCTION place_encounter_legal_hold(
    p_encounter_id UUID,
    p_reason TEXT,
    p_placed_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Mark all versions as under legal hold
    UPDATE clinical_encounter_versions
    SET
        legal_hold = true,
        legal_hold_reason = p_reason,
        legal_hold_by = p_placed_by,
        legal_hold_at = NOW()
    WHERE encounter_id = p_encounter_id;

    -- Log this action
    INSERT INTO audit_log (
        action_type,
        user_id,
        resource_type,
        resource_id,
        changes,
        metadata
    ) VALUES (
        'encounter.legal_hold',
        p_placed_by,
        'clinical_encounter',
        p_encounter_id,
        jsonb_build_object('reason', p_reason),
        jsonb_build_object('action', 'place_legal_hold')
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION place_encounter_legal_hold
IS 'Place clinical encounter under legal hold - prevents deletion, required for legal proceedings';

-- ============================================================================
-- FUNCTION: Remove legal hold (requires authorization)
-- ============================================================================

CREATE OR REPLACE FUNCTION remove_encounter_legal_hold(
    p_encounter_id UUID,
    p_reason TEXT,
    p_removed_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Remove legal hold from all versions
    UPDATE clinical_encounter_versions
    SET
        legal_hold = false
    WHERE encounter_id = p_encounter_id;

    -- Log this action
    INSERT INTO audit_log (
        action_type,
        user_id,
        resource_type,
        resource_id,
        changes,
        metadata
    ) VALUES (
        'encounter.legal_hold_removed',
        p_removed_by,
        'clinical_encounter',
        p_encounter_id,
        jsonb_build_object('reason', p_reason),
        jsonb_build_object('action', 'remove_legal_hold')
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Create amendment to signed note (Pasientjournalloven requirement)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_encounter_amendment(
    p_encounter_id UUID,
    p_field_name VARCHAR,
    p_amendment_text TEXT,
    p_reason VARCHAR,
    p_amended_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_current_version RECORD;
    v_amendment_id UUID;
    v_new_version_number INTEGER;
BEGIN
    -- Get current version
    SELECT * INTO v_current_version
    FROM clinical_encounter_versions
    WHERE encounter_id = p_encounter_id
    ORDER BY version_number DESC
    LIMIT 1;

    -- Verify note is signed
    IF v_current_version.is_signed = false THEN
        RAISE EXCEPTION 'Cannot create amendment for unsigned note. Use regular update instead.';
    END IF;

    -- Get next version number
    v_new_version_number := v_current_version.version_number + 1;

    -- Create amendment version
    INSERT INTO clinical_encounter_versions (
        id,
        encounter_id,
        version_number,
        patient_id,
        practitioner_id,
        encounter_date,
        subjective,
        objective,
        assessment,
        plan,
        evaluation,
        old_subjective,
        old_objective,
        old_assessment,
        old_plan,
        old_evaluation,
        icpc_codes,
        icd10_codes,
        treatment_codes,
        region_treated,
        created_by,
        created_at,
        changed_by,
        changed_at,
        change_type,
        change_reason,
        previous_version_id,
        amendment_to_version,
        changes_summary,
        is_signed,
        requires_cosign
    ) VALUES (
        gen_random_uuid(),
        p_encounter_id,
        v_new_version_number,
        v_current_version.patient_id,
        v_current_version.practitioner_id,
        v_current_version.encounter_date,
        -- Apply amendment based on field
        CASE WHEN p_field_name = 'subjective'
            THEN v_current_version.subjective || E'\n\n[AMENDMENT ' || NOW() || ']: ' || p_amendment_text
            ELSE v_current_version.subjective END,
        CASE WHEN p_field_name = 'objective'
            THEN v_current_version.objective || E'\n\n[AMENDMENT ' || NOW() || ']: ' || p_amendment_text
            ELSE v_current_version.objective END,
        CASE WHEN p_field_name = 'assessment'
            THEN v_current_version.assessment || E'\n\n[AMENDMENT ' || NOW() || ']: ' || p_amendment_text
            ELSE v_current_version.assessment END,
        CASE WHEN p_field_name = 'plan'
            THEN v_current_version.plan || E'\n\n[AMENDMENT ' || NOW() || ']: ' || p_amendment_text
            ELSE v_current_version.plan END,
        CASE WHEN p_field_name = 'evaluation'
            THEN v_current_version.evaluation || E'\n\n[AMENDMENT ' || NOW() || ']: ' || p_amendment_text
            ELSE v_current_version.evaluation END,
        -- Store old values
        v_current_version.subjective,
        v_current_version.objective,
        v_current_version.assessment,
        v_current_version.plan,
        v_current_version.evaluation,
        v_current_version.icpc_codes,
        v_current_version.icd10_codes,
        v_current_version.treatment_codes,
        v_current_version.region_treated,
        p_amended_by,
        NOW(),
        p_amended_by,
        NOW(),
        'amendment',
        p_reason,
        v_current_version.id,
        v_current_version.version_number,
        jsonb_build_object(
            'amended_field', p_field_name,
            'amendment_text', p_amendment_text,
            'original_version', v_current_version.version_number
        ),
        false, -- Not signed yet
        true   -- Requires cosign
    )
    RETURNING id INTO v_amendment_id;

    -- Log the amendment
    INSERT INTO audit_log (
        action_type,
        user_id,
        resource_type,
        resource_id,
        changes,
        metadata
    ) VALUES (
        'encounter.amendment_created',
        p_amended_by,
        'clinical_encounter',
        p_encounter_id,
        jsonb_build_object(
            'field', p_field_name,
            'reason', p_reason,
            'amendment_version', v_new_version_number
        ),
        jsonb_build_object('amendment_id', v_amendment_id)
    );

    RETURN v_amendment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_encounter_amendment
IS 'Pasientjournalloven: Creates formal amendment to signed clinical note with full audit trail';

-- ============================================================================
-- VIEW: Encounters requiring cosignature
-- ============================================================================

CREATE OR REPLACE VIEW encounters_pending_cosign AS
SELECT
    v.id as version_id,
    v.encounter_id,
    v.version_number,
    v.created_by,
    u_created.name as created_by_name,
    v.created_at,
    v.change_type,
    v.change_reason,
    e.patient_id,
    p.first_name || ' ' || p.last_name as patient_name
FROM clinical_encounter_versions v
JOIN clinical_encounters e ON v.encounter_id = e.id
JOIN patients p ON e.patient_id = p.id
LEFT JOIN users u_created ON v.created_by = u_created.id
WHERE v.requires_cosign = true
  AND v.cosigned_by IS NULL
ORDER BY v.created_at DESC;

COMMENT ON VIEW encounters_pending_cosign IS 'Clinical notes/amendments requiring cosignature';

-- ============================================================================
-- VIEW: Legal hold encounters
-- ============================================================================

CREATE OR REPLACE VIEW encounters_under_legal_hold AS
SELECT DISTINCT ON (v.encounter_id)
    v.encounter_id,
    e.patient_id,
    p.first_name || ' ' || p.last_name as patient_name,
    v.legal_hold_reason,
    v.legal_hold_at,
    u.name as held_by_name,
    e.encounter_date
FROM clinical_encounter_versions v
JOIN clinical_encounters e ON v.encounter_id = e.id
JOIN patients p ON e.patient_id = p.id
LEFT JOIN users u ON v.legal_hold_by = u.id
WHERE v.legal_hold = true
ORDER BY v.encounter_id, v.legal_hold_at DESC;

COMMENT ON VIEW encounters_under_legal_hold IS 'All clinical encounters currently under legal hold';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN clinical_encounter_versions.old_subjective IS 'Previous value before change - required for audit trail';
COMMENT ON COLUMN clinical_encounter_versions.old_objective IS 'Previous value before change - required for audit trail';
COMMENT ON COLUMN clinical_encounter_versions.old_assessment IS 'Previous value before change - required for audit trail';
COMMENT ON COLUMN clinical_encounter_versions.old_plan IS 'Previous value before change - required for audit trail';
COMMENT ON COLUMN clinical_encounter_versions.old_evaluation IS 'Previous value before change - required for audit trail';
COMMENT ON COLUMN clinical_encounter_versions.changed_by IS 'User who made the change';
COMMENT ON COLUMN clinical_encounter_versions.changed_at IS 'Timestamp of the change';
COMMENT ON COLUMN clinical_encounter_versions.amendment_to_version IS 'If this is an amendment, which version it amends';
COMMENT ON COLUMN clinical_encounter_versions.requires_cosign IS 'Whether this version requires cosignature (student notes, amendments)';
COMMENT ON COLUMN clinical_encounter_versions.legal_hold IS 'Whether this version is under legal hold (litigation, investigation)';

-- ============================================================================
-- GRANT PERMISSIONS (uncomment for production)
-- ============================================================================

-- GRANT SELECT, INSERT ON clinical_encounter_versions TO chiroclickcrm_app;
-- GRANT SELECT ON encounters_pending_cosign TO chiroclickcrm_app;
-- GRANT SELECT ON encounters_under_legal_hold TO chiroclickcrm_app;
-- GRANT EXECUTE ON FUNCTION create_encounter_version_enhanced TO chiroclickcrm_app;
-- GRANT EXECUTE ON FUNCTION get_encounter_version_diff TO chiroclickcrm_app;
-- GRANT EXECUTE ON FUNCTION create_encounter_amendment TO chiroclickcrm_app;
-- GRANT EXECUTE ON FUNCTION place_encounter_legal_hold TO chiroclickcrm_admin;
-- GRANT EXECUTE ON FUNCTION remove_encounter_legal_hold TO chiroclickcrm_admin;

COMMENT ON SCHEMA public IS 'ChiroClickCRM v4.3 - Added Enhanced Clinical Note Versioning (Pasientjournalloven)';
