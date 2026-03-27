/**
 * MessageApprovalDashboard Component Tests
 * Tests for message approval and review dashboard
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mocks BEFORE component import
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
  formatDate: () => '15.03.2024',
  formatTime: () => '10:00',
}));

vi.mock('../../../services/api', () => ({
  schedulerAPI: {
    getTodaysMessages: vi.fn(),
    sendApproved: vi.fn(),
    cancelMessage: vi.fn(),
    schedule: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { schedulerAPI } from '../../../services/api';
import MessageApprovalDashboard from '../../../components/communications/MessageApprovalDashboard';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function renderWithProviders(ui) {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

const mockMessages = [
  {
    id: 1,
    patient_name: 'Ola Nordmann',
    type: 'SMS',
    recipient: '+4712345678',
    content: 'Hei Ola, husk timen din i morgen!',
    category: 'reminder',
    created_at: '2026-03-20T10:00:00Z',
    trigger_event: 'Daglig påminnelse',
  },
  {
    id: 2,
    patient_name: 'Kari Hansen',
    type: 'EMAIL',
    recipient: 'kari@example.com',
    content: 'Hei Kari, du møtte ikke til timen din.',
    category: 'no_show',
    created_at: '2026-03-20T09:00:00Z',
    trigger_event: 'No-show',
  },
  {
    id: 3,
    patient_name: 'Per Olsen',
    type: 'SMS',
    recipient: '+4798765432',
    content: 'Hei Per, vi anbefaler en oppfølgingstime.',
    category: 'follow_up',
    created_at: '2026-03-19T15:00:00Z',
    trigger_event: null,
  },
];

describe('MessageApprovalDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    schedulerAPI.getTodaysMessages.mockResolvedValue({
      data: { data: mockMessages },
    });
    schedulerAPI.sendApproved.mockResolvedValue({ data: { success: true } });
    schedulerAPI.cancelMessage.mockResolvedValue({ data: { success: true } });
    schedulerAPI.schedule.mockResolvedValue({ data: { id: 99 } });
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should render the dashboard title', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Meldingsgodkjenning')).toBeInTheDocument();
      });
    });

    it('should show message count in subtitle', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/melding\(er\) venter på godkjenning/)).toBeInTheDocument();
      });
    });

    it('should render category filter buttons', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Alle')).toBeInTheDocument();
        expect(screen.getByText('No-show')).toBeInTheDocument();
        expect(screen.getByText('Oppfølging')).toBeInTheDocument();
        expect(screen.getByText('Påminnelse')).toBeInTheDocument();
        expect(screen.getByText('Recall')).toBeInTheDocument();
      });
    });

    it('should render message cards for all messages', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
        expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
        expect(screen.getByText('Per Olsen')).toBeInTheDocument();
      });
    });

    it('should show bulk approve button when messages exist', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Godkjenn alle/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  describe('Empty State', () => {
    it('should show empty state when no messages', async () => {
      schedulerAPI.getTodaysMessages.mockResolvedValue({
        data: { data: [] },
      });

      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Ingen meldinger venter på godkjenning')).toBeInTheDocument();
      });
    });

    it('should show helper text in empty state', async () => {
      schedulerAPI.getTodaysMessages.mockResolvedValue({
        data: { data: [] },
      });

      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Nye meldinger vil vises her automatisk')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // CATEGORY FILTERING
  // ============================================================================

  describe('Category Filtering', () => {
    it('should filter messages by no_show category', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
      });

      // "No-show" appears in both filter buttons and message card badges; target the filter button
      const noShowButtons = screen.getAllByText('No-show');
      // The filter button is the one inside the category filter bar (bg-gray-50)
      const filterButton = noShowButtons.find((el) => el.closest('.bg-gray-50'));
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
        expect(screen.queryByText('Ola Nordmann')).not.toBeInTheDocument();
        expect(screen.queryByText('Per Olsen')).not.toBeInTheDocument();
      });
    });

    it('should show all messages when Alle is selected', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      });

      // Click a category first, then back to Alle
      const noShowButtons = screen.getAllByText('No-show');
      const filterButton = noShowButtons.find((el) => el.closest('.bg-gray-50'));
      fireEvent.click(filterButton);
      fireEvent.click(screen.getByText('Alle'));

      await waitFor(() => {
        expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
        expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
        expect(screen.getByText('Per Olsen')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // MESSAGE CARD INTERACTION
  // ============================================================================

  describe('Message Card Interaction', () => {
    it('should expand a message card when clicked', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      });

      // Click the header button of the first message card
      fireEvent.click(screen.getByText('Ola Nordmann'));

      await waitFor(() => {
        // After expanding, the message content appears (may appear twice: content + SMS preview)
        const contentElements = screen.getAllByText('Hei Ola, husk timen din i morgen!');
        expect(contentElements.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Godkjenn & Send')).toBeInTheDocument();
        expect(screen.getByText('Avvis')).toBeInTheDocument();
      });
    });

    it('should collapse an expanded message card when clicked again', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      });

      // Expand
      fireEvent.click(screen.getByText('Ola Nordmann'));
      await waitFor(() => {
        expect(screen.getByText('Godkjenn & Send')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(screen.getByText('Ola Nordmann'));
      await waitFor(() => {
        expect(screen.queryByText('Godkjenn & Send')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // APPROVE / REJECT
  // ============================================================================

  describe('Approve and Reject', () => {
    it('should call sendApproved when approve button is clicked', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      });

      // Expand the first message
      fireEvent.click(screen.getByText('Ola Nordmann'));
      await waitFor(() => {
        expect(screen.getByText('Godkjenn & Send')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Godkjenn & Send'));

      await waitFor(() => {
        expect(schedulerAPI.sendApproved).toHaveBeenCalledWith([1]);
      });
    });

    it('should call cancelMessage when reject button is clicked', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      });

      // Expand the first message
      fireEvent.click(screen.getByText('Ola Nordmann'));
      await waitFor(() => {
        expect(screen.getByText('Avvis')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Avvis'));

      await waitFor(() => {
        expect(schedulerAPI.cancelMessage).toHaveBeenCalledWith(1);
      });
    });
  });

  // ============================================================================
  // STATS FOOTER
  // ============================================================================

  describe('Stats Footer', () => {
    it('should show SMS and Email counts in footer', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('2 SMS')).toBeInTheDocument();
        expect(screen.getByText('1 e-post')).toBeInTheDocument();
      });
    });

    it('should show auto-refresh notice', async () => {
      renderWithProviders(<MessageApprovalDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Oppdateres automatisk hvert 30. sekund')).toBeInTheDocument();
      });
    });
  });
});
