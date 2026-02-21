/**
 * CampaignManager Component Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CampaignManager from '../../components/crm/CampaignManager';

// Mock dependencies
vi.mock('../../services/api', () => ({
  crmAPI: {
    getCampaigns: vi.fn(),
    createCampaign: vi.fn(),
    launchCampaign: vi.fn(),
  },
}));

vi.mock('../../utils/toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../../utils/logger', () => ({
  default: { scope: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }), error: vi.fn() },
}));

import { crmAPI } from '../../services/api';

const mockCampaigns = [
  {
    id: 'c1',
    name: 'Februar Nyhetsbrev',
    type: 'NEWSLETTER',
    channel: 'EMAIL',
    status: 'ACTIVE',
    audience_description: 'Alle pasienter',
    audience_size: 500,
    scheduled_at: null,
    sent_count: 450,
    delivered_count: 440,
    opened_count: 280,
    clicked_count: 120,
    converted_count: 35,
    created_at: '2026-02-01T10:00:00Z',
    completed_at: null,
    is_automated: false,
  },
  {
    id: 'c2',
    name: 'Reaktivering Mars',
    type: 'REACTIVATION',
    channel: 'SMS',
    status: 'DRAFT',
    audience_description: 'Inaktive pasienter',
    audience_size: 150,
    scheduled_at: '2026-03-01T09:00:00Z',
    sent_count: 0,
    delivered_count: 0,
    opened_count: null,
    clicked_count: null,
    converted_count: 0,
    created_at: '2026-02-15T10:00:00Z',
    completed_at: null,
    is_automated: false,
  },
  {
    id: 'c3',
    name: 'Bursdagshilsen',
    type: 'BIRTHDAY',
    channel: 'EMAIL',
    status: 'ACTIVE',
    audience_description: 'Bursdagsbarn',
    audience_size: null,
    scheduled_at: null,
    sent_count: 30,
    delivered_count: 30,
    opened_count: 25,
    clicked_count: 10,
    converted_count: 3,
    created_at: '2026-01-10T10:00:00Z',
    completed_at: null,
    is_automated: true,
  },
];

describe('CampaignManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      crmAPI.getCampaigns.mockReturnValue(new Promise(() => {}));
      render(<CampaignManager />);
      expect(screen.getByText('Laster kampanjer...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  describe('Error State', () => {
    it('should show error message when API call fails', async () => {
      crmAPI.getCampaigns.mockRejectedValue(new Error('Server error'));
      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
      expect(screen.getByText('Prøv igjen')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // LOADED STATE
  // ============================================================================

  describe('Loaded State', () => {
    beforeEach(() => {
      crmAPI.getCampaigns.mockResolvedValue({ data: mockCampaigns });
    });

    it('should render header and stats after loading', async () => {
      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Kampanjer')).toBeInTheDocument();
      });

      expect(screen.getByText('Totalt Sendt')).toBeInTheDocument();
      expect(screen.getByText('Gj.snitt Åpningsrate')).toBeInTheDocument();
    });

    it('should show active campaigns in default tab', async () => {
      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Februar Nyhetsbrev')).toBeInTheDocument();
      });

      // c1 and c3 are ACTIVE, c2 is DRAFT (not shown in active tab)
      expect(screen.getByText('Bursdagshilsen')).toBeInTheDocument();
    });

    it('should show tabs with correct counts', async () => {
      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Kampanjer')).toBeInTheDocument();
      });

      // Check tab labels are present
      expect(screen.getByText('Aktive')).toBeInTheDocument();
      expect(screen.getByText('Utkast')).toBeInTheDocument();
      expect(screen.getByText('Fullført')).toBeInTheDocument();
      expect(screen.getByText('Automatiserte')).toBeInTheDocument();
    });

    it('should switch to draft tab and show draft campaigns', async () => {
      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Kampanjer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Utkast'));

      await waitFor(() => {
        expect(screen.getByText('Reaktivering Mars')).toBeInTheDocument();
      });
    });

    it('should display campaign metrics for sent campaigns', async () => {
      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Februar Nyhetsbrev')).toBeInTheDocument();
      });

      // Campaign c1 has sent=450, should show metrics
      expect(screen.getByText('450')).toBeInTheDocument();
    });

    it('should mark automated campaigns with badge', async () => {
      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Automatisert')).toBeInTheDocument();
      });
    });

    it('should open new campaign modal', async () => {
      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Ny Kampanje')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Ny Kampanje'));
      expect(screen.getByText('Kampanjetype')).toBeInTheDocument();
      expect(screen.getByText('Nyhetsbrev')).toBeInTheDocument();
    });

    it('should show campaign detail when campaign is clicked', async () => {
      render(<CampaignManager />);

      await waitFor(() => {
        expect(screen.getByText('Februar Nyhetsbrev')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Februar Nyhetsbrev'));

      await waitFor(() => {
        expect(screen.getByText('Rediger Kampanje')).toBeInTheDocument();
      });
    });
  });
});
