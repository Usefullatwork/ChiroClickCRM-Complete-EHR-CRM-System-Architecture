import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockSetLang = vi.fn();

vi.mock('../../i18n', () => ({
  useLanguage: () => ({ lang: 'no', setLang: mockSetLang }),
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: mockSetLang,
  }),
}));

import LanguageSwitcher from '../../components/LanguageSwitcher';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockSetLang.mockClear();
  });

  it('renders NO and EN buttons', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText(/NO/)).toBeInTheDocument();
    expect(screen.getByText(/EN/)).toBeInTheDocument();
  });

  it('calls setLang with "no" when NO button is clicked', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText(/NO/));
    expect(mockSetLang).toHaveBeenCalledWith('no');
  });

  it('calls setLang with "en" when EN button is clicked', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByText(/EN/));
    expect(mockSetLang).toHaveBeenCalledWith('en');
  });

  it('renders two buttons', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });
});
