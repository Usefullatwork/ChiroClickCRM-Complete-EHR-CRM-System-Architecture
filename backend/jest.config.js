/**
 * Jest Configuration
 * Testing framework configuration for ChiroClickCRM backend
 */

export default {
  // Use Node environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test match patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Exclude server entry point
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],

  coverageDirectory: '<rootDir>/coverage',

  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    },
    './src/middleware/security.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/utils/norwegianIdValidation.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/utils/encryption.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Transform ES modules
  transform: {},

  // Module paths
  modulePaths: ['<rootDir>/src'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // Verbose output
  verbose: true,

  // Timeout
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Reset mocks after each test
  resetMocks: true
};
