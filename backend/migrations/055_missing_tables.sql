-- Migration 012: Add missing tables for scheduler and smart communications

-- Table for job execution logging (referenced in scheduler.js:147)
CREATE TABLE IF NOT EXISTS scheduled_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(255) NOT NULL,
  job_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('success', 'failed')),
  duration_ms INTEGER,
  result JSONB,
  error_message TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_job_logs_name ON scheduled_job_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_scheduled_job_logs_executed ON scheduled_job_logs(executed_at);

-- Table for smart scheduler communications (referenced in smartScheduler.js:248)
CREATE TABLE IF NOT EXISTS scheduled_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  communication_type VARCHAR(20) NOT NULL CHECK (communication_type IN ('sms', 'email')),
  message_template TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sched_comms_org ON scheduled_communications(organization_id);
CREATE INDEX IF NOT EXISTS idx_sched_comms_patient ON scheduled_communications(patient_id);
CREATE INDEX IF NOT EXISTS idx_sched_comms_status ON scheduled_communications(status, scheduled_date, scheduled_time);
