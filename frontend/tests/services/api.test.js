/**
 * API Client Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Setup mocks
const mockSessionStorage = {
  store: {},
  getItem: jest.fn((key) => mockSessionStorage.store[key] || null),
  setItem: jest.fn((key, value) => {
    mockSessionStorage.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete mockSessionStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockSessionStorage.store = {};
  }),
};

const mockLocalStorage = {
  store: {},
  getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  }),
};

global.sessionStorage = mockSessionStorage;
global.localStorage = mockLocalStorage;
global.btoa = (str) => Buffer.from(str).toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString();
global.window = { __DESKTOP_MODE__: true };

describe('API Client', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('Organization ID Storage', () => {
    it('should store organization ID in sessionStorage', async () => {
      const { setOrganizationId, getOrganizationId } = await import('../../src/services/api.js');

      setOrganizationId('test-org-123');

      const stored = getOrganizationId();
      expect(stored).toBe('test-org-123');
    });

    it('should clear organization ID when null is passed', async () => {
      const { setOrganizationId, getOrganizationId } = await import('../../src/services/api.js');

      setOrganizationId('test-org-123');
      setOrganizationId(null);

      expect(mockSessionStorage.removeItem).toHaveBeenCalled();
    });

    it('should migrate from localStorage to sessionStorage', async () => {
      mockLocalStorage.store['organizationId'] = 'legacy-org-id';

      const { getOrganizationId } = await import('../../src/services/api.js');

      // Clear module cache to force re-import
      jest.resetModules();

      const { getOrganizationId: freshGetOrgId } = await import('../../src/services/api.js');

      // Should attempt to read from localStorage as fallback
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('organizationId');
    });

    it('should clear organization ID with clearOrganizationId', async () => {
      const { setOrganizationId, clearOrganizationId } = await import('../../src/services/api.js');

      setOrganizationId('test-org-123');
      clearOrganizationId();

      expect(mockSessionStorage.removeItem).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('organizationId');
    });

    it('should handle corrupted storage data gracefully', async () => {
      mockSessionStorage.store['org_session'] = 'invalid-base64-!!!';

      jest.resetModules();
      const { getOrganizationId } = await import('../../src/services/api.js');

      const result = getOrganizationId();
      expect(result).toBeNull();
    });
  });

  describe('API Endpoints', () => {
    it('should export patientsAPI with all methods', async () => {
      const { patientsAPI } = await import('../../src/services/api.js');

      expect(patientsAPI.getAll).toBeDefined();
      expect(patientsAPI.getById).toBeDefined();
      expect(patientsAPI.create).toBeDefined();
      expect(patientsAPI.update).toBeDefined();
      expect(patientsAPI.delete).toBeDefined();
      expect(patientsAPI.search).toBeDefined();
    });

    it('should export encountersAPI with all methods', async () => {
      const { encountersAPI } = await import('../../src/services/api.js');

      expect(encountersAPI.getAll).toBeDefined();
      expect(encountersAPI.getById).toBeDefined();
      expect(encountersAPI.create).toBeDefined();
      expect(encountersAPI.sign).toBeDefined();
    });

    it('should export appointmentsAPI with all methods', async () => {
      const { appointmentsAPI } = await import('../../src/services/api.js');

      expect(appointmentsAPI.getAll).toBeDefined();
      expect(appointmentsAPI.create).toBeDefined();
      expect(appointmentsAPI.cancel).toBeDefined();
      expect(appointmentsAPI.confirm).toBeDefined();
    });

    it('should export communicationsAPI with all methods', async () => {
      const { communicationsAPI } = await import('../../src/services/api.js');

      expect(communicationsAPI.getAll).toBeDefined();
      expect(communicationsAPI.sendSMS).toBeDefined();
      expect(communicationsAPI.sendEmail).toBeDefined();
    });

    it('should export kpiAPI with all methods', async () => {
      const { kpiAPI } = await import('../../src/services/api.js');

      expect(kpiAPI.getDashboard).toBeDefined();
      expect(kpiAPI.getDaily).toBeDefined();
      expect(kpiAPI.getWeekly).toBeDefined();
      expect(kpiAPI.getMonthly).toBeDefined();
    });
  });
});
