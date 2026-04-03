/**
 * PatientInfoSidebar Component Tests
 * Tests patient display, red flags, contraindications, warnings, and action buttons.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  AlertTriangle: () => null,
  Activity: () => null,
  Phone: () => null,
  Mail: () => null,
  Sparkles: () => null,
  ArrowLeft: () => null,
  BookOpen: () => null,
  Loader2: () => null,
}));

import { PatientInfoSidebar } from '../../../components/encounter/PatientInfoSidebar';

function buildProps(overrides = {}) {
  return {
    patientData: {
      first_name: 'Ola',
      last_name: 'Nordmann',
      national_id: '01019012345',
      medical_history: 'Tidligere ryggoperasjon',
    },
    patientLoading: false,
    patientInitials: 'ON',
    patientAge: 35,
    patientRedFlags: [],
    patientContraindications: [],
    redFlagAlerts: [],
    clinicalWarnings: [],
    aiSuggestions: null,
    onNavigateBack: vi.fn(),
    onOpenAIAssistant: vi.fn(),
    onOpenTemplatePicker: vi.fn(),
    ...overrides,
  };
}

describe('PatientInfoSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders patient name', () => {
    render(<PatientInfoSidebar {...buildProps()} />);
    expect(screen.getByTestId('encounter-patient-name').textContent).toBe('Ola Nordmann');
  });

  it('renders patient initials', () => {
    render(<PatientInfoSidebar {...buildProps()} />);
    expect(screen.getByText('ON')).toBeTruthy();
  });

  it('renders patient age', () => {
    render(<PatientInfoSidebar {...buildProps()} />);
    expect(screen.getByText(/35 ar/)).toBeTruthy();
  });

  it('masks national ID', () => {
    render(<PatientInfoSidebar {...buildProps()} />);
    expect(screen.getByText(/010190-\*\*\*\*\*/)).toBeTruthy();
  });

  it('calls onNavigateBack when back button is clicked', () => {
    const onNavigateBack = vi.fn();
    render(<PatientInfoSidebar {...buildProps({ onNavigateBack })} />);
    fireEvent.click(screen.getByText('Tilbake til pasient'));
    expect(onNavigateBack).toHaveBeenCalledTimes(1);
  });

  it('renders medical history section', () => {
    render(<PatientInfoSidebar {...buildProps()} />);
    expect(screen.getByText('Sykehistorie')).toBeTruthy();
    expect(screen.getByText('Tidligere ryggoperasjon')).toBeTruthy();
  });

  it('renders red flag alerts when present', () => {
    render(
      <PatientInfoSidebar
        {...buildProps({
          patientRedFlags: ['Cauda equina symptomer'],
          redFlagAlerts: ['RED_FLAG: Plutselig vekttap'],
        })}
      />
    );
    expect(screen.getByText('Kliniske Varsler')).toBeTruthy();
    expect(screen.getByText('Cauda equina symptomer')).toBeTruthy();
    expect(screen.getByText('RED_FLAG: Plutselig vekttap')).toBeTruthy();
  });

  it('hides red flags section when no flags', () => {
    render(<PatientInfoSidebar {...buildProps()} />);
    expect(screen.queryByText('Kliniske Varsler')).toBeNull();
  });

  it('renders contraindications', () => {
    render(
      <PatientInfoSidebar
        {...buildProps({ patientContraindications: ['Manipulasjon kontraindisert'] })}
      />
    );
    expect(screen.getByText('Kontraindikasjoner')).toBeTruthy();
    expect(screen.getByText('Manipulasjon kontraindisert')).toBeTruthy();
  });

  it('renders clinical warnings', () => {
    render(
      <PatientInfoSidebar {...buildProps({ clinicalWarnings: ['Blodfortynnende medisin'] })} />
    );
    expect(screen.getByText('Kliniske Advarsler')).toBeTruthy();
    expect(screen.getByText('Blodfortynnende medisin')).toBeTruthy();
  });

  it('renders AI suggestions preview section', () => {
    render(<PatientInfoSidebar {...buildProps()} />);
    expect(screen.getByText('AI-forslag')).toBeTruthy();
  });

  it('shows AI reasoning when suggestions exist', () => {
    render(
      <PatientInfoSidebar
        {...buildProps({ aiSuggestions: { clinicalReasoning: 'Test AI reasoning' } })}
      />
    );
    expect(screen.getByText('Test AI reasoning')).toBeTruthy();
  });

  it('renders template picker button', () => {
    render(<PatientInfoSidebar {...buildProps()} />);
    expect(screen.getByText('Kliniske Maler')).toBeTruthy();
  });

  it('calls onOpenTemplatePicker when template button is clicked', () => {
    const onOpenTemplatePicker = vi.fn();
    render(<PatientInfoSidebar {...buildProps({ onOpenTemplatePicker })} />);
    fireEvent.click(screen.getByText('Kliniske Maler'));
    expect(onOpenTemplatePicker).toHaveBeenCalledTimes(1);
  });

  it('renders contact buttons (Ring, SMS)', () => {
    render(<PatientInfoSidebar {...buildProps()} />);
    expect(screen.getByText('Ring')).toBeTruthy();
    expect(screen.getByText('SMS')).toBeTruthy();
  });
});
