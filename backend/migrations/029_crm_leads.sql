-- Migration: 029_crm_leads.sql
-- Description: Create CRM leads and related tables

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(50) DEFAULT 'WEBSITE',
    source_detail TEXT,
    status VARCHAR(50) DEFAULT 'NEW',
    temperature VARCHAR(20) DEFAULT 'WARM',
    primary_interest VARCHAR(255),
    chief_complaint TEXT,
    main_complaint TEXT,
    notes TEXT,
    score INTEGER DEFAULT 0,
    assigned_to UUID REFERENCES users(id),
    converted_patient_id UUID REFERENCES patients(id),
    converted_at TIMESTAMP,
    next_follow_up_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead activities table
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Automation workflows table (if not exists)
CREATE TABLE IF NOT EXISTS automation_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_config JSONB,
    conditions JSONB,
    actions JSONB,
    run_at_time TIME,
    timezone VARCHAR(50) DEFAULT 'Europe/Oslo',
    max_per_day INTEGER DEFAULT 100,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_organization ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_org ON automation_workflows(organization_id);
