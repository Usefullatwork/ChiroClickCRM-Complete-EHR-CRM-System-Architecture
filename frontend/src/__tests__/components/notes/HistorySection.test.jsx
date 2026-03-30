/**
 * HistorySection Component Tests
 * Tests for demographics, subjective, and medical history sections
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  User: (props) => <span data-testid="icon-user">User</span>,
  FileText: (props) => <span data-testid="icon-filetext">FileText</span>,
  Heart: (props) => <span data-testid="icon-heart">Heart</span>,
  AlertTriangle: (props) => <span data-testid="icon-alert">AlertTriangle</span>,
}));

import HistorySection from '../../../components/notes/HistorySection';

const makeConsultData = (overrides = {}) => ({
  demographics: {
    occupation: 'Kontorarbeider',
    activityLevel: 'Moderat aktiv',
    lifestyle: 'Stillesittende arbeid',
    sleepQuality: 'God',
    ...overrides.demographics,
  },
  subjective: {
    chiefComplaint: 'Ryggsmerter',
    historyOfPresentIllness: 'Smerter i 2 uker',
    onsetDate: '2024-03-01',
    onsetCircumstances: 'Lofting',
    painLocation: 'Korsrygg',
    painIntensity: 5,
    painPattern: 'intermittent',
    painRadiation: 'Nei',
    aggravatingFactors: 'Sitting',
    relievingFactors: 'Gange',
    functionalLimitations: 'Kan ikke loft tungt',
    previousEpisodes: 'Ingen',
    previousTreatment: 'Paracet',
    currentMedications: 'Ingen',
    medicationAllergies: 'Ingen',
    ...overrides.subjective,
  },
  medicalHistory: {
    pastMedicalHistory: 'Frisk',
    surgicalHistory: 'Ingen',
    familyHistory: 'Far med ryggproblemer',
    socialHistory: 'Ikke-royker',
    redFlagScreening: {
      unexplainedWeightLoss: false,
      nightPain: false,
      fever: false,
      bladderDysfunction: false,
      bowelDysfunction: false,
      progressiveWeakness: false,
      saddleAnesthesia: false,
      recentTrauma: false,
      cancerHistory: false,
      immunocompromised: false,
      ...overrides.medicalHistory?.redFlagScreening,
    },
    ...overrides.medicalHistory,
  },
});

// Stub UI sub-components that InitialConsultTemplate passes as props
const Section = ({ id, title, icon: Icon, color, children }) => (
  <div data-testid={`section-${id}`}>
    <h3>{title}</h3>
    <div>{children}</div>
  </div>
);

const TextField = ({ label, value, onChange, placeholder, required }) => (
  <div>
    <label>
      {label}
      {required && ' *'}
    </label>
    <textarea
      aria-label={label}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const InputField = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div>
    <label>{label}</label>
    <input
      aria-label={label}
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const Checkbox = ({ label, checked, onChange, warning }) => (
  <label>
    <input
      type="checkbox"
      checked={checked || false}
      onChange={(e) => onChange(e.target.checked)}
    />
    {label}
  </label>
);

describe('HistorySection', () => {
  let updateField;
  let updateNestedField;
  let updateRootField;

  beforeEach(() => {
    updateField = vi.fn();
    updateNestedField = vi.fn();
    updateRootField = vi.fn();
  });

  const renderComponent = (overrides = {}) => {
    const consultData = makeConsultData(overrides);
    return render(
      <HistorySection
        consultData={consultData}
        updateField={updateField}
        updateNestedField={updateNestedField}
        updateRootField={updateRootField}
        readOnly={false}
        Section={Section}
        TextField={TextField}
        InputField={InputField}
        Checkbox={Checkbox}
      />
    );
  };

  it('renders all three sections: demographics, subjective, medicalHistory', () => {
    renderComponent();
    expect(screen.getByTestId('section-demographics')).toBeInTheDocument();
    expect(screen.getByTestId('section-subjective')).toBeInTheDocument();
    expect(screen.getByTestId('section-medicalHistory')).toBeInTheDocument();
  });

  it('renders demographics fields with correct values', () => {
    renderComponent();
    expect(screen.getByDisplayValue('Kontorarbeider')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Moderat aktiv')).toBeInTheDocument();
  });

  it('calls updateField when occupation input changes', () => {
    renderComponent();
    const input = screen.getByDisplayValue('Kontorarbeider');
    fireEvent.change(input, { target: { value: 'Sykepleier' } });
    expect(updateField).toHaveBeenCalledWith('demographics', 'occupation', 'Sykepleier');
  });

  it('renders chief complaint as a required field', () => {
    renderComponent();
    // The TextField stub adds " *" for required fields
    expect(screen.getByText('Hovedklage *')).toBeInTheDocument();
  });

  it('renders chief complaint textarea with value', () => {
    renderComponent();
    const textarea = screen.getByLabelText('Hovedklage');
    expect(textarea.value).toBe('Ryggsmerter');
  });

  it('calls updateField when chief complaint changes', () => {
    renderComponent();
    const textarea = screen.getByLabelText('Hovedklage');
    fireEvent.change(textarea, { target: { value: 'Nakkesmerter' } });
    expect(updateField).toHaveBeenCalledWith('subjective', 'chiefComplaint', 'Nakkesmerter');
  });

  it('renders pain intensity slider with current value', () => {
    renderComponent();
    const slider = screen.getByLabelText('Smerteintensitet VAS skala');
    expect(slider.value).toBe('5');
  });

  it('calls updateField and updateRootField when pain slider changes', () => {
    renderComponent();
    const slider = screen.getByLabelText('Smerteintensitet VAS skala');
    fireEvent.change(slider, { target: { value: '8' } });
    expect(updateField).toHaveBeenCalledWith('subjective', 'painIntensity', 8);
    expect(updateRootField).toHaveBeenCalledWith('vas_pain_start', 8);
  });

  it('renders pain pattern select with correct value', () => {
    renderComponent();
    const select = screen.getByLabelText('Smertemonster');
    expect(select.value).toBe('intermittent');
  });

  it('renders red flag screening checkboxes', () => {
    renderComponent();
    expect(screen.getByText('Rødt flagg screening')).toBeInTheDocument();
    expect(screen.getByLabelText('Uforklarlig vekttap')).toBeInTheDocument();
    expect(screen.getByLabelText('Nattesmerte')).toBeInTheDocument();
    expect(screen.getByLabelText('Feber')).toBeInTheDocument();
    expect(screen.getByLabelText('Blaeredysfunksjon')).toBeInTheDocument();
  });

  it('calls updateNestedField when red flag checkbox is toggled', () => {
    renderComponent();
    const checkbox = screen.getByLabelText('Nattesmerte');
    fireEvent.click(checkbox);
    expect(updateNestedField).toHaveBeenCalledWith(
      'medicalHistory',
      'redFlagScreening',
      'nightPain',
      true
    );
  });

  it('renders medical history fields with correct values', () => {
    renderComponent();
    expect(screen.getByDisplayValue('Frisk')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Far med ryggproblemer')).toBeInTheDocument();
  });

  it('renders subjective fields: HPI, pain location, onset date', () => {
    renderComponent();
    expect(screen.getByDisplayValue('Smerter i 2 uker')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Korsrygg')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-03-01')).toBeInTheDocument();
  });
});
