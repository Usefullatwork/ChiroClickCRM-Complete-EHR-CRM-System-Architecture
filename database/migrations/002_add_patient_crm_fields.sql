-- Migration: Add CRM and Marketing Fields to Patients Table
-- Based on existing Excel CRM structure
-- Date: 2025-11-18

-- Add preferred therapist/practitioner
ALTER TABLE patients
ADD COLUMN preferred_therapist_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add preferred contact method
ALTER TABLE patients
ADD COLUMN preferred_contact_method VARCHAR(30) CHECK (preferred_contact_method IN ('SMS', 'EMAIL', 'PHONE', 'MAIL', 'NO_CONTACT'));

-- Add language preference
ALTER TABLE patients
ADD COLUMN language VARCHAR(10) CHECK (language IN ('NO', 'EN', 'OTHER')) DEFAULT 'NO';

-- Add main problem/chief complaint
ALTER TABLE patients
ADD COLUMN main_problem VARCHAR(255);

-- Add treatment type preference
ALTER TABLE patients
ADD COLUMN treatment_type VARCHAR(50) CHECK (treatment_type IN ('KIROPRAKTOR', 'NEVROBEHANDLING', 'MUSKELBEHANDLING', 'OTHER'));

-- Add general notes (patient-facing, non-clinical)
ALTER TABLE patients
ADD COLUMN general_notes TEXT;

-- Add follow-up tracking
ALTER TABLE patients
ADD COLUMN should_be_followed_up DATE;

ALTER TABLE patients
ADD COLUMN needs_feedback BOOLEAN DEFAULT false;

-- Add referral tracking
ALTER TABLE patients
ADD COLUMN has_given_referral BOOLEAN DEFAULT false;

-- Add video marketing consent
ALTER TABLE patients
ADD COLUMN consent_video_marketing BOOLEAN DEFAULT false;

ALTER TABLE patients
ADD COLUMN video_consent_location VARCHAR(255);

-- Create index for preferred therapist lookups
CREATE INDEX idx_patients_preferred_therapist ON patients(preferred_therapist_id);

-- Create index for follow-up queries
CREATE INDEX idx_patients_follow_up ON patients(should_be_followed_up) WHERE should_be_followed_up IS NOT NULL;

-- Create index for language
CREATE INDEX idx_patients_language ON patients(language);

-- Add comments for documentation
COMMENT ON COLUMN patients.preferred_therapist_id IS 'Preferred practitioner (Mads, Andre, Mikael, Edle, etc.)';
COMMENT ON COLUMN patients.preferred_contact_method IS 'How patient prefers to be contacted';
COMMENT ON COLUMN patients.language IS 'Patient language preference (Norwegian, English, Other)';
COMMENT ON COLUMN patients.main_problem IS 'Primary complaint or reason for visit (Hovedproblem)';
COMMENT ON COLUMN patients.treatment_type IS 'Type of treatment patient receives (Kiropraktor, Nevrobehandling, etc.)';
COMMENT ON COLUMN patients.general_notes IS 'General CRM notes (non-clinical, patient-facing)';
COMMENT ON COLUMN patients.should_be_followed_up IS 'Date when patient should be followed up (Burde Vært Fulgt opp)';
COMMENT ON COLUMN patients.needs_feedback IS 'Whether patient needs feedback/callback';
COMMENT ON COLUMN patients.has_given_referral IS 'Whether this patient has referred others';
COMMENT ON COLUMN patients.consent_video_marketing IS 'Consent for video marketing';
COMMENT ON COLUMN patients.video_consent_location IS 'Where video consent was obtained';
