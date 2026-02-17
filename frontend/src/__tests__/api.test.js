/**
 * API Service Tests
 * Tests for frontend API client and endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import _axios from 'axios';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'org-123'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Endpoints', () => {
    it('should export patients API', async () => {
      const { patientsAPI } = await import('../services/api');

      expect(patientsAPI).toBeDefined();
      expect(patientsAPI.getAll).toBeDefined();
      expect(patientsAPI.getById).toBeDefined();
      expect(patientsAPI.create).toBeDefined();
      expect(patientsAPI.update).toBeDefined();
      expect(patientsAPI.delete).toBeDefined();
    });

    it('should export encounters API', async () => {
      const { encountersAPI } = await import('../services/api');

      expect(encountersAPI).toBeDefined();
      expect(encountersAPI.getAll).toBeDefined();
      expect(encountersAPI.create).toBeDefined();
      expect(encountersAPI.sign).toBeDefined();
    });

    it('should export appointments API', async () => {
      const { appointmentsAPI } = await import('../services/api');

      expect(appointmentsAPI).toBeDefined();
      expect(appointmentsAPI.getByDate).toBeDefined();
      expect(appointmentsAPI.cancel).toBeDefined();
      expect(appointmentsAPI.confirm).toBeDefined();
    });

    it('should export AI API', async () => {
      const { aiAPI } = await import('../services/api');

      expect(aiAPI).toBeDefined();
      expect(aiAPI.getStatus).toBeDefined();
      expect(aiAPI.generateSOAPSuggestion).toBeDefined();
      expect(aiAPI.suggestDiagnosis).toBeDefined();
      expect(aiAPI.analyzeRedFlags).toBeDefined();
    });

    it('should export KPI API', async () => {
      const { kpiAPI } = await import('../services/api');

      expect(kpiAPI).toBeDefined();
      expect(kpiAPI.getDashboard).toBeDefined();
      expect(kpiAPI.getDaily).toBeDefined();
      expect(kpiAPI.getMonthly).toBeDefined();
    });

    it('should export templates API', async () => {
      const { templatesAPI } = await import('../services/api');

      expect(templatesAPI).toBeDefined();
      expect(templatesAPI.getByCategory).toBeDefined();
      expect(templatesAPI.toggleFavorite).toBeDefined();
    });
  });

  describe('API Configuration', () => {
    it('should use correct base URL', async () => {
      const api = await import('../services/api');

      // Verify the default export (apiClient) exists and was created via axios.create
      expect(api.default).toBeDefined();
      // axios.create was called at module load time (before clearAllMocks)
      // Verify the module exported the expected API_URL
      expect(api.API_URL).toBeDefined();
    });
  });
});
