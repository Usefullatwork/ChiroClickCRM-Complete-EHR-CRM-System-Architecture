-- ============================================================================
-- Demo Users Seed
--
-- Creates a demo organization and users for development/testing
-- Password for all users: admin123
-- ============================================================================

-- Create demo organization
INSERT INTO organizations (id, name, org_number, email, subscription_tier, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'ChiroClick Demo Klinikk',
  '999888777',
  'demo@chiroclickcrm.no',
  'PRO',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- Create admin user (password: admin123)
-- Hash generated with bcrypt, 10 rounds
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'admin@chiroclickcrm.no',
  '$2b$10$ohl4C6Xa9meLOVyotGbMq.80PrTc4I..sHs0a6zGj8OWVqQC5arFO',
  'Admin',
  'User',
  'ADMIN',
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  email_verified = true;

-- Create practitioner user (password: admin123)
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, hpr_number, is_active, email_verified)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'kiropraktor@chiroclickcrm.no',
  '$2b$10$ohl4C6Xa9meLOVyotGbMq.80PrTc4I..sHs0a6zGj8OWVqQC5arFO',
  'Kari',
  'Nordmann',
  'PRACTITIONER',
  'HPR123456',
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  email_verified = true;

-- Create receptionist user (password: admin123)
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'resepsjon@chiroclickcrm.no',
  '$2b$10$ohl4C6Xa9meLOVyotGbMq.80PrTc4I..sHs0a6zGj8OWVqQC5arFO',
  'Ole',
  'Hansen',
  'RECEPTIONIST',
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  email_verified = true;

-- Summary
SELECT
  'Demo users created' as status,
  (SELECT COUNT(*) FROM users WHERE organization_id = 'a0000000-0000-0000-0000-000000000001') as user_count;
