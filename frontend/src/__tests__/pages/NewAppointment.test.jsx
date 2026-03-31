/**
 * NewAppointment Page Tests
 *
 * Tests form rendering, field validation, patient search,
 * practitioner selection, recurring options, and form submission
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock i18n (CUSTOM - from ../../i18n, NOT react-i18next)
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
  formatDate: () => '15.03.2024',
  formatTime: () => '10:00',
}));

// Mock API
vi.mock('../../services/api', () => ({
  appointmentsAPI: {
    create: vi.fn(),
    getAvailableSlots: vi.fn(),
  },
  patientsAPI: {
    getAll: vi.fn(),
  },
  usersAPI: {
    getAll: vi.fn(),
  },
}));

// Mock Breadcrumbs
vi.mock('../../components/common/Breadcrumbs', () => ({
  default: ({ items }) => (
    <nav data-testid="breadcrumbs">
      {items.map((item, i) => (
        <span key={i}>{item.label}</span>
      ))}
    </nav>
  ),
}));

import NewAppointment from '../../pages/NewAppointment';
import { appointmentsAPI, patientsAPI, usersAPI } from '../../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

const mockUsers = [
  { id: 1, first_name: 'Erik', last_name: 'Hansen', role: 'CHIROPRACTOR' },
  { id: 2, first_name: 'Anna', last_name: 'Berg', role: 'CHIROPRACTOR' },
];

const mockPatients = [
  { id: 101, first_name: 'Ola', last_name: 'Nordmann', solvit_id: 'SOL-001' },
  { id: 102, first_name: 'Kari', last_name: 'Hansen', solvit_id: 'SOL-002' },
];

describe('NewAppointment Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    usersAPI.getAll.mockResolvedValue({
      data: { users: mockUsers },
    });

    patientsAPI.getAll.mockResolvedValue({
      data: { patients: mockPatients },
    });

    appointmentsAPI.create.mockResolvedValue({
      data: { appointment: { id: 1 } },
    });
  });

  it('should render without crashing', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      // "newAppointment" appears in both breadcrumbs and h1
      const headings = screen.getAllByText('newAppointment');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should display the page heading and subtitle', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      // h1 heading
      const headings = screen.getAllByText('newAppointment');
      expect(headings.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('scheduleNewAppointment')).toBeInTheDocument();
    });
  });

  it('should display breadcrumbs', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
      expect(screen.getByText('Oversikt')).toBeInTheDocument();
    });
  });

  it('should display all form sections', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByText('patientPractitioner')).toBeInTheDocument();
      expect(screen.getByText('dateTime')).toBeInTheDocument();
      expect(screen.getByText('appointmentDetails')).toBeInTheDocument();
      expect(screen.getByText('recurringAppointment')).toBeInTheDocument();
    });
  });

  it('should display patient search input', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('searchPatientPlaceholder')).toBeInTheDocument();
    });
  });

  it('should display practitioner dropdown with loaded users', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByText('Erik Hansen - CHIROPRACTOR')).toBeInTheDocument();
      expect(screen.getByText('Anna Berg - CHIROPRACTOR')).toBeInTheDocument();
    });
  });

  it('should display appointment type dropdown with options', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByText('regularAppointment')).toBeInTheDocument();
      expect(screen.getByText('initialConsultation')).toBeInTheDocument();
      expect(screen.getByText('followUp')).toBeInTheDocument();
      expect(screen.getByText('emergency')).toBeInTheDocument();
      expect(screen.getByText('reExamination')).toBeInTheDocument();
    });
  });

  it('should display status dropdown with pending and confirmed options', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      // These are status options in the dropdown
      const pendingOptions = screen.getAllByText('pending');
      expect(pendingOptions.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('confirmed')).toBeInTheDocument();
    });
  });

  it('should display recurring pattern dropdown', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByText('oneTimeAppointment')).toBeInTheDocument();
      expect(screen.getByText('weekly')).toBeInTheDocument();
      expect(screen.getByText('biweekly')).toBeInTheDocument();
      expect(screen.getByText('monthly')).toBeInTheDocument();
      expect(screen.getByText('custom')).toBeInTheDocument();
    });
  });

  it('should display cancel and create buttons', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByText('cancel')).toBeInTheDocument();
      expect(screen.getByText('createAppointment')).toBeInTheDocument();
    });
  });

  it('should navigate back to appointments on cancel click', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByText('cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/appointments');
  });

  it('should navigate back when clicking the back arrow button', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      const backButton = screen.getByLabelText('Tilbake til avtaler');
      expect(backButton).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Tilbake til avtaler'));
    expect(mockNavigate).toHaveBeenCalledWith('/appointments');
  });

  it('should show validation errors when submitting empty form', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByText('createAppointment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('createAppointment'));

    await waitFor(() => {
      expect(screen.getByText('Pasient er påkrevd')).toBeInTheDocument();
      expect(screen.getByText('Behandler er påkrevd')).toBeInTheDocument();
      expect(screen.getByText('Starttid er påkrevd')).toBeInTheDocument();
      expect(screen.getByText('Sluttid er påkrevd')).toBeInTheDocument();
    });
  });

  it('should not call create API when form has validation errors', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByText('createAppointment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('createAppointment'));

    await waitFor(() => {
      expect(screen.getByText('Pasient er påkrevd')).toBeInTheDocument();
    });

    expect(appointmentsAPI.create).not.toHaveBeenCalled();
  });

  it('should search patients when typing more than 1 character', async () => {
    renderWithProviders(<NewAppointment />);

    const searchInput = screen.getByPlaceholderText('searchPatientPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'Ol' } });

    await waitFor(() => {
      expect(patientsAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Ol', limit: 50 })
      );
    });
  });

  it('should display patient search results', async () => {
    renderWithProviders(<NewAppointment />);

    const searchInput = screen.getByPlaceholderText('searchPatientPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'Ola' } });

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('ID: SOL-001')).toBeInTheDocument();
    });
  });

  it('should select a patient from search results', async () => {
    renderWithProviders(<NewAppointment />);

    const searchInput = screen.getByPlaceholderText('searchPatientPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'Ola' } });

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ola Nordmann'));

    // After selecting, the search field should show the patient name
    await waitFor(() => {
      expect(searchInput.value).toBe('Ola Nordmann');
    });
  });

  it('should show recurring end date field when pattern is selected', async () => {
    renderWithProviders(<NewAppointment />);

    // Initially there should be no recurring end date field
    expect(screen.queryByText('recurringUntil')).not.toBeInTheDocument();

    // Select a recurring pattern
    const recurringSelect = screen.getByDisplayValue('oneTimeAppointment');
    fireEvent.change(recurringSelect, { target: { value: 'WEEKLY' } });

    await waitFor(() => {
      expect(screen.getByText('recurringUntil')).toBeInTheDocument();
    });
  });

  it('should show recurring note info box when pattern is selected', async () => {
    renderWithProviders(<NewAppointment />);

    const recurringSelect = screen.getByDisplayValue('oneTimeAppointment');
    fireEvent.change(recurringSelect, { target: { value: 'MONTHLY' } });

    await waitFor(() => {
      expect(screen.getByText('recurringNote')).toBeInTheDocument();
    });
  });

  it('should display patient notes textarea', async () => {
    renderWithProviders(<NewAppointment />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('patientNotesPlaceholder')).toBeInTheDocument();
    });
  });

  it('should require recurring end date when pattern is selected', async () => {
    renderWithProviders(<NewAppointment />);

    // Select a recurring pattern
    const recurringSelect = screen.getByDisplayValue('oneTimeAppointment');
    fireEvent.change(recurringSelect, { target: { value: 'WEEKLY' } });

    await waitFor(() => {
      expect(screen.getByText('recurringUntil')).toBeInTheDocument();
    });

    // Submit without filling recurring end date (and other fields)
    fireEvent.click(screen.getByText('createAppointment'));

    await waitFor(() => {
      expect(screen.getByText('Sluttdato er påkrevd for gjentakende avtaler')).toBeInTheDocument();
    });

    expect(appointmentsAPI.create).not.toHaveBeenCalled();
  });
});
