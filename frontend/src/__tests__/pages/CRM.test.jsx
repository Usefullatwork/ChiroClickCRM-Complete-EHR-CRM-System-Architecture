/**
 * CRM Page Tests
 * Tests for the CRM Hub dashboard with sidebar navigation, overview stats,
 * and lazy-loaded sub-modules
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock APIs
vi.mock('../../services/api', () => ({
  crmAPI: {
    getOverview: vi.fn(),
    getWaitlist: vi.fn(),
    addToWaitlist: vi.fn(),
    updateWaitlistEntry: vi.fn(),
    notifyWaitlist: vi.fn(),
  },
  patientsAPI: {
    getAll: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Users: () => <span>Users</span>,
  UserPlus: () => <span>UserPlus</span>,
  MessageSquare: () => <span>MessageSquare</span>,
  BarChart3: () => <span>BarChart3</span>,
  Settings: () => <span>Settings</span>,
  Gift: () => <span>Gift</span>,
  Star: () => <span>Star</span>,
  Clock: () => <span>Clock</span>,
  Workflow: () => <span>Workflow</span>,
  TrendingUp: () => <span>TrendingUp</span>,
  FileText: () => <span>FileText</span>,
  Send: () => <span>Send</span>,
  Plus: () => <span>Plus</span>,
  Bell: () => <span>Bell</span>,
  Target: () => <span>Target</span>,
  Zap: () => <span>Zap</span>,
  ListChecks: () => <span>ListChecks</span>,
}));

// Mock lazy-loaded sub-components as simple stubs
vi.mock('../../components/crm/LeadManagement', () => ({
  default: () => <div data-testid="lead-management">LeadManagement</div>,
}));
vi.mock('../../components/crm/PatientLifecycle', () => ({
  default: () => <div data-testid="patient-lifecycle">PatientLifecycle</div>,
}));
vi.mock('../../components/crm/ReferralProgram', () => ({
  default: () => <div data-testid="referral-program">ReferralProgram</div>,
}));
vi.mock('../../components/crm/SurveyManager', () => ({
  default: () => <div data-testid="survey-manager">SurveyManager</div>,
}));
vi.mock('../../components/crm/CommunicationHistory', () => ({
  default: () => <div data-testid="communication-history">CommunicationHistory</div>,
}));
vi.mock('../../components/crm/CampaignManager', () => ({
  default: () => <div data-testid="campaign-manager">CampaignManager</div>,
}));
vi.mock('../../components/crm/WorkflowBuilder', () => ({
  default: () => <div data-testid="workflow-builder">WorkflowBuilder</div>,
}));
vi.mock('../../components/crm/RetentionDashboard', () => ({
  default: () => <div data-testid="retention-dashboard">RetentionDashboard</div>,
}));
vi.mock('../../components/crm/WaitlistManager', () => ({
  default: () => <div data-testid="waitlist-manager">WaitlistManager</div>,
}));
vi.mock('../../components/crm/ExerciseTemplates', () => ({
  default: () => <div data-testid="exercise-templates">ExerciseTemplates</div>,
}));
vi.mock('../../components/crm/CRMSettings', () => ({
  default: () => <div data-testid="crm-settings">CRMSettings</div>,
}));

import CRM from '../../pages/CRM';
import { crmAPI } from '../../services/api';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

const renderWithProviders = (ui) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CRM Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crmAPI.getOverview.mockResolvedValue({
      data: {
        newLeads: 5,
        activePatients: 120,
        atRiskPatients: 8,
        pendingReferrals: 3,
        avgNPS: 72,
        waitlistCount: 4,
      },
    });
  });

  // ==========================================================================
  // HEADING & LAYOUT
  // ==========================================================================

  describe('Heading & Layout', () => {
    it('should render the page title', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Kunderelasjonshåndtering')).toBeInTheDocument();
      });
    });

    it('should render the subtitle', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(
          screen.getByText('Administrer pasienter, leads, kampanjer og kommunikasjon')
        ).toBeInTheDocument();
      });
    });

    it('should show the new lead button', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Ny lead')).toBeInTheDocument();
      });
    });

    it('should show language toggle button', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('EN')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // SIDEBAR NAVIGATION
  // ==========================================================================

  describe('Sidebar Navigation', () => {
    it('should render all 12 sidebar module buttons', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('overview')).toBeInTheDocument();
        expect(screen.getByText('leads')).toBeInTheDocument();
        expect(screen.getByText('patientLifecycle')).toBeInTheDocument();
        expect(screen.getByText('referrals')).toBeInTheDocument();
        expect(screen.getByText('surveys')).toBeInTheDocument();
        expect(screen.getByText('communications')).toBeInTheDocument();
        expect(screen.getByText('campaigns')).toBeInTheDocument();
        expect(screen.getByText('automation')).toBeInTheDocument();
        expect(screen.getByText('retention')).toBeInTheDocument();
        expect(screen.getByText('waitlist')).toBeInTheDocument();
        expect(screen.getByText('exerciseTemplates')).toBeInTheDocument();
        expect(screen.getByText('settings')).toBeInTheDocument();
      });
    });

    it('should navigate to LeadManagement when leads button is clicked', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('leads')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('leads'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-management')).toBeInTheDocument();
      });
    });

    it('should navigate to PatientLifecycle when lifecycle button is clicked', async () => {
      renderWithProviders(<CRM />);

      fireEvent.click(screen.getByText('patientLifecycle'));

      await waitFor(() => {
        expect(screen.getByTestId('patient-lifecycle')).toBeInTheDocument();
      });
    });

    it('should navigate to CRMSettings when settings button is clicked', async () => {
      renderWithProviders(<CRM />);

      fireEvent.click(screen.getByText('settings'));

      await waitFor(() => {
        expect(screen.getByTestId('crm-settings')).toBeInTheDocument();
      });
    });

    it('should navigate to WorkflowBuilder when automation button is clicked', async () => {
      renderWithProviders(<CRM />);

      fireEvent.click(screen.getByText('automation'));

      await waitFor(() => {
        expect(screen.getByTestId('workflow-builder')).toBeInTheDocument();
      });
    });

    it('should navigate to ExerciseTemplates when exerciseTemplates button is clicked', async () => {
      renderWithProviders(<CRM />);

      fireEvent.click(screen.getByText('exerciseTemplates'));

      await waitFor(() => {
        expect(screen.getByTestId('exercise-templates')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // OVERVIEW (DEFAULT VIEW)
  // ==========================================================================

  describe('Overview Stats', () => {
    it('should show overview stat cards with data from API', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Nye Leads')).toBeInTheDocument();
        expect(screen.getByText('Aktive Pasienter')).toBeInTheDocument();
        expect(screen.getByText('I Faresonen')).toBeInTheDocument();
        expect(screen.getByText('NPS Score')).toBeInTheDocument();
      });
    });

    it('should display overview stat values from API response', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        // Check that numeric values rendered — use getAllByText since "5" may appear in multiple contexts
        expect(screen.getByText('120')).toBeInTheDocument();
        expect(screen.getByText('72%')).toBeInTheDocument();
      });
    });

    it('should show Lead Pipeline preview section', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Lead Pipeline')).toBeInTheDocument();
      });
    });

    it('should show Recent Messages preview section', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Siste Meldinger')).toBeInTheDocument();
      });
    });

    it('should show Pending Referrals preview section', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Ventende Henvisninger')).toBeInTheDocument();
      });
    });

    it('should show Active Campaigns preview section', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Aktive Kampanjer')).toBeInTheDocument();
      });
    });

    it('should show Automation section', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Automatisering')).toBeInTheDocument();
      });
    });

    it('should show Waitlist section with patient count', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Venteliste')).toBeInTheDocument();
        expect(screen.getByText('pasienter venter')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // AT-RISK PATIENTS ALERT
  // ==========================================================================

  describe('At-Risk Patients Alert', () => {
    it('should show at-risk alert when atRiskPatients > 0', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText(/pasienter i faresonen/)).toBeInTheDocument();
      });
    });

    it('should show view patients button in at-risk alert', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Se pasienter')).toBeInTheDocument();
      });
    });

    it('should show send campaign button in at-risk alert', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Send kampanje')).toBeInTheDocument();
      });
    });

    it('should not show at-risk alert when atRiskPatients is 0', async () => {
      crmAPI.getOverview.mockResolvedValue({
        data: {
          newLeads: 0,
          activePatients: 0,
          atRiskPatients: 0,
          pendingReferrals: 0,
          avgNPS: 0,
          waitlistCount: 0,
        },
      });

      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Nye Leads')).toBeInTheDocument();
      });

      expect(screen.queryByText(/pasienter i faresonen/)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // OVERVIEW QUICK ACTIONS
  // ==========================================================================

  describe('Overview Quick Actions', () => {
    it('should show view-all buttons for overview sections', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        const viewAllButtons = screen.getAllByText(/Se alle/);
        expect(viewAllButtons.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should show check available slots button in waitlist section', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Sjekk ledige tider')).toBeInTheDocument();
      });
    });

    it('should show manage button for automation section', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        // "Administrer →" is the manage link; the subtitle also contains "Administrer" so use getAllByText
        const adminLinks = screen.getAllByText(/Administrer/);
        expect(adminLinks.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==========================================================================
  // API INTEGRATION
  // ==========================================================================

  describe('API Integration', () => {
    it('should call getOverview on mount', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(crmAPI.getOverview).toHaveBeenCalled();
      });
    });

    it('should handle getOverview failure gracefully', async () => {
      crmAPI.getOverview.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Kunderelasjonshåndtering')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // OVERVIEW CONTENT
  // ==========================================================================

  describe('Overview Content', () => {
    it('should show pipeline bars in Lead Pipeline preview', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Nye')).toBeInTheDocument();
        expect(screen.getByText('Kontaktet')).toBeInTheDocument();
        expect(screen.getByText('Booket')).toBeInTheDocument();
        expect(screen.getByText('Konvertert')).toBeInTheDocument();
      });
    });

    it('should show message previews in Recent Messages', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
        expect(screen.getByText('Ole Hansen')).toBeInTheDocument();
        expect(screen.getByText('Anna Berg')).toBeInTheDocument();
      });
    });

    it('should show referral previews', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Lise Olsen')).toBeInTheDocument();
        expect(screen.getByText('Martin Berg')).toBeInTheDocument();
      });
    });

    it('should show campaign previews', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Vi savner deg')).toBeInTheDocument();
        expect(screen.getByText('Bursdag Januar')).toBeInTheDocument();
      });
    });

    it('should show workflow statuses', async () => {
      renderWithProviders(<CRM />);

      await waitFor(() => {
        expect(screen.getByText('Velkomstsekvens')).toBeInTheDocument();
        expect(screen.getByText('30-dagers sjekk')).toBeInTheDocument();
        expect(screen.getByText('Bursdagshilsen')).toBeInTheDocument();
      });
    });
  });
});
