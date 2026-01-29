-- ============================================================================
-- Migration 021: Enhanced Audit Logging System
-- ChiroClickCRM - Norwegian EHR/CRM System
-- Created: 2026-01-03
-- ============================================================================
-- PURPOSE: Enhanced audit logging for GDPR and Norwegian healthcare compliance.
-- Automatically logs all sensitive data access and modifications.
-- ============================================================================

-- ============================================================================
-- ADD ENHANCED COLUMNS TO AUDIT_LOG
-- ============================================================================

ALTER TABLE audit_log
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS patient_id UUID,
ADD COLUMN IF NOT EXISTS data_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS sensitivity_level VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS access_reason TEXT,
ADD COLUMN IF NOT EXISTS consent_reference UUID,
ADD COLUMN IF NOT EXISTS request_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS response_code INTEGER,
ADD COLUMN IF NOT EXISTS gdpr_relevant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS export_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- ============================================================================
-- ENHANCED INDEXES FOR AUDIT QUERIES
-- ============================================================================

-- Index for organization-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created
ON audit_log(organization_id, created_at DESC)
WHERE organization_id IS NOT NULL;

-- Index for patient access auditing (GDPR requirement)
CREATE INDEX IF NOT EXISTS idx_audit_log_patient
ON audit_log(patient_id, created_at DESC)
WHERE patient_id IS NOT NULL;

-- Index for sensitive data access
CREATE INDEX IF NOT EXISTS idx_audit_log_sensitive
ON audit_log(sensitivity_level, created_at DESC)
WHERE sensitivity_level IN ('high', 'critical');

-- Index for GDPR relevant actions
CREATE INDEX IF NOT EXISTS idx_audit_log_gdpr
ON audit_log(gdpr_relevant, created_at DESC)
WHERE gdpr_relevant = true;

-- Index for flagged entries
CREATE INDEX IF NOT EXISTS idx_audit_log_flagged
ON audit_log(flagged, created_at DESC)
WHERE flagged = true;

-- Index for correlation tracking
CREATE INDEX IF NOT EXISTS idx_audit_log_correlation
ON audit_log(correlation_id)
WHERE correlation_id IS NOT NULL;

-- Index for request tracking
CREATE INDEX IF NOT EXISTS idx_audit_log_request
ON audit_log(request_id)
WHERE request_id IS NOT NULL;

-- Composite index for security investigations
CREATE INDEX IF NOT EXISTS idx_audit_log_security
ON audit_log(ip_address, user_id, created_at DESC)
WHERE success = false;

-- Index for data category analysis
CREATE INDEX IF NOT EXISTS idx_audit_log_data_category
ON audit_log(data_category, action_type, created_at DESC)
WHERE data_category IS NOT NULL;

-- ============================================================================
-- SENSITIVE DATA CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sensitive_data_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(50) UNIQUE NOT NULL,
    sensitivity_level VARCHAR(20) NOT NULL DEFAULT 'normal',
    description TEXT,
    requires_access_reason BOOLEAN DEFAULT false,
    requires_consent BOOLEAN DEFAULT false,
    retention_days INTEGER DEFAULT 3650, -- 10 years default
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data categories
INSERT INTO sensitive_data_categories (category_name, sensitivity_level, description, requires_access_reason, requires_consent) VALUES
('patient_demographics', 'normal', 'Basic patient information (name, address, contact)', false, false),
('clinical_notes', 'high', 'SOAP notes, clinical observations, findings', true, false),
('diagnosis_codes', 'high', 'ICD-10, ICPC-2 diagnosis codes', true, false),
('treatment_plans', 'high', 'Treatment plans and prescriptions', true, false),
('mental_health', 'critical', 'Mental health notes and assessments', true, true),
('substance_abuse', 'critical', 'Substance abuse related information', true, true),
('hiv_status', 'critical', 'HIV/AIDS related information', true, true),
('genetic_data', 'critical', 'Genetic test results and data', true, true),
('reproductive_health', 'high', 'Reproductive health information', true, false),
('financial_data', 'high', 'Billing, insurance, payment information', true, false),
('authentication', 'high', 'Login attempts, password changes', false, false),
('system_config', 'normal', 'System configuration changes', false, false)
ON CONFLICT (category_name) DO NOTHING;

COMMENT ON TABLE sensitive_data_categories IS 'Categories of sensitive data for audit tracking and access control';

-- ============================================================================
-- FUNCTION: Automatically log sensitive data access
-- ============================================================================

