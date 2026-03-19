-- Migration 076: Patient Connectivity tables
-- SMS/email reminders, document sharing, messaging, booking requests

-- 1. appointment_reminders
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('24H_BEFORE', '1H_BEFORE', 'CUSTOM')),
  channel VARCHAR(10) NOT NULL CHECK (channel IN ('SMS', 'EMAIL', 'PUSH')),
  scheduled_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED')),
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_org ON appointment_reminders(organization_id);
CREATE INDEX IF NOT EXISTS idx_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_patient ON appointment_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON appointment_reminders(status, scheduled_at);

-- 2. portal_documents
CREATE TABLE IF NOT EXISTS portal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_id UUID,
  title VARCHAR(255) NOT NULL,
  download_token VARCHAR(64) UNIQUE NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  downloaded_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_docs_org ON portal_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_portal_docs_patient ON portal_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_portal_docs_token ON portal_documents(download_token);

-- 3. patient_messages
CREATE TABLE IF NOT EXISTS patient_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('CLINICIAN', 'PATIENT', 'SYSTEM')),
  sender_id UUID,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  parent_message_id UUID REFERENCES patient_messages(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_org ON patient_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_patient ON patient_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON patient_messages(patient_id, is_read) WHERE is_read = false;

-- 4. portal_booking_requests
CREATE TABLE IF NOT EXISTS portal_booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  preferred_date DATE,
  preferred_time_slot VARCHAR(20),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED')),
  handled_by UUID REFERENCES users(id),
  appointment_id UUID REFERENCES appointments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_req_org ON portal_booking_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_booking_req_patient ON portal_booking_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_booking_req_status ON portal_booking_requests(status);
