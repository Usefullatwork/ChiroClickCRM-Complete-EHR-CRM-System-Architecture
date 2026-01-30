-- ============================================================================
-- Migration 028: Clinical Note Amendments
-- ChiroClickCRM - Norwegian EHR/CRM System
-- Created: 2026-01-18
-- ============================================================================
-- PURPOSE: Track amendments to signed clinical notes in compliance with
-- Pasientjournalloven (Norwegian Patient Records Act). Signed notes must
-- remain immutable, but amendments can be added with full audit trail.
-- ============================================================================

-- ============================================================================
-- CLINICAL NOTE AMENDMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_note_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    note_id UUID NOT NULL,

    -- Amendment details
    version INTEGER DEFAULT 1,
    amendment_text TEXT NOT NULL,
    reason VARCHAR(500),

    -- Audit trail
    amended_by UUID REFERENCES users(id),
    amended_at TIMESTAMP DEFAULT NOW(),

    -- Digital signature for amendment
    amendment_hash VARCHAR(128),

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key reference to clinical_notes if it exists with UUID id
-- Note: This may need to be adjusted based on actual clinical_notes schema
-- ALTER TABLE clinical_note_amendments ADD CONSTRAINT fk_note_id
--   FOREIGN KEY (note_id) REFERENCES clinical_notes(id) ON DELETE CASCADE;

-- ============================================================================
-- ADD has_amendments COLUMN TO clinical_notes IF NOT EXISTS
-- ============================================================================

-- Add has_amendments flag to clinical_notes table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clinical_notes'
        AND column_name = 'has_amendments'
    ) THEN
        ALTER TABLE clinical_notes ADD COLUMN has_amendments BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clinical_note_amendments_org
    ON clinical_note_amendments(organization_id);

CREATE INDEX IF NOT EXISTS idx_clinical_note_amendments_note
    ON clinical_note_amendments(note_id);

CREATE INDEX IF NOT EXISTS idx_clinical_note_amendments_amended_by
    ON clinical_note_amendments(amended_by);

CREATE INDEX IF NOT EXISTS idx_clinical_note_amendments_amended_at
    ON clinical_note_amendments(amended_at DESC);

-- Composite index for querying amendments by note and version
CREATE INDEX IF NOT EXISTS idx_clinical_note_amendments_note_version
    ON clinical_note_amendments(note_id, version);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE clinical_note_amendments ENABLE ROW LEVEL SECURITY;

-- RLS Policy for organization isolation
CREATE POLICY amendments_tenant_isolation ON clinical_note_amendments
    USING (organization_id = current_tenant_id());

CREATE POLICY amendments_tenant_insert ON clinical_note_amendments
    FOR INSERT WITH CHECK (organization_id = current_tenant_id());

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_clinical_note_amendments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clinical_note_amendments_updated_at ON clinical_note_amendments;
CREATE TRIGGER clinical_note_amendments_updated_at
    BEFORE UPDATE ON clinical_note_amendments
    FOR EACH ROW EXECUTE FUNCTION update_clinical_note_amendments_timestamp();

-- ============================================================================
-- TRIGGER: Auto-increment version number
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_amendment_version()
RETURNS TRIGGER AS $$
DECLARE
    max_version INTEGER;
BEGIN
    -- Get the maximum version for this note
    SELECT COALESCE(MAX(version), 0) INTO max_version
    FROM clinical_note_amendments
    WHERE note_id = NEW.note_id;

    -- Set the new version
    NEW.version := max_version + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clinical_note_amendments_version ON clinical_note_amendments;
CREATE TRIGGER clinical_note_amendments_version
    BEFORE INSERT ON clinical_note_amendments
    FOR EACH ROW EXECUTE FUNCTION increment_amendment_version();

-- ============================================================================
-- TRIGGER: Generate amendment hash for integrity verification
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_amendment_hash()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate a hash of the amendment content for integrity verification
    NEW.amendment_hash := encode(
        sha256(
            convert_to(
                NEW.note_id::text || NEW.amendment_text || NEW.amended_by::text || NEW.amended_at::text,
                'UTF8'
            )
        ),
        'hex'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clinical_note_amendments_hash ON clinical_note_amendments;
CREATE TRIGGER clinical_note_amendments_hash
    BEFORE INSERT ON clinical_note_amendments
    FOR EACH ROW EXECUTE FUNCTION generate_amendment_hash();

-- ============================================================================
-- VIEW: Note with all amendments
-- ============================================================================

CREATE OR REPLACE VIEW clinical_notes_with_amendments AS
SELECT
    cn.*,
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', cna.id,
                    'version', cna.version,
                    'amendment_text', cna.amendment_text,
                    'reason', cna.reason,
                    'amended_by', cna.amended_by,
                    'amended_at', cna.amended_at
                ) ORDER BY cna.version
            )
            FROM clinical_note_amendments cna
            WHERE cna.note_id = cn.id
        ),
        '[]'::jsonb
    ) as amendments
FROM clinical_notes cn;

COMMENT ON VIEW clinical_notes_with_amendments
    IS 'Clinical notes with all amendments included as JSON array';

-- ============================================================================
-- FUNCTION: Get amendment count for a note
-- ============================================================================

CREATE OR REPLACE FUNCTION get_note_amendment_count(p_note_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM clinical_note_amendments
    WHERE note_id = p_note_id;

    RETURN count_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_note_amendment_count
    IS 'Returns the number of amendments for a clinical note';

-- ============================================================================
-- AUDIT LOGGING FOR AMENDMENTS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_amendment_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        action_type,
        user_id,
        resource_type,
        resource_id,
        organization_id,
        changes,
        metadata,
        created_at
    ) VALUES (
        'clinical_note.amendment_created',
        NEW.amended_by,
        'clinical_note_amendment',
        NEW.id,
        NEW.organization_id,
        jsonb_build_object(
            'note_id', NEW.note_id,
            'version', NEW.version,
            'reason', NEW.reason
        ),
        jsonb_build_object(
            'amendment_hash', NEW.amendment_hash
        ),
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the insert if audit logging fails
        RAISE WARNING 'Failed to log amendment creation: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clinical_note_amendments_audit ON clinical_note_amendments;
CREATE TRIGGER clinical_note_amendments_audit
    AFTER INSERT ON clinical_note_amendments
    FOR EACH ROW EXECUTE FUNCTION log_amendment_creation();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE clinical_note_amendments IS
    'Pasientjournalloven compliant: Tracks amendments to signed clinical notes with full audit trail';

COMMENT ON COLUMN clinical_note_amendments.organization_id IS
    'Organization tenant ID for multi-tenant isolation';

COMMENT ON COLUMN clinical_note_amendments.note_id IS
    'Reference to the original clinical note being amended';

COMMENT ON COLUMN clinical_note_amendments.version IS
    'Auto-incrementing version number for amendments to this note';

COMMENT ON COLUMN clinical_note_amendments.amendment_text IS
    'The amendment content - what is being added or clarified';

COMMENT ON COLUMN clinical_note_amendments.reason IS
    'Reason for the amendment (required for compliance)';

COMMENT ON COLUMN clinical_note_amendments.amended_by IS
    'User who created the amendment';

COMMENT ON COLUMN clinical_note_amendments.amendment_hash IS
    'SHA256 hash for integrity verification';

-- ============================================================================
-- SCHEMA VERSION UPDATE
-- ============================================================================

COMMENT ON SCHEMA public IS 'ChiroClickCRM v4.4 - Added Clinical Note Amendments (Pasientjournalloven)';