CREATE OR REPLACE FUNCTION log_sensitive_data_access(
    p_user_id UUID,
    p_action_type VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id UUID,
    p_patient_id UUID DEFAULT NULL,
    p_data_category VARCHAR(50) DEFAULT NULL,
    p_access_reason TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_organization_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_sensitivity VARCHAR(20);
    v_requires_reason BOOLEAN;
    v_audit_id UUID;
    v_gdpr_relevant BOOLEAN;
BEGIN
    -- Get sensitivity level for this data category
    SELECT sensitivity_level, requires_access_reason
    INTO v_sensitivity, v_requires_reason
    FROM sensitive_data_categories
    WHERE category_name = p_data_category;

    -- Default to normal if category not found
    v_sensitivity := COALESCE(v_sensitivity, 'normal');
    v_requires_reason := COALESCE(v_requires_reason, false);

    -- Check if access reason is required but not provided
    IF v_requires_reason AND (p_access_reason IS NULL OR p_access_reason = '') THEN
        -- Log the access attempt anyway but flag it
        v_gdpr_relevant := true;
    ELSE
        v_gdpr_relevant := (v_sensitivity IN ('high', 'critical'));
    END IF;

    -- Insert audit log entry
    INSERT INTO audit_log (
        action_type,
        user_id,
        resource_type,
        resource_id,
        patient_id,
        organization_id,
        data_category,
        sensitivity_level,
        access_reason,
        ip_address,
        user_agent,
        metadata,
        gdpr_relevant,
        success,
        flagged,
        flag_reason
    ) VALUES (
        p_action_type,
        p_user_id,
        p_resource_type,
        p_resource_id,
        p_patient_id,
        p_organization_id,
        p_data_category,
        v_sensitivity,
        p_access_reason,
        p_ip_address,
        p_user_agent,
        p_metadata,
        v_gdpr_relevant,
        true,
        (v_requires_reason AND (p_access_reason IS NULL OR p_access_reason = '')),
        CASE WHEN v_requires_reason AND (p_access_reason IS NULL OR p_access_reason = '')
            THEN 'Access reason required but not provided'
            ELSE NULL
        END
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_sensitive_data_access
IS 'Logs access to sensitive data with appropriate sensitivity tracking';

-- ============================================================================
-- FUNCTION: Log failed access attempt
-- ============================================================================

CREATE OR REPLACE FUNCTION log_failed_access(
    p_user_id UUID,
    p_action_type VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id UUID,
    p_error_message TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_log (
        action_type,
        user_id,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        metadata,
        success,
        error_message,
        flagged,
        flag_reason
    ) VALUES (
        p_action_type,
        p_user_id,
        p_resource_type,
        p_resource_id,
        p_ip_address,
        p_user_agent,
        p_metadata,
        false,
        p_error_message,
        true,
        'Failed access attempt'
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_failed_access IS 'Logs failed access attempts for security monitoring';

-- ============================================================================
-- TRIGGER FUNCTION: Auto-audit clinical encounters access
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_clinical_encounter_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log SELECT operations via rules (this handles INSERT/UPDATE/DELETE)
    IF TG_OP = 'INSERT' THEN
        PERFORM log_sensitive_data_access(
            NEW.practitioner_id,
            'encounter.create',
            'clinical_encounter',
            NEW.id,
            NEW.patient_id,
            'clinical_notes',
            'New clinical encounter',
            NULL, NULL,
            jsonb_build_object('encounter_date', NEW.encounter_date)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_sensitive_data_access(
            COALESCE(NEW.updated_by, NEW.practitioner_id),
            'encounter.update',
            'clinical_encounter',
            NEW.id,
            NEW.patient_id,
            'clinical_notes',
            'Clinical encounter updated',
            NULL, NULL,
            jsonb_build_object(
                'encounter_date', NEW.encounter_date,
                'is_signed', NEW.is_signed
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_sensitive_data_access(
            OLD.practitioner_id,
            'encounter.delete',
            'clinical_encounter',
            OLD.id,
            OLD.patient_id,
            'clinical_notes',
            'Clinical encounter deleted',
            NULL, NULL,
            jsonb_build_object('encounter_date', OLD.encounter_date)
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for clinical encounters
DROP TRIGGER IF EXISTS trigger_audit_clinical_encounters ON clinical_encounters;
CREATE TRIGGER trigger_audit_clinical_encounters
AFTER INSERT OR UPDATE OR DELETE ON clinical_encounters
FOR EACH ROW
EXECUTE FUNCTION audit_clinical_encounter_access();

-- ============================================================================
-- TRIGGER FUNCTION: Auto-audit patient data access
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_patient_access()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_sensitive_data_access(
            NULL, -- Set in application layer
            'patient.create',
            'patient',
            NEW.id,
            NEW.id,
            'patient_demographics',
            'New patient registration'
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_sensitive_data_access(
            NULL,
            'patient.update',
            'patient',
            NEW.id,
            NEW.id,
            'patient_demographics',
            'Patient record updated'
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_sensitive_data_access(
            NULL,
            'patient.delete',
            'patient',
            OLD.id,
            OLD.id,
            'patient_demographics',
            'Patient record deleted'
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for patients
DROP TRIGGER IF EXISTS trigger_audit_patients ON patients;
CREATE TRIGGER trigger_audit_patients
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW
EXECUTE FUNCTION audit_patient_access();

-- ============================================================================
-- VIEW: Recent sensitive data access
-- ============================================================================

CREATE OR REPLACE VIEW recent_sensitive_access AS
SELECT
    a.id,
    a.action_type,
    a.created_at,
    u.name as user_name,
    u.email as user_email,
    a.resource_type,
    a.resource_id,
    a.patient_id,
    p.first_name || ' ' || p.last_name as patient_name,
    a.data_category,
    a.sensitivity_level,
    a.access_reason,
    a.ip_address,
    a.success,
    a.flagged,
    a.flag_reason
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.sensitivity_level IN ('high', 'critical')
  AND a.created_at > NOW() - INTERVAL '7 days'
ORDER BY a.created_at DESC;

COMMENT ON VIEW recent_sensitive_access IS 'Last 7 days of sensitive data access for security review';

-- ============================================================================
-- VIEW: Patient access log (GDPR data subject access request)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_patient_access_log(
    p_patient_id UUID,
    p_from_date TIMESTAMP DEFAULT NULL,
    p_to_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
    access_date TIMESTAMP,
    action_type VARCHAR,
    user_name VARCHAR,
    user_role VARCHAR,
    data_category VARCHAR,
    access_reason TEXT,
    ip_address INET
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.created_at as access_date,
        a.action_type,
        u.name as user_name,
        u.role as user_role,
        a.data_category,
        a.access_reason,
        a.ip_address
    FROM audit_log a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.patient_id = p_patient_id
      AND a.created_at >= COALESCE(p_from_date, '1970-01-01'::TIMESTAMP)
      AND a.created_at <= COALESCE(p_to_date, NOW())
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_patient_access_log
IS 'GDPR: Returns all access to a patients data for data subject access requests';

-- ============================================================================
-- VIEW: Suspicious activity detection
-- ============================================================================

CREATE OR REPLACE VIEW suspicious_activity_enhanced AS
SELECT
    user_id,
    u.name as user_name,
    u.email as user_email,
    ip_address,
    COUNT(*) as total_actions,
    COUNT(*) FILTER (WHERE success = false) as failed_actions,
    COUNT(*) FILTER (WHERE sensitivity_level = 'critical') as critical_access_count,
    COUNT(DISTINCT patient_id) as unique_patients_accessed,
    MAX(created_at) as last_action,
    array_agg(DISTINCT action_type) as action_types
FROM audit_log
LEFT JOIN users u ON audit_log.user_id = u.id
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, u.name, u.email, ip_address
HAVING
    COUNT(*) FILTER (WHERE success = false) >= 3
    OR COUNT(*) FILTER (WHERE sensitivity_level = 'critical') >= 5
    OR COUNT(DISTINCT patient_id) >= 50
ORDER BY failed_actions DESC, critical_access_count DESC;

COMMENT ON VIEW suspicious_activity_enhanced
IS 'Enhanced suspicious activity detection: failed attempts, excessive critical access, or too many patients';

-- ============================================================================
-- VIEW: After-hours access
-- ============================================================================

CREATE OR REPLACE VIEW after_hours_access AS
SELECT
    a.id,
    a.created_at,
    EXTRACT(HOUR FROM a.created_at) as hour,
    EXTRACT(DOW FROM a.created_at) as day_of_week,
    u.name as user_name,
    u.email as user_email,
    a.action_type,
    a.resource_type,
    a.patient_id,
    p.first_name || ' ' || p.last_name as patient_name,
    a.ip_address,
    a.data_category,
    a.sensitivity_level
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN patients p ON a.patient_id = p.id
WHERE (
    EXTRACT(HOUR FROM a.created_at) NOT BETWEEN 7 AND 18
    OR EXTRACT(DOW FROM a.created_at) IN (0, 6) -- Sunday, Saturday
)
AND a.created_at > NOW() - INTERVAL '7 days'
AND a.sensitivity_level IN ('high', 'critical')
ORDER BY a.created_at DESC;

COMMENT ON VIEW after_hours_access
IS 'Sensitive data access outside business hours - requires periodic review';

-- ============================================================================
-- FUNCTION: Generate GDPR data export for patient
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_gdpr_data_export(
    p_patient_id UUID,
    p_requested_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_patient RECORD;
    v_encounters JSONB;
    v_access_log JSONB;
BEGIN
    -- Log this export request
    PERFORM log_sensitive_data_access(
        p_requested_by,
        'gdpr.data_export',
        'patient',
        p_patient_id,
        p_patient_id,
        'patient_demographics',
        'GDPR data subject access request'
    );

    -- Get patient data
    SELECT row_to_json(p) INTO v_patient
    FROM (
        SELECT
            first_name, last_name, birth_date, email, phone_number,
            address, postal_code, city, created_at
        FROM patients WHERE id = p_patient_id
    ) p;

    -- Get encounters
    SELECT jsonb_agg(e) INTO v_encounters
    FROM (
        SELECT
            encounter_date, subjective, objective, assessment, plan,
            icpc_codes, icd10_codes, region_treated, created_at
        FROM clinical_encounters
        WHERE patient_id = p_patient_id
        ORDER BY encounter_date DESC
    ) e;

    -- Get access log
    SELECT jsonb_agg(a) INTO v_access_log
    FROM (
        SELECT
            created_at, action_type, data_category
        FROM audit_log
        WHERE patient_id = p_patient_id
        ORDER BY created_at DESC
        LIMIT 1000
    ) a;

    -- Build result
    v_result := jsonb_build_object(
        'export_date', NOW(),
        'patient_id', p_patient_id,
        'personal_data', v_patient,
        'clinical_encounters', COALESCE(v_encounters, '[]'::JSONB),
        'access_log', COALESCE(v_access_log, '[]'::JSONB)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_gdpr_data_export
IS 'GDPR Art. 15: Generates complete data export for data subject access request';

-- ============================================================================
-- FUNCTION: Review and clear flagged audit entries
-- ============================================================================

CREATE OR REPLACE FUNCTION review_flagged_audit_entry(
    p_audit_id UUID,
    p_reviewed_by UUID,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE audit_log
    SET
        reviewed_at = NOW(),
        reviewed_by = p_reviewed_by,
        flagged = false,
        metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object('review_notes', p_review_notes)
    WHERE id = p_audit_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION review_flagged_audit_entry
IS 'Mark flagged audit entry as reviewed by security/compliance officer';

-- ============================================================================
-- COMMENTS ON COLUMNS
-- ============================================================================

COMMENT ON COLUMN audit_log.organization_id IS 'Organization context for multi-tenant queries';
COMMENT ON COLUMN audit_log.patient_id IS 'Patient whose data was accessed - for GDPR reporting';
COMMENT ON COLUMN audit_log.data_category IS 'Category of data accessed (e.g., clinical_notes, patient_demographics)';
COMMENT ON COLUMN audit_log.sensitivity_level IS 'Sensitivity level: normal, high, critical';
COMMENT ON COLUMN audit_log.access_reason IS 'Reason for accessing data - required for high sensitivity';
COMMENT ON COLUMN audit_log.gdpr_relevant IS 'Whether this action is relevant for GDPR reporting';
COMMENT ON COLUMN audit_log.correlation_id IS 'For tracking related actions across microservices';
COMMENT ON COLUMN audit_log.flagged IS 'Whether this entry requires security review';
COMMENT ON COLUMN audit_log.reviewed_at IS 'When the flagged entry was reviewed';
COMMENT ON COLUMN audit_log.reviewed_by IS 'Who reviewed the flagged entry';

-- ============================================================================
-- GRANT PERMISSIONS (uncomment for production)
-- ============================================================================

-- GRANT SELECT ON audit_log TO chiroclickcrm_app;
-- GRANT INSERT ON audit_log TO chiroclickcrm_app;
-- GRANT SELECT ON sensitive_data_categories TO chiroclickcrm_app;
-- GRANT SELECT ON recent_sensitive_access TO chiroclickcrm_security;
-- GRANT SELECT ON suspicious_activity_enhanced TO chiroclickcrm_security;
-- GRANT SELECT ON after_hours_access TO chiroclickcrm_security;
-- GRANT EXECUTE ON FUNCTION log_sensitive_data_access TO chiroclickcrm_app;
-- GRANT EXECUTE ON FUNCTION log_failed_access TO chiroclickcrm_app;
-- GRANT EXECUTE ON FUNCTION get_patient_access_log TO chiroclickcrm_app;
-- GRANT EXECUTE ON FUNCTION generate_gdpr_data_export TO chiroclickcrm_admin;
-- GRANT EXECUTE ON FUNCTION review_flagged_audit_entry TO chiroclickcrm_security;

COMMENT ON SCHEMA public IS 'ChiroClickCRM v4.3 - Added Enhanced Audit Logging (GDPR Compliant)';
