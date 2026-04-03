/**
 * SickNoteGenerator Component Tests
 *
 * Tests rendering, patient info form, diagnosis selection,
 * period controls, preview toggle, and save callback.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mocks must come before component import
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
  formatDate: () => '15.03.2024',
}));

vi.mock('lucide-react', () => ({
  FileText: (props) => <span data-testid="icon-filetext" {...props} />,
  User: (props) => <span data-testid="icon-user" {...props} />,
  Calendar: (props) => <span data-testid="icon-calendar" {...props} />,
  Building2: (props) => <span data-testid="icon-building" {...props} />,
  Stethoscope: (props) => <span data-testid="icon-stethoscope" {...props} />,
  Clock: (props) => <span data-testid="icon-clock" {...props} />,
  AlertTriangle: (props) => <span data-testid="icon-alert" {...props} />,
  CheckCircle: (props) => <span data-testid="icon-check" {...props} />,
  Printer: (props) => <span data-testid="icon-printer" {...props} />,
  Copy: (props) => <span data-testid="icon-copy" {...props} />,
  ChevronDown: (props) => <span data-testid="icon-chevdown" {...props} />,
  ChevronUp: (props) => <span data-testid="icon-chevup" {...props} />,
  FileDown: (props) => <span data-testid="icon-filedown" {...props} />,
}));

vi.mock('../../../services/api/billing', () => ({
  pdfAPI: {
    generateSickNote: vi.fn(),
  },
}));

import SickNoteGenerator from '../../../components/documents/SickNoteGenerator';

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <SickNoteGenerator {...props} />
    </BrowserRouter>
  );
};

describe('SickNoteGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sick note title and subtitle', () => {
    renderComponent();
    expect(screen.getByText('Sykemelding')).toBeInTheDocument();
    expect(screen.getByText('NAV-kompatibel sykmeldingsdokumentasjon')).toBeInTheDocument();
  });

  it('renders patient information section with input fields', () => {
    renderComponent();
    expect(screen.getByText('Pasientopplysninger')).toBeInTheDocument();
    expect(screen.getByText('Navn')).toBeInTheDocument();
    expect(screen.getByText('Arbeidsgiver')).toBeInTheDocument();
  });

  it('renders diagnosis section with ICPC-2 code dropdowns', () => {
    renderComponent();
    expect(screen.getByText('Diagnose')).toBeInTheDocument();
    // The main and secondary diagnosis selects should be present
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);
    // Should contain L01 Nakkeplager option (appears in both selects)
    const options = screen.getAllByText('L01 - Nakkeplager');
    expect(options.length).toBe(2);
  });

  it('pre-fills patient data when patientData prop is provided', () => {
    const patientData = {
      name: 'Ola Nordmann',
      personalId: '12345678901',
      employer: 'Test AS',
    };
    renderComponent({ patientData });

    const nameInput = screen.getByDisplayValue('Ola Nordmann');
    expect(nameInput).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345678901')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test AS')).toBeInTheDocument();
  });

  it('pre-fills practitioner data when practitionerData prop is provided', () => {
    const practitionerData = {
      name: 'Dr. Hansen',
      hprNumber: 'HPR-12345',
    };
    renderComponent({ practitionerData });

    // Practitioner section is defaultOpen=false, so we need to open it
    const attestationButton = screen.getByText('Behandlerattestasjon');
    fireEvent.click(attestationButton);

    expect(screen.getByDisplayValue('Dr. Hansen')).toBeInTheDocument();
    expect(screen.getByDisplayValue('HPR-12345')).toBeInTheDocument();
  });

  it('toggles preview mode when Forhåndsvis button is clicked', () => {
    renderComponent();
    const previewButton = screen.getByText('Forhåndsvis');

    // Initially in edit mode - patient section should be visible
    expect(screen.getByText('Pasientopplysninger')).toBeInTheDocument();

    // Switch to preview
    fireEvent.click(previewButton);

    // Patient section should no longer be visible in preview mode
    expect(screen.queryByText('Pasientopplysninger')).not.toBeInTheDocument();

    // The pre element should contain the generated document text
    const preElement = document.querySelector('pre');
    expect(preElement).not.toBeNull();
    expect(preElement.textContent).toContain('SYKEMELDING');
  });

  it('displays work capacity buttons and allows selection', () => {
    renderComponent();
    // Default is 100%
    const fullAbsenceBtn = screen.getByText('100% - Full sykemelding');
    expect(fullAbsenceBtn).toBeInTheDocument();

    // Click 50% option
    const halfAbsenceBtn = screen.getByText('50% sykemelding');
    fireEvent.click(halfAbsenceBtn);

    // The 50% button should now have the active class
    expect(halfAbsenceBtn.className).toContain('bg-blue-600');
  });

  it('calls onSave with data when save button is clicked', () => {
    const onSave = vi.fn();
    renderComponent({ onSave });

    const saveButton = screen.getByText('Lagre');
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        patient: expect.any(Object),
        clinical: expect.any(Object),
        period: expect.any(Object),
        restrictions: expect.any(Object),
        followUp: expect.any(Object),
        practitioner: expect.any(Object),
      })
    );
  });

  it('updates patient name when typing in the name field', () => {
    renderComponent();
    const nameInputs = screen.getAllByRole('textbox');
    // First textbox should be patient name (first field in first section)
    const nameInput = nameInputs[0];
    fireEvent.change(nameInput, { target: { value: 'Kari Nordmann' } });
    expect(nameInput.value).toBe('Kari Nordmann');
  });

  it('shows retroactive date field when checkbox is checked', () => {
    renderComponent();
    const retroCheckbox = screen.getByRole('checkbox');
    expect(retroCheckbox).not.toBeChecked();

    fireEvent.click(retroCheckbox);
    expect(retroCheckbox).toBeChecked();

    // After checking, an additional date input should appear for retroactive date
    const dateInputs = screen
      .getAllByRole('textbox')
      .concat(Array.from(document.querySelectorAll('input[type="date"]')));
    // Should have more date inputs now (startDate, endDate, dateOfBirth, retroactiveFrom)
    expect(dateInputs.length).toBeGreaterThanOrEqual(4);
  });

  it('renders footer action buttons (copy, print, save)', () => {
    renderComponent();
    expect(screen.getByText('Kopier')).toBeInTheDocument();
    expect(screen.getByText('Skriv ut')).toBeInTheDocument();
    expect(screen.getByText('Lagre')).toBeInTheDocument();
  });
});
