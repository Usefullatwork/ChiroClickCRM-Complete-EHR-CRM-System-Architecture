import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chiroclickcrm_test';

// Global test timeout
jest.setTimeout(10000);

// Mock external services
global.mockClerk = {
  verifyToken: jest.fn(),
  users: {
    getUser: jest.fn()
  }
};

// Mock logger to reduce noise in tests
jest.mock('../src/utils/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Cleanup after all tests
afterAll(async () => {
  // Close any open database connections
  const db = require('../src/config/database.js');
  if (db.pool) {
    await db.pool.end();
  }
});
