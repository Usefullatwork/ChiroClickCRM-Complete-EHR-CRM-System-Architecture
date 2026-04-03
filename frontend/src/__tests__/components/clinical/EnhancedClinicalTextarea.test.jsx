/**
 * EnhancedClinicalTextarea Tests
 *
 * Tests:
 * - Renders textarea
 * - Character input
 * - Label rendering
 * - Quick phrases display
 * - Disabled state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Sparkles: (props) => null,
  Loader2: (props) => null,
  Mic: (props) => null,
  MicOff: (props) => null,
  Square: (props) => null,
}));

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
  useLanguage: () => ({ lang: 'no', setLang: vi.fn() }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));

vi.mock('../../../services/api', () => ({
  aiAPI: {
    generateField: vi.fn().mockResolvedValue({ data: { text: '' } }),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
  },
}));

vi.mock('../../../hooks/useTextExpansion', () => ({
  default: () => ({
    suggestions: [],
    isOpen: false,
    searchTerm: '',
    selectedIndex: 0,
    handleKeyDown: vi.fn(),
    handleInput: vi.fn(),
    insertTemplate: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock('../../../components/clinical/TextExpansionPopup', () => ({
  default: () => null,
}));

import EnhancedClinicalTextarea, {
  MACROS,
} from '../../../components/clinical/EnhancedClinicalTextarea';

describe('EnhancedClinicalTextarea', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    placeholder: 'Skriv notater her...',
    label: 'Subjektiv',
    section: 'subjective',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock SpeechRecognition as unavailable
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });

  it('renders a textarea element', () => {
    render(<EnhancedClinicalTextarea {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Skriv notater her...');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('renders the label text', () => {
    render(<EnhancedClinicalTextarea {...defaultProps} />);
    expect(screen.getByText('Subjektiv')).toBeInTheDocument();
  });

  it('renders label hint with macro/command info', () => {
    render(<EnhancedClinicalTextarea {...defaultProps} />);
    expect(screen.getByText(/\.xx makro/)).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<EnhancedClinicalTextarea {...defaultProps} value="Test text" />);
    const textarea = screen.getByPlaceholderText('Skriv notater her...');
    expect(textarea.value).toBe('Test text');
  });

  it('calls onChange when text is entered', () => {
    render(<EnhancedClinicalTextarea {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Skriv notater her...');
    fireEvent.change(textarea, { target: { value: 'New text', selectionStart: 8 } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('New text');
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<EnhancedClinicalTextarea {...defaultProps} disabled={true} />);
    const textarea = screen.getByPlaceholderText('Skriv notater her...');
    expect(textarea).toBeDisabled();
  });

  it('renders quick phrases when provided', () => {
    const phrases = ['Bedring', 'Forverring', 'Uendret'];
    render(<EnhancedClinicalTextarea {...defaultProps} quickPhrases={phrases} />);
    expect(screen.getByText('+ Bedring')).toBeInTheDocument();
    expect(screen.getByText('+ Forverring')).toBeInTheDocument();
    expect(screen.getByText('+ Uendret')).toBeInTheDocument();
  });

  it('does not render quick phrases when disabled', () => {
    const phrases = ['Bedring'];
    render(<EnhancedClinicalTextarea {...defaultProps} quickPhrases={phrases} disabled={true} />);
    expect(screen.queryByText('+ Bedring')).not.toBeInTheDocument();
  });

  it('does not render quick phrases when array is empty', () => {
    render(<EnhancedClinicalTextarea {...defaultProps} quickPhrases={[]} />);
    // No quick phrase buttons should be rendered
    expect(screen.queryByText(/^\+ /)).not.toBeInTheDocument();
  });

  it('renders with specified rows', () => {
    render(<EnhancedClinicalTextarea {...defaultProps} rows={6} />);
    const textarea = screen.getByPlaceholderText('Skriv notater her...');
    expect(textarea).toHaveAttribute('rows', '6');
  });
});

describe('MACROS export', () => {
  it('exports macros object with Norwegian shortcuts', () => {
    expect(MACROS['.bs']).toBe('Bedring siden sist. ');
    expect(MACROS['.nrom']).toBe('Normal ROM i alle retninger. ');
    expect(MACROS['.hvla']).toBe('HVLA manipulasjon ');
    expect(MACROS['.fu1']).toBe('Oppfølging om 1 uke. ');
  });

  it('has subjective, objective, treatment, and plan macros', () => {
    const keys = Object.keys(MACROS);
    expect(keys.length).toBeGreaterThan(20);
    // Subjective
    expect(MACROS['.ie']).toContain('Ingen endring');
    // Objective
    expect(MACROS['.palp']).toContain('palpasjon');
    // Treatment
    expect(MACROS['.mob']).toContain('Mobilisering');
    // Plan
    expect(MACROS['.øv']).toContain('Hjemmeøvelser');
  });
});
