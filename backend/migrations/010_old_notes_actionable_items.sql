-- Migration: Enhanced Old Journal Notes with Actionable Items
-- Adds task tracking, follow-up items, and communication history extraction

-- Table for actionable items extracted from old notes
CREATE TABLE IF NOT EXISTS old_note_actionable_items (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES imported_journal_notes(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Item details
    item_type VARCHAR(50) NOT NULL, -- FOLLOW_UP, TODO, SEND_NOTE, CALL_PATIENT, PRESCRIPTION, REFERRAL, TEST_RESULT, REMINDER, OTHER
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Scheduling
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT

    -- Status tracking
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by INTEGER REFERENCES users(id),

    -- Assignment
    assigned_to INTEGER REFERENCES users(id),

    -- Context from AI extraction
    original_text TEXT, -- The original text from note that generated this item
    ai_confidence DECIMAL(3,2), -- How confident AI is about this item

    -- Follow-up integration
    followup_id INTEGER REFERENCES follow_ups(id), -- Link to follow-up system if converted

    -- Notes and updates
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_actionable_items_note ON old_note_actionable_items(note_id);
CREATE INDEX idx_actionable_items_patient ON old_note_actionable_items(patient_id);
CREATE INDEX idx_actionable_items_status ON old_note_actionable_items(status);
CREATE INDEX idx_actionable_items_completed ON old_note_actionable_items(completed) WHERE completed = false;
CREATE INDEX idx_actionable_items_due_date ON old_note_actionable_items(due_date) WHERE due_date IS NOT NULL AND completed = false;
CREATE INDEX idx_actionable_items_assigned ON old_note_actionable_items(assigned_to) WHERE completed = false;
CREATE INDEX idx_actionable_items_type ON old_note_actionable_items(item_type);

-- Table for communication history extracted from old notes
CREATE TABLE IF NOT EXISTS old_note_communications (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES imported_journal_notes(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Communication details
    communication_type VARCHAR(50) NOT NULL, -- SMS, EMAIL, PHONE_CALL, LETTER, IN_PERSON
    communication_date DATE,
    subject VARCHAR(255),
    content TEXT,
    direction VARCHAR(20), -- OUTGOING, INCOMING

    -- Context
    original_text TEXT, -- Original text from note
    ai_extracted BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_note_comms_note ON old_note_communications(note_id);
CREATE INDEX idx_note_comms_patient ON old_note_communications(patient_id);
CREATE INDEX idx_note_comms_type ON old_note_communications(communication_type);
CREATE INDEX idx_note_comms_date ON old_note_communications(communication_date DESC);

-- Table for tracking what information is missing from old notes (for data quality)
CREATE TABLE IF NOT EXISTS old_note_missing_info (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES imported_journal_notes(id) ON DELETE CASCADE,

    missing_field VARCHAR(100) NOT NULL, -- e.g., 'diagnosis', 'treatment_plan', 'follow_up_date'
    importance VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
    can_be_inferred BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_missing_info_note ON old_note_missing_info(note_id);
CREATE INDEX idx_missing_info_field ON old_note_missing_info(missing_field);

-- Add new fields to imported_journal_notes table
ALTER TABLE imported_journal_notes ADD COLUMN IF NOT EXISTS actionable_items_count INTEGER DEFAULT 0;
ALTER TABLE imported_journal_notes ADD COLUMN IF NOT EXISTS actionable_items_completed INTEGER DEFAULT 0;
ALTER TABLE imported_journal_notes ADD COLUMN IF NOT EXISTS has_follow_up_needed BOOLEAN DEFAULT false;
ALTER TABLE imported_journal_notes ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE imported_journal_notes ADD COLUMN IF NOT EXISTS communication_history_extracted BOOLEAN DEFAULT false;
ALTER TABLE imported_journal_notes ADD COLUMN IF NOT EXISTS tags TEXT[]; -- e.g., ['urgent', 'requires_callback', 'referral_needed']

-- Trigger to update actionable items count
CREATE OR REPLACE FUNCTION update_actionable_items_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE imported_journal_notes
        SET actionable_items_count = actionable_items_count + 1
        WHERE id = NEW.note_id;

        IF NEW.completed THEN
            UPDATE imported_journal_notes
            SET actionable_items_completed = actionable_items_completed + 1
            WHERE id = NEW.note_id;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.completed AND NOT OLD.completed THEN
            UPDATE imported_journal_notes
            SET actionable_items_completed = actionable_items_completed + 1
            WHERE id = NEW.note_id;
        ELSIF NOT NEW.completed AND OLD.completed THEN
            UPDATE imported_journal_notes
            SET actionable_items_completed = actionable_items_completed - 1
            WHERE id = NEW.note_id;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE imported_journal_notes
        SET actionable_items_count = actionable_items_count - 1
        WHERE id = OLD.note_id;

        IF OLD.completed THEN
            UPDATE imported_journal_notes
            SET actionable_items_completed = actionable_items_completed - 1
            WHERE id = OLD.note_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_actionable_items_count
    AFTER INSERT OR UPDATE OR DELETE ON old_note_actionable_items
    FOR EACH ROW
    EXECUTE FUNCTION update_actionable_items_count();

-- Trigger for updated_at
CREATE TRIGGER update_old_note_actionable_items_updated_at
    BEFORE UPDATE ON old_note_actionable_items
    FOR EACH ROW
    EXECUTE FUNCTION update_imported_notes_updated_at();

-- Comments
COMMENT ON TABLE old_note_actionable_items IS 'Tasks, follow-ups, and action items extracted from old journal notes';
COMMENT ON TABLE old_note_communications IS 'Communication history extracted from old journal notes';
COMMENT ON TABLE old_note_missing_info IS 'Tracks missing information in old notes for data quality';
COMMENT ON COLUMN old_note_actionable_items.item_type IS 'Type of action needed: FOLLOW_UP, TODO, SEND_NOTE, CALL_PATIENT, etc.';
COMMENT ON COLUMN old_note_actionable_items.ai_confidence IS 'AI confidence score for this extraction (0.00-1.00)';
COMMENT ON COLUMN imported_journal_notes.tags IS 'Tags for quick filtering: urgent, callback_needed, referral_needed, etc.';
