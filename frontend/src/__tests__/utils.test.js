/**
 * Utility Functions Tests
 * Tests for frontend utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatNorwegianPhone, formatPersonnummer } from '../lib/utils';

describe('cn (classNames utility)', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded');
    expect(result).toContain('base');
    expect(result).toContain('included');
    expect(result).not.toContain('excluded');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    // tailwind-merge should use the last px value
    expect(result).toContain('px-4');
    expect(result).toContain('py-1');
  });
});

describe('formatDate', () => {
  it('should format date in Norwegian format', () => {
    const date = new Date('2024-03-15');
    const result = formatDate(date);
    expect(result).toMatch(/15.*0?3.*2024/);
  });

  it('should handle string dates', () => {
    const result = formatDate('2024-03-15');
    expect(result).toBeDefined();
  });

  it('should return dash for invalid dates', () => {
    const result = formatDate(null);
    expect(result).toBe('-');
  });
});

describe('formatNorwegianPhone', () => {
  it('should format Norwegian phone numbers', () => {
    const result = formatNorwegianPhone('12345678');
    expect(result).toMatch(/\+47|12 34 56 78|123 45 678/);
  });

  it('should handle numbers with country code', () => {
    const result = formatNorwegianPhone('+4712345678');
    expect(result).toContain('47');
  });

  it('should return original for invalid numbers', () => {
    const result = formatNorwegianPhone('123');
    expect(result).toBeDefined();
  });
});

describe('formatPersonnummer', () => {
  it('should mask personnummer for display', () => {
    const result = formatPersonnummer('12345678901');
    expect(result).toContain('***');
    expect(result.length).toBeLessThan(11);
  });

  it('should handle null/undefined', () => {
    expect(formatPersonnummer(null)).toBe('');
    expect(formatPersonnummer(undefined)).toBe('');
  });
});
