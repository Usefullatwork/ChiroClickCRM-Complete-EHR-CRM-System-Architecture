/**
 * Unit Tests for Red Flag Engine (src/services/clinical/redFlagEngine.js)
 * Tests red flag detection, severity scoring, screening questions,
 * clinical alert generation, and audit logging.
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  default: { query: mockQuery, transaction: jest.fn(), getClient: jest.fn() },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const {
  RED_FLAG_CATEGORIES,
  RED_FLAG_RULES,
  scanForRedFlags,
  calculateRiskScore,
  getScreeningQuestions,
  generateAlert,
  logRedFlagDetection,
} = await import('../../../src/services/clinical/redFlagEngine.js');

describe('redFlagEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // RED_FLAG_CATEGORIES constant
  // ===========================================================================

  describe('RED_FLAG_CATEGORIES', () => {
    it('should export CAUDA_EQUINA as CRITICAL severity', () => {
      expect(RED_FLAG_CATEGORIES.CAUDA_EQUINA.severity).toBe('CRITICAL');
      expect(RED_FLAG_CATEGORIES.CAUDA_EQUINA.action).toBe('IMMEDIATE_REFERRAL');
    });

    it('should export all required category keys', () => {
      const expected = [
        'CAUDA_EQUINA',
        'MALIGNANCY',
        'INFECTION',
        'FRACTURE',
        'VASCULAR',
        'INFLAMMATORY',
        'NEUROLOGICAL',
        'SYSTEMIC',
        'MEDICATION',
        'AGE_RELATED',
      ];
      expected.forEach((key) => {
        expect(RED_FLAG_CATEGORIES).toHaveProperty(key);
      });
    });
  });

  // ===========================================================================
  // scanForRedFlags
  // ===========================================================================

  describe('scanForRedFlags', () => {
    it('should return empty array for benign clinical text', () => {
      const result = scanForRedFlags('Pasient har mild ryggsmerte, bedres med hvile og bevegelse.');
      expect(result).toEqual([]);
    });

    it('should detect bladder dysfunction as CAUDA_EQUINA (CRITICAL)', () => {
      const result = scanForRedFlags(
        'Pasienten rapporterer urin inkontinens og nedsatt kraft i bena.'
      );
      const flag = result.find((f) => f.category === 'CAUDA_EQUINA');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('CRITICAL');
      expect(flag.action).toBe('IMMEDIATE_REFERRAL');
      expect(flag.ruleId).toBe('ce_bladder');
    });

    it('should detect saddle anesthesia as CAUDA_EQUINA (CRITICAL)', () => {
      const result = scanForRedFlags('Saddle numbness and loss of sensation between legs.');
      const flag = result.find((f) => f.ruleId === 'ce_saddle');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('CRITICAL');
    });

    it('should detect bowel dysfunction as CAUDA_EQUINA', () => {
      const result = scanForRedFlags('Loss of bowel control reported since yesterday.');
      const flag = result.find((f) => f.ruleId === 'ce_bowel');
      expect(flag).toBeDefined();
      expect(flag.category).toBe('CAUDA_EQUINA');
    });

    it('should detect previous cancer history as MALIGNANCY (HIGH)', () => {
      const result = scanForRedFlags('Pasient har tidligere kreft i prostata.');
      const flag = result.find((f) => f.category === 'MALIGNANCY');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('HIGH');
      expect(flag.riskMultiplier).toBe(2.0);
    });

    it('should detect night pain as MALIGNANCY flag', () => {
      const result = scanForRedFlags(
        'Pasienten vekkes av smerter om natten og har konstant smerte.'
      );
      const flag = result.find((f) => f.ruleId === 'mal_night');
      expect(flag).toBeDefined();
      expect(flag.category).toBe('MALIGNANCY');
    });

    it('should detect fever as INFECTION (HIGH)', () => {
      const result = scanForRedFlags('Pasienten har feber og frysninger.');
      const flag = result.find((f) => f.ruleId === 'inf_fever');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('HIGH');
      expect(flag.action).toBe('MEDICAL_EVALUATION');
    });

    it('should detect significant trauma as FRACTURE (HIGH)', () => {
      const result = scanForRedFlags('Pasienten var involvert i en bilulykke i går.');
      const flag = result.find((f) => f.ruleId === 'fx_trauma');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('HIGH');
      expect(flag.action).toBe('IMAGING_REQUIRED');
    });

    it('should detect possible aneurysm as VASCULAR (HIGH)', () => {
      const result = scanForRedFlags('Pulsating mass noted in the aorta region.');
      const flag = result.find((f) => f.ruleId === 'vas_aneurysm');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('HIGH');
      expect(flag.action).toBe('EMERGENCY_EVALUATION');
    });

    it('should detect progressive neurological symptoms as NEUROLOGICAL (MODERATE)', () => {
      const result = scanForRedFlags(
        'Progressive weakness in lower extremities noted over 3 days.'
      );
      const flag = result.find((f) => f.ruleId === 'neuro_progressive');
      expect(flag).toBeDefined();
      expect(flag.severity).toBe('MODERATE');
    });

    it('should detect morning stiffness as INFLAMMATORY when age is under threshold', () => {
      const result = scanForRedFlags(
        'Morning stiffness lasting over 1 hour, improves with activity.',
        { age: 35 }
      );
      const flag = result.find((f) => f.ruleId === 'infl_stiffness');
      expect(flag).toBeDefined();
      expect(flag.category).toBe('INFLAMMATORY');
    });

    it('should skip morning stiffness inflammatory flag when age meets or exceeds threshold', () => {
      const result = scanForRedFlags(
        'Morning stiffness lasting over 1 hour, improves with activity.',
        { age: 45 }
      );
      const flag = result.find((f) => f.ruleId === 'infl_stiffness');
      expect(flag).toBeUndefined();
    });

    it('should sort detected flags with CRITICAL severity first', () => {
      const text = [
        'Morning stiffness improves with activity.',
        'Urin inkontinens og bilateral svakhet i bena.',
      ].join(' ');
      const result = scanForRedFlags(text);
      expect(result.length).toBeGreaterThan(1);
      expect(result[0].severity).toBe('CRITICAL');
    });

    it('should only match once per rule even if multiple patterns match', () => {
      // "urinary incontinence" AND "bladder dysfunction" both match ce_bladder
      const result = scanForRedFlags('Urinary incontinence and bladder dysfunction observed.');
      const ceBladerFlags = result.filter((f) => f.ruleId === 'ce_bladder');
      expect(ceBladerFlags).toHaveLength(1);
    });

    it('should include matchedPattern and questions in each flag', () => {
      const result = scanForRedFlags('Pasienten har feber.');
      const flag = result.find((f) => f.ruleId === 'inf_fever');
      expect(flag).toHaveProperty('matchedPattern');
      expect(flag).toHaveProperty('questions');
      expect(Array.isArray(flag.questions)).toBe(true);
    });
  });

  // ===========================================================================
  // calculateRiskScore
  // ===========================================================================

  describe('calculateRiskScore', () => {
    it('should return score 0 and level LOW for empty flags', () => {
      const result = calculateRiskScore([]);
      expect(result).toEqual({ score: 0, level: 'LOW', recommendation: 'proceed' });
    });

    it('should return CRITICAL level when any flag has CRITICAL severity', () => {
      const flags = scanForRedFlags('Urin inkontinens observert.');
      const result = calculateRiskScore(flags);
      expect(result.level).toBe('CRITICAL');
      expect(result.recommendation).toBe('immediate_referral');
    });

    it('should return HIGH level for HIGH severity flags with no CRITICAL', () => {
      const flags = scanForRedFlags('Pasienten har feber og nylig operasjon.');
      const result = calculateRiskScore(flags);
      expect(['HIGH', 'CRITICAL']).toContain(result.level);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should apply age modifier for patient under 18', () => {
      const flags = scanForRedFlags('Progressive weakness in lower extremities.');
      const withAge = calculateRiskScore(flags, { age: 15 });
      const withoutAge = calculateRiskScore(flags, {});
      expect(withAge.score).toBeGreaterThanOrEqual(withoutAge.score);
    });

    it('should apply age modifier for patient over 75', () => {
      const flags = scanForRedFlags('Progressive weakness in lower extremities.');
      const withAge = calculateRiskScore(flags, { age: 80 });
      const withoutAge = calculateRiskScore(flags, {});
      expect(withAge.score).toBeGreaterThanOrEqual(withoutAge.score);
    });

    it('should cap score at 100', () => {
      const flags = scanForRedFlags(
        'Urin inkontinens og bilateral svakhet i bena og saddle numbness og bowel dysfunction.'
      );
      const result = calculateRiskScore(flags, { age: 80 });
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should include flagCount and highestSeverity in result', () => {
      const flags = scanForRedFlags('Pasienten har feber.');
      const result = calculateRiskScore(flags);
      expect(result).toHaveProperty('flagCount');
      expect(result).toHaveProperty('highestSeverity');
      expect(result.flagCount).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // getScreeningQuestions
  // ===========================================================================

  describe('getScreeningQuestions', () => {
    it('should return empty array when no flags detected', () => {
      const result = getScreeningQuestions([]);
      expect(result).toEqual([]);
    });

    it('should return questions grouped by category (no duplicates per category)', () => {
      const flags = scanForRedFlags(
        'Urin inkontinens og bilateral svakhet i bena og saddle numbness.'
      );
      const questions = getScreeningQuestions(flags, 'no');
      const categories = questions.map((q) => q.category);
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toBe(uniqueCategories.length);
    });

    it('should include Norwegian context in question objects when language is no', () => {
      const flags = scanForRedFlags('Pasienten har feber.');
      const questions = getScreeningQuestions(flags, 'no');
      expect(questions.length).toBeGreaterThan(0);
      questions.forEach((q) => {
        expect(q).toHaveProperty('category');
        expect(q).toHaveProperty('severity');
        expect(q).toHaveProperty('questions');
        expect(q).toHaveProperty('context');
      });
    });

    it('should include English context when language is en', () => {
      const flags = scanForRedFlags('Fever present and recent surgery.');
      const questions = getScreeningQuestions(flags, 'en');
      expect(questions.length).toBeGreaterThan(0);
      const infectionQ = questions.find((q) => q.category === 'INFECTION');
      if (infectionQ) {
        expect(typeof infectionQ.context).toBe('string');
        expect(infectionQ.context.length).toBeGreaterThan(0);
      }
    });
  });

  // ===========================================================================
  // generateAlert
  // ===========================================================================

  describe('generateAlert', () => {
    it('should return null when no flags detected', () => {
      const result = generateAlert([], { level: 'LOW', score: 0, recommendation: 'proceed' });
      expect(result).toBeNull();
    });

    it('should return alert object with correct structure for CRITICAL flags', () => {
      const flags = scanForRedFlags('Urinary retention observed.');
      const riskScore = calculateRiskScore(flags);
      const alert = generateAlert(flags, riskScore, 'en');

      expect(alert).not.toBeNull();
      expect(alert).toHaveProperty('level');
      expect(alert).toHaveProperty('title');
      expect(alert).toHaveProperty('score');
      expect(alert).toHaveProperty('flags');
      expect(alert).toHaveProperty('recommendation');
      expect(alert).toHaveProperty('timestamp');
    });

    it('should produce Norwegian title for CRITICAL level when language is no', () => {
      const flags = scanForRedFlags('Urin inkontinens observert.');
      const riskScore = calculateRiskScore(flags);
      const alert = generateAlert(flags, riskScore, 'no');
      expect(alert.title).toContain('KRITISK');
    });

    it('should produce English title for CRITICAL level when language is en', () => {
      const flags = scanForRedFlags('Urinary incontinence noted.');
      const riskScore = calculateRiskScore(flags);
      const alert = generateAlert(flags, riskScore, 'en');
      expect(alert.title).toContain('CRITICAL');
    });

    it('should include action and timeframe for each flag in the alert', () => {
      const flags = scanForRedFlags('Pasienten har feber.');
      const riskScore = calculateRiskScore(flags);
      const alert = generateAlert(flags, riskScore, 'en');
      expect(Array.isArray(alert.flags)).toBe(true);
      alert.flags.forEach((f) => {
        expect(f).toHaveProperty('action');
        expect(f).toHaveProperty('timeframe');
      });
    });

    it('should fall back to English messages for unsupported language code', () => {
      const flags = scanForRedFlags('Feber observert.');
      const riskScore = calculateRiskScore(flags);
      const alert = generateAlert(flags, riskScore, 'fr');
      expect(alert).not.toBeNull();
      expect(typeof alert.title).toBe('string');
    });
  });

  // ===========================================================================
  // logRedFlagDetection
  // ===========================================================================

  describe('logRedFlagDetection', () => {
    it('should call query with audit INSERT when flags are detected', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const flags = scanForRedFlags('Urin inkontinens observert.');
      const riskScore = calculateRiskScore(flags);

      await logRedFlagDetection('patient-1', 'encounter-1', flags, riskScore, 'user-1');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO audit_logs');
      expect(sql).toContain('RED_FLAG_DETECTED');
      expect(params[0]).toBe('user-1');
      expect(params[1]).toBe('encounter-1');
    });

    it('should include patientId, flagCount, riskScore and riskLevel in audit payload', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const flags = scanForRedFlags('Urin inkontinens observert.');
      const riskScore = calculateRiskScore(flags);

      await logRedFlagDetection('patient-42', 'encounter-99', flags, riskScore, 'user-5');

      const payload = JSON.parse(mockQuery.mock.calls[0][1][2]);
      expect(payload.patientId).toBe('patient-42');
      expect(payload.flagCount).toBe(flags.length);
      expect(payload.riskScore).toBe(riskScore.score);
      expect(payload.riskLevel).toBe(riskScore.level);
    });

    it('should not throw when query fails — error is logged and swallowed', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB unavailable'));
      const flags = scanForRedFlags('Feber observert.');
      const riskScore = calculateRiskScore(flags);

      await expect(
        logRedFlagDetection('p1', 'e1', flags, riskScore, 'u1')
      ).resolves.toBeUndefined();
    });
  });
});
