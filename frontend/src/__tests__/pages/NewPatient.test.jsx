/**
 * NewPatient Page Tests
 *
 * Tests form rendering, validation, submission, navigation,
 * consent checkboxes, treatment preferences, and error handling.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---- Mocks (before imports) ----

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/api', () => ({
  patientsAPI: {
    create: vi.fn(),
    search: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        patients: 'Pasienter',
        newPatient: 'Ny Pasient',
        personalInfo: 'Personlig informasjon',
        gender: 'Kjonn',
        male: 'Mann',
        female: 'Kvinne',
        other: 'Annet',
        firstName: 'Fornavn',
        lastName: 'Etternavn',
        dateOfBirth: 'Fodselsdato',
        contactInfo: 'Kontaktinformasjon',
        phone: 'Telefon',
        email: 'E-post',
        preferredContactMethod: 'Foretrukket kontaktmetode',
        sms: 'SMS',
        address: 'Adresse',
        postalCode: 'Postnummer',
        city: 'By',
        clinical: 'Klinisk informasjon',
        mainProblem: 'Hovedproblem',
        notes: 'Notater',
        consentGiven: 'Samtykke',
        createPatient: 'Opprett pasient',
      };
      return map[key] || key;
    },
    _lang: 'nb',
  }),
}));

vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('../../hooks/useUnsavedChanges', () => ({
  default: () => ({ isBlocked: false, proceed: vi.fn(), reset: vi.fn() }),
}));

vi.mock('../../components/common/UnsavedChangesDialog', () => ({
  default: ({ isBlocked }) =>
    isBlocked ? <div data-testid="unsaved-dialog">Unsaved changes</div> : null,
}));

vi.mock('../../components/common/Breadcrumbs', () => ({
  default: () => <nav data-testid="breadcrumbs">Breadcrumbs</nav>,
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span aria-hidden="true" />,
  Save: () => <span aria-hidden="true" />,
  AlertCircle: () => <span aria-hidden="true" />,
  User: () => <span aria-hidden="true" />,
  Phone: () => <span aria-hidden="true" />,
  MapPin: () => <span aria-hidden="true" />,
  FileText: () => <span aria-hidden="true" />,
}));

// ---- Imports (after mocks) ----

import NewPatient from '../../pages/NewPatient';
import { patientsAPI } from '../../services/api';

// ---- Helpers ----

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

const renderPage = () => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NewPatient />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

/** Fills the minimum required fields so the form passes validation. */
const fillRequiredFields = () => {
  fireEvent.change(screen.getByPlaceholderText('e.g., SOLV12345'), {
    target: { value: 'SOLV-999' },
  });
  fireEvent.change(screen.getByTestId('new-patient-first-name'), {
    target: { value: 'Kari' },
  });
  fireEvent.change(screen.getByTestId('new-patient-last-name'), {
    target: { value: 'Nordmann' },
  });
  fireEvent.change(screen.getByTestId('new-patient-dob'), {
    target: { value: '1990-05-15' },
  });
  // Gender select
  const genderSelect = screen.getByDisplayValue('Select gender');
  fireEvent.change(genderSelect, { target: { value: 'FEMALE' } });
};

// ---- Tests ----

