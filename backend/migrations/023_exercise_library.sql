-- ============================================================================
-- Migration 023: Exercise Library and Rehab System
-- Created: 2026-01-29
-- Description: Comprehensive exercise library, prescription system, and program templates
-- ============================================================================

-- ============================================================================
-- EXERCISE LIBRARY
-- Main repository of exercises (both organization-specific and global)
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Info
  code VARCHAR(50) NOT NULL,
  name_no TEXT NOT NULL,
  name_en TEXT,

  -- Categorization
  category VARCHAR(50) NOT NULL, -- 'stretching', 'strengthening', 'mobility', 'balance', 'vestibular'
  body_region VARCHAR(50) NOT NULL, -- 'cervical', 'thoracic', 'lumbar', 'shoulder', 'hip', 'knee', 'ankle', 'core', 'full_body'
  difficulty VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'

  -- Instructions
  instructions_no TEXT NOT NULL,
  instructions_en TEXT,
  contraindications TEXT,
  precautions TEXT,
  common_errors TEXT, -- Common mistakes to avoid

  -- Media
  video_url TEXT,
  image_url TEXT,
  thumbnail_url TEXT,

  -- Dosing Defaults
  default_sets INTEGER DEFAULT 3,
  default_reps INTEGER DEFAULT 10,
  default_hold_seconds INTEGER,
  default_rest_seconds INTEGER DEFAULT 30,
  default_frequency VARCHAR(50) DEFAULT 'daily', -- 'daily', '2x_daily', '3x_week', 'weekly'

  -- Equipment/Requirements
  equipment_needed TEXT[], -- Array of equipment: ['resistance_band', 'foam_roller', 'none']
  requires_supervision BOOLEAN DEFAULT false,

  -- Metadata
  source VARCHAR(100) DEFAULT 'custom', -- 'custom', 'free-exercise-db', 'imported', 'vestibular'
  tags TEXT[], -- Searchable tags: ['mcgill', 'mckenzie', 'brugger', 'nerve_glide']
  is_active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false, -- If true, visible to all organizations
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure code is unique per organization (or globally for system exercises)
  CONSTRAINT unique_exercise_code_per_org UNIQUE (organization_id, code)
);

