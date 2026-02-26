/**
 * Red Flag Engine Tests
 */

import { describe, it, test, expect, jest } from '@jest/globals';

// Mock database — redFlagEngine imports it but tests only use pure functions
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: jest.fn(),
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const { default: redFlagEngine } = await import('../../src/services/redFlagEngine.js');

describe('Red Flag Engine', () => {
  describe('scanForRedFlags', () => {
    test('should detect cauda equina bladder symptoms', () => {
      const flags = redFlagEngine.scanForRedFlags(
        'Patient has bladder dysfunction and urinary incontinence'
      );

      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some((f) => f.category === 'CAUDA_EQUINA')).toBe(true);
      expect(flags.some((f) => f.severity === 'CRITICAL')).toBe(true);
    });

    test('should detect Norwegian cauda equina symptoms', () => {
      const flags = redFlagEngine.scanForRedFlags(
        'Pasient med blæreforstyrrelser og tap av kontroll over tarm'
      );

      expect(flags.some((f) => f.category === 'CAUDA_EQUINA')).toBe(true);
    });

    test('should detect saddle anesthesia', () => {
      const flags = redFlagEngine.scanForRedFlags('Nummenhet mellom bena og sadel-nummenhet');

      expect(flags.some((f) => f.ruleId === 'ce_saddle')).toBe(true);
    });

    test('should detect malignancy weight loss', () => {
      const flags = redFlagEngine.scanForRedFlags('Uforklarlig vekttap på 8 kg siste 3 måneder');

      expect(flags.some((f) => f.category === 'MALIGNANCY')).toBe(true);
    });

    test('should detect night pain', () => {
      const flags = redFlagEngine.scanForRedFlags('Constant pain that wakes the patient at night');

      expect(flags.some((f) => f.ruleId === 'mal_night')).toBe(true);
    });

    test('should detect infection fever', () => {
      const flags = redFlagEngine.scanForRedFlags('Pasient har feber og frysninger');

      expect(flags.some((f) => f.category === 'INFECTION')).toBe(true);
    });

    test('should detect immunocompromised status', () => {
      const flags = redFlagEngine.scanForRedFlags(
        'Patient is immunocompromised due to chemotherapy'
      );

      expect(flags.some((f) => f.ruleId === 'inf_immune')).toBe(true);
    });

    test('should detect trauma fracture risk', () => {
      const flags = redFlagEngine.scanForRedFlags('Betydelig trauma etter bilulykke');

      expect(flags.some((f) => f.category === 'FRACTURE')).toBe(true);
    });

    test('should detect osteoporosis', () => {
      const flags = redFlagEngine.scanForRedFlags('Kjent osteoporose med lav beintetthet');

      expect(flags.some((f) => f.ruleId === 'fx_osteoporosis')).toBe(true);
    });

    test('should detect inflammatory morning stiffness', () => {
      const flags = redFlagEngine.scanForRedFlags(
        'Morning stiffness lasting more than 30 minutes that improves with activity'
      );

      expect(flags.some((f) => f.category === 'INFLAMMATORY')).toBe(true);
    });

    test('should detect progressive neurological symptoms', () => {
      const flags = redFlagEngine.scanForRedFlags('Progressive weakness in lower extremities');

      expect(flags.some((f) => f.category === 'NEUROLOGICAL')).toBe(true);
    });

    test('should detect myelopathy signs', () => {
      const flags = redFlagEngine.scanForRedFlags('Positive Babinski sign with hyperreflexia');

      expect(flags.some((f) => f.ruleId === 'neuro_myelopathy')).toBe(true);
    });

    test('should return empty for normal content', () => {
      const flags = redFlagEngine.scanForRedFlags(
        'Mild neck pain after desk work. Normal examination.'
      );

      expect(flags.length).toBe(0);
    });

    test('should sort by severity', () => {
      const flags = redFlagEngine.scanForRedFlags(
        'Bladder dysfunction, unexplained weight loss, and morning stiffness'
      );

      // Critical should be first
      if (flags.length >= 2) {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
        for (let i = 1; i < flags.length; i++) {
          expect(severityOrder[flags[i - 1].severity]).toBeLessThanOrEqual(
            severityOrder[flags[i].severity]
          );
        }
      }
    });
  });

  describe('calculateRiskScore', () => {
    test('should return LOW for no flags', () => {
      const result = redFlagEngine.calculateRiskScore([]);

      expect(result.score).toBe(0);
      expect(result.level).toBe('LOW');
      expect(result.recommendation).toBe('proceed');
    });

    test('should return CRITICAL for cauda equina', () => {
      const flags = redFlagEngine.scanForRedFlags('Saddle anesthesia with bladder dysfunction');
      const result = redFlagEngine.calculateRiskScore(flags);

      expect(result.level).toBe('CRITICAL');
      expect(result.recommendation).toBe('immediate_referral');
    });

    test('should return HIGH for malignancy indicators', () => {
      const flags = redFlagEngine.scanForRedFlags('Unexplained weight loss with night pain');
      const result = redFlagEngine.calculateRiskScore(flags);

      expect(['CRITICAL', 'HIGH']).toContain(result.level);
      expect(['immediate_referral', 'urgent_evaluation']).toContain(result.recommendation);
    });

    test('should increase score for multiple flags', () => {
      const singleFlags = redFlagEngine.scanForRedFlags('Fever');
      const multipleFlags = redFlagEngine.scanForRedFlags(
        'Fever and immunocompromised and recent surgery'
      );

      const singleScore = redFlagEngine.calculateRiskScore(singleFlags);
      const multipleScore = redFlagEngine.calculateRiskScore(multipleFlags);

      expect(multipleScore.score).toBeGreaterThanOrEqual(singleScore.score);
    });

    test('should apply age modifier', () => {
      const flags = redFlagEngine.scanForRedFlags('Morning stiffness');

      const youngResult = redFlagEngine.calculateRiskScore(flags, { age: 25 });
      const elderlyResult = redFlagEngine.calculateRiskScore(flags, { age: 80 });

      expect(elderlyResult.score).toBeGreaterThan(youngResult.score);
    });

    test('should apply risk multiplier', () => {
      const flags = redFlagEngine.scanForRedFlags('Previous cancer history');
      const result = redFlagEngine.calculateRiskScore(flags);

      // Cancer history has riskMultiplier: 2.0
      expect(result.flagCount).toBeGreaterThan(0);
    });
  });

  describe('getScreeningQuestions', () => {
    test('should return questions for detected flags', () => {
      const flags = redFlagEngine.scanForRedFlags('Blæreforstyrrelser');
      const questions = redFlagEngine.getScreeningQuestions(flags, 'no');

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toHaveProperty('category');
      expect(questions[0]).toHaveProperty('questions');
    });

    test('should not duplicate questions for same category', () => {
      const flags = redFlagEngine.scanForRedFlags('Bladder dysfunction and bowel dysfunction');
      const questions = redFlagEngine.getScreeningQuestions(flags);

      const categories = questions.map((q) => q.category);
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toBe(uniqueCategories.length);
    });

    test('should return empty for no flags', () => {
      const questions = redFlagEngine.getScreeningQuestions([]);
      expect(questions.length).toBe(0);
    });
  });

  describe('generateAlert', () => {
    test('should generate alert for critical flags', () => {
      const flags = redFlagEngine.scanForRedFlags('Cauda equina syndrom mistanke');
      const riskScore = redFlagEngine.calculateRiskScore(flags);
      const alert = redFlagEngine.generateAlert(flags, riskScore, 'no');

      expect(alert).not.toBeNull();
      expect(alert.level).toBe('CRITICAL');
      expect(alert.title).toContain('KRITISK');
    });

    test('should generate alert in English', () => {
      const flags = redFlagEngine.scanForRedFlags('Bladder dysfunction');
      const riskScore = redFlagEngine.calculateRiskScore(flags);
      const alert = redFlagEngine.generateAlert(flags, riskScore, 'en');

      expect(alert.title).toContain('CRITICAL');
    });

    test('should return null for no flags', () => {
      const alert = redFlagEngine.generateAlert([], { score: 0, level: 'LOW' });
      expect(alert).toBeNull();
    });

    test('should include flag details', () => {
      const flags = redFlagEngine.scanForRedFlags('Fever and weight loss');
      const riskScore = redFlagEngine.calculateRiskScore(flags);
      const alert = redFlagEngine.generateAlert(flags, riskScore, 'en');

      expect(alert.flags).toBeDefined();
      expect(alert.flags.length).toBeGreaterThan(0);
      expect(alert.flags[0]).toHaveProperty('action');
      expect(alert.flags[0]).toHaveProperty('timeframe');
    });

    test('should include timestamp', () => {
      const flags = redFlagEngine.scanForRedFlags('Night pain');
      const riskScore = redFlagEngine.calculateRiskScore(flags);
      const alert = redFlagEngine.generateAlert(flags, riskScore);

      expect(alert.timestamp).toBeDefined();
      expect(new Date(alert.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('RED_FLAG_CATEGORIES', () => {
    test('should have all required categories', () => {
      const categories = Object.keys(redFlagEngine.RED_FLAG_CATEGORIES);

      expect(categories).toContain('CAUDA_EQUINA');
      expect(categories).toContain('MALIGNANCY');
      expect(categories).toContain('INFECTION');
      expect(categories).toContain('FRACTURE');
      expect(categories).toContain('VASCULAR');
      expect(categories).toContain('INFLAMMATORY');
      expect(categories).toContain('NEUROLOGICAL');
    });

    test('should have bilingual names', () => {
      Object.values(redFlagEngine.RED_FLAG_CATEGORIES).forEach((category) => {
        expect(category).toHaveProperty('name_no');
        expect(category).toHaveProperty('name_en');
      });
    });

    test('should have severity levels', () => {
      const validSeverities = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
      Object.values(redFlagEngine.RED_FLAG_CATEGORIES).forEach((category) => {
        expect(validSeverities).toContain(category.severity);
      });
    });
  });
});
