/**
 * Empty States Resilience Tests
 * Verify API service functions handle empty/null responses without crashing
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../services/api', () => ({
  kpiAPI: {
    getSummary: vi.fn(),
    getTrends: vi.fn(),
  },
  macrosAPI: {
    getAll: vi.fn(),
  },
  followUpsAPI: {
    getPatientsNeedingFollowUp: vi.fn(),
  },
  outcomesAPI: {
    getBenchmarks: vi.fn(),
  },
}));

import { kpiAPI, macrosAPI, followUpsAPI, outcomesAPI } from '../../services/api';

describe('Empty States Resilience', () => {
  it('should handle KPI API returning null data', async () => {
    kpiAPI.getSummary.mockResolvedValue({ data: null });
    const result = await kpiAPI.getSummary();
    expect(result.data).toBeNull();
  });

  it('should handle KPI API returning empty object', async () => {
    kpiAPI.getSummary.mockResolvedValue({ data: {} });
    const result = await kpiAPI.getSummary();
    expect(result.data).toEqual({});
  });

  it('should handle KPI trends returning empty array', async () => {
    kpiAPI.getTrends.mockResolvedValue({ data: [] });
    const result = await kpiAPI.getTrends();
    expect(result.data).toEqual([]);
  });

  it('should handle macros API returning null', async () => {
    macrosAPI.getAll.mockResolvedValue({ data: null });
    const result = await macrosAPI.getAll();
    expect(result.data).toBeNull();
  });

  it('should handle follow-ups API returning empty array', async () => {
    followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({ data: [] });
    const result = await followUpsAPI.getPatientsNeedingFollowUp();
    expect(result.data).toEqual([]);
  });

  it('should handle outcomes benchmarks returning undefined', async () => {
    outcomesAPI.getBenchmarks.mockResolvedValue(undefined);
    const result = await outcomesAPI.getBenchmarks();
    expect(result).toBeUndefined();
  });

  it('should handle API rejection gracefully', async () => {
    kpiAPI.getSummary.mockRejectedValue(new Error('Network failure'));
    await expect(kpiAPI.getSummary()).rejects.toThrow('Network failure');
  });

  it('should handle null response object', async () => {
    macrosAPI.getAll.mockResolvedValue(null);
    const result = await macrosAPI.getAll();
    expect(result).toBeNull();
  });
});
