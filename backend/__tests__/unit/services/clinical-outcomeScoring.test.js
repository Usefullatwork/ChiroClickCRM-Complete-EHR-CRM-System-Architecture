/**
 * Unit Tests for Outcome Scoring (src/services/clinical/outcomeScoring.js)
 * Tests ODI, NDI, VAS, DASH, NPRS scoring algorithms
 */

import { jest } from '@jest/globals';

const { scoreODI, scoreNDI, scoreVAS, scoreDASH, scoreNPRS, getScorer, scoreQuestionnaire } =
  await import('../../../src/services/clinical/outcomeScoring.js');

describe('outcomeScoring', () => {
  // ===========================================================================
  // scoreODI
  // ===========================================================================
  describe('scoreODI', () => {
    it('should score minimal disability (0-20%)', () => {
      const result = scoreODI([0, 0, 1, 0, 0, 0, 1, 0, 0, 0]);
      expect(result.percentage).toBeLessThanOrEqual(20);
      expect(result.severity).toBe('Minimal disability');
    });

    it('should score moderate disability (21-40%)', () => {
      const result = scoreODI([2, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
      expect(result.percentage).toBe(40);
      expect(result.severity).toBe('Moderate disability');
    });

    it('should score severe disability (41-60%)', () => {
      const result = scoreODI([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]);
      expect(result.percentage).toBe(60);
      expect(result.severity).toBe('Severe disability');
    });

    it('should handle null answers (skip unanswered)', () => {
      const result = scoreODI([2, null, 3, null, 1, null, 2, null, null, null]);
      expect(result.score).toBe(8);
      expect(result.maxScore).toBe(20);
    });

    it('should throw for non-array input', () => {
      expect(() => scoreODI('invalid')).toThrow('ODI answers must be an array');
    });

    it('should throw for empty valid answers', () => {
      expect(() => scoreODI([null, null])).toThrow('At least one ODI section');
    });

    it('should throw for out-of-range value', () => {
      expect(() => scoreODI([6])).toThrow('integer 0-5');
    });

    it('should throw for non-integer value', () => {
      expect(() => scoreODI([2.5])).toThrow('integer 0-5');
    });

    it('should score bed-bound (>80%)', () => {
      const result = scoreODI([5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
      expect(result.percentage).toBe(100);
      expect(result.severity).toBe('Bed-bound');
    });

    it('should calculate percentage correctly', () => {
      const result = scoreODI([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
      expect(result.score).toBe(10);
      expect(result.maxScore).toBe(50);
      expect(result.percentage).toBe(20);
    });
  });

  // ===========================================================================
  // scoreNDI
  // ===========================================================================
  describe('scoreNDI', () => {
    it('should score no disability (0-4)', () => {
      const result = scoreNDI([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(result.severity).toBe('No disability');
    });

    it('should score mild disability (5-14)', () => {
      const result = scoreNDI([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
      expect(result.score).toBe(10);
      expect(result.severity).toBe('Mild disability');
    });

    it('should score complete disability (35+)', () => {
      const result = scoreNDI([4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
      expect(result.severity).toBe('Complete disability');
    });

    it('should throw for non-array input', () => {
      expect(() => scoreNDI(42)).toThrow('NDI answers must be an array');
    });

    it('should throw for out-of-range answers', () => {
      expect(() => scoreNDI([-1])).toThrow('integer 0-5');
    });
  });

  // ===========================================================================
  // scoreVAS
  // ===========================================================================
  describe('scoreVAS', () => {
    it('should score no pain (0)', () => {
      const result = scoreVAS(0);
      expect(result.severity).toBe('No pain');
    });

    it('should score mild pain (1-30)', () => {
      const result = scoreVAS(20);
      expect(result.severity).toBe('Mild pain');
    });

    it('should score moderate pain (31-60)', () => {
      const result = scoreVAS(50);
      expect(result.severity).toBe('Moderate pain');
    });

    it('should score severe pain (61-100)', () => {
      const result = scoreVAS(80);
      expect(result.severity).toBe('Severe pain');
    });

    it('should throw for value out of range', () => {
      expect(() => scoreVAS(101)).toThrow('number 0-100');
    });

    it('should throw for non-number', () => {
      expect(() => scoreVAS('high')).toThrow('number 0-100');
    });

    it('should throw for negative value', () => {
      expect(() => scoreVAS(-1)).toThrow('number 0-100');
    });
  });

  // ===========================================================================
  // scoreDASH
  // ===========================================================================
  describe('scoreDASH', () => {
    it('should score with minimum 27 items', () => {
      const answers = new Array(27).fill(1);
      const result = scoreDASH(answers);
      expect(result.score).toBe(0);
      expect(result.severity).toBe('No difficulty');
    });

    it('should throw when fewer than 27 items', () => {
      const answers = new Array(26).fill(1);
      expect(() => scoreDASH(answers)).toThrow('at least 27');
    });

    it('should score severe difficulty', () => {
      const answers = new Array(30).fill(5);
      const result = scoreDASH(answers);
      expect(result.score).toBe(100);
      expect(result.severity).toBe('Severe difficulty');
    });

    it('should handle 30 items correctly', () => {
      const answers = new Array(30).fill(3);
      const result = scoreDASH(answers);
      expect(result.score).toBe(50);
      expect(result.severity).toBe('Moderate difficulty');
    });

    it('should throw for non-array', () => {
      expect(() => scoreDASH('invalid')).toThrow('DASH answers must be an array');
    });

    it('should throw for out-of-range answers', () => {
      const answers = new Array(27).fill(0);
      expect(() => scoreDASH(answers)).toThrow('integer 1-5');
    });
  });

  // ===========================================================================
  // scoreNPRS
  // ===========================================================================
  describe('scoreNPRS', () => {
    it('should score no pain (0)', () => {
      expect(scoreNPRS(0).severity).toBe('No pain');
    });

    it('should score mild pain (1-3)', () => {
      expect(scoreNPRS(2).severity).toBe('Mild pain');
    });

    it('should score moderate pain (4-6)', () => {
      expect(scoreNPRS(5).severity).toBe('Moderate pain');
    });

    it('should score severe pain (7-10)', () => {
      expect(scoreNPRS(8).severity).toBe('Severe pain');
    });

    it('should throw for non-integer', () => {
      expect(() => scoreNPRS(5.5)).toThrow('integer 0-10');
    });

    it('should throw for out of range', () => {
      expect(() => scoreNPRS(11)).toThrow('integer 0-10');
    });
  });

  // ===========================================================================
  // getScorer
  // ===========================================================================
  describe('getScorer', () => {
    it('should return scoreODI for ODI', () => {
      expect(getScorer('ODI')).toBe(scoreODI);
    });

    it('should return scoreNDI for NDI', () => {
      expect(getScorer('NDI')).toBe(scoreNDI);
    });

    it('should throw for unknown type', () => {
      expect(() => getScorer('UNKNOWN')).toThrow('Unknown questionnaire type');
    });
  });

  // ===========================================================================
  // scoreQuestionnaire
  // ===========================================================================
  describe('scoreQuestionnaire', () => {
    it('should score VAS with single value', () => {
      const result = scoreQuestionnaire('VAS', 50);
      expect(result.score).toBe(50);
    });

    it('should score VAS with object { value }', () => {
      const result = scoreQuestionnaire('VAS', { value: 30 });
      expect(result.score).toBe(30);
    });

    it('should score NPRS with object { score }', () => {
      const result = scoreQuestionnaire('NPRS', { score: 5 });
      expect(result.score).toBe(5);
    });

    it('should score ODI with array', () => {
      const result = scoreQuestionnaire('ODI', [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
      expect(result.score).toBe(10);
    });
  });
});
