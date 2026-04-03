/**
 * ProblemList Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProblemList from '../../../components/assessment/ProblemList';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
  useLanguage: () => ({ lang: 'no', setLang: vi.fn() }),
  LanguageProvider: ({ children }) => children,
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));

describe('ProblemList', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing with empty problems', () => {
    const { container } = render(<ProblemList problems={[]} onChange={mockOnChange} />);
    expect(container).toBeTruthy();
  });

  it('should render with a list of problems', () => {
    const problems = [
      { id: '1', code: 'M54.5', name: 'Low back pain', status: 'acute', onset: '2026-01-01' },
    ];
    const { container } = render(<ProblemList problems={problems} onChange={mockOnChange} />);
    expect(container).toBeTruthy();
  });

  it('should render without onChange callback', () => {
    const { container } = render(<ProblemList problems={[]} />);
    expect(container).toBeTruthy();
  });
});
