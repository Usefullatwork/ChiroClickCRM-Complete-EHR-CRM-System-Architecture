/**
 * Jest Test Setup
 * Runs before all tests
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment variables if not already set
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // 32 chars for AES-256
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-purposes-only';
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(), // Mock console.log
  info: jest.fn(), // Mock console.info
  warn: jest.fn(), // Mock console.warn
  error: console.error, // Keep console.error for debugging
};

// Global test helpers
global.createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  role: 'PRACTITIONER',
  organizationId: 'org-abc',
  twoFactorEnabled: false,
  ...overrides
});

global.createMockPatient = (overrides = {}) => ({
  id: 'patient-123',
  firstName: 'Test',
  lastName: 'Patient',
  fodselsnummer_encrypted: 'encrypted-fnr',
  fodselsnummer_hash: 'hashed-fnr',
  organizationId: 'org-abc',
  ...overrides
});

// Cleanup after all tests
afterAll(() => {
  jest.clearAllMocks();
});
