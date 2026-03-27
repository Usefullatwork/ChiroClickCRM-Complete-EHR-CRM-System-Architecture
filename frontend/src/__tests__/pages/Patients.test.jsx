/**
 * Patients Page Tests
 *
 * Tests rendering, patient list display, search, filters,
 * loading/empty states, export, and navigation.
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
    getAll: vi.fn(),
    search: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

vi.mock('../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
  },
}));

vi.mock('../../lib/utils', () => ({
  formatDate: (d) => d || '-',
  formatPhone: (p) => p || '-',
  calculateAge: (dob) => (dob ? 35 : null),
}));

vi.mock('../../components/ui/Skeleton', () => ({
  PatientsTableSkeleton: ({ rows }) => (
    <div data-testid="patients-skeleton">Loading {rows} rows...</div>
  ),
}));

vi.mock('../../components/ui/EmptyState', () => ({
  default: ({ title, description, action }) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  ),
}));

vi.mock('../../components/ui/StatusBadge', () => ({
  default: ({ status, label }) => <span data-testid="status-badge">{label || status}</span>,
}));

import Patients from '../../pages/Patients';
import { patientsAPI } from '../../services/api';
import toast from '../../utils/toast';

// ---- Helpers ----

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

const mockPatients = [
  {
    id: 1,
    solvit_id: 'SOL-001',
    first_name: 'Ola',
    last_name: 'Nordmann',
    email: 'ola@example.com',
    phone: '+4712345678',
    date_of_birth: '1990-05-15',
    status: 'ACTIVE',
    category: 'OSLO',
    total_visits: 5,
    last_visit_date: new Date().toISOString(),
    upcoming_appointments: 1,
    red_flags: [],
  },
  {
    id: 2,
    solvit_id: 'SOL-002',
    first_name: 'Kari',
    last_name: 'Hansen',
    email: 'kari@example.com',
    phone: '+4798765432',
    date_of_birth: '1985-10-20',
    status: 'INACTIVE',
    category: 'OUTSIDE_OSLO',
    total_visits: 12,
    last_visit_date: '2024-01-01',
    upcoming_appointments: 0,
    red_flags: [],
  },
];

const mockPagination = { page: 1, pages: 1, total: 2 };

describe('Patients Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientsAPI.getAll.mockResolvedValue({
      data: {
        patients: mockPatients,
        pagination: mockPagination,
      },
    });
  });

  it('renders without crashing', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByTestId('patients-page-title')).toBeInTheDocument();
    });
  });

  it('displays the page title', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByTestId('patients-page-title')).toHaveTextContent('title');
    });
  });

  it('shows loading skeleton while fetching patients', () => {
    patientsAPI.getAll.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<Patients />);
    expect(screen.getByTestId('patients-skeleton')).toBeInTheDocument();
  });

  it('displays patient list after loading', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByTestId('patients-list')).toBeInTheDocument();
    });
    const rows = screen.getAllByTestId('patient-row');
    expect(rows).toHaveLength(2);
  });

  it('displays patient names in the table', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });
  });

  it('displays patient initials in avatars', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByText('ON')).toBeInTheDocument();
      expect(screen.getByText('KH')).toBeInTheDocument();
    });
  });

  it('shows the search input', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByTestId('patients-search-input')).toBeInTheDocument();
    });
  });

  it('allows typing in the search input', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByTestId('patients-search-input')).toBeInTheDocument();
    });
    const input = screen.getByTestId('patients-search-input');
    fireEvent.change(input, { target: { value: 'Ola' } });
    expect(input.value).toBe('Ola');
  });

  it('shows the add new patient button', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByTestId('patients-add-button')).toBeInTheDocument();
    });
  });

  it('navigates to new patient page when add button is clicked', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByTestId('patients-add-button')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('patients-add-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/patients/new');
  });

  it('shows empty state when no patients exist', async () => {
    patientsAPI.getAll.mockResolvedValue({
      data: {
        patients: [],
        pagination: { page: 1, pages: 1, total: 0 },
      },
    });
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('shows status badges for each patient', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      const badges = screen.getAllByTestId('status-badge');
      expect(badges).toHaveLength(2);
    });
  });

  it('navigates to patient detail when a row is clicked', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getAllByTestId('patient-row')).toHaveLength(2);
    });
    fireEvent.click(screen.getAllByTestId('patient-row')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/patients/1');
  });

  it('displays total patient count', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByText(/2\s+totalpatients/i)).toBeInTheDocument();
    });
  });

  it('shows export button', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });

  it('shows import button', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByText('Import')).toBeInTheDocument();
    });
  });

  it('displays error state when API call fails', async () => {
    patientsAPI.getAll.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('shows status filter dropdown', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByText('allStatuses')).toBeInTheDocument();
    });
  });

  it('shows category filter dropdown', async () => {
    renderWithProviders(<Patients />);
    await waitFor(() => {
      expect(screen.getByText('allCategories')).toBeInTheDocument();
    });
  });
});
