/**
 * SoapNoteBuilder Tests
 *
 * Tests:
 * - Renders SOAP tabs
 * - Tab navigation
 * - Header with patient info
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  X: (props) => null,
  AlertTriangle: (props) => null,
  CheckCircle2: (props) => null,
  Save: (props) => null,
  Loader2: (props) => null,
}));

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
  useLanguage: () => ({ lang: 'no', setLang: vi.fn() }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));

vi.mock('dompurify', () => ({
  default: { sanitize: (str) => str },
}));

vi.mock('../../../components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, ...rest }) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}));

vi.mock('../../../components/ui/Input', () => ({
  TextArea: ({ label, value, onChange, error, ...rest }) => (
    <div>
      {label && <label>{label}</label>}
      <textarea value={value} onChange={onChange} {...rest} />
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));

vi.mock('../../../components/ui/Alert', () => ({
  Alert: ({ children }) => <div role="alert">{children}</div>,
}));

vi.mock('../../../hooks/useEncounters', () => ({
  useCreateEncounter: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));

vi.mock('../../../hooks/useCodes', () => ({
  useChiropracticCodes: () => ({
    data: [
      { code: 'L84', description: 'Ryggsyndromer' },
      { code: 'L83', description: 'Nakkesmerter' },
    ],
    isLoading: false,
  }),
}));

vi.mock('../../../utils/toast', () => ({
  default: { error: vi.fn(), warning: vi.fn(), success: vi.fn() },
}));

import { SoapNoteBuilder } from '../../../components/clinical/SoapNoteBuilder';

describe('SoapNoteBuilder', () => {
  const defaultProps = {
    patient: { id: 'p-1', name: 'Ola Nordmann', alerts: [] },
    onCancel: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Clinical Encounter header', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    expect(screen.getByText('Clinical Encounter')).toBeInTheDocument();
  });

  it('renders patient name in header', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    expect(screen.getByText(/Ola Nordmann/)).toBeInTheDocument();
  });

  it('renders all four SOAP tabs', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    // Use getAllByText since sidebar also has these labels
    expect(screen.getAllByText('Subjective').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Objective').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Assessment').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Plan').length).toBeGreaterThanOrEqual(1);
  });

  it('starts on Subjective tab', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    expect(screen.getByText('Patient Complaints & History')).toBeInTheDocument();
  });

  it('switches to Objective tab on click', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    // Click the tab button (not the sidebar heading) by finding all and using the button
    const objectiveBtns = screen.getAllByText('Objective');
    const tabBtn = objectiveBtns.find((el) => el.tagName === 'BUTTON');
    fireEvent.click(tabBtn);
    expect(screen.getByText('Clinical Findings & Examination')).toBeInTheDocument();
  });

  it('switches to Assessment tab showing diagnosis codes', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    const assessmentBtns = screen.getAllByText('Assessment');
    const tabBtn = assessmentBtns.find((el) => el.tagName === 'BUTTON');
    fireEvent.click(tabBtn);
    expect(screen.getByText('Diagnosis (ICPC-2)')).toBeInTheDocument();
    expect(screen.getByText('L84')).toBeInTheDocument();
    expect(screen.getByText('L83')).toBeInTheDocument();
  });

  it('switches to Plan tab showing treatment codes', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    const planBtns = screen.getAllByText('Plan');
    const tabBtn = planBtns.find((el) => el.tagName === 'BUTTON');
    fireEvent.click(tabBtn);
    expect(screen.getByText('Treatment Codes (Takster)')).toBeInTheDocument();
    expect(screen.getByText('L214')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders Save Draft button', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    expect(screen.getByText('Save Draft')).toBeInTheDocument();
  });

  it('renders Sign & Complete button', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    expect(screen.getByText('Sign & Complete')).toBeInTheDocument();
  });

  it('renders Quick Phrases sidebar', () => {
    render(<SoapNoteBuilder {...defaultProps} />);
    expect(screen.getByText('Quick Phrases')).toBeInTheDocument();
  });

  it('shows patient alerts when present', () => {
    const patientWithAlerts = {
      ...defaultProps.patient,
      alerts: ['Allergi: Penicillin'],
    };
    render(<SoapNoteBuilder {...defaultProps} patient={patientWithAlerts} />);
    expect(screen.getByText(/Allergi: Penicillin/)).toBeInTheDocument();
  });
});
