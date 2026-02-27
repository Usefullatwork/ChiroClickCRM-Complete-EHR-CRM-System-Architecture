/**
 * RecallDashboard Component Tests
 * Tests for the patient recall dashboard
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecallDashboard from '../../components/recall/RecallDashboard';

// Mock API
vi.mock('../../services/api', () => ({
  followUpsAPI: {
    getPatientsNeedingFollowUp: vi.fn(),
    getRecallRules: vi.fn(),
    markPatientAsContacted: vi.fn(),
  },
}));

// Mock toast
vi.mock('../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { followUpsAPI } from '../../services/api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('RecallDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({ data: { patients: [] } });
    followUpsAPI.getRecallRules.mockResolvedValue({ data: { data: [] } });
  });

  // ============================================================================
  // HEADING
  // ============================================================================

  describe('Heading', () => {
    it('should render the dashboard heading', async () => {
      render(<RecallDashboard />, { wrapper: createWrapper() });
      expect(screen.getByText('Recall Dashboard')).toBeInTheDocument();
    });

    it('should render the description text', async () => {
      render(<RecallDashboard />, { wrapper: createWrapper() });
      expect(screen.getByText(/Pasienter som bor kalles inn til ny time/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // STAT CARDS
  // ============================================================================

  describe('Stat Cards', () => {
    it('should display stat cards with totals', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [
            { id: '1', first_name: 'Ola', last_name: 'N', days_overdue: 20 },
            { id: '2', first_name: 'Kari', last_name: 'H', days_overdue: 0 },
            { id: '3', first_name: 'Per', last_name: 'B', days_overdue: -5 },
          ],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // total = 3
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Totalt due')).toBeInTheDocument();
      });
    });

    it('should show stat labels', async () => {
      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Forfalt')).toBeInTheDocument();
        expect(screen.getByText('Due i dag')).toBeInTheDocument();
        expect(screen.getByText('Kommende')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should show loading text while data is being fetched', () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockReturnValue(new Promise(() => {}));
      render(<RecallDashboard />, { wrapper: createWrapper() });
      expect(screen.getByText('Laster pasienter...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  describe('Empty State', () => {
    it('should show empty message when no patients need recall', async () => {
      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ingen pasienter trenger recall akkurat na.')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // SEARCH FILTER
  // ============================================================================

  describe('Search Filter', () => {
    it('should filter patients by search query', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [
            { id: '1', first_name: 'Ola', last_name: 'Nordmann', days_overdue: 5 },
            { id: '2', first_name: 'Kari', last_name: 'Hansen', days_overdue: 10 },
          ],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Names render as "{first_name} {last_name}" in a single text node
        expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
        expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      });

      // Search for "Kari"
      const searchInput = screen.getByPlaceholderText('Sok pasient eller tilstand...');
      fireEvent.change(searchInput, { target: { value: 'Kari' } });

      await waitFor(() => {
        expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
        expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      });
    });

    it('should show no-match message when search finds nothing', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [{ id: '1', first_name: 'Ola', last_name: 'Nordmann', days_overdue: 5 }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Sok pasient eller tilstand...');
      fireEvent.change(searchInput, { target: { value: 'zzzzz' } });

      await waitFor(() => {
        expect(screen.getByText('Ingen pasienter matcher soket.')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // URGENCY COLORS
  // ============================================================================

  describe('Urgency Colors', () => {
    it('should show red for patients > 14 days overdue', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [{ id: '1', first_name: 'Test', last_name: 'User', days_overdue: 20 }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        const badge = screen.getByText('20 dager');
        expect(badge.className).toContain('text-red-700');
      });
    });

    it('should show yellow for patients 1-14 days overdue', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [{ id: '1', first_name: 'Test', last_name: 'User', days_overdue: 5 }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        const badge = screen.getByText('5 dager');
        expect(badge.className).toContain('text-yellow-700');
      });
    });

    it('should show green for patients due today or in the future', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [{ id: '1', first_name: 'Test', last_name: 'User', days_overdue: 0 }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        const badge = screen.getByText('I dag');
        expect(badge.className).toContain('text-green-700');
      });
    });
  });

  // ============================================================================
  // CONTACT ACTIONS
  // ============================================================================

  describe('Contact Actions', () => {
    it('should show contact buttons for each patient', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [{ id: '1', first_name: 'Ola', last_name: 'N', days_overdue: 5 }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        const smsButton = screen.getByTitle('Send SMS');
        expect(smsButton).toBeInTheDocument();
        const phoneButton = screen.getByTitle('Ring pasient');
        expect(phoneButton).toBeInTheDocument();
        const dismissButton = screen.getByTitle('Avvis recall');
        expect(dismissButton).toBeInTheDocument();
      });
    });

    it('should call markPatientAsContacted when SMS button clicked', async () => {
      followUpsAPI.markPatientAsContacted.mockResolvedValue({ data: {} });
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [{ id: 'p1', first_name: 'Ola', last_name: 'N', days_overdue: 5 }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTitle('Send SMS')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Send SMS'));

      await waitFor(() => {
        expect(followUpsAPI.markPatientAsContacted).toHaveBeenCalledWith('p1', 'sms');
      });
    });

    it('should call markPatientAsContacted with "phone" when phone button clicked', async () => {
      followUpsAPI.markPatientAsContacted.mockResolvedValue({ data: {} });
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [{ id: 'p1', first_name: 'Ola', last_name: 'N', days_overdue: 5 }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTitle('Ring pasient')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Ring pasient'));

      await waitFor(() => {
        expect(followUpsAPI.markPatientAsContacted).toHaveBeenCalledWith('p1', 'phone');
      });
    });

    it('should call markPatientAsContacted with "dismissed" when dismiss button clicked', async () => {
      followUpsAPI.markPatientAsContacted.mockResolvedValue({ data: {} });
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [{ id: 'p1', first_name: 'Ola', last_name: 'N', days_overdue: 5 }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTitle('Avvis recall')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Avvis recall'));

      await waitFor(() => {
        expect(followUpsAPI.markPatientAsContacted).toHaveBeenCalledWith('p1', 'dismissed');
      });
    });
  });

  // ============================================================================
  // FUTURE DUE PATIENTS
  // ============================================================================

  describe('Future Due Patients', () => {
    it('should show "Om X d." for patients with negative days_overdue', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [{ id: '1', first_name: 'Fremtidig', last_name: 'Pasient', days_overdue: -7 }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Om 7 d.')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // STATS BREAKDOWN
  // ============================================================================

  describe('Stats Breakdown', () => {
    it('should calculate correct overdue, today, and upcoming counts', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [
            { id: '1', first_name: 'A', last_name: 'Overdue', days_overdue: 20 },
            { id: '2', first_name: 'B', last_name: 'Overdue2', days_overdue: 5 },
            { id: '3', first_name: 'C', last_name: 'Today', days_overdue: 0 },
            { id: '4', first_name: 'D', last_name: 'Upcoming', days_overdue: -3 },
          ],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Numbers appear in multiple stat cards, so use getAllByText
        expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1); // total
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // overdue
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1); // due today and upcoming
      });
    });
  });

  // ============================================================================
  // RECALL RULES
  // ============================================================================

  describe('Recall Rules', () => {
    it('should show recall rules section when rules exist', async () => {
      followUpsAPI.getRecallRules.mockResolvedValue({
        data: {
          data: [
            { category: 'Nakke', interval_days: 28, priority: 'high' },
            { category: 'Korsrygg', interval_days: 42, priority: 'medium' },
          ],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Recall-regler \(2 kategorier\)/)).toBeInTheDocument();
      });
    });

    it('should expand rules when header is clicked', async () => {
      followUpsAPI.getRecallRules.mockResolvedValue({
        data: {
          data: [{ category: 'Nakke', interval_days: 28, priority: 'high' }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Recall-regler/)).toBeInTheDocument();
      });

      // Rules content should be hidden initially
      expect(screen.queryByText('Nakke')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(screen.getByText(/Recall-regler/));

      await waitFor(() => {
        expect(screen.getByText('Nakke')).toBeInTheDocument();
        expect(screen.getByText(/Intervall: 28 dager/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // SORT FUNCTIONALITY
  // ============================================================================

  describe('Sort Functionality', () => {
    it('should render sortable column headers', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [{ id: '1', first_name: 'Ola', last_name: 'N', days_overdue: 5 }],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        // /Pasient/ matches description text and <th>, so use getAllByText
        expect(screen.getAllByText(/Pasient/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Siste besok/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Tilstand/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Dager forfalt/).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ============================================================================
  // PATIENT PHONE DISPLAY
  // ============================================================================

  describe('Patient Phone Display', () => {
    it('should show phone number when available', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [
            { id: '1', first_name: 'Ola', last_name: 'N', days_overdue: 5, phone: '90123456' },
          ],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('90123456')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // CONDITION BADGE
  // ============================================================================

  describe('Condition Badge', () => {
    it('should show condition badge when condition is provided', async () => {
      followUpsAPI.getPatientsNeedingFollowUp.mockResolvedValue({
        data: {
          patients: [
            {
              id: '1',
              first_name: 'Ola',
              last_name: 'N',
              days_overdue: 5,
              condition: 'Nakkesmerter',
            },
          ],
        },
      });

      render(<RecallDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nakkesmerter')).toBeInTheDocument();
      });
    });
  });
});
