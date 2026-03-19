/**
 * PatientDetail Resilience Tests
 * Verify PatientDetail renders gracefully with null, empty, and extreme data
 */
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../services/api', () => ({
  patientsAPI: {
    getById: vi.fn(),
    update: vi.fn(),
  },
  encountersAPI: {
    getByPatient: vi.fn(),
  },
  appointmentsAPI: {
    getByPatient: vi.fn(),
  },
  followUpsAPI: {
    getByPatient: vi.fn(),
  },
  exercisesAPI: {
    getByPatient: vi.fn(),
  },
  financialAPI: {
    getByPatient: vi.fn(),
  },
  treatmentPlansAPI: {
    getByPatient: vi.fn(),
  },
  outcomesAPI: {
    getPatientSummary: vi.fn(),
  },
  progressAPI: {
    getPatientStats: vi.fn(),
  },
  communicationsAPI: {
    getByPatient: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
  formatDateWithWeekday: () => 'Mandag 15. mars 2024',
  formatDateShort: () => '15.03.2024',
  formatTime: () => '10:00',
}));

vi.mock('../../utils/toast', () => ({
  default: {
    info: vi.fn(),
    promise: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../components/ui/Skeleton', () => ({
  default: () => <div>Loading...</div>,
  PatientDetailSkeleton: () => <div>Loading patient...</div>,
}));

vi.mock('../../services/websocket', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-patient-id' }),
    useNavigate: () => vi.fn(),
  };
});

import { patientsAPI, encountersAPI, appointmentsAPI } from '../../services/api';

function renderWithProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('PatientDetail Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not crash when patient API returns null', async () => {
    patientsAPI.getById.mockResolvedValue({ data: null });
    encountersAPI.getByPatient.mockResolvedValue({ data: [] });
    appointmentsAPI.getByPatient.mockResolvedValue({ data: [] });

    const { default: PatientDetail } = await import('../../pages/PatientDetail');
    expect(() => renderWithProviders(<PatientDetail />)).not.toThrow();
  });

  it('should not crash when patient has empty name fields', async () => {
    patientsAPI.getById.mockResolvedValue({
      data: { id: '1', first_name: '', last_name: '', email: '', phone: '' },
    });
    encountersAPI.getByPatient.mockResolvedValue({ data: [] });
    appointmentsAPI.getByPatient.mockResolvedValue({ data: [] });

    const { default: PatientDetail } = await import('../../pages/PatientDetail');
    expect(() => renderWithProviders(<PatientDetail />)).not.toThrow();
  });

  it('should not crash when patient name is 10K characters', async () => {
    patientsAPI.getById.mockResolvedValue({
      data: {
        id: '1',
        first_name: 'A'.repeat(10000),
        last_name: 'B'.repeat(10000),
        email: 'test@test.com',
      },
    });
    encountersAPI.getByPatient.mockResolvedValue({ data: [] });
    appointmentsAPI.getByPatient.mockResolvedValue({ data: [] });

    const { default: PatientDetail } = await import('../../pages/PatientDetail');
    expect(() => renderWithProviders(<PatientDetail />)).not.toThrow();
  });

  it('should not crash when API rejects', async () => {
    patientsAPI.getById.mockRejectedValue(new Error('Patient not found'));
    encountersAPI.getByPatient.mockRejectedValue(new Error('Error'));
    appointmentsAPI.getByPatient.mockRejectedValue(new Error('Error'));

    const { default: PatientDetail } = await import('../../pages/PatientDetail');
    expect(() => renderWithProviders(<PatientDetail />)).not.toThrow();
  });

  it('should not crash with deeply nested null SOAP data', async () => {
    patientsAPI.getById.mockResolvedValue({
      data: { id: '1', first_name: 'Test', last_name: 'Patient' },
    });
    encountersAPI.getByPatient.mockResolvedValue({
      data: [
        {
          id: 'e1',
          subjective: null,
          objective: null,
          assessment: null,
          plan: null,
          encounter_date: null,
        },
      ],
    });
    appointmentsAPI.getByPatient.mockResolvedValue({ data: [] });

    const { default: PatientDetail } = await import('../../pages/PatientDetail');
    expect(() => renderWithProviders(<PatientDetail />)).not.toThrow();
  });

  it('should not crash when encounters is not an array', async () => {
    patientsAPI.getById.mockResolvedValue({
      data: { id: '1', first_name: 'Test', last_name: 'Patient' },
    });
    encountersAPI.getByPatient.mockResolvedValue({ data: 'not-an-array' });
    appointmentsAPI.getByPatient.mockResolvedValue({ data: null });

    const { default: PatientDetail } = await import('../../pages/PatientDetail');
    expect(() => renderWithProviders(<PatientDetail />)).not.toThrow();
  });
});
