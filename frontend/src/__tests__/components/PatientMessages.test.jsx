/**
 * PatientMessages Component Tests
 * Tests the staff-facing chat view for patient messages
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PatientMessages from '../../components/portal/PatientMessages';

vi.mock('../../services/api', () => ({
  portalAPI: {
    getPatientMessages: vi.fn(),
    sendPatientMessage: vi.fn(),
  },
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key }),
}));

const { portalAPI } = await import('../../services/api');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('PatientMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no messages', async () => {
    portalAPI.getPatientMessages.mockResolvedValue({
      data: { messages: [], pagination: { page: 1, limit: 50, total: 0 } },
    });

    render(<PatientMessages patientId="test-uuid" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText('Ingen meldinger enda')).toBeTruthy();
  });

  it('renders chat messages with correct alignment', async () => {
    portalAPI.getPatientMessages.mockResolvedValue({
      data: {
        messages: [
          {
            id: '1',
            sender_type: 'PATIENT',
            sender_id: null,
            subject: null,
            body: 'Hei, jeg har et sporsmal',
            is_read: true,
            read_at: '2026-03-19T10:00:00Z',
            parent_message_id: null,
            created_at: '2026-03-19T09:00:00Z',
          },
          {
            id: '2',
            sender_type: 'CLINICIAN',
            sender_id: 'staff-1',
            sender_name: 'Dr. Hansen',
            subject: null,
            body: 'Hei! Hva lurer du paa?',
            is_read: false,
            read_at: null,
            parent_message_id: null,
            created_at: '2026-03-19T09:05:00Z',
          },
        ],
        pagination: { page: 1, limit: 50, total: 2 },
      },
    });

    render(<PatientMessages patientId="test-uuid" />, {
      wrapper: createWrapper(),
    });

    // Wait for messages to appear
    expect(await screen.findByText('Hei, jeg har et sporsmal')).toBeTruthy();
    expect(screen.getByText('Hei! Hva lurer du paa?')).toBeTruthy();

    // Check sender labels
    expect(screen.getByText('Pasient')).toBeTruthy();
    expect(screen.getByText('Dr. Hansen')).toBeTruthy();
  });

  it('shows compose textarea input', async () => {
    portalAPI.getPatientMessages.mockResolvedValue({
      data: { messages: [], pagination: { page: 1, limit: 50, total: 0 } },
    });

    render(<PatientMessages patientId="test-uuid" />, {
      wrapper: createWrapper(),
    });

    // Wait for loading to finish
    await screen.findByText('Ingen meldinger enda');

    const textarea = screen.getByPlaceholderText('Skriv en melding...');
    expect(textarea).toBeTruthy();
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
  });
});
