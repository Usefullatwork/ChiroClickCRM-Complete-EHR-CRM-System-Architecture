/**
 * ReferralProgram Component Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReferralProgram from '../../components/crm/ReferralProgram';

// Mock dependencies
vi.mock('../../services/api', () => ({
  crmAPI: {
    getReferrals: vi.fn(),
    getReferralStats: vi.fn(),
    createReferral: vi.fn(),
  },
}));

vi.mock('../../utils/toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../../utils/logger', () => ({
  default: { scope: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }), error: vi.fn() },
}));

import { crmAPI } from '../../services/api';

const mockReferrals = [
  {
    id: 'r1',
    referrer_name: 'Erik Hansen',
    referrer_email: 'erik@test.no',
    referee_name: 'Lars Olsen',
    referee_email: 'lars@test.no',
    referral_code: 'REF-ABC123',
    status: 'CONVERTED',
    created_at: '2026-01-15T10:00:00Z',
    converted_at: '2026-01-20T10:00:00Z',
    reward_status: 'PAID',
    reward_amount: 500,
  },
  {
    id: 'r2',
    referrer_name: 'Sofie Nilsen',
    referrer_email: 'sofie@test.no',
    referee_name: 'Maria Berg',
    referee_email: 'maria@test.no',
    referral_code: 'REF-DEF456',
    status: 'SENT',
    created_at: '2026-02-01T10:00:00Z',
    converted_at: null,
    reward_status: 'PENDING',
    reward_amount: 500,
  },
];

const mockStats = {
  topReferrers: [
    { name: 'Erik Hansen', referrals: 5, converted: 3, totalReward: 1500 },
    { name: 'Sofie Nilsen', referrals: 3, converted: 1, totalReward: 500 },
  ],
};

describe('ReferralProgram Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      crmAPI.getReferrals.mockReturnValue(new Promise(() => {}));
      crmAPI.getReferralStats.mockReturnValue(new Promise(() => {}));
      render(<ReferralProgram />);
      expect(screen.getByText('Laster henvisninger...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  describe('Error State', () => {
    it('should show error message when API call fails', async () => {
      crmAPI.getReferrals.mockRejectedValue(new Error('Network error'));
      crmAPI.getReferralStats.mockRejectedValue(new Error('Network error'));
      render(<ReferralProgram />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      expect(screen.getByText('Prøv igjen')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // LOADED STATE
  // ============================================================================

  describe('Loaded State', () => {
    beforeEach(() => {
      crmAPI.getReferrals.mockResolvedValue({ data: mockReferrals });
      crmAPI.getReferralStats.mockResolvedValue({ data: mockStats });
    });

    it('should render header and stats cards after loading', async () => {
      render(<ReferralProgram />);

      await waitFor(() => {
        expect(screen.getByText('Henvisningsprogram')).toBeInTheDocument();
      });

      // Stats should be visible
      expect(screen.getByText('Totalt Henvisninger')).toBeInTheDocument();
      expect(screen.getAllByText('Konvertert').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Ventende')).toBeInTheDocument();
    });

    it('should display correct referral counts in stats', async () => {
      render(<ReferralProgram />);

      await waitFor(() => {
        expect(screen.getByText('Henvisningsprogram')).toBeInTheDocument();
      });

      // 2 total referrals
      const statsCards = screen.getAllByText('2');
      expect(statsCards.length).toBeGreaterThanOrEqual(1);
    });

    it('should show top referrers in overview tab', async () => {
      render(<ReferralProgram />);

      await waitFor(() => {
        expect(screen.getByText('Topp Henvisere')).toBeInTheDocument();
      });

      // Names appear in both referrals table and top referrers
      expect(screen.getAllByText('Erik Hansen').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sofie Nilsen').length).toBeGreaterThanOrEqual(1);
    });

    it('should switch to referrals tab and show table', async () => {
      render(<ReferralProgram />);

      await waitFor(() => {
        expect(screen.getByText('Alle Henvisninger')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Alle Henvisninger'));

      // Table headers should be visible
      expect(screen.getByText('Henviser')).toBeInTheDocument();
    });

    it('should switch to leaderboard tab', async () => {
      render(<ReferralProgram />);

      await waitFor(() => {
        expect(screen.getByText('Toppliste')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Toppliste'));
      expect(screen.getByText('Henviser Toppliste')).toBeInTheDocument();
    });

    it('should switch to settings tab and show form fields', async () => {
      render(<ReferralProgram />);

      await waitFor(() => {
        expect(screen.getByText('Innstillinger')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Innstillinger'));
      expect(screen.getByText('Programinnstillinger')).toBeInTheDocument();
      expect(screen.getByText('Lagre Endringer')).toBeInTheDocument();
    });

    it('should open new referral modal when button is clicked', async () => {
      render(<ReferralProgram />);

      await waitFor(() => {
        // The button text "Ny Henvisning" appears in the header
        expect(screen.getAllByText('Ny Henvisning').length).toBeGreaterThanOrEqual(1);
      });

      // Click the first one (the button in the header)
      fireEvent.click(screen.getAllByText('Ny Henvisning')[0]);
      expect(screen.getByText('Ny Pasient Navn')).toBeInTheDocument();
    });
  });
});
