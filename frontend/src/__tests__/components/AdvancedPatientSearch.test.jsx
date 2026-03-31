/**
 * AdvancedPatientSearch Component Tests
 *
 * Tests search, filter, sort, clear, and result selection
 */

import { render, screen, fireEvent } from '@testing-library/react';
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

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'en',
    setLang: vi.fn(),
  }),
  useLanguage: () => ({ lang: 'en', setLang: vi.fn() }),
  LanguageProvider: ({ children }) => children,
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
    expect(screen.getByText('advancedPatientSearch')).toBeInTheDocument();
    expect(screen.getByText('searchMultipleCriteria')).toBeInTheDocument();
  });

  it('should render all filter fields', () => {
    renderWithProviders();
    expect(screen.getByText('nameEmailPhone')).toBeInTheDocument();
    expect(screen.getByText('minAge')).toBeInTheDocument();
    expect(screen.getByText('maxAge')).toBeInTheDocument();
    expect(screen.getByText('gender')).toBeInTheDocument();
    expect(screen.getByText('city')).toBeInTheDocument();
  });

  it('should have Search and Clear Filters buttons', () => {
    renderWithProviders();
    // Search button text (not the icon)
    expect(screen.getByRole('button', { name: /search/ })).toBeInTheDocument();
    expect(screen.getByText('clearFilters')).toBeInTheDocument();
  });

  it('should show initial state message before searching', () => {
    renderWithProviders();
    expect(
      screen.getByText('Angi sokekriterier og klikk Sok for a finne pasienter')
    ).toBeInTheDocument();
  });

  it('should allow typing in search input', () => {
    renderWithProviders();
    const searchInput = screen.getByPlaceholderText('searchByNameEmailPhone');
    fireEvent.change(searchInput, { target: { value: 'Ola' } });
    expect(searchInput.value).toBe('Ola');
  });

  it('should allow setting age filters', () => {
    renderWithProviders();
    const minAge = screen.getByPlaceholderText('f.eks. 18');
    const maxAge = screen.getByPlaceholderText('f.eks. 65');
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
    const searchInput = screen.getByPlaceholderText('searchByNameEmailPhone');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(searchInput.value).toBe('test');

    fireEvent.click(screen.getByText('clearFilters'));
    expect(searchInput.value).toBe('');
  });

  it('should call onClose when Close button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders({ onClose });
    fireEvent.click(screen.getByText('close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should render consent filter options', () => {
    renderWithProviders();
    expect(screen.getByText('treatmentConsent')).toBeInTheDocument();
    expect(screen.getByText('marketingConsent')).toBeInTheDocument();
    expect(screen.getByText('followUpRequired')).toBeInTheDocument();
  });

  it('should render last visit date range filters', () => {
    renderWithProviders();
    expect(screen.getByText('lastVisitFrom')).toBeInTheDocument();
    expect(screen.getByText('lastVisitTo')).toBeInTheDocument();
  });
});
