/**
 * Test Setup and Configuration
 * Sets up mocks and test utilities for all tests
 */

import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DESKTOP_MODE = 'true';
process.env.CACHE_ENGINE = 'memory';
process.env.ENCRYPTION_KEY = 'abcdefghijklmnopqrstuvwxyz123456';
process.env.JWT_SECRET = 'test_jwt_secret';

// Mock logger to prevent console spam during tests
// Use dynamic path resolution for logger mock
const loggerPath = new URL('../src/utils/logger.js', import.meta.url).pathname.replace(
  /^\/([A-Z]:)/,
  '$1'
);
jest.unstable_mockModule(loggerPath, () => ({
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

// Exercise test data factories
export const createTestExercise = (overrides = {}) => ({
  id: 'test-exercise-id-123',
  organization_id: 'test-org-id-456',
  name: 'Cat-Camel Stretch',
  name_no: 'Katt-Kamel Tøyning',
  category: 'stretching',
  body_region: 'lumbar',
  description: 'Alternating cat and camel positions',
  instructions: 'Start on hands and knees...',
  sets: 3,
  reps: 10,
  hold_seconds: null,
  difficulty: 'beginner',
  equipment: null,
  media_url: null,
  is_global: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createTestPrescription = (overrides = {}) => ({
  id: 'test-prescription-id-123',
  organization_id: 'test-org-id-456',
  patient_id: 'test-patient-id-123',
  exercise_id: 'test-exercise-id-123',
  prescribed_by: 'test-user-id-789',
  sets: 3,
  reps: 10,
  frequency: 'daily',
  duration_weeks: 4,
  notes: 'Perform slowly',
  status: 'ACTIVE',
  prescribed_at: new Date().toISOString(),
  ...overrides,
});

export const createTestExerciseProgress = (overrides = {}) => ({
  id: 'test-progress-id-123',
  prescription_id: 'test-prescription-id-123',
  patient_id: 'test-patient-id-123',
  completed_at: new Date().toISOString(),
  pain_level: 3,
  difficulty_rating: 2,
  notes: 'Felt good',
  ...overrides,
});

export const createTestPortalToken = (overrides = {}) => ({
  id: 'test-token-id-123',
  patient_id: 'test-patient-id-123',
  organization_id: 'test-org-id-456',
  access_token: 'mock-generated-token-abc123def456ghij789klmno',
  token_type: 'exercises',
  expires_at: new Date(Date.now() + 86400000).toISOString(),
  is_revoked: false,
  patient_first_name: 'Test',
  patient_last_name: 'Patient',
  patient_email: 'test@example.com',
  organization_name: 'Test Clinic',
  organization_phone: '+47 12 34 56 78',
  ...overrides,
});

// Mock Express request/response helpers
export const createMockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: createTestUser(),
  headers: { 'x-organization-id': 'test-org-id-456' },
  ...overrides,
});

export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };
  return res;
};

// Create multiple test items
export const createMany = (factory, count, overrides = {}) => {
  return Array.from({ length: count }, (_, i) =>
    factory({ id: `${factory({}).id}-${i}`, ...overrides })
  );
};

// Async test helper
export const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
