/**
 * Outcome Scoring Tests
 * Tests all clinical scoring algorithms: ODI, NDI, VAS, DASH, NPRS
 */

import {
  scoreODI,
  scoreNDI,
  scoreVAS,
  scoreDASH,
  scoreNPRS,
  getScorer,
  scoreQuestionnaire,
} from '../../src/services/outcomeScoring.js';

describe('Outcome Scoring Algorithms', () => {
  // =========================================================================
  // ODI (Oswestry Disability Index)
  // =========================================================================
  describe('scoreODI', () => {
    test('should score perfect (0%) as minimal disability', () => {
      const result = scoreODI([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(result.score).toBe(0);
      expect(result.maxScore).toBe(50);
      expect(result.percentage).toBe(0);
      expect(result.severity).toBe('Minimal disability');
    });

    test('should score worst (100%) as bed-bound', () => {
      const result = scoreODI([5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
      expect(result.score).toBe(50);
      expect(result.maxScore).toBe(50);
      expect(result.percentage).toBe(100);
      expect(result.severity).toBe('Bed-bound');
    });

    test('should classify 20% as minimal disability', () => {
      const result = scoreODI([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]); // 10/50 = 20%
      expect(result.percentage).toBe(20);
      expect(result.severity).toBe('Minimal disability');
    });

    test('should classify 40% as moderate disability', () => {
      const result = scoreODI([2, 2, 2, 2, 2, 2, 2, 2, 2, 2]); // 20/50 = 40%
      expect(result.percentage).toBe(40);
      expect(result.severity).toBe('Moderate disability');
    });

    test('should classify 60% as severe disability', () => {
      const result = scoreODI([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]); // 30/50 = 60%
      expect(result.percentage).toBe(60);
      expect(result.severity).toBe('Severe disability');
    });

    test('should classify 80% as crippled', () => {
      const result = scoreODI([4, 4, 4, 4, 4, 4, 4, 4, 4, 4]); // 40/50 = 80%
      expect(result.percentage).toBe(80);
      expect(result.severity).toBe('Crippled');
    });

    test('should handle partial answers (null sections)', () => {
      const result = scoreODI([3, null, 2, null, 4, null, 1, null, 3, null]);
      expect(result.maxScore).toBe(25); // 5 answered * 5
      expect(result.score).toBe(13);
      expect(result.percentage).toBe(52);
    });

    test('should throw on empty array', () => {
      expect(() => scoreODI([])).toThrow('At least one');
    });

    test('should throw on all-null answers', () => {
      expect(() => scoreODI([null, null, null])).toThrow('At least one');
    });

    test('should throw on non-array input', () => {
      expect(() => scoreODI('invalid')).toThrow('must be an array');
    });

    test('should throw on out-of-range values', () => {
      expect(() => scoreODI([6])).toThrow('0-5');
      expect(() => scoreODI([-1])).toThrow('0-5');
    });

    test('should throw on non-integer values', () => {
      expect(() => scoreODI([2.5])).toThrow('integer');
    });

    test('should handle mixed valid and null answers', () => {
      const result = scoreODI([0, null, 5, null, 3]);
      expect(result.score).toBe(8);
      expect(result.maxScore).toBe(15);
    });
  });

  // =========================================================================
  // NDI (Neck Disability Index)
  // =========================================================================
  describe('scoreNDI', () => {
    test('should score 0-4 as no disability', () => {
      const result = scoreNDI([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(result.score).toBe(0);
      expect(result.severity).toBe('No disability');
    });

    test('should score 5-14 as mild disability', () => {
      const result = scoreNDI([1, 1, 1, 1, 1, 0, 0, 0, 0, 0]); // score=5
      expect(result.score).toBe(5);
      expect(result.severity).toBe('Mild disability');
    });

    test('should score 15-24 as moderate disability', () => {
      const result = scoreNDI([2, 2, 2, 2, 2, 1, 1, 1, 1, 1]); // score=15
      expect(result.score).toBe(15);
      expect(result.severity).toBe('Moderate disability');
    });

    test('should score 25-34 as severe disability', () => {
      const result = scoreNDI([3, 3, 3, 3, 3, 2, 2, 2, 2, 2]); // score=25
      expect(result.score).toBe(25);
      expect(result.severity).toBe('Severe disability');
    });

    test('should score 35+ as complete disability', () => {
      const result = scoreNDI([4, 4, 4, 4, 4, 3, 3, 3, 3, 3]); // score=35
      expect(result.score).toBe(35);
      expect(result.severity).toBe('Complete disability');
    });

    test('should calculate correct percentage', () => {
      const result = scoreNDI([2, 2, 2, 2, 2, 2, 2, 2, 2, 2]); // 20/50
      expect(result.percentage).toBe(40);
    });

    test('should handle partial answers', () => {
      const result = scoreNDI([3, null, 4, null, 2]);
      expect(result.score).toBe(9);
      expect(result.maxScore).toBe(15);
    });

    test('should throw on invalid input', () => {
      expect(() => scoreNDI(null)).toThrow('must be an array');
      expect(() => scoreNDI([6])).toThrow('0-5');
    });
  });

  // =========================================================================
  // VAS (Visual Analog Scale)
  // =========================================================================
  describe('scoreVAS', () => {
    test('should score 0 as no pain', () => {
      const result = scoreVAS(0);
      expect(result.score).toBe(0);
      expect(result.maxScore).toBe(100);
      expect(result.severity).toBe('No pain');
    });

    test('should score 1-30 as mild pain', () => {
      expect(scoreVAS(1).severity).toBe('Mild pain');
      expect(scoreVAS(15).severity).toBe('Mild pain');
      expect(scoreVAS(30).severity).toBe('Mild pain');
    });

    test('should score 31-60 as moderate pain', () => {
      expect(scoreVAS(31).severity).toBe('Moderate pain');
      expect(scoreVAS(45).severity).toBe('Moderate pain');
      expect(scoreVAS(60).severity).toBe('Moderate pain');
    });

    test('should score 61-100 as severe pain', () => {
      expect(scoreVAS(61).severity).toBe('Severe pain');
      expect(scoreVAS(80).severity).toBe('Severe pain');
      expect(scoreVAS(100).severity).toBe('Severe pain');
    });

    test('should handle decimal values', () => {
      const result = scoreVAS(45.5);
      expect(result.score).toBe(45.5);
      expect(result.percentage).toBe(45.5);
    });

    test('should throw on out-of-range values', () => {
      expect(() => scoreVAS(-1)).toThrow('0-100');
      expect(() => scoreVAS(101)).toThrow('0-100');
    });

    test('should throw on non-number input', () => {
      expect(() => scoreVAS('50')).toThrow('number');
      expect(() => scoreVAS(null)).toThrow();
    });
  });

  // =========================================================================
  // DASH (Disabilities of Arm, Shoulder and Hand)
  // =========================================================================
  describe('scoreDASH', () => {
    test('should score all 1s as 0% (no difficulty)', () => {
      const result = scoreDASH(Array(30).fill(1));
      expect(result.score).toBe(0);
      expect(result.severity).toBe('No difficulty');
    });

    test('should score all 5s as 100% (severe)', () => {
      const result = scoreDASH(Array(30).fill(5));
      expect(result.score).toBe(100);
      expect(result.severity).toBe('Severe difficulty');
    });

    test('should score all 3s as 50% (moderate)', () => {
      const result = scoreDASH(Array(30).fill(3));
      expect(result.score).toBe(50);
      expect(result.severity).toBe('Moderate difficulty');
    });

    test('should apply DASH formula correctly: ((sum/n)-1)*25', () => {
      const answers = Array(30).fill(2); // sum=60, n=30, ((60/30)-1)*25 = 25
      const result = scoreDASH(answers);
      expect(result.score).toBe(25);
    });

    test('should accept 27 answered items (3 nulls)', () => {
      const answers = [...Array(27).fill(3), null, null, null];
      const result = scoreDASH(answers);
      expect(result.score).toBe(50);
    });

    test('should throw if fewer than 27 answered', () => {
      const answers = [...Array(26).fill(3), null, null, null, null];
      expect(() => scoreDASH(answers)).toThrow('at least 27');
    });

    test('should throw on values outside 1-5 range', () => {
      const answers = Array(30).fill(0); // 0 is out of range
      expect(() => scoreDASH(answers)).toThrow('1-5');
    });

    test('should classify 0-15 as no difficulty', () => {
      const result = scoreDASH(Array(30).fill(1)); // 0%
      expect(result.severity).toBe('No difficulty');
    });

    test('should classify 16-40 as mild difficulty', () => {
      // ((sum/30)-1)*25 = 25 -> mild
      const result = scoreDASH(Array(30).fill(2));
      expect(result.severity).toBe('Mild difficulty');
    });

    test('should classify 41-60 as moderate difficulty', () => {
      const result = scoreDASH(Array(30).fill(3)); // 50%
      expect(result.severity).toBe('Moderate difficulty');
    });

    test('should classify 61+ as severe difficulty', () => {
      const result = scoreDASH(Array(30).fill(4)); // 75%
      expect(result.severity).toBe('Severe difficulty');
    });

    test('should throw on non-array', () => {
      expect(() => scoreDASH('invalid')).toThrow('must be an array');
    });
  });

  // =========================================================================
  // NPRS (Numeric Pain Rating Scale)
  // =========================================================================
  describe('scoreNPRS', () => {
    test('should score 0 as no pain', () => {
      const result = scoreNPRS(0);
      expect(result.score).toBe(0);
      expect(result.maxScore).toBe(10);
      expect(result.percentage).toBe(0);
      expect(result.severity).toBe('No pain');
    });

    test('should score 1-3 as mild pain', () => {
      expect(scoreNPRS(1).severity).toBe('Mild pain');
      expect(scoreNPRS(2).severity).toBe('Mild pain');
      expect(scoreNPRS(3).severity).toBe('Mild pain');
    });

    test('should score 4-6 as moderate pain', () => {
      expect(scoreNPRS(4).severity).toBe('Moderate pain');
      expect(scoreNPRS(5).severity).toBe('Moderate pain');
      expect(scoreNPRS(6).severity).toBe('Moderate pain');
    });

    test('should score 7-10 as severe pain', () => {
      expect(scoreNPRS(7).severity).toBe('Severe pain');
      expect(scoreNPRS(8).severity).toBe('Severe pain');
      expect(scoreNPRS(9).severity).toBe('Severe pain');
      expect(scoreNPRS(10).severity).toBe('Severe pain');
    });

    test('should calculate percentage correctly', () => {
      expect(scoreNPRS(5).percentage).toBe(50);
      expect(scoreNPRS(10).percentage).toBe(100);
    });

    test('should throw on non-integer', () => {
      expect(() => scoreNPRS(5.5)).toThrow('integer');
    });

    test('should throw on out-of-range', () => {
      expect(() => scoreNPRS(-1)).toThrow('0-10');
      expect(() => scoreNPRS(11)).toThrow('0-10');
    });

    test('should throw on non-number', () => {
      expect(() => scoreNPRS('5')).toThrow();
    });
  });

  // =========================================================================
  // getScorer utility
  // =========================================================================
  describe('getScorer', () => {
    test('should return correct scorer for each type', () => {
      expect(getScorer('ODI')).toBe(scoreODI);
      expect(getScorer('NDI')).toBe(scoreNDI);
      expect(getScorer('VAS')).toBe(scoreVAS);
      expect(getScorer('DASH')).toBe(scoreDASH);
      expect(getScorer('NPRS')).toBe(scoreNPRS);
    });

    test('should throw on unknown type', () => {
      expect(() => getScorer('UNKNOWN')).toThrow('Unknown questionnaire type');
      expect(() => getScorer('')).toThrow('Unknown questionnaire type');
    });
  });

  // =========================================================================
  // scoreQuestionnaire wrapper
  // =========================================================================
  describe('scoreQuestionnaire', () => {
    test('should score NPRS with object wrapper', () => {
      const result = scoreQuestionnaire('NPRS', { value: 7 });
      expect(result.score).toBe(7);
      expect(result.severity).toBe('Severe pain');
    });

    test('should score VAS with object wrapper', () => {
      const result = scoreQuestionnaire('VAS', { value: 45 });
      expect(result.score).toBe(45);
      expect(result.severity).toBe('Moderate pain');
    });

    test('should score NPRS with raw number', () => {
      const result = scoreQuestionnaire('NPRS', 3);
      expect(result.score).toBe(3);
      expect(result.severity).toBe('Mild pain');
    });

    test('should score VAS with raw number', () => {
      const result = scoreQuestionnaire('VAS', 80);
      expect(result.score).toBe(80);
      expect(result.severity).toBe('Severe pain');
    });

    test('should score ODI with array', () => {
      const result = scoreQuestionnaire('ODI', [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
      expect(result.score).toBe(20);
      expect(result.percentage).toBe(40);
    });

    test('should score NDI with array', () => {
      const result = scoreQuestionnaire('NDI', [1, 1, 1, 1, 1, 0, 0, 0, 0, 0]);
      expect(result.score).toBe(5);
      expect(result.severity).toBe('Mild disability');
    });

    test('should score DASH with array', () => {
      const result = scoreQuestionnaire('DASH', Array(30).fill(2));
      expect(result.score).toBe(25);
    });

    test('should throw on unknown type', () => {
      expect(() => scoreQuestionnaire('INVALID', [1, 2, 3])).toThrow('Unknown');
    });

    test('should use score property from object for VAS', () => {
      const result = scoreQuestionnaire('VAS', { score: 55 });
      expect(result.score).toBe(55);
    });
  });

  // =========================================================================
  // Edge cases and boundary values
  // =========================================================================
  describe('Boundary values', () => {
    test('ODI boundary: 20% is minimal, 21% is moderate', () => {
      // 10/50 = 20% -> minimal
      const minimal = scoreODI([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
      expect(minimal.severity).toBe('Minimal disability');

      // Need > 20% -> moderate
      const moderate = scoreODI([1, 1, 1, 1, 1, 1, 1, 1, 1, 2]); // 11/50 = 22%
      expect(moderate.severity).toBe('Moderate disability');
    });

    test('NDI boundary: 4 is no disability, 5 is mild', () => {
      const none = scoreNDI([0, 0, 0, 0, 4, 0, 0, 0, 0, 0]); // score=4
      expect(none.severity).toBe('No disability');

      const mild = scoreNDI([0, 0, 0, 0, 5, 0, 0, 0, 0, 0]); // score=5
      expect(mild.severity).toBe('Mild disability');
    });

    test('VAS boundary: 30 is mild, 31 is moderate', () => {
      expect(scoreVAS(30).severity).toBe('Mild pain');
      expect(scoreVAS(31).severity).toBe('Moderate pain');
    });

    test('NPRS boundary: 3 is mild, 4 is moderate', () => {
      expect(scoreNPRS(3).severity).toBe('Mild pain');
      expect(scoreNPRS(4).severity).toBe('Moderate pain');
    });

    test('NPRS boundary: 6 is moderate, 7 is severe', () => {
      expect(scoreNPRS(6).severity).toBe('Moderate pain');
      expect(scoreNPRS(7).severity).toBe('Severe pain');
    });
  });
});
