/**
 * Unit Tests for System Prompts
 * Tests all exported prompt constants and builder functions
 */

import { jest } from '@jest/globals';

const {
  SPELL_CHECK_PROMPT,
  SOAP_SUBJECTIVE_PROMPT,
  SOAP_OBJECTIVE_PROMPT,
  SOAP_ASSESSMENT_PROMPT,
  SOAP_PLAN_PROMPT,
  SOAP_PROMPTS,
  buildDiagnosisPrompt,
  RED_FLAG_PROMPT,
  CLINICAL_SUMMARY_PROMPT,
  JOURNAL_ORGANIZATION_PROMPT,
  MERGE_NOTES_PROMPT,
  SMS_CONSTRAINT,
} = await import('../../../src/services/ai/systemPrompts.js');

describe('System Prompts', () => {
  // ===========================================================================
  // SPELL CHECK PROMPT
  // ===========================================================================

  describe('SPELL_CHECK_PROMPT', () => {
    it('should be a non-empty string', () => {
      expect(typeof SPELL_CHECK_PROMPT).toBe('string');
      expect(SPELL_CHECK_PROMPT.length).toBeGreaterThan(10);
    });

    it('should reference Norwegian language', () => {
      expect(SPELL_CHECK_PROMPT).toContain('norsk');
    });

    it('should mention medical terminology preservation', () => {
      expect(SPELL_CHECK_PROMPT.toLowerCase()).toContain('medisinsk');
    });
  });

  // ===========================================================================
  // SOAP PROMPTS
  // ===========================================================================

  describe('SOAP_PROMPTS', () => {
    it('should have all four SOAP sections', () => {
      expect(SOAP_PROMPTS.subjective).toBeDefined();
      expect(SOAP_PROMPTS.objective).toBeDefined();
      expect(SOAP_PROMPTS.assessment).toBeDefined();
      expect(SOAP_PROMPTS.plan).toBeDefined();
    });

    it('should map to the individual prompt constants', () => {
      expect(SOAP_PROMPTS.subjective).toBe(SOAP_SUBJECTIVE_PROMPT);
      expect(SOAP_PROMPTS.objective).toBe(SOAP_OBJECTIVE_PROMPT);
      expect(SOAP_PROMPTS.assessment).toBe(SOAP_ASSESSMENT_PROMPT);
      expect(SOAP_PROMPTS.plan).toBe(SOAP_PLAN_PROMPT);
    });

    it('should contain Norwegian clinical instructions', () => {
      expect(SOAP_SUBJECTIVE_PROMPT).toContain('kiropraktor');
      expect(SOAP_OBJECTIVE_PROMPT).toContain('palpasjon');
      expect(SOAP_ASSESSMENT_PROMPT).toContain('differensialdiagnose');
      expect(SOAP_PLAN_PROMPT).toContain('behandling');
    });

    it('should mention writing in Norwegian', () => {
      expect(SOAP_SUBJECTIVE_PROMPT).toContain('norsk');
      expect(SOAP_OBJECTIVE_PROMPT).toContain('norsk');
    });

    it('should instruct point-form for subjective and objective', () => {
      expect(SOAP_SUBJECTIVE_PROMPT).toContain('punktform');
      expect(SOAP_OBJECTIVE_PROMPT).toContain('punktform');
    });
  });

  // ===========================================================================
  // DIAGNOSIS PROMPT BUILDER
  // ===========================================================================

  describe('buildDiagnosisPrompt', () => {
    it('should return a function result containing the codes text', () => {
      const codesText = 'L84 - Ryggsmerte\nL86 - Isjias';
      const result = buildDiagnosisPrompt(codesText);

      expect(result).toContain('L84 - Ryggsmerte');
      expect(result).toContain('L86 - Isjias');
    });

    it('should mention ICPC-2 in the prompt', () => {
      const result = buildDiagnosisPrompt('L01 - Nakkesmerter');

      expect(result).toContain('ICPC-2');
    });

    it('should instruct response format (1-3 codes)', () => {
      const result = buildDiagnosisPrompt('');

      expect(result).toContain('1-3');
    });

    it('should handle empty codes text', () => {
      const result = buildDiagnosisPrompt('');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should mention kiropraktor context', () => {
      const result = buildDiagnosisPrompt('L84');

      expect(result.toLowerCase()).toContain('kiropraktor');
    });
  });

  // ===========================================================================
  // RED FLAG PROMPT
  // ===========================================================================

  describe('RED_FLAG_PROMPT', () => {
    it('should be a non-empty string', () => {
      expect(typeof RED_FLAG_PROMPT).toBe('string');
      expect(RED_FLAG_PROMPT.length).toBeGreaterThan(50);
    });

    it('should mention key red flags', () => {
      const prompt = RED_FLAG_PROMPT.toLowerCase();
      expect(prompt).toContain('cauda equina');
      expect(prompt).toContain('fraktur');
      expect(prompt).toContain('infeksjon');
    });

    it('should mention referral assessment', () => {
      expect(RED_FLAG_PROMPT).toContain('henvises');
    });
  });

  // ===========================================================================
  // CLINICAL SUMMARY PROMPT
  // ===========================================================================

  describe('CLINICAL_SUMMARY_PROMPT', () => {
    it('should be a non-empty string', () => {
      expect(typeof CLINICAL_SUMMARY_PROMPT).toBe('string');
      expect(CLINICAL_SUMMARY_PROMPT.length).toBeGreaterThan(10);
    });

    it('should mention Norwegian language', () => {
      expect(CLINICAL_SUMMARY_PROMPT).toContain('norsk');
    });

    it('should mention clinical summary purpose', () => {
      expect(CLINICAL_SUMMARY_PROMPT.toLowerCase()).toContain('sammendrag');
    });
  });

  // ===========================================================================
  // JOURNAL ORGANIZATION PROMPT
  // ===========================================================================

  describe('JOURNAL_ORGANIZATION_PROMPT', () => {
    it('should be a non-empty string', () => {
      expect(typeof JOURNAL_ORGANIZATION_PROMPT).toBe('string');
      expect(JOURNAL_ORGANIZATION_PROMPT.length).toBeGreaterThan(100);
    });

    it('should define SOAP structure', () => {
      expect(JOURNAL_ORGANIZATION_PROMPT).toContain('soap');
    });

    it('should define actionable items', () => {
      expect(JOURNAL_ORGANIZATION_PROMPT).toContain('actionable_items');
    });

    it('should require JSON format output', () => {
      expect(JOURNAL_ORGANIZATION_PROMPT).toContain('JSON');
    });

    it('should define action types', () => {
      expect(JOURNAL_ORGANIZATION_PROMPT).toContain('FOLLOW_UP');
      expect(JOURNAL_ORGANIZATION_PROMPT).toContain('REFERRAL');
    });
  });

  // ===========================================================================
  // MERGE NOTES PROMPT
  // ===========================================================================

  describe('MERGE_NOTES_PROMPT', () => {
    it('should be a non-empty string', () => {
      expect(typeof MERGE_NOTES_PROMPT).toBe('string');
    });

    it('should mention chronological ordering', () => {
      expect(MERGE_NOTES_PROMPT.toLowerCase()).toContain('kronologisk');
    });

    it('should mention SOAP format', () => {
      expect(MERGE_NOTES_PROMPT).toContain('SOAP');
    });
  });

  // ===========================================================================
  // SMS CONSTRAINT
  // ===========================================================================

  describe('SMS_CONSTRAINT', () => {
    it('should be a non-empty string', () => {
      expect(typeof SMS_CONSTRAINT).toBe('string');
    });

    it('should mention 160 character limit', () => {
      expect(SMS_CONSTRAINT).toContain('160');
    });

    it('should mention SMS format', () => {
      expect(SMS_CONSTRAINT).toContain('SMS');
    });
  });
});
