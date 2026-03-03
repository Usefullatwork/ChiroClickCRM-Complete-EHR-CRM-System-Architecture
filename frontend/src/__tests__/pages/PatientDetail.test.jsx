/**
 * PatientDetail Page Tests
 *
 * Tests patient view, edit mode, save, tabs, and GDPR export
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock react-router-dom params
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'patient-123' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock API
vi.mock('../../services/api', () => ({
  patientsAPI: {
    getById: vi.fn(),
    update: vi.fn(),
  },
  encountersAPI: {
    getByPatient: vi.fn(),
  },
}));

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        patientNotFound: 'Patient not found',
        patients: 'Patients',
        contactInfo: 'Contact Information',
        phone: 'Phone',
        email: 'Email',
        preferredContactMethod: 'Preferred Contact Method',
        address: 'Address',
        clinical: 'Clinical Information',
        mainProblem: 'Main Problem',
        notes: 'Notes',
        totalVisits: 'Total Visits',
        lastVisit: 'Last Visit',
        savePatient: 'Save',
        consentGiven: 'Consent Given',
        sms: 'SMS',
        treatmentPreferences: 'Treatment Preferences',
        needles: 'Needles',
        adjustments: 'Adjustments',
        neckAdjustments: 'Neck Adjustments',
        prefOk: 'OK',
        prefNotOk: 'Not OK',
        prefNotCleared: 'Not cleared',
        preferenceNotes: 'Preference notes',
        treatmentNotesPlaceholder: 'Any notes about treatment preferences...',
        recentVisits: 'Recent Visits',
        noVisitsRecorded: 'No visits recorded',
        editPatient: 'Edit',
        cancel: 'Cancel',
        newVisit: 'New Visit',
        backToPatients: 'Back to patients',
      };
      return map[key] || key;
    },
    lang: 'no',
  }),
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock hooks
vi.mock('../../hooks/usePatientPresence', () => ({
  default: () => [],
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Test User', email: 'test@test.com' } }),
}));

// Mock child components
vi.mock('../../components/patients/PatientSummaryCard', () => ({
  default: ({ patient }) => <div data-testid="patient-summary-card">{patient.first_name}</div>,
}));

vi.mock('../../components/treatment/TreatmentPlanProgress', () => ({
  default: () => <div data-testid="treatment-plan-progress">Treatment Plan</div>,
}));

vi.mock('../../components/clinical/OutcomeChart', () => ({
  default: () => <div data-testid="outcome-chart">Outcome Chart</div>,
}));

vi.mock('../../components/clinical/ComplianceDashboard', () => ({
  default: () => <div data-testid="compliance-dashboard">Compliance</div>,
}));

vi.mock('../../components/common/Breadcrumbs', () => ({
  default: () => <nav data-testid="breadcrumbs">Breadcrumbs</nav>,
}));

vi.mock('../../components/GDPRExportModal', () => ({
  default: ({ onClose }) => (
    <div data-testid="gdpr-modal">
      <button onClick={onClose}>Close GDPR</button>
    </div>
  ),
}));

vi.mock('../../components/patients/PatientTimeline', () => ({
  default: () => <div data-testid="patient-timeline">Timeline</div>,
}));

// Mock lucide-react icons — use aria-hidden to avoid text matching conflicts
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span aria-hidden="true" />,
  Edit: () => <span aria-hidden="true" />,
  Save: () => <span aria-hidden="true" />,
  X: () => <span aria-hidden="true" />,
  Phone: () => <span aria-hidden="true" />,
  Mail: () => <span aria-hidden="true" />,
  MapPin: () => <span aria-hidden="true" />,
  FileText: () => <span aria-hidden="true" />,
  AlertCircle: () => <span aria-hidden="true" />,
  MessageSquare: () => <span aria-hidden="true" />,
  Globe: () => <span aria-hidden="true" />,
  Shield: () => <span aria-hidden="true" />,
  // StatusBadge.jsx icons
  CheckCircle2: () => <span aria-hidden="true" />,
  Clock: () => <span aria-hidden="true" />,
  XCircle: () => <span aria-hidden="true" />,
  AlertTriangle: () => <span aria-hidden="true" />,
  Pause: () => <span aria-hidden="true" />,
  HelpCircle: () => <span aria-hidden="true" />,
  // PatientChartSidebar.jsx icons
  Calendar: () => <span aria-hidden="true" />,
  CheckCircle: () => <span aria-hidden="true" />,
}));

// Mock lib/utils
vi.mock('../../lib/utils', () => ({
  formatDate: (d) => d || '-',
  formatPhone: (p) => p || '-',
  calculateAge: () => 35,
}));

import PatientDetail from '../../pages/PatientDetail';
import { patientsAPI, encountersAPI } from '../../services/api';

const mockPatient = {
  id: 'patient-123',
  first_name: 'Ola',
  last_name: 'Nordmann',
  date_of_birth: '1990-01-15',
  solvit_id: 'SOL-001',
  phone: '+4712345678',
  email: 'ola@example.com',
  preferred_contact_method: 'SMS',
  language: 'NO',
  main_problem: 'Korsryggsmerter',
  treatment_type: 'KIROPRAKTOR',
  preferred_therapist: 'Mads',
  general_notes: 'Test notes',
  status: 'ACTIVE',
  total_visits: 12,
  last_visit_date: '2026-02-01',
  first_visit_date: '2025-06-01',
  treatment_pref_needles: true,
  treatment_pref_adjustments: true,
  treatment_pref_neck_adjustments: null,
  treatment_pref_notes: '',
  consent_sms: true,
  consent_email: true,
  consent_marketing: false,
  consent_video_marketing: false,
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const renderWithProviders = (component) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PatientDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientsAPI.getById.mockResolvedValue({ data: mockPatient });
    encountersAPI.getByPatient.mockResolvedValue({ data: { encounters: [] } });
  });

  it('should render patient name after loading', async () => {
    renderWithProviders(<PatientDetail />);

    await waitFor(() => {
      expect(screen.getByTestId('patient-detail-name')).toHaveTextContent('Ola Nordmann');
    });
  });

  it('should display contact information section', async () => {
    renderWithProviders(<PatientDetail />);

    await waitFor(() => {
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
    });
  });

  it('should show clinical information section', async () => {
    renderWithProviders(<PatientDetail />);

    await waitFor(() => {
      expect(screen.getByText('Clinical Information')).toBeInTheDocument();
    });
    expect(screen.getByText('Korsryggsmerter')).toBeInTheDocument();
  });

  it('should display treatment preferences section', async () => {
    renderWithProviders(<PatientDetail />);

    await waitFor(() => {
      expect(screen.getByText('Treatment Preferences')).toBeInTheDocument();
    });
    expect(screen.getByText('Needles')).toBeInTheDocument();
    expect(screen.getByText('Adjustments')).toBeInTheDocument();
  });

  it('should show Edit button in non-editing mode', async () => {
    renderWithProviders(<PatientDetail />);

    await waitFor(() => {
      // Edit text is inside <span className="hidden sm:inline"> but still in DOM
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  it('should switch to edit mode when Edit is clicked', async () => {
    renderWithProviders(<PatientDetail />);

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit'));

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  it('should show patient status badge', async () => {
    renderWithProviders(<PatientDetail />);

    await waitFor(() => {
      // Sidebar renders StatusBadge in two places (avatar section + stats)
      const badges = screen.getAllByText('ACTIVE');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should display consent status section', async () => {
    renderWithProviders(<PatientDetail />);

    await waitFor(() => {
      expect(screen.getByText('Consent Given')).toBeInTheDocument();
    });
  });

  it('should render treatment plan progress widget on Journals tab', async () => {
    renderWithProviders(<PatientDetail />);

    // Switch to Journals tab
    await waitFor(() => {
      expect(screen.getByText('Journaler')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Journaler'));

    await waitFor(() => {
      expect(screen.getByTestId('treatment-plan-progress')).toBeInTheDocument();
    });
  });

  it('should display "No visits recorded" on Journals tab when encounters list is empty', async () => {
    renderWithProviders(<PatientDetail />);

    // Switch to Journals tab
    await waitFor(() => {
      expect(screen.getByText('Journaler')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Journaler'));

    await waitFor(() => {
      expect(screen.getByText('No visits recorded')).toBeInTheDocument();
    });
  });

  it('should show patient not found message when patient is null', async () => {
    patientsAPI.getById.mockResolvedValue({ data: null });

    renderWithProviders(<PatientDetail />);

    await waitFor(() => {
      expect(screen.getByText('Patient not found')).toBeInTheDocument();
    });
  });

  it('should open GDPR export modal', async () => {
    renderWithProviders(<PatientDetail />);

    await waitFor(() => {
      expect(screen.getByTitle('GDPR Export')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('GDPR Export'));

    await waitFor(() => {
      expect(screen.getByTestId('gdpr-modal')).toBeInTheDocument();
    });
  });
});
