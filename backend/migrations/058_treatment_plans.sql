-- Migration 058: Treatment Plans with Milestones and Sessions

CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  practitioner_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  condition_description TEXT,
  diagnosis_code VARCHAR(20),
  frequency VARCHAR(100),
  total_sessions INTEGER,
  completed_sessions INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  target_end_date DATE,
  goals JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treatment_plan_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_date DATE,
  outcome_measure VARCHAR(20),
  target_score NUMERIC(5,2),
  actual_score NUMERIC(5,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'achieved', 'missed')),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treatment_plan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  encounter_id UUID,
  session_number INTEGER NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tp_patient ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_tp_org ON treatment_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_tp_status ON treatment_plans(status);
CREATE INDEX IF NOT EXISTS idx_tpm_plan ON treatment_plan_milestones(plan_id);
CREATE INDEX IF NOT EXISTS idx_tps_plan ON treatment_plan_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_tps_encounter ON treatment_plan_sessions(encounter_id);
