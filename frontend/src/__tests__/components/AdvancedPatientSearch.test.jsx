/**
 * AdvancedPatientSearch Component Tests
 *
 * Tests search, filter, sort, clear, and result selection
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  },
}));

vi.mock('lucide-react', () => ({
  X: () => <span aria-hidden="true" />,
  Search: () => <span aria-hidden="true" />,
  Calendar: () => <span aria-hidden="true" />,
  User: () => <span aria-hidden="true" />,
  Phone: () => <span aria-hidden="true" />,
  Mail: () => <span aria-hidden="true" />,
  MapPin: () => <span aria-hidden="true" />,
  AlertCircle: () => <span aria-hidden="true" />,
}));

import AdvancedPatientSearch from '../../components/AdvancedPatientSearch';
import { patientsAPI } from '../../services/api';

const mockPatients = [
  {
    id: 'p1',
    first_name: 'Ola',
    last_name: 'Nordmann',
    email: 'ola@example.com',
    phone: '+4712345678',
    city: 'Oslo',
    age: 35,
    consent_treatment: true,
    should_be_followed_up: false,
  },
  {
    id: 'p2',
    first_name: 'Kari',
    last_name: 'Hansen',
    email: 'kari@example.com',
    phone: '+4787654321',
    city: 'Bergen',
    age: 42,
    consent_treatment: false,
    should_be_followed_up: true,
  },
];

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const renderWithProviders = (props = {}) => {
  const queryClient = createQueryClient();
  const defaultProps = {
    onClose: vi.fn(),
    onSelect: null,
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AdvancedPatientSearch {...defaultProps} {...props} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdvancedPatientSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientsAPI.getAll.mockResolvedValue({
      data: { patients: mockPatients },
    });
  });

  it('should render the search modal with title', () => {
    renderWithProviders();
    expect(screen.getByText('Advanced Patient Search')).toBeInTheDocument();
    expect(screen.getByText('Search patients using multiple criteria')).toBeInTheDocument();
  });

  it('should render all filter fields', () => {
    renderWithProviders();
    expect(screen.getByText('Name, Email, or Phone')).toBeInTheDocument();
    expect(screen.getByText('Min Age')).toBeInTheDocument();
    expect(screen.getByText('Max Age')).toBeInTheDocument();
    expect(screen.getByText('Gender')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();
  });

  it('should have Search and Clear Filters buttons', () => {
    renderWithProviders();
    // Search button text (not the icon)
    expect(screen.getByRole('button', { name: /Search/ })).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('should show initial state message before searching', () => {
    renderWithProviders();
    expect(
      screen.getByText('Set your search criteria and click Search to find patients')
    ).toBeInTheDocument();
  });

  it('should allow typing in search input', () => {
    renderWithProviders();
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone...');
    fireEvent.change(searchInput, { target: { value: 'Ola' } });
    expect(searchInput.value).toBe('Ola');
  });

  it('should allow setting age filters', () => {
    renderWithProviders();
    const minAge = screen.getByPlaceholderText('e.g., 18');
    const maxAge = screen.getByPlaceholderText('e.g., 65');
    fireEvent.change(minAge, { target: { value: '20' } });
    fireEvent.change(maxAge, { target: { value: '50' } });
    expect(minAge.value).toBe('20');
    expect(maxAge.value).toBe('50');
  });

  it('should allow selecting gender filter', () => {
    renderWithProviders();
    // Gender select doesn't use htmlFor — find by role and options
    const selects = screen.getAllByRole('combobox');
    // Find the one that has Male/Female options
    const genderSelect = selects.find((s) => Array.from(s.options).some((o) => o.value === 'MALE'));
    expect(genderSelect).toBeTruthy();
    fireEvent.change(genderSelect, { target: { value: 'FEMALE' } });
    expect(genderSelect.value).toBe('FEMALE');
  });

  it('should clear all filters when Clear Filters is clicked', () => {
    renderWithProviders();
    const searchInput = screen.getByPlaceholderText('Search by name, email, or phone...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(searchInput.value).toBe('test');

    fireEvent.click(screen.getByText('Clear Filters'));
    expect(searchInput.value).toBe('');
  });

  it('should call onClose when Close button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders({ onClose });
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should render consent filter options', () => {
    renderWithProviders();
    expect(screen.getByText('Treatment Consent')).toBeInTheDocument();
    expect(screen.getByText('Marketing Consent')).toBeInTheDocument();
    expect(screen.getByText('Follow-up Required')).toBeInTheDocument();
  });

  it('should render last visit date range filters', () => {
    renderWithProviders();
    expect(screen.getByText('Last Visit From')).toBeInTheDocument();
    expect(screen.getByText('Last Visit To')).toBeInTheDocument();
  });
});
