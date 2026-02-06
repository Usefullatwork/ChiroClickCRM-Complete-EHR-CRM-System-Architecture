/**
 * Test Setup and Configuration
 * Sets up mocks and test utilities for all tests
 */

import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DESKTOP_MODE = 'true';
process.env.CACHE_ENGINE = 'memory';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars__!';
process.env.JWT_SECRET = 'test_jwt_secret';

// Mock logger to prevent console spam during tests
jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Test database mock helper
export const createMockQuery = (mockRows = [], mockRowCount = null) => {
  return jest.fn().mockResolvedValue({
    rows: mockRows,
    rowCount: mockRowCount ?? mockRows.length,
  });
};

// Create mock transaction
export const createMockTransaction = (callback) => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return jest.fn().mockImplementation(async (cb) => {
    return await cb(mockClient);
  });
};

// Test data factories
export const createTestPatient = (overrides = {}) => ({
  id: 'test-patient-id-123',
  organization_id: 'test-org-id-456',
  solvit_id: 'SOL001',
  first_name: 'Test',
  last_name: 'Patient',
  date_of_birth: '1985-06-15',
  gender: 'M',
  email: 'test@example.com',
  phone: '+4712345678',
  status: 'ACTIVE',
  category: 'OSLO',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createTestEncounter = (overrides = {}) => ({
  id: 'test-encounter-id-123',
  organization_id: 'test-org-id-456',
  patient_id: 'test-patient-id-123',
  practitioner_id: 'test-user-id-789',
  encounter_date: new Date().toISOString().split('T')[0],
  encounter_type: 'FOLLOWUP',
  duration_minutes: 30,
  subjective: { chief_complaint: 'Lower back pain' },
  objective: { observations: 'Reduced ROM in lumbar spine' },
  assessment: { clinical_impression: 'Mechanical LBP' },
  plan: { treatment_provided: 'Spinal manipulation' },
  icpc_codes: ['L84'],
  status: 'COMPLETED',
  is_signed: false,
  ...overrides,
});

export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id-789',
  organization_id: 'test-org-id-456',
  email: 'practitioner@example.com',
  first_name: 'Test',
  last_name: 'Practitioner',
  role: 'PRACTITIONER',
  hpr_number: '12345678',
  is_active: true,
  ...overrides,
});

export const createTestAppointment = (overrides = {}) => ({
  id: 'test-appointment-id-123',
  organization_id: 'test-org-id-456',
  patient_id: 'test-patient-id-123',
  practitioner_id: 'test-user-id-789',
  start_time: new Date(Date.now() + 86400000).toISOString(),
  end_time: new Date(Date.now() + 86400000 + 1800000).toISOString(),
  appointment_type: 'FOLLOWUP',
  status: 'SCHEDULED',
  notes: 'Follow-up appointment',
  ...overrides,
});

export const createTestCommunication = (overrides = {}) => ({
  id: 'test-comm-id-123',
  organization_id: 'test-org-id-456',
  patient_id: 'test-patient-id-123',
  type: 'SMS',
  direction: 'OUTBOUND',
  content: 'Test message',
  status: 'SENT',
  sent_at: new Date().toISOString(),
  ...overrides,
});

// Async test helper
export const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
