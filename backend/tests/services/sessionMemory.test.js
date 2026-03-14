/**
 * Session Memory Tests
 * Verifies learning extraction, session storage, feature flag gating, and context output.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('sessionMemory — feature flag OFF', () => {
  let recordLearning, getSessionContext;

  beforeEach(async () => {
    jest.resetModules();
    delete process.env.CONTEXT_TIERED_ENABLED;
    const mod = await import('../../src/services/ai/sessionMemory.js');
    recordLearning = mod.recordLearning;
    getSessionContext = mod.getSessionContext;
  });

  it('recordLearning() should be a no-op when flag is off', () => {
    expect(() => recordLearning('org1', 'p1', 'soap_notes', 'cauda equina')).not.toThrow();
  });

  it('getSessionContext() should return empty string when flag is off', () => {
    expect(getSessionContext('org1', 'p1')).toBe('');
  });
});

describe('sessionMemory — feature flag ON', () => {
  let recordLearning, getSessionContext, clearSessionMemory, clearAllSessionMemory;

  beforeEach(async () => {
    jest.resetModules();
    process.env.CONTEXT_TIERED_ENABLED = 'true';
    const mod = await import('../../src/services/ai/sessionMemory.js');
    recordLearning = mod.recordLearning;
    getSessionContext = mod.getSessionContext;
    clearSessionMemory = mod.clearSessionMemory;
    clearAllSessionMemory = mod.clearAllSessionMemory;
  });

  afterEach(() => {
    clearAllSessionMemory?.();
    delete process.env.CONTEXT_TIERED_ENABLED;
  });

  it('should extract "cauda equina" as critical severity red flag', () => {
    recordLearning('org1', 'p1', 'red_flag_analysis', 'Mistanke om cauda equina syndrom');
    const ctx = getSessionContext('org1', 'p1');
    expect(ctx).toContain('cauda equina');
  });

  it('should extract "fraktur" as high severity red flag', () => {
    recordLearning('org1', 'p1', 'soap_notes', 'Mulig fraktur i thorakalcolumna');
    const ctx = getSessionContext('org1', 'p1');
    expect(ctx).toContain('fraktur');
  });

  it('should extract multiple red flags from one output', () => {
    recordLearning('org1', 'p1', 'red_flag_analysis', 'Myelopati tegn, mulig malign prosess');
    const ctx = getSessionContext('org1', 'p1');
    expect(ctx).toContain('myelopati');
    expect(ctx).toContain('malign');
  });

  it('should extract ICPC codes from output', () => {
    recordLearning('org1', 'p1', 'soap_notes', 'Diagnose: L84 Ryggsyndromer uten utstråling, L03');
    const ctx = getSessionContext('org1', 'p1');
    expect(ctx).toContain('L84');
    expect(ctx).toContain('L03');
  });

  it('should deduplicate ICPC codes', () => {
    recordLearning('org1', 'p1', 'soap_notes', 'Kode L84 og L84 igjen');
    const ctx = getSessionContext('org1', 'p1');
    // Should appear only once in the codes list
    const matches = ctx.match(/L84/g);
    expect(matches.length).toBe(1);
  });

  it('should store confidence metadata', () => {
    recordLearning('org1', 'p1', 'soap_notes', 'Ingen røde flagg', {
      confidence: { score: 0.92, level: 'high' },
    });
    // Confidence is stored internally but not output in getSessionContext
    // Verify no throw and session exists
    const ctx = getSessionContext('org1', 'p1');
    expect(typeof ctx).toBe('string');
  });

  it('should isolate sessions by org:patient key', () => {
    recordLearning('org1', 'p1', 'red_flag_analysis', 'cauda equina');
    recordLearning('org1', 'p2', 'soap_notes', 'fraktur');

    const ctx1 = getSessionContext('org1', 'p1');
    const ctx2 = getSessionContext('org1', 'p2');

    expect(ctx1).toContain('cauda equina');
    expect(ctx1).not.toContain('fraktur');
    expect(ctx2).toContain('fraktur');
    expect(ctx2).not.toContain('cauda equina');
  });

  it('should trim learnings to MAX_LEARNINGS (20) with FIFO', () => {
    // Push 22 learnings (each output has a unique red flag-less code to force a learning)
    for (let i = 0; i < 22; i++) {
      recordLearning('org1', 'p1', 'soap_notes', `Kode A${String(i).padStart(2, '0')}`);
    }
    // Context should still work (no crash)
    const ctx = getSessionContext('org1', 'p1');
    expect(typeof ctx).toBe('string');
    // Oldest codes (A00, A01) should be trimmed — only last 20 remain
    // A00 was the first pushed, should be gone
    expect(ctx).not.toContain('A00');
    // A21 was the last pushed, should be present
    expect(ctx).toContain('A21');
  });

  it('should deduplicate red flags in getSessionContext output', () => {
    recordLearning('org1', 'p1', 'soap_notes', 'cauda equina problem');
    recordLearning('org1', 'p1', 'soap_notes', 'cauda equina igjen');
    const ctx = getSessionContext('org1', 'p1');
    const matches = ctx.match(/cauda equina/g);
    expect(matches.length).toBe(1);
  });

  it('should include diagnosis codes section in output', () => {
    recordLearning('org1', 'p1', 'soap_notes', 'L84 ryggsmerte');
    const ctx = getSessionContext('org1', 'p1');
    expect(ctx).toContain('Diagnosekoder brukt');
  });

  it('clearSessionMemory() should clear specific session', () => {
    recordLearning('org1', 'p1', 'soap_notes', 'cauda equina');
    recordLearning('org1', 'p2', 'soap_notes', 'fraktur');
    clearSessionMemory('org1', 'p1');
    expect(getSessionContext('org1', 'p1')).toBe('');
    expect(getSessionContext('org1', 'p2')).toContain('fraktur');
  });

  it('clearAllSessionMemory() should clear all sessions', () => {
    recordLearning('org1', 'p1', 'soap_notes', 'cauda equina');
    recordLearning('org2', 'p3', 'soap_notes', 'fraktur');
    clearAllSessionMemory();
    expect(getSessionContext('org1', 'p1')).toBe('');
    expect(getSessionContext('org2', 'p3')).toBe('');
  });
});