describe('NewPatient Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== RENDERING =====

  it('should render the page heading', () => {
    renderPage();
    expect(screen.getByText('Ny Pasient')).toBeInTheDocument();
  });

  it('should render breadcrumbs', () => {
    renderPage();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('should render the Personal Information section', () => {
    renderPage();
    expect(screen.getByText('Personlig informasjon')).toBeInTheDocument();
  });

  it('should render the Contact Information section', () => {
    renderPage();
    expect(screen.getByText('Kontaktinformasjon')).toBeInTheDocument();
  });

  it('should render the Address section', () => {
    renderPage();
    expect(screen.getByText('Adresse')).toBeInTheDocument();
  });

  it('should render the Clinical Information section', () => {
    renderPage();
    expect(screen.getByText('Klinisk informasjon')).toBeInTheDocument();
  });

  it('should render the Consent section', () => {
    renderPage();
    expect(screen.getByText('Samtykke')).toBeInTheDocument();
  });

  it('should render the Treatment Preferences section with Norwegian heading', () => {
    renderPage();
    expect(screen.getByText('Behandlingspreferanser')).toBeInTheDocument();
  });

  // ===== FORM FIELDS =====

  it('should render the SolvIt ID input field', () => {
    renderPage();
    expect(screen.getByPlaceholderText('e.g., SOLV12345')).toBeInTheDocument();
  });

  it('should render first name and last name inputs with test IDs', () => {
    renderPage();
    expect(screen.getByTestId('new-patient-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('new-patient-last-name')).toBeInTheDocument();
  });

  it('should render date of birth input', () => {
    renderPage();
    expect(screen.getByTestId('new-patient-dob')).toBeInTheDocument();
  });

  it('should render gender select with Male, Female, Other options', () => {
    renderPage();
    expect(screen.getByDisplayValue('Select gender')).toBeInTheDocument();
    expect(screen.getByText('Mann')).toBeInTheDocument();
    expect(screen.getByText('Kvinne')).toBeInTheDocument();
    expect(screen.getByText('Annet')).toBeInTheDocument();
  });

  it('should render phone and email inputs', () => {
    renderPage();
    expect(screen.getByTestId('new-patient-phone')).toBeInTheDocument();
    expect(screen.getByTestId('new-patient-email')).toBeInTheDocument();
  });

  it('should render category select with Oslo, Outside Oslo, Traveling, Referred', () => {
    renderPage();
    const categoryOptions = screen.getAllByText('Not set');
    // At least one "Not set" default from the category select
    expect(categoryOptions.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Oslo')).toBeInTheDocument();
    expect(screen.getByText('Outside Oslo')).toBeInTheDocument();
    expect(screen.getByText('Traveling')).toBeInTheDocument();
    expect(screen.getByText('Referred')).toBeInTheDocument();
  });

  it('should render address fields (street, postal code, city)', () => {
    renderPage();
    expect(screen.getByPlaceholderText('Street address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., 0123')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
  });

  it('should render language select defaulting to Norsk', () => {
    renderPage();
    expect(screen.getByDisplayValue('Norsk')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should render preferred contact method select', () => {
    renderPage();
    expect(screen.getByText('Do not contact')).toBeInTheDocument();
  });

  it('should render main problem, preferred therapist, referral source inputs', () => {
    renderPage();
    expect(screen.getByPlaceholderText('e.g., Nakke smerter, Rygg problemer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mads, Andre, Mikael, Edle...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Doctor, Friend, Google')).toBeInTheDocument();
  });

  it('should render treatment type select with Norwegian options', () => {
    renderPage();
    expect(screen.getByText('Kiropraktor')).toBeInTheDocument();
    expect(screen.getByText('Nevrobehandling')).toBeInTheDocument();
    expect(screen.getByText('Muskelbehandling')).toBeInTheDocument();
  });

  it('should render general notes textarea', () => {
    renderPage();
    expect(
      screen.getByPlaceholderText('Any additional notes about the patient...')
    ).toBeInTheDocument();
  });

  // ===== CONSENT CHECKBOXES =====

  it('should render all five consent checkboxes', () => {
    renderPage();
    expect(screen.getByText('Consent to SMS notifications')).toBeInTheDocument();
    expect(screen.getByText('Consent to email notifications')).toBeInTheDocument();
    expect(screen.getByText('Consent to data storage (GDPR required)')).toBeInTheDocument();
    expect(screen.getByText('Consent to marketing communications')).toBeInTheDocument();
    expect(screen.getByText('Consent to video marketing')).toBeInTheDocument();
  });

  it('should have SMS, email, and data storage consent checked by default', () => {
    renderPage();
    const checkboxes = screen.getAllByRole('checkbox');
    // consent_sms (index 0), consent_email (1), consent_data_storage (2) = checked
    // consent_marketing (3), consent_video_marketing (4) = unchecked
    expect(checkboxes[0]).toBeChecked(); // SMS
    expect(checkboxes[1]).toBeChecked(); // email
    expect(checkboxes[2]).toBeChecked(); // data storage
    expect(checkboxes[3]).not.toBeChecked(); // marketing
    expect(checkboxes[4]).not.toBeChecked(); // video marketing
  });

  it('should toggle consent checkbox on click', () => {
    renderPage();
    const marketingCheckbox = screen.getAllByRole('checkbox')[3];
    expect(marketingCheckbox).not.toBeChecked();
    fireEvent.click(marketingCheckbox);
    expect(marketingCheckbox).toBeChecked();
  });

  // ===== TREATMENT PREFERENCES =====

  it('should render treatment preference radio buttons for needles, adjustments, and neck adjustments', () => {
    renderPage();
    expect(screen.getByText(/Nåler \(dry needling, akupunktur\)/)).toBeInTheDocument();
    expect(screen.getByText('Justeringer generelt:')).toBeInTheDocument();
    expect(screen.getByText('Nakkejusteringer spesifikt:')).toBeInTheDocument();
  });

  it('should render Norwegian OK / Ikke OK / Ikke avklart labels', () => {
    renderPage();
    // There are 3 sets of radio groups, each with OK, Ikke OK, Ikke avklart
    const okLabels = screen.getAllByText('OK');
    const notOkLabels = screen.getAllByText('Ikke OK');
    const notClearedLabels = screen.getAllByText('Ikke avklart');
    expect(okLabels).toHaveLength(3);
    expect(notOkLabels).toHaveLength(3);
    expect(notClearedLabels).toHaveLength(3);
  });

  it('should render treatment preference notes textarea', () => {
    renderPage();
    expect(
      screen.getByPlaceholderText(
        'f.eks. pasient er nervøs for nakkejusteringer pga tidligere ubehag...'
      )
    ).toBeInTheDocument();
  });

  // ===== BUTTONS =====

  it('should render Cancel and submit buttons', () => {
    renderPage();
    expect(screen.getByTestId('new-patient-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('new-patient-submit')).toBeInTheDocument();
  });

  it('should show translated submit label "Opprett pasient"', () => {
    renderPage();
    expect(screen.getByTestId('new-patient-submit')).toHaveTextContent('Opprett pasient');
  });

  it('should render back-to-patients button with aria-label', () => {
    renderPage();
    expect(screen.getByLabelText('Back to patients')).toBeInTheDocument();
  });

  // ===== VALIDATION =====

  it('should show validation errors when submitting an empty form', async () => {
    renderPage();
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(screen.getByText('SolvIt ID is required')).toBeInTheDocument();
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
      expect(screen.getByText('Gender is required')).toBeInTheDocument();
    });
  });

  it('should not call patientsAPI.create when validation fails', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('new-patient-submit'));
    expect(patientsAPI.create).not.toHaveBeenCalled();
  });

  it('should show error for future date of birth', async () => {
    renderPage();

    fillRequiredFields();
    // Override DOB with a future date
    fireEvent.change(screen.getByTestId('new-patient-dob'), {
      target: { value: '2099-01-01' },
    });

    // Submit via the form element to ensure the latest state is read
    const form = screen.getByTestId('new-patient-submit').closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Date of birth cannot be in the future')).toBeInTheDocument();
    });
  });

  it('should show phone validation error for invalid Norwegian number', async () => {
    renderPage();
    fillRequiredFields();
    fireEvent.change(screen.getByTestId('new-patient-phone'), {
      target: { value: '123' },
    });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(
        screen.getByText('Phone must be a valid Norwegian phone number (8 digits)')
      ).toBeInTheDocument();
    });
  });

  it('should accept valid Norwegian phone with +47 prefix', async () => {
    renderPage();
    fillRequiredFields();
    fireEvent.change(screen.getByTestId('new-patient-phone'), {
      target: { value: '+47 12345678' },
    });

    patientsAPI.create.mockResolvedValue({ data: { id: 'new-id' } });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(patientsAPI.create).toHaveBeenCalled();
    });
  });

  it('should accept valid 8-digit phone number without prefix', async () => {
    renderPage();
    fillRequiredFields();
    fireEvent.change(screen.getByTestId('new-patient-phone'), {
      target: { value: '98765432' },
    });

    patientsAPI.create.mockResolvedValue({ data: { id: 'new-id' } });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(patientsAPI.create).toHaveBeenCalled();
    });
  });

  it('should show email validation error for invalid email', async () => {
    renderPage();

    fillRequiredFields();
    fireEvent.change(screen.getByTestId('new-patient-email'), {
      target: { value: 'not-an-email' },
    });

    // Use fireEvent.submit on the form element instead of clicking the button
    const form = screen.getByTestId('new-patient-submit').closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Email must be valid')).toBeInTheDocument();
    });
  });

  it('should accept valid email address', async () => {
    renderPage();
    fillRequiredFields();
    fireEvent.change(screen.getByTestId('new-patient-email'), {
      target: { value: 'kari@example.com' },
    });

    patientsAPI.create.mockResolvedValue({ data: { id: 'new-id' } });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(patientsAPI.create).toHaveBeenCalled();
    });
  });

  it('should clear field error when user types into the errored field', async () => {
    renderPage();
    // Trigger validation errors
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });

    // Type into first name -> error should clear
    fireEvent.change(screen.getByTestId('new-patient-first-name'), {
      target: { value: 'Kari' },
    });

    expect(screen.queryByText('First name is required')).not.toBeInTheDocument();
  });

  // ===== FORM SUBMISSION =====

  it('should call patientsAPI.create with form data on valid submission', async () => {
    renderPage();
    fillRequiredFields();

    patientsAPI.create.mockResolvedValue({ data: { id: 'patient-new' } });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(patientsAPI.create).toHaveBeenCalledTimes(1);
    });

    const callArg = patientsAPI.create.mock.calls[0][0];
    expect(callArg.solvit_id).toBe('SOLV-999');
    expect(callArg.first_name).toBe('Kari');
    expect(callArg.last_name).toBe('Nordmann');
    expect(callArg.date_of_birth).toBe('1990-05-15');
    expect(callArg.gender).toBe('FEMALE');
  });

  it('should navigate to patient detail page on successful creation', async () => {
    renderPage();
    fillRequiredFields();

    patientsAPI.create.mockResolvedValue({ data: { id: 'patient-abc' } });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/patients/patient-abc');
    });
  });

  it('should strip empty optional fields (email, phone) from submission data', async () => {
    renderPage();
    fillRequiredFields();
    // Leave phone and email empty (defaults)

    patientsAPI.create.mockResolvedValue({ data: { id: 'new-id' } });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(patientsAPI.create).toHaveBeenCalledTimes(1);
    });

    const callArg = patientsAPI.create.mock.calls[0][0];
    expect(callArg.email).toBeUndefined();
    expect(callArg.phone).toBeUndefined();
  });

  it('should strip empty address object when no address fields are filled', async () => {
    renderPage();
    fillRequiredFields();

    patientsAPI.create.mockResolvedValue({ data: { id: 'new-id' } });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(patientsAPI.create).toHaveBeenCalledTimes(1);
    });

    const callArg = patientsAPI.create.mock.calls[0][0];
    expect(callArg.address).toBeUndefined();
  });

  it('should include address when at least one address field is filled', async () => {
    renderPage();
    fillRequiredFields();
    fireEvent.change(screen.getByPlaceholderText('Street address'), {
      target: { value: 'Karl Johans gate 1' },
    });

    patientsAPI.create.mockResolvedValue({ data: { id: 'new-id' } });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(patientsAPI.create).toHaveBeenCalledTimes(1);
    });

    const callArg = patientsAPI.create.mock.calls[0][0];
    expect(callArg.address).toBeDefined();
    expect(callArg.address.street).toBe('Karl Johans gate 1');
    expect(callArg.address.country).toBe('Norway');
  });

  // ===== ERROR HANDLING =====

  it('should show general error message on API failure without field details', async () => {
    renderPage();
    fillRequiredFields();

    patientsAPI.create.mockRejectedValue({
      response: { data: { message: 'Internal server error' } },
    });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('should show fallback error message when API response has no message', async () => {
    renderPage();
    fillRequiredFields();

    patientsAPI.create.mockRejectedValue({
      response: { data: {} },
    });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(screen.getByText('Failed to create patient')).toBeInTheDocument();
    });
  });

  it('should display backend field-level validation errors', async () => {
    renderPage();
    fillRequiredFields();

    patientsAPI.create.mockRejectedValue({
      response: {
        data: {
          details: [
            { field: 'solvit_id', message: 'SolvIt ID already exists' },
            { field: 'email', message: 'Email already registered' },
          ],
        },
      },
    });
    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(screen.getByText('SolvIt ID already exists')).toBeInTheDocument();
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  // ===== NAVIGATION =====

  it('should navigate to /patients when Cancel button is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('new-patient-cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/patients');
  });

  it('should navigate to /patients when back arrow button is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByLabelText('Back to patients'));
    expect(mockNavigate).toHaveBeenCalledWith('/patients');
  });

  // ===== FORM STATE =====

  it('should update input values on change', () => {
    renderPage();
    const firstNameInput = screen.getByTestId('new-patient-first-name');
    fireEvent.change(firstNameInput, { target: { value: 'Ola' } });
    expect(firstNameInput).toHaveValue('Ola');
  });

  it('should update address fields independently', () => {
    renderPage();
    const streetInput = screen.getByPlaceholderText('Street address');
    const cityInput = screen.getByPlaceholderText('City');
    const postalInput = screen.getByPlaceholderText('e.g., 0123');

    fireEvent.change(streetInput, { target: { value: 'Storgata 5' } });
    fireEvent.change(cityInput, { target: { value: 'Oslo' } });
    fireEvent.change(postalInput, { target: { value: '0182' } });

    expect(streetInput).toHaveValue('Storgata 5');
    expect(cityInput).toHaveValue('Oslo');
    expect(postalInput).toHaveValue('0182');
  });

  it('should update general notes textarea', () => {
    renderPage();
    const notesArea = screen.getByPlaceholderText('Any additional notes about the patient...');
    fireEvent.change(notesArea, { target: { value: 'Test note' } });
    expect(notesArea).toHaveValue('Test note');
  });

  it('should update language select', () => {
    renderPage();
    const langSelect = screen.getByDisplayValue('Norsk');
    fireEvent.change(langSelect, { target: { value: 'EN' } });
    expect(langSelect).toHaveValue('EN');
  });

  // ===== SUBMIT BUTTON STATE =====

  it('should show "Creating..." text while mutation is pending', async () => {
    renderPage();
    fillRequiredFields();

    // Make API hang (never resolve) to keep isPending true
    let resolvePromise;
    patientsAPI.create.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    fireEvent.click(screen.getByTestId('new-patient-submit'));

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    // Verify the submit button is disabled while pending
    expect(screen.getByTestId('new-patient-submit')).toBeDisabled();

    // Clean up — resolve the promise so React settles
    resolvePromise({ data: { id: 'done' } });
  });

  // ===== DESCRIPTIVE PARAGRAPH =====

  it('should render subtitle text', () => {
    renderPage();
    expect(screen.getByText('Create a new patient record')).toBeInTheDocument();
  });
});
