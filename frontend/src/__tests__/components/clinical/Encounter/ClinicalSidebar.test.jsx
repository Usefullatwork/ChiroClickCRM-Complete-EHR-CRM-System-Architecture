/**
 * ClinicalSidebar Tests
 *
 * Tests:
 * - Renders patient info
 * - Red flag alerts display
 * - Loading state
 * - AI suggestions section
 * - Navigation buttons
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  AlertTriangle: (props) => null,
  Activity: (props) => null,
  Phone: (props) => null,
  Mail: (props) => null,
  ArrowLeft: (props) => null,
  Loader2: (props) => null,
  Sparkles: (props) => null,
  BookOpen: (props) => null,
}));

import ClinicalSidebar from '../../../../components/clinical/Encounter/ClinicalSidebar';

describe('ClinicalSidebar', () => {
  const defaultProps = {
    patient: {
      data: {
        first_name: 'Ola',
        last_name: 'Nordmann',
        date_of_birth: '1990-05-15',
        national_id: '15059012345',
        phone: '+47 12345678',
        email: 'ola@test.no',
        medical_history: 'Tidligere ryggsmerter',
        red_flags: [],
        contraindications: [],
      },
    },
    patientLoading: false,
    redFlagAlerts: [],
    clinicalWarnings: [],
    aiSuggestions: null,
    onOpenAIAssistant: vi.fn(),
    onOpenTemplatePicker: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the back button', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    expect(screen.getByText('Tilbake til pasient')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Tilbake til pasient'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('renders patient name', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
  });

  it('renders patient initials', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    expect(screen.getByText('ON')).toBeInTheDocument();
  });

  it('renders patient age', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    // Patient born 1990, current date is 2026-03-31, should be ~35-36
    const ageText = screen.getByText(/\d+ år/);
    expect(ageText).toBeInTheDocument();
  });

  it('renders masked national ID', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    expect(screen.getByText(/150590-\*\*\*\*\*/)).toBeInTheDocument();
  });

  it('renders loading spinner when patientLoading', () => {
    render(<ClinicalSidebar {...defaultProps} patientLoading={true} />);
    expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
  });

  it('renders quick contact buttons', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    expect(screen.getByText('Ring')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });

  it('renders red flag alerts when present', () => {
    render(<ClinicalSidebar {...defaultProps} redFlagAlerts={['Cauda equina syndrom']} />);
    expect(screen.getByText('Kliniske Varsler')).toBeInTheDocument();
    expect(screen.getByText('Cauda equina syndrom')).toBeInTheDocument();
  });

  it('renders patient red flags', () => {
    const patient = {
      ...defaultProps.patient,
      data: {
        ...defaultProps.patient.data,
        red_flags: ['Allergi mot penicillin'],
      },
    };
    render(<ClinicalSidebar {...defaultProps} patient={patient} />);
    expect(screen.getByText('Allergi mot penicillin')).toBeInTheDocument();
  });

  it('renders contraindications when present', () => {
    const patient = {
      ...defaultProps.patient,
      data: {
        ...defaultProps.patient.data,
        contraindications: ['Antikoagulantia'],
      },
    };
    render(<ClinicalSidebar {...defaultProps} patient={patient} />);
    expect(screen.getByText('Kontraindikasjoner')).toBeInTheDocument();
    expect(screen.getByText('Antikoagulantia')).toBeInTheDocument();
  });

  it('renders clinical warnings when present', () => {
    render(<ClinicalSidebar {...defaultProps} clinicalWarnings={['Manglende oppfølging']} />);
    expect(screen.getByText('Kliniske Advarsler')).toBeInTheDocument();
    expect(screen.getByText('Manglende oppfølging')).toBeInTheDocument();
  });

  it('renders medical history', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    expect(screen.getByText('Sykehistorie')).toBeInTheDocument();
    expect(screen.getByText('Tidligere ryggsmerter')).toBeInTheDocument();
  });

  it('renders AI suggestions section', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    expect(screen.getByText('AI-forslag')).toBeInTheDocument();
  });

  it('renders Kliniske Maler button', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    expect(screen.getByText('Kliniske Maler')).toBeInTheDocument();
  });

  it('calls onOpenTemplatePicker when template button is clicked', () => {
    render(<ClinicalSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Kliniske Maler'));
    expect(defaultProps.onOpenTemplatePicker).toHaveBeenCalled();
  });
});
