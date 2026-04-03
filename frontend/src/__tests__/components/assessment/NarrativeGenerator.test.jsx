/**
 * NarrativeGenerator Component Tests
 */

import { describe, it, expect } from 'vitest';
import { generateSubjectiveNarrative } from '../../../components/assessment/NarrativeGenerator';

describe('generateSubjectiveNarrative', () => {
  it('should return empty array for empty data', () => {
    const result = generateSubjectiveNarrative({});
    expect(result).toEqual([]);
  });

  it('should generate chief complaint narrative', () => {
    const result = generateSubjectiveNarrative({
      chief_complaint: 'Low back pain',
    });
    expect(result).toContain('Chief Complaint: Low back pain.');
  });

  it('should generate VAS pain narrative', () => {
    const result = generateSubjectiveNarrative({
      vas_pain_start: 7,
    });
    const painEntry = result.find((n) => n.includes('Pain Scale'));
    expect(painEntry).toBeDefined();
    expect(painEntry).toContain('7/10');
  });

  it('should generate onset narrative', () => {
    const result = generateSubjectiveNarrative({
      onset: 'Gradual onset over 2 weeks',
    });
    expect(result).toContain('Onset: Gradual onset over 2 weeks.');
  });

  it('should handle radiation for non-radiating pain', () => {
    const result = generateSubjectiveNarrative({
      pain_qualities: ['aching'],
    });
    const radiation = result.find((n) => n.includes('Radiation'));
    expect(radiation).toContain('non-radiating');
  });
});
