-- Migration: Encounter Amendments
-- Allows adding amendments/addenda to signed clinical encounters

-- Encounter amendments table
CREATE TABLE IF NOT EXISTS encounter_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),

    -- Amendment content
    amendment_type VARCHAR(50) NOT NULL DEFAULT 'ADDENDUM', -- ADDENDUM, CORRECTION, CLARIFICATION, LATE_ENTRY
    reason TEXT, -- Reason for the amendment (required for corrections)
    content TEXT NOT NULL, -- The amendment text

    -- Affected sections (optional - for clarity about what was amended)
    affected_sections JSONB DEFAULT '[]', -- e.g., ["subjective", "assessment"]

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Signing (amendments must also be signed)
    signed_at TIMESTAMPTZ,
    signed_by UUID REFERENCES users(id),

    -- Indexes
    CONSTRAINT fk_amendment_encounter FOREIGN KEY (encounter_id) REFERENCES clinical_encounters(id),
    CONSTRAINT fk_amendment_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_amendment_author FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_amendments_encounter_id ON encounter_amendments(encounter_id);
CREATE INDEX IF NOT EXISTS idx_amendments_organization_id ON encounter_amendments(organization_id);
CREATE INDEX IF NOT EXISTS idx_amendments_author_id ON encounter_amendments(author_id);
CREATE INDEX IF NOT EXISTS idx_amendments_created_at ON encounter_amendments(created_at DESC);

-- Amendment types enum comment
COMMENT ON COLUMN encounter_amendments.amendment_type IS 'Type of amendment: ADDENDUM (new info), CORRECTION (fix error), CLARIFICATION (explain existing), LATE_ENTRY (info added late)';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_amendment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_amendment_timestamp
    BEFORE UPDATE ON encounter_amendments
    FOR EACH ROW
    EXECUTE FUNCTION update_amendment_timestamp();
