import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import _userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import * as api from '../../services/api';

// Mock API module
vi.mock('../../services/api');

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard header', () => {
    vi.spyOn(api, 'dashboardAPI').mockImplementation(() => ({
      getOverview: vi.fn().mockResolvedValue({
        todayAppointments: 5,
        pendingFollowUps: 3,
        newPatients: 2,
        todayRevenue: 12500,
      }),
    }));

    renderWithRouter(<Dashboard />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it("should display today's appointment count", async () => {
    const mockDashboardAPI = {
      getOverview: vi.fn().mockResolvedValue({
        todayAppointments: 5,
        pendingFollowUps: 3,
        newPatients: 2,
        todayRevenue: 12500,
      }),
    };

    vi.spyOn(api, 'dashboardAPI').mockReturnValue(mockDashboardAPI);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const mockDashboardAPI = {
      getOverview: vi.fn().mockRejectedValue(new Error('API Error')),
    };

    vi.spyOn(api, 'dashboardAPI').mockReturnValue(mockDashboardAPI);

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching data', () => {
    const mockDashboardAPI = {
      getOverview: vi.fn().mockImplementation(() => new Promise(() => {})),
    };

    vi.spyOn(api, 'dashboardAPI').mockReturnValue(mockDashboardAPI);

    renderWithRouter(<Dashboard />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