-- ============================================================================
-- PATIENT EXERCISE PRESCRIPTIONS
-- Individual exercise assignments to patients
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_exercise_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  prescribed_by UUID REFERENCES users(id),

  -- Exercise reference
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE SET NULL,
  -- Denormalized for offline access and historical record
  exercise_code VARCHAR(50) NOT NULL,
  exercise_name TEXT NOT NULL,
  exercise_instructions TEXT,

  -- Custom dosing (overrides exercise defaults)
  sets INTEGER,
  reps INTEGER,
  hold_seconds INTEGER,
  rest_seconds INTEGER,
  frequency VARCHAR(50) DEFAULT 'daily',
  duration_weeks INTEGER DEFAULT 6,
  custom_instructions TEXT,
  progression_notes TEXT, -- Notes on how to progress

  -- Scheduling
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  specific_days TEXT[], -- e.g., ['monday', 'wednesday', 'friday']

  -- Status tracking
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'discontinued', 'paused'
  discontinue_reason TEXT,
  discontinued_at TIMESTAMPTZ,
  discontinued_by UUID REFERENCES users(id),

  -- Compliance tracking (JSONB: {"2025-01-29": {completed: true, pain_level: 3, notes: "Felt good", sets_completed: 3}})
  compliance_log JSONB DEFAULT '{}',

  -- Effectiveness ratings
  patient_rating INTEGER CHECK (patient_rating BETWEEN 1 AND 5),
  patient_feedback TEXT,
  clinician_rating INTEGER CHECK (clinician_rating BETWEEN 1 AND 5),
  clinician_notes TEXT,

  -- Reminders
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TIME,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EXERCISE PROGRAMS (Templates)
-- Reusable collections of exercises for common conditions
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Info
  name_no TEXT NOT NULL,
  name_en TEXT,
  description_no TEXT,
  description_en TEXT,

  -- Target condition/region
  target_condition VARCHAR(100), -- 'neck_pain', 'low_back_pain', 'shoulder_impingement', 'whiplash'
  body_region VARCHAR(50),
  difficulty VARCHAR(20) DEFAULT 'beginner',

  -- Program structure (JSONB array of exercise configurations)
  -- Format: [{
  --   exercise_id: UUID,
  --   exercise_code: string,
  --   exercise_name: string,
  --   order: number,
  --   sets: number,
  --   reps: number,
  --   hold_seconds: number,
  --   frequency: string,
  --   phase: number, // 1, 2, 3 for progression
  --   phase_weeks: number, // weeks before progressing
  --   notes: string
  -- }]
  exercises JSONB NOT NULL DEFAULT '[]',

  -- Program duration
  duration_weeks INTEGER DEFAULT 6,
  phases INTEGER DEFAULT 1, -- Number of progression phases

  -- Metadata
  is_template BOOLEAN DEFAULT true, -- If false, it's a patient's custom program
  is_active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false, -- If true, visible to all organizations
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PATIENT EXERCISE PROGRAMS
-- Instances of programs assigned to patients
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_exercise_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  program_id UUID REFERENCES exercise_programs(id) ON DELETE SET NULL,
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
  prescribed_by UUID REFERENCES users(id),

  -- Program snapshot (denormalized for offline/history)
  program_name TEXT NOT NULL,
  program_description TEXT,

  -- Customizations
  custom_exercises JSONB, -- Override program exercises
  custom_duration_weeks INTEGER,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'discontinued', 'paused'
  current_phase INTEGER DEFAULT 1,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,

  -- Overall compliance
  overall_compliance_percent DECIMAL(5, 2),
  last_activity_date DATE,

  -- Notes
  clinician_notes TEXT,
  patient_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EXERCISE FAVORITES
