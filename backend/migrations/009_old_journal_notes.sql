-- Migration: Old Journal Notes Import System
-- This migration creates tables for importing and organizing old patient journal notes

-- Table to store imported old journal notes before processing
CREATE TABLE IF NOT EXISTS imported_journal_notes (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Original note data
    original_content TEXT NOT NULL,
    original_filename VARCHAR(255),
    upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by INTEGER REFERENCES users(id),

    -- Processing status
    processing_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, reviewed

    -- AI-processed data
    ai_organized_data JSONB, -- Structured data organized by AI
    ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    ai_processing_date TIMESTAMPTZ,
    ai_model_used VARCHAR(100),

    -- Generated SOAP format
    generated_soap JSONB, -- {subjective, objective, assessment, plan}
    suggested_encounter_date DATE,
    suggested_encounter_type VARCHAR(50), -- INITIAL, FOLLOWUP, REEXAM, etc.
    suggested_diagnosis_codes TEXT[], -- Array of suggested ICPC-2/ICD-10 codes

    -- Review and approval
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_date TIMESTAMPTZ,
    review_notes TEXT,
    approved BOOLEAN DEFAULT false,

    -- Conversion to clinical encounter
    converted_to_encounter_id INTEGER REFERENCES clinical_encounters(id),
    conversion_date TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_imported_notes_patient ON imported_journal_notes(patient_id);
CREATE INDEX idx_imported_notes_org ON imported_journal_notes(organization_id);
CREATE INDEX idx_imported_notes_status ON imported_journal_notes(processing_status);
CREATE INDEX idx_imported_notes_upload_date ON imported_journal_notes(upload_date DESC);
CREATE INDEX idx_imported_notes_approved ON imported_journal_notes(approved) WHERE approved = true;

-- Table for tracking batches of imported notes (if uploading multiple files at once)
CREATE TABLE IF NOT EXISTS imported_notes_batches (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE, -- NULL if batch contains multiple patients

    batch_name VARCHAR(255),
    total_notes INTEGER NOT NULL DEFAULT 0,
    processed_notes INTEGER NOT NULL DEFAULT 0,
    approved_notes INTEGER NOT NULL DEFAULT 0,

    uploaded_by INTEGER REFERENCES users(id),
    upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    batch_status VARCHAR(50) NOT NULL DEFAULT 'uploading', -- uploading, processing, completed, failed

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link table between batches and individual notes
CREATE TABLE IF NOT EXISTS batch_notes (
    batch_id INTEGER NOT NULL REFERENCES imported_notes_batches(id) ON DELETE CASCADE,
    note_id INTEGER NOT NULL REFERENCES imported_journal_notes(id) ON DELETE CASCADE,
    PRIMARY KEY (batch_id, note_id)
);

-- Indexes
CREATE INDEX idx_batches_org ON imported_notes_batches(organization_id);
CREATE INDEX idx_batches_patient ON imported_notes_batches(patient_id);
CREATE INDEX idx_batches_status ON imported_notes_batches(batch_status);
CREATE INDEX idx_batch_notes_batch ON batch_notes(batch_id);
CREATE INDEX idx_batch_notes_note ON batch_notes(note_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_imported_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_imported_journal_notes_updated_at
    BEFORE UPDATE ON imported_journal_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_imported_notes_updated_at();

CREATE TRIGGER update_imported_notes_batches_updated_at
    BEFORE UPDATE ON imported_notes_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_imported_notes_updated_at();

-- Comments
COMMENT ON TABLE imported_journal_notes IS 'Stores old journal notes imported for AI processing and organization';
COMMENT ON TABLE imported_notes_batches IS 'Tracks batches of imported notes for bulk processing';
COMMENT ON COLUMN imported_journal_notes.ai_organized_data IS 'Structured data extracted by AI, including entities, dates, symptoms, treatments, etc.';
COMMENT ON COLUMN imported_journal_notes.generated_soap IS 'AI-generated SOAP format ready for clinical encounter creation';
COMMENT ON COLUMN imported_journal_notes.ai_confidence_score IS 'AI confidence in the organization quality (0.00-1.00)';
