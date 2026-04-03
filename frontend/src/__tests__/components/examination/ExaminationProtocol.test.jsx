/**
 * ExaminationProtocol Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExaminationProtocol from '../../../components/examination/ExaminationProtocol';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
  useLanguage: () => ({ lang: 'no', setLang: vi.fn() }),
  LanguageProvider: ({ children }) => children,
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../data/examinationProtocols', () => ({
  EXAMINATION_REGIONS: {
    cervical: {
      name: 'Cervikalcolumna',
      nameEn: 'Cervical Spine',
      sections: [],
    },
    lumbar: {
      name: 'Lumbalcolumna',
      nameEn: 'Lumbar Spine',
      sections: [],
    },
  },
}));

describe('ExaminationProtocol', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the region selector sidebar', () => {
    render(<ExaminationProtocol values={{}} onChange={mockOnChange} lang="no" />);
    expect(screen.getByText('Kroppsregion')).toBeInTheDocument();
  });

  it('should render region buttons', () => {
    render(<ExaminationProtocol values={{}} onChange={mockOnChange} lang="no" />);
    expect(screen.getByText('Cervikalcolumna')).toBeInTheDocument();
    expect(screen.getByText('Lumbalcolumna')).toBeInTheDocument();
  });

  it('should show placeholder when no region selected', () => {
    render(<ExaminationProtocol values={{}} onChange={mockOnChange} lang="no" />);
    expect(screen.getByText('Velg en kroppsregion for å starte undersøkelsen')).toBeInTheDocument();
  });

  it('should render English text when lang is en', () => {
    render(<ExaminationProtocol values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Body Region')).toBeInTheDocument();
    expect(screen.getByText('Select a body region to start examination')).toBeInTheDocument();
  });
});