-- Quick access to frequently used exercises per practitioner
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_exercise_favorite UNIQUE (user_id, exercise_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Exercise Library indexes
CREATE INDEX IF NOT EXISTS idx_exercise_library_org ON exercise_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_exercise_library_category ON exercise_library(category);
CREATE INDEX IF NOT EXISTS idx_exercise_library_body_region ON exercise_library(body_region);
CREATE INDEX IF NOT EXISTS idx_exercise_library_difficulty ON exercise_library(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercise_library_code ON exercise_library(code);
CREATE INDEX IF NOT EXISTS idx_exercise_library_active ON exercise_library(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_exercise_library_global ON exercise_library(is_global) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_exercise_library_tags ON exercise_library USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_exercise_library_search ON exercise_library USING GIN (to_tsvector('norwegian', coalesce(name_no, '') || ' ' || coalesce(instructions_no, '')));

-- Patient Prescription indexes
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_org ON patient_exercise_prescriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_patient ON patient_exercise_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_encounter ON patient_exercise_prescriptions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_status ON patient_exercise_prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_active ON patient_exercise_prescriptions(patient_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_exercise ON patient_exercise_prescriptions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_date ON patient_exercise_prescriptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_patient_prescriptions_compliance ON patient_exercise_prescriptions USING GIN (compliance_log);

-- Exercise Program indexes
CREATE INDEX IF NOT EXISTS idx_exercise_programs_org ON exercise_programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_exercise_programs_condition ON exercise_programs(target_condition);
CREATE INDEX IF NOT EXISTS idx_exercise_programs_region ON exercise_programs(body_region);
CREATE INDEX IF NOT EXISTS idx_exercise_programs_active ON exercise_programs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_exercise_programs_global ON exercise_programs(is_global) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_exercise_programs_exercises ON exercise_programs USING GIN (exercises);

-- Patient Program indexes
CREATE INDEX IF NOT EXISTS idx_patient_programs_org ON patient_exercise_programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_patient_programs_patient ON patient_exercise_programs(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_programs_status ON patient_exercise_programs(status);
CREATE INDEX IF NOT EXISTS idx_patient_programs_active ON patient_exercise_programs(patient_id, status) WHERE status = 'active';

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_exercise_favorites_user ON exercise_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_favorites_exercise ON exercise_favorites(exercise_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update exercise library updated_at timestamp
CREATE OR REPLACE FUNCTION update_exercise_library_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate prescription compliance percentage
CREATE OR REPLACE FUNCTION calculate_prescription_compliance(prescription_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  log JSONB;
  total_days INTEGER := 0;
  completed_days INTEGER := 0;
  entry JSONB;
BEGIN
  SELECT compliance_log INTO log FROM patient_exercise_prescriptions WHERE id = prescription_id;

  IF log IS NULL OR log = '{}'::jsonb THEN
    RETURN 0;
  END IF;

  FOR entry IN SELECT value FROM jsonb_each(log)
  LOOP
    total_days := total_days + 1;
    IF (entry->>'completed')::boolean = true THEN
      completed_days := completed_days + 1;
    END IF;
  END LOOP;

  IF total_days = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((completed_days::decimal / total_days::decimal) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get patient's active exercises with compliance
CREATE OR REPLACE FUNCTION get_patient_active_exercises(p_patient_id UUID, p_org_id UUID)
RETURNS TABLE (
  prescription_id UUID,
  exercise_name TEXT,
  exercise_code VARCHAR(50),
  sets INTEGER,
  reps INTEGER,
  frequency VARCHAR(50),
  start_date DATE,
  days_active INTEGER,
  compliance_percent DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pep.id,
    pep.exercise_name,
    pep.exercise_code,
    pep.sets,
    pep.reps,
    pep.frequency,
    pep.start_date,
    (CURRENT_DATE - pep.start_date)::INTEGER,
    calculate_prescription_compliance(pep.id)
  FROM patient_exercise_prescriptions pep
  WHERE pep.patient_id = p_patient_id
    AND pep.organization_id = p_org_id
    AND pep.status = 'active'
  ORDER BY pep.start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update timestamps
DROP TRIGGER IF EXISTS exercise_library_updated_at ON exercise_library;
CREATE TRIGGER exercise_library_updated_at
  BEFORE UPDATE ON exercise_library
  FOR EACH ROW
  EXECUTE FUNCTION update_exercise_library_timestamp();

DROP TRIGGER IF EXISTS patient_prescriptions_updated_at ON patient_exercise_prescriptions;
CREATE TRIGGER patient_prescriptions_updated_at
  BEFORE UPDATE ON patient_exercise_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_exercise_library_timestamp();

DROP TRIGGER IF EXISTS exercise_programs_updated_at ON exercise_programs;
CREATE TRIGGER exercise_programs_updated_at
  BEFORE UPDATE ON exercise_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_exercise_library_timestamp();

DROP TRIGGER IF EXISTS patient_programs_updated_at ON patient_exercise_programs;
CREATE TRIGGER patient_programs_updated_at
  BEFORE UPDATE ON patient_exercise_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_exercise_library_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE exercise_library IS 'Repository of exercises with instructions, media, and dosing defaults';
COMMENT ON TABLE patient_exercise_prescriptions IS 'Individual exercise assignments to patients with compliance tracking';
COMMENT ON TABLE exercise_programs IS 'Reusable program templates containing multiple exercises';
COMMENT ON TABLE patient_exercise_programs IS 'Instances of programs assigned to specific patients';
COMMENT ON TABLE exercise_favorites IS 'Quick access to frequently used exercises per practitioner';

COMMENT ON COLUMN exercise_library.code IS 'Unique identifier code for the exercise (e.g., NECK-STRETCH-001)';
COMMENT ON COLUMN exercise_library.is_global IS 'If true, exercise is visible to all organizations';
COMMENT ON COLUMN patient_exercise_prescriptions.compliance_log IS 'JSONB object with date keys containing completion status, pain level, and notes';
COMMENT ON COLUMN exercise_programs.exercises IS 'JSONB array defining exercise order, dosing, and progression phases';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
