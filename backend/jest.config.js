/**
 * Jest Configuration
 * Test configuration for ChiroClickCRM backend
 */

export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__', '<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  // Run environment setup before each test file (sets ENCRYPTION_KEY, DESKTOP_MODE, etc.)
  setupFiles: ['<rootDir>/tests/envSetup.js'],
  injectGlobals: true,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/**/*.test.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  transform: {},
  testTimeout: 30000,
  verbose: true,
  // Workaround for ESM
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Run tests serially to avoid database conflicts
  maxWorkers: 1,
  // Force exit after tests complete (handles open database connections)
  forceExit: true,
  // Detect open handles for debugging
  detectOpenHandles: false,
};
