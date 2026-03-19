/**
 * BookingRequests Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock api
vi.mock('../../services/api', () => ({
  portalAPI: {
    getBookingRequests: vi.fn(),
    handleBookingRequest: vi.fn(),
    getBookingRequestCount: vi.fn(),
  },
}));

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    scope: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import BookingRequests from '../../components/portal/BookingRequests';
import { portalAPI } from '../../services/api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('BookingRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no requests', async () => {
    portalAPI.getBookingRequests.mockResolvedValue({
      data: { requests: [], pagination: { page: 1, limit: 20, total: 0 } },
    });

    render(<BookingRequests />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Ingen timeforespørsler')).toBeDefined();
    });
  });

  it('should render booking request cards', async () => {
    portalAPI.getBookingRequests.mockResolvedValue({
      data: {
        requests: [
          {
            id: 'req-1',
            first_name: 'Ola',
            last_name: 'Nordmann',
            preferred_date: '2026-04-01',
            preferred_time_slot: '10:00',
            reason: 'Ryggsmerter',
            status: 'PENDING',
            created_at: '2026-03-19T12:00:00Z',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1 },
      },
    });

    render(<BookingRequests />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Ola Nordmann')).toBeDefined();
      expect(screen.getByText('Ryggsmerter')).toBeDefined();
    });
  });

  it('should show approve and reject buttons for pending requests', async () => {
    portalAPI.getBookingRequests.mockResolvedValue({
      data: {
        requests: [
          {
            id: 'req-2',
            first_name: 'Kari',
            last_name: 'Hansen',
            preferred_date: '2026-04-02',
            preferred_time_slot: '14:00',
            reason: null,
            status: 'PENDING',
            created_at: '2026-03-19T13:00:00Z',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1 },
      },
    });

    render(<BookingRequests />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Godkjenn')).toBeDefined();
      expect(screen.getByText('Avvis')).toBeDefined();
    });
  });

  it('should handle approve action with date/time form', async () => {
    portalAPI.getBookingRequests.mockResolvedValue({
      data: {
        requests: [
          {
            id: 'req-3',
            first_name: 'Per',
            last_name: 'Olsen',
            preferred_date: '2026-04-03',
            preferred_time_slot: '09:00',
            reason: 'Nakkesmerter',
            status: 'PENDING',
            created_at: '2026-03-19T14:00:00Z',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1 },
      },
    });

    portalAPI.handleBookingRequest.mockResolvedValue({
      data: { id: 'req-3', status: 'CONFIRMED' },
    });

    render(<BookingRequests />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Per Olsen')).toBeDefined();
    });

    // Click approve to open inline form
    fireEvent.click(screen.getByText('Godkjenn'));

    // The date/time inputs should appear with pre-filled values
    await waitFor(() => {
      expect(screen.getByText('Bekreft')).toBeDefined();
    });
  });
});
